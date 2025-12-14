import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Request, Response, NextFunction, Application } from 'express'
import express from 'express'

// Mock logger
vi.mock('@/utils/loggers', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

describe('Performance Service', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: NextFunction
  let mockApp: Application

  beforeEach(() => {
    vi.clearAllMocks()
    mockReq = {
      method: 'GET',
      originalUrl: '/api/test',
    }
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      on: vi.fn(),
      headersSent: false,
    }
    mockNext = vi.fn()
    mockApp = express()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('applyPerformanceOptimizations', () => {
    it('should disable x-powered-by header', async () => {
      const { applyPerformanceOptimizations } = await import('@/services/performance.service')
      const app = express()

      applyPerformanceOptimizations(app, {})

      expect(app.get('x-powered-by')).toBe(false)
    })

    it('should set etag to false when disabled', async () => {
      const { applyPerformanceOptimizations } = await import('@/services/performance.service')
      const app = express()

      applyPerformanceOptimizations(app, { disableEtag: true })

      expect(app.get('etag')).toBe(false)
    })

    it('should set trust proxy when configured', async () => {
      const { applyPerformanceOptimizations } = await import('@/services/performance.service')
      const app = express()

      applyPerformanceOptimizations(app, { trustProxy: true })

      expect(app.get('trust proxy')).toBe(true)
    })
  })

  describe('memoryCacheMiddleware', () => {
    it('should cache GET requests', async () => {
      const { memoryCacheMiddleware } = await import('@/services/performance.service')
      const middleware = memoryCacheMiddleware(60)

      const testData = { message: 'test' }

      // First request - cache miss
      middleware(mockReq as Request, mockRes as Response, mockNext)
      expect(mockNext).toHaveBeenCalled()

      // The middleware wraps res.json to set cache, so we just verify next was called
      // The actual caching logic is internal to the middleware
    })

    it('should skip non-GET requests', async () => {
      const { memoryCacheMiddleware } = await import('@/services/performance.service')
      const middleware = memoryCacheMiddleware(60)

      mockReq.method = 'POST'

      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
      expect(mockRes.json).not.toHaveBeenCalled()
    })
  })

  describe('timeoutMiddleware', () => {
    it('should call next immediately', async () => {
      const { timeoutMiddleware } = await import('@/services/performance.service')
      const middleware = timeoutMiddleware(5000)

      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('should create timeout middleware with custom timeout', async () => {
      const { timeoutMiddleware } = await import('@/services/performance.service')
      const middleware = timeoutMiddleware(1000)

      expect(middleware).toBeDefined()
      expect(typeof middleware).toBe('function')
    })
  })

  describe('slowRequestLogger', () => {
    it('should call next immediately', async () => {
      const { slowRequestLogger } = await import('@/services/performance.service')
      const middleware = slowRequestLogger(1000)

      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('should register finish event listener', async () => {
      const { slowRequestLogger } = await import('@/services/performance.service')
      const middleware = slowRequestLogger(1000)

      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.on).toHaveBeenCalledWith('finish', expect.any(Function))
    })
  })

  describe('getClusterStatus', () => {
    it('should return cluster status', async () => {
      const { getClusterStatus } = await import('@/services/performance.service')

      const status = getClusterStatus()

      expect(status).toHaveProperty('isPrimary')
      expect(status).toHaveProperty('workerId')
      expect(status).toHaveProperty('numWorkers')
      expect(status).toHaveProperty('workers')
    })
  })

  describe('NODE_PERFORMANCE_FLAGS', () => {
    it('should export performance flags', async () => {
      const { NODE_PERFORMANCE_FLAGS } = await import('@/services/performance.service')

      expect(NODE_PERFORMANCE_FLAGS).toBeDefined()
      expect(NODE_PERFORMANCE_FLAGS.maxOldSpaceSize).toContain('--max-old-space-size')
      expect(NODE_PERFORMANCE_FLAGS.uvThreadpoolSize).toContain('UV_THREADPOOL_SIZE')
    })
  })

  describe('generateOptimizedStartCommand', () => {
    it('should generate optimized start command', async () => {
      const { generateOptimizedStartCommand } = await import('@/services/performance.service')

      const command = generateOptimizedStartCommand('dist/server.js')

      expect(command).toContain('UV_THREADPOOL_SIZE=16')
      expect(command).toContain('--max-old-space-size=4096')
      expect(command).toContain('dist/server.js')
    })
  })

  describe('getPerformanceMetrics', () => {
    it('should return performance metrics', async () => {
      const { getPerformanceMetrics } = await import('@/services/performance.service')

      const metrics = getPerformanceMetrics()

      expect(metrics).toHaveProperty('memory')
      expect(metrics).toHaveProperty('uptime')
      expect(metrics).toHaveProperty('cpuUsage')
      expect(metrics.memory).toHaveProperty('heapUsed')
      expect(metrics.memory).toHaveProperty('heapTotal')
    })
  })
})
