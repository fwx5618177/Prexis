import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Request, Response, NextFunction } from 'express'

// Mock express-rate-limit
vi.mock('express-rate-limit', () => ({
  default: vi.fn((options) => {
    return (req: Request, res: Response, next: NextFunction) => {
      // 模拟速率限制行为
      if ((req as Request & { __rateLimitExceeded?: boolean }).__rateLimitExceeded) {
        res.status(429).json(options.message)
        return
      }
      next()
    }
  }),
}))

// Mock config
vi.mock('@/config', () => ({
  RATE_LIMIT_WINDOW_MS: 60000,
  RATE_LIMIT_MAX: 100,
  AUTH_RATE_LIMIT_WINDOW_MS: 900000,
  AUTH_RATE_LIMIT_MAX: 10,
}))

describe('RateLimit Middleware', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: NextFunction

  beforeEach(() => {
    vi.resetModules()
    mockReq = {
      ip: '127.0.0.1',
      method: 'GET',
      path: '/api/test',
    }
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
    }
    mockNext = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('createRateLimiter', () => {
    it('should create a rate limiter with default config', async () => {
      const { createRateLimiter } = await import('@/middlewares/rateLimit.middleware')

      const limiter = createRateLimiter({
        windowMs: 60000,
        max: 100,
      })

      expect(limiter).toBeDefined()
      expect(typeof limiter).toBe('function')
    })

    it('should create a rate limiter with custom message', async () => {
      const { createRateLimiter } = await import('@/middlewares/rateLimit.middleware')

      const limiter = createRateLimiter({
        windowMs: 60000,
        max: 50,
        message: 'Custom rate limit message',
      })

      expect(limiter).toBeDefined()
    })

    it('should create a rate limiter with skipSuccessfulRequests', async () => {
      const { createRateLimiter } = await import('@/middlewares/rateLimit.middleware')

      const limiter = createRateLimiter({
        windowMs: 60000,
        max: 100,
        skipSuccessfulRequests: true,
      })

      expect(limiter).toBeDefined()
    })

    it('should create a rate limiter with custom keyGenerator', async () => {
      const { createRateLimiter } = await import('@/middlewares/rateLimit.middleware')

      const customKeyGen = vi.fn().mockReturnValue('custom-key')
      const limiter = createRateLimiter({
        windowMs: 60000,
        max: 100,
        keyGenerator: customKeyGen,
      })

      expect(limiter).toBeDefined()
    })
  })

  describe('Preset Limiters', () => {
    it('should export apiLimiter', async () => {
      const { apiLimiter } = await import('@/middlewares/rateLimit.middleware')
      expect(apiLimiter).toBeDefined()
      expect(typeof apiLimiter).toBe('function')
    })

    it('should export authLimiter', async () => {
      const { authLimiter } = await import('@/middlewares/rateLimit.middleware')
      expect(authLimiter).toBeDefined()
      expect(typeof authLimiter).toBe('function')
    })

    it('should export strictLimiter', async () => {
      const { strictLimiter } = await import('@/middlewares/rateLimit.middleware')
      expect(strictLimiter).toBeDefined()
      expect(typeof strictLimiter).toBe('function')
    })
  })

  describe('apiLimiter', () => {
    it('should allow requests under the limit', async () => {
      const module = await import('@/middlewares/rateLimit.middleware')
      const { apiLimiter } = module

      apiLimiter(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
      expect(mockRes.status).not.toHaveBeenCalled()
    })

    it('should block requests over the limit', async () => {
      const module = await import('@/middlewares/rateLimit.middleware')
      const { apiLimiter } = module

      // 标记为超限
      const reqWithFlag = mockReq as Request & { __rateLimitExceeded?: boolean }
      reqWithFlag.__rateLimitExceeded = true

      apiLimiter(reqWithFlag as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(429)
      expect(mockRes.json).toHaveBeenCalled()
      expect(mockNext).not.toHaveBeenCalled()
    })
  })

  describe('createUserRateLimiter', () => {
    it('should create a user-based rate limiter', async () => {
      const { createUserRateLimiter } = await import('@/middlewares/rateLimit.middleware')

      const limiter = createUserRateLimiter({
        windowMs: 60000,
        max: 50,
      })

      expect(limiter).toBeDefined()
      expect(typeof limiter).toBe('function')
    })

    it('should handle requests without user', async () => {
      const { createUserRateLimiter } = await import('@/middlewares/rateLimit.middleware')

      const limiter = createUserRateLimiter({
        windowMs: 60000,
        max: 50,
      })

      limiter(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('should handle requests with user', async () => {
      const { createUserRateLimiter } = await import('@/middlewares/rateLimit.middleware')

      const limiter = createUserRateLimiter({
        windowMs: 60000,
        max: 50,
      })

      ;(mockReq as Request & { user?: { id: string } }).user = { id: 'user-123' }

      limiter(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })
  })

  describe('RateLimitConfig interface', () => {
    it('should support all configuration options', async () => {
      const { createRateLimiter } = await import('@/middlewares/rateLimit.middleware')

      const limiter = createRateLimiter({
        windowMs: 30000,
        max: 25,
        message: 'Test message',
        skipSuccessfulRequests: true,
        skipFailedRequests: false,
        keyGenerator: () => 'test-key',
      })

      expect(limiter).toBeDefined()
    })

    it('should work with minimal config', async () => {
      const { createRateLimiter } = await import('@/middlewares/rateLimit.middleware')

      const limiter = createRateLimiter({
        windowMs: 1000,
        max: 1,
      })

      expect(limiter).toBeDefined()
    })
  })
})
