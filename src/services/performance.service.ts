/**
 * 高性能优化配置
 * 用于优化 Node.js 服务器性能
 */

import { Application, Request, Response, NextFunction } from 'express'
import { cpus } from 'os'
import cluster from 'cluster'
import { logger } from '@/utils/loggers'

/**
 * 高性能配置选项
 */
export interface PerformanceConfig {
  /** 启用响应缓存 */
  enableCache?: boolean
  /** 缓存 TTL (秒) */
  cacheTTL?: number
  /** 启用 Keep-Alive 优化 */
  enableKeepAlive?: boolean
  /** Keep-Alive 超时 (毫秒) */
  keepAliveTimeout?: number
  /** 禁用 ETag */
  disableEtag?: boolean
  /** 禁用 X-Powered-By */
  disableXPoweredBy?: boolean
  /** 启用信任代理 */
  trustProxy?: boolean | string | number
}

/**
 * 应用高性能优化
 */
export function applyPerformanceOptimizations(app: Application, config: PerformanceConfig = {}): void {
  // 禁用 X-Powered-By (减少响应头大小)
  if (config.disableXPoweredBy !== false) {
    app.disable('x-powered-by')
  }

  // 禁用 ETag (减少计算开销，适合 API)
  if (config.disableEtag) {
    app.set('etag', false)
  }

  // 信任代理 (Nginx/负载均衡器后)
  if (config.trustProxy) {
    app.set('trust proxy', config.trustProxy)
  }

  // 启用 Keep-Alive (仅 HTTP/1.x，HTTP/2 不需要这些头)
  if (config.enableKeepAlive !== false) {
    app.use((req: Request, res: Response, next: NextFunction) => {
      // HTTP/2 不支持 Connection 和 Keep-Alive 头
      // 检查 httpVersion 是否为 2.0
      if (!req.httpVersion.startsWith('2')) {
        res.set('Connection', 'keep-alive')
        res.set('Keep-Alive', `timeout=${Math.floor((config.keepAliveTimeout ?? 65000) / 1000)}`)
      }
      next()
    })
  }

  logger.info('Performance optimizations applied')
}

/**
 * 内存缓存中间件
 * 生产环境建议使用 Redis
 */
export function memoryCacheMiddleware(ttlSeconds = 60) {
  const cache = new Map<string, { data: unknown; expires: number }>()

  // 定期清理过期缓存
  setInterval(() => {
    const now = Date.now()
    for (const [key, value] of cache.entries()) {
      if (value.expires < now) {
        cache.delete(key)
      }
    }
  }, ttlSeconds * 1000)

  return (req: Request, res: Response, next: NextFunction): void => {
    // 仅缓存 GET 请求
    if (req.method !== 'GET') {
      next()
      return
    }

    const key = req.originalUrl
    const cached = cache.get(key)

    if (cached && cached.expires > Date.now()) {
      res.set('X-Cache', 'HIT')
      res.json(cached.data)
      return
    }

    // 拦截响应
    const originalJson = res.json.bind(res)
    res.json = (data: unknown) => {
      cache.set(key, {
        data,
        expires: Date.now() + ttlSeconds * 1000,
      })
      res.set('X-Cache', 'MISS')
      return originalJson(data)
    }

    next()
  }
}

/**
 * 请求超时中间件
 */
export function timeoutMiddleware(timeoutMs = 30000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const timeoutId = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          message: 'Request timeout',
        })
      }
    }, timeoutMs)

    res.on('finish', () => clearTimeout(timeoutId))
    res.on('close', () => clearTimeout(timeoutId))

    next()
  }
}

/**
 * 慢请求日志中间件
 */
export function slowRequestLogger(thresholdMs = 1000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now()

    res.on('finish', () => {
      const duration = Date.now() - startTime
      if (duration > thresholdMs) {
        logger.warn(`Slow request: ${req.method} ${req.originalUrl} took ${duration}ms`)
      }
    })

    next()
  }
}

// ============ Cluster 模式工具 ============

/**
 * Cluster 配置
 */
