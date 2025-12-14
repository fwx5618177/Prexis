/**
 * 健康检查模块
 * 提供 /health 和 /ready 端点用于容器探测
 * 集成 Circuit Breaker 保护数据库健康检查
 */

import { Router, Request, Response } from 'express'
import { Routes } from '@types'
import prisma from '@/prisma/client'
import { createRateLimiter } from '@/middlewares/rateLimit.middleware'
import { circuitBreakerManager } from '@/services/circuit-breaker.service'

interface HealthStatus {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  uptime: number
  version: string
  checks?: {
    database?: {
      status: 'up' | 'down'
      latency?: number
      circuitBreaker?: 'CLOSED' | 'OPEN' | 'HALF_OPEN'
    }
  }
}

// 创建一个严格的限制器用于测试 (5次/分钟)
const testLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1分钟
  max: 5, // 最多5次
  message: '请求太频繁，请稍后再试',
})

// 数据库健康检查函数
async function checkDatabase(): Promise<{ latency: number }> {
  const startTime = Date.now()
  await prisma.$queryRaw`SELECT 1`
  return { latency: Date.now() - startTime }
}

class HealthRoute implements Routes {
  public path = '/health'
  public router: Router = Router()
  private startTime: number = Date.now()
  private dbCircuitBreaker

  constructor() {
    // 创建数据库健康检查的熔断器
    this.dbCircuitBreaker = circuitBreakerManager.create('database-health', checkDatabase, {
      timeout: 5000, // 5秒超时
      errorThresholdPercentage: 50, // 50% 错误率触发熔断
      resetTimeout: 30000, // 30秒后尝试恢复
      volumeThreshold: 5, // 至少5个请求才开始计算
      rollingCountTimeout: 10000, // 10秒滚动窗口
    })

    this.initializeRoutes()
  }

  private initializeRoutes(): void {
    // 基本健康检查 - 用于 liveness probe
    this.router.get(this.path, this.healthCheck)

    // 就绪检查 - 用于 readiness probe，检查数据库连接等
    this.router.get('/ready', this.readinessCheck)

    // 熔断器状态查询
    this.router.get('/circuit-breaker/status', this.getCircuitBreakerStatus)

    // 速率限制测试端点 (5次/分钟)
    this.router.get('/rate-test', testLimiter, (req: Request, res: Response) => {
      res.json({ success: true, message: '请求成功', timestamp: new Date().toISOString() })
    })
  }

  /**
   * 基本健康检查
   * 只检查服务是否运行
   */
  private healthCheck = (
    _req: unknown,
    res: { status: (code: number) => { json: (data: HealthStatus) => void } },
  ): void => {
    const response: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      version: process.env.npm_package_version || '1.0.0',
    }
    res.status(200).json(response)
  }

  /**
   * 就绪检查
   * 检查服务及其依赖是否就绪（使用熔断器保护）
   */
  private readinessCheck = async (
    _req: unknown,
    res: { status: (code: number) => { json: (data: HealthStatus) => void } },
  ): Promise<void> => {
    const cbStatus = circuitBreakerManager.getStatus('database-health')

    const response: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: {
          status: 'down',
          circuitBreaker: cbStatus?.state || 'CLOSED',
        },
      },
    }

    try {
      // 使用熔断器保护数据库健康检查
      const result = await this.dbCircuitBreaker.fire()

      if (response.checks?.database) {
        response.checks.database = {
          status: 'up',
          latency: result.latency,
          circuitBreaker: cbStatus?.state || 'CLOSED',
        }
      }

      res.status(200).json(response)
    } catch {
      response.status = 'unhealthy'
      if (response.checks?.database) {
        response.checks.database.status = 'down'
        response.checks.database.circuitBreaker = cbStatus?.state || 'OPEN'
      }
      res.status(503).json(response)
    }
  }

  /**
   * 获取熔断器状态
   */
  private getCircuitBreakerStatus = (_req: Request, res: Response): void => {
    const statuses = circuitBreakerManager.getAllStatus()
    res.json({
      count: statuses.length,
      breakers: statuses,
    })
  }
}

export default HealthRoute
