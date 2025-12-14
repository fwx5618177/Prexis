import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Request, Response, NextFunction } from 'express'

// Mock Prisma
vi.mock('@/prisma/client', () => ({
  default: {
    $queryRaw: vi.fn(),
  },
}))

// Mock rate limiter
vi.mock('@/middlewares/rateLimit.middleware', () => ({
  createRateLimiter: vi.fn(() => (req: Request, res: Response, next: () => void) => next()),
}))

describe('Health Module', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: NextFunction

  beforeEach(() => {
    vi.clearAllMocks()
    mockReq = {}
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    }
    mockNext = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('HealthRoute', () => {
    it('should create health route instance', async () => {
      const HealthRoute = (await import('@/modules/health')).default
      const healthRoute = new HealthRoute()

      expect(healthRoute).toBeDefined()
      expect(healthRoute.path).toBe('/health')
      expect(healthRoute.router).toBeDefined()
    })

    it('should have correct path', async () => {
      const HealthRoute = (await import('@/modules/health')).default
      const healthRoute = new HealthRoute()

      expect(healthRoute.path).toBe('/health')
    })

    it('should have router with routes', async () => {
      const HealthRoute = (await import('@/modules/health')).default
      const healthRoute = new HealthRoute()

      // 检查 router 是否有 stack（注册的路由）
      expect(healthRoute.router.stack.length).toBeGreaterThan(0)
    })
  })

  describe('Health Check Endpoint', () => {
    it('should return healthy status', async () => {
      const HealthRoute = (await import('@/modules/health')).default
      const healthRoute = new HealthRoute()

      // 找到 healthCheck 路由处理器
      const healthCheckRoute = healthRoute.router.stack.find(
        (layer: { route?: { path: string } }) => layer.route?.path === '/health',
      )

      expect(healthCheckRoute).toBeDefined()
    })

    it('should return correct health response structure', async () => {
      const HealthRoute = (await import('@/modules/health')).default
      const healthRoute = new HealthRoute()

      // 找到并调用 healthCheck handler
      const healthLayer = healthRoute.router.stack.find(
        (layer: { route?: { path: string } }) => layer.route?.path === '/health',
      )

      if (healthLayer?.route?.stack?.[0]?.handle) {
        healthLayer.route.stack[0].handle(mockReq as Request, mockRes as Response, mockNext)
      }

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'healthy',
          timestamp: expect.any(String),
          uptime: expect.any(Number),
          version: expect.any(String),
        }),
      )
    })
  })

  describe('Readiness Check Endpoint', () => {
    it('should have /ready endpoint', async () => {
      const HealthRoute = (await import('@/modules/health')).default
      const healthRoute = new HealthRoute()

      const readyRoute = healthRoute.router.stack.find(
        (layer: { route?: { path: string } }) => layer.route?.path === '/ready',
      )

      expect(readyRoute).toBeDefined()
    })

    it('should return healthy when database is up', async () => {
      const prisma = (await import('@/prisma/client')).default
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ 1: 1 }])

      const HealthRoute = (await import('@/modules/health')).default
      const healthRoute = new HealthRoute()

      const readyLayer = healthRoute.router.stack.find(
        (layer: { route?: { path: string } }) => layer.route?.path === '/ready',
      )

      if (readyLayer?.route?.stack?.[0]?.handle) {
        await readyLayer.route.stack[0].handle(mockReq as Request, mockRes as Response, mockNext)
      }

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'healthy',
          checks: expect.objectContaining({
            database: expect.objectContaining({
              status: 'up',
            }),
          }),
        }),
      )
    })

    it('should return unhealthy when database is down', async () => {
      const prisma = (await import('@/prisma/client')).default
      vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(new Error('Connection failed'))

      const HealthRoute = (await import('@/modules/health')).default
      const healthRoute = new HealthRoute()

      const readyLayer = healthRoute.router.stack.find(
        (layer: { route?: { path: string } }) => layer.route?.path === '/ready',
      )

      if (readyLayer?.route?.stack?.[0]?.handle) {
        await readyLayer.route.stack[0].handle(mockReq as Request, mockRes as Response, mockNext)
      }

      expect(mockRes.status).toHaveBeenCalledWith(503)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'unhealthy',
          checks: expect.objectContaining({
            database: expect.objectContaining({
              status: 'down',
            }),
          }),
        }),
      )
    })
  })

  describe('Rate Test Endpoint', () => {
    it('should have /rate-test endpoint', async () => {
      const HealthRoute = (await import('@/modules/health')).default
      const healthRoute = new HealthRoute()

      const rateTestRoute = healthRoute.router.stack.find(
        (layer: { route?: { path: string } }) => layer.route?.path === '/rate-test',
      )

      expect(rateTestRoute).toBeDefined()
    })
  })

  describe('Health Response', () => {
    it('should include uptime in seconds', async () => {
      const HealthRoute = (await import('@/modules/health')).default
      const healthRoute = new HealthRoute()

      const healthLayer = healthRoute.router.stack.find(
        (layer: { route?: { path: string } }) => layer.route?.path === '/health',
      )

      if (healthLayer?.route?.stack?.[0]?.handle) {
        healthLayer.route.stack[0].handle(mockReq as Request, mockRes as Response, mockNext)
      }

      const jsonMock = mockRes.json as ReturnType<typeof vi.fn>
      const calls = jsonMock.mock.calls
      expect(calls.length).toBeGreaterThan(0)
      const response = calls[0]?.[0] as { uptime: number }
      expect(typeof response.uptime).toBe('number')
      expect(response.uptime).toBeGreaterThanOrEqual(0)
    })

    it('should include ISO timestamp', async () => {
      const HealthRoute = (await import('@/modules/health')).default
      const healthRoute = new HealthRoute()

      const healthLayer = healthRoute.router.stack.find(
        (layer: { route?: { path: string } }) => layer.route?.path === '/health',
      )

      if (healthLayer?.route?.stack?.[0]?.handle) {
        healthLayer.route.stack[0].handle(mockReq as Request, mockRes as Response, mockNext)
      }

      const jsonMock = mockRes.json as ReturnType<typeof vi.fn>
      const calls = jsonMock.mock.calls
      expect(calls.length).toBeGreaterThan(0)
      const response = calls[0]?.[0] as { timestamp: string }
      expect(response.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })
  })
})
