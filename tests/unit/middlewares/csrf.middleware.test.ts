import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Request, Response, NextFunction } from 'express'

describe('CSRF Middleware', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: NextFunction

  beforeEach(() => {
    vi.resetModules()
    mockReq = {
      method: 'GET',
      cookies: {},
      headers: {},
    }
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      cookie: vi.fn(),
    }
    mockNext = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('csrfProtection (disabled)', () => {
    beforeEach(() => {
      vi.doMock('@/config', () => ({
        CSRF_ENABLED: false,
      }))
    })

    it('should skip protection when CSRF is disabled', async () => {
      const { csrfProtection } = await import('@/middlewares/csrf.middleware')
      const middleware = csrfProtection()

      mockReq.method = 'POST'
      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
      expect(mockRes.status).not.toHaveBeenCalled()
    })
  })

  describe('csrfProtection (enabled)', () => {
    beforeEach(() => {
      vi.doMock('@/config', () => ({
        CSRF_ENABLED: true,
      }))
    })

    it('should set CSRF token cookie for GET requests', async () => {
      const { csrfProtection } = await import('@/middlewares/csrf.middleware')
      const middleware = csrfProtection()

      mockReq.method = 'GET'
      mockReq.cookies = {}

      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.cookie).toHaveBeenCalledWith(
        'XSRF-TOKEN',
        expect.any(String),
        expect.objectContaining({
          httpOnly: false,
          sameSite: 'strict',
        }),
      )
      expect(mockNext).toHaveBeenCalled()
    })

    it('should skip setting cookie if token already exists', async () => {
      const { csrfProtection } = await import('@/middlewares/csrf.middleware')
      const middleware = csrfProtection()

      mockReq.method = 'GET'
      mockReq.cookies = { 'XSRF-TOKEN': 'existing-token' }

      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.cookie).not.toHaveBeenCalled()
      expect(mockNext).toHaveBeenCalled()
    })

    it('should pass safe methods without validation', async () => {
      const { csrfProtection } = await import('@/middlewares/csrf.middleware')
      const middleware = csrfProtection()

      const safeMethods = ['GET', 'HEAD', 'OPTIONS']

      for (const method of safeMethods) {
        vi.mocked(mockNext).mockClear()
        mockReq.method = method
        mockReq.cookies = { 'XSRF-TOKEN': 'token' }

        middleware(mockReq as Request, mockRes as Response, mockNext)

        expect(mockNext).toHaveBeenCalled()
      }
    })

    it('should reject POST without CSRF token', async () => {
      const { csrfProtection } = await import('@/middlewares/csrf.middleware')
      const middleware = csrfProtection()

      mockReq.method = 'POST'
      mockReq.cookies = {}
      mockReq.headers = {}

      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(403)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'CSRF token missing',
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should reject POST with mismatched tokens', async () => {
      const { csrfProtection } = await import('@/middlewares/csrf.middleware')
      const middleware = csrfProtection()

      mockReq.method = 'POST'
      mockReq.cookies = { 'XSRF-TOKEN': 'cookie-token' }
      mockReq.headers = { 'x-xsrf-token': 'header-token' }

      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(403)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'CSRF token mismatch',
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should allow POST with matching tokens', async () => {
      const { csrfProtection } = await import('@/middlewares/csrf.middleware')
      const middleware = csrfProtection()

      const token = 'valid-csrf-token'
      mockReq.method = 'POST'
      mockReq.cookies = { 'XSRF-TOKEN': token }
      mockReq.headers = { 'x-xsrf-token': token }

      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
      expect(mockRes.status).not.toHaveBeenCalled()
    })

    it('should validate PUT, PATCH, DELETE methods', async () => {
      const { csrfProtection } = await import('@/middlewares/csrf.middleware')
      const middleware = csrfProtection()

      const unsafeMethods = ['PUT', 'PATCH', 'DELETE']
      const token = 'valid-token'

      for (const method of unsafeMethods) {
        vi.mocked(mockNext).mockClear()
        vi.mocked(mockRes.status as ReturnType<typeof vi.fn>).mockClear()

        mockReq.method = method
        mockReq.cookies = { 'XSRF-TOKEN': token }
        mockReq.headers = { 'x-xsrf-token': token }

        middleware(mockReq as Request, mockRes as Response, mockNext)

        expect(mockNext).toHaveBeenCalled()
      }
    })
  })

  describe('csrfTokenHandler', () => {
    beforeEach(() => {
      vi.doMock('@/config', () => ({
        CSRF_ENABLED: true,
      }))
    })

    it('should return existing token from cookie', async () => {
      const { csrfTokenHandler } = await import('@/middlewares/csrf.middleware')

      const existingToken = 'existing-token-123'
      mockReq.cookies = { 'XSRF-TOKEN': existingToken }

      csrfTokenHandler(mockReq as Request, mockRes as Response)

      expect(mockRes.json).toHaveBeenCalledWith({ csrfToken: existingToken })
    })

    it('should generate new token if none exists', async () => {
      const { csrfTokenHandler } = await import('@/middlewares/csrf.middleware')

      mockReq.cookies = {}

      csrfTokenHandler(mockReq as Request, mockRes as Response)

      expect(mockRes.cookie).toHaveBeenCalledWith(
        'XSRF-TOKEN',
        expect.any(String),
        expect.objectContaining({
          httpOnly: false,
          sameSite: 'strict',
        }),
      )
      expect(mockRes.json).toHaveBeenCalledWith({
        csrfToken: expect.any(String),
      })
    })
  })
})
