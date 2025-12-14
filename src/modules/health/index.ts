/**
 * 健康检查模块
 * 提供 /health 和 /ready 端点用于容器探测
 */

import { Router, Request, Response } from 'express'
import { Routes } from '@types'
import prisma from '@/prisma/client'
import { createRateLimiter } from '@/middlewares/rateLimit.middleware'

interface HealthStatus {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  uptime: number
  version: string
  checks?: {
    database?: {
      status: 'up' | 'down'
      latency?: number
    }
  }
}

// 创建一个严格的限制器用于测试 (5次/分钟)
const testLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1分钟
  max: 5, // 最多5次
  message: '请求太频繁，请稍后再试',
})

class HealthRoute implements Routes {
  public path = '/health'
  public router: Router = Router()
  private startTime: number = Date.now()

  constructor() {
    this.initializeRoutes()
  }

  private initializeRoutes(): void {
    // 基本健康检查 - 用于 liveness probe
    this.router.get(this.path, this.healthCheck)

    // 就绪检查 - 用于 readiness probe，检查数据库连接等
    this.router.get('/ready', this.readinessCheck)

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
   * 检查服务及其依赖是否就绪
   */
  private readinessCheck = async (
    _req: unknown,
    res: { status: (code: number) => { json: (data: HealthStatus) => void } },
  ): Promise<void> => {
    const response: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: {
          status: 'down',
        },
      },
    }

    try {
      // 检查数据库连接
      const startTime = Date.now()
      await prisma.$queryRaw`SELECT 1`
      const latency = Date.now() - startTime

      if (response.checks?.database) {
        response.checks.database = {
          status: 'up',
          latency,
        }
      }

      res.status(200).json(response)
    } catch {
      response.status = 'unhealthy'
      if (response.checks?.database) {
        response.checks.database.status = 'down'
      }
      res.status(503).json(response)
    }
  }
}

export default HealthRoute