export interface ClusterConfig {
  /** Worker 数量 (默认 CPU 核心数) */
  workers?: number
  /** 是否自动重启崩溃的 Worker */
  autoRestart?: boolean
  /** 重启延迟 (毫秒) */
  restartDelay?: number
}

/**
 * 使用 Cluster 模式启动应用
 *
 * @example
 * ```ts
 * startWithCluster(() => {
 *   const app = new App(routes)
 *   app.listen()
 * })
 * ```
 */
export function startWithCluster(startApp: () => void | Promise<void>, config: ClusterConfig = {}): void {
  const numWorkers = config.workers ?? cpus().length
  const autoRestart = config.autoRestart ?? true
  const restartDelay = config.restartDelay ?? 1000

  if (cluster.isPrimary) {
    logger.info(`Primary ${process.pid} is running`)
    logger.info(`Starting ${numWorkers} workers...`)

    // Fork workers
    for (let i = 0; i < numWorkers; i++) {
      cluster.fork()
    }

    // 处理 Worker 退出
    cluster.on('exit', (worker, code, signal) => {
      logger.warn(`Worker ${worker.process.pid} died (code: ${code}, signal: ${signal})`)

      if (autoRestart) {
        logger.info(`Restarting worker in ${restartDelay}ms...`)
        setTimeout(() => {
          cluster.fork()
        }, restartDelay)
      }
    })

    // 优雅关闭
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down workers...')
      for (const id in cluster.workers) {
        cluster.workers[id]?.kill()
      }
      process.exit(0)
    })
  } else {
    // Worker 进程
    logger.info(`Worker ${process.pid} started`)
    startApp()
  }
}

/**
 * 获取 Cluster 状态
 */
export function getClusterStatus(): {
  isPrimary: boolean
  workerId: number | undefined
  numWorkers: number
  workers: Array<{ id: number; pid: number | undefined }>
} {
  return {
    isPrimary: cluster.isPrimary,
    workerId: cluster.worker?.id,
    numWorkers: Object.keys(cluster.workers ?? {}).length,
    workers: Object.values(cluster.workers ?? {}).map(w => ({
      id: w?.id ?? 0,
      pid: w?.process.pid,
    })),
  }
}

// ============ Node.js 性能调优建议 ============

/**
 * 推荐的 Node.js 启动参数
 */
export const NODE_PERFORMANCE_FLAGS = {
  // 增加老生代内存 (默认 ~1.4GB)
  maxOldSpaceSize: '--max-old-space-size=4096',
  // 增加堆内存限制
  maxHeapSize: '--max-heap-size=4096',
  // 启用 TLS 1.3
  tlsMinVersion: '--tls-min-v1.3',
  // 优化 libuv 线程池 (默认 4)
  uvThreadpoolSize: 'UV_THREADPOOL_SIZE=16',
  // 禁用实验性警告
  noWarnings: '--no-warnings',
  // 启用追踪 GC (调试用)
  traceGc: '--trace-gc',
}

/**
 * 生成优化的启动命令
 */
export function generateOptimizedStartCommand(entryPoint: string): string {
  return `UV_THREADPOOL_SIZE=16 node --max-old-space-size=4096 ${entryPoint}`
}

/**
 * 性能监控指标
 */
export function getPerformanceMetrics(): {
  memory: NodeJS.MemoryUsage
  uptime: number
  cpuUsage: NodeJS.CpuUsage
  eventLoopLag: number
} {
  const startHrTime = process.hrtime()

  // 简单的事件循环延迟检测
  setImmediate(() => {
    const diff = process.hrtime(startHrTime)
    const lagMs = diff[0] * 1000 + diff[1] / 1e6
    // 这个值应该非常小 (<1ms)
    if (lagMs > 10) {
      logger.warn(`High event loop lag: ${lagMs.toFixed(2)}ms`)
    }
  })

  return {
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    cpuUsage: process.cpuUsage(),
    eventLoopLag: 0, // 实际值通过 setImmediate 异步获取
  }
}
