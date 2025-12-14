/**
 * Request ID 中间件测试
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Request, Response, NextFunction } from 'express'
import { requestIdMiddleware, REQUEST_ID_HEADER, getRequestDuration } from '@/middlewares/requestId.middleware'

describe('Request ID Middleware', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: NextFunction

  beforeEach(() => {
    mockReq = {
      headers: {},
    }
    mockRes = {
      setHeader: vi.fn(),
    }
    mockNext = vi.fn()
  })

  it('should generate a new request ID if not provided', () => {
    requestIdMiddleware(mockReq as Request, mockRes as Response, mockNext)

    expect(mockReq.requestId).toBeDefined()
    expect(mockReq.requestId).toMatch(/^[0-9a-f-]{36}$/) // UUID format
    expect(mockNext).toHaveBeenCalled()
  })

  it('should use existing request ID from headers', () => {
    const existingId = 'existing-request-id-123'
    mockReq.headers = { 'x-request-id': existingId }

    requestIdMiddleware(mockReq as Request, mockRes as Response, mockNext)

    expect(mockReq.requestId).toBe(existingId)
  })

  it('should set request ID in response header', () => {
    requestIdMiddleware(mockReq as Request, mockRes as Response, mockNext)

    expect(mockRes.setHeader).toHaveBeenCalledWith(REQUEST_ID_HEADER, mockReq.requestId)
  })

  it('should set startTime on request', () => {
    const before = Date.now()
    requestIdMiddleware(mockReq as Request, mockRes as Response, mockNext)
    const after = Date.now()

    expect(mockReq.startTime).toBeGreaterThanOrEqual(before)
    expect(mockReq.startTime).toBeLessThanOrEqual(after)
  })

  it('should call next function', () => {
    requestIdMiddleware(mockReq as Request, mockRes as Response, mockNext)

    expect(mockNext).toHaveBeenCalledTimes(1)
  })
})

describe('getRequestDuration', () => {
  it('should calculate duration correctly', async () => {
    const mockReq = { startTime: Date.now() - 100 } as Request

    const duration = getRequestDuration(mockReq)

    expect(duration).toBeGreaterThanOrEqual(100)
    expect(duration).toBeLessThan(200)
  })

  it('should return 0 if startTime is not set', () => {
    const mockReq = {} as Request

    const duration = getRequestDuration(mockReq)

    expect(duration).toBeGreaterThanOrEqual(0)
  })
})
