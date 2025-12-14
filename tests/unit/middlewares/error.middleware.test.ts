import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Request, Response, NextFunction } from 'express'
import { HttpException } from '@/exceptions/HttpException'

// Mock logger
vi.mock('@/utils/loggers', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}))

// 动态导入中间件以便 mock 生效
const importMiddleware = async () => {
  const { default: errorMiddleware } = await import('@/middlewares/error.middleware')
  return errorMiddleware
}

describe('Error Middleware', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: NextFunction
  let errorMiddleware: Awaited<ReturnType<typeof importMiddleware>>

  beforeEach(async () => {
    vi.clearAllMocks()
    errorMiddleware = await importMiddleware()

    mockReq = {
      method: 'GET',
      path: '/test',
    }
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    }
    mockNext = vi.fn()
  })

  it('should handle HttpException with status and message', () => {
    const error = new HttpException(404, 'Not Found')

    errorMiddleware(error, mockReq as Request, mockRes as Response, mockNext)

    expect(mockRes.status).toHaveBeenCalledWith(404)
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Error',
        message: 'Not Found',
        statusCode: 404,
      }),
    )
  })

  it('should default to 500 status when not provided', () => {
    const error = { message: 'Unknown error' } as HttpException

    errorMiddleware(error, mockReq as Request, mockRes as Response, mockNext)

    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

  it('should default message when not provided', () => {
    const error = { status: 400 } as HttpException

    errorMiddleware(error, mockReq as Request, mockRes as Response, mockNext)

    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Something went wrong',
      }),
    )
  })

  it('should include timestamp in response', () => {
    const error = new HttpException(400, 'Bad Request')

    errorMiddleware(error, mockReq as Request, mockRes as Response, mockNext)

    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        timestamp: expect.any(String),
      }),
    )
  })

  it('should handle different HTTP methods in logging', () => {
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']

    methods.forEach((method) => {
      mockReq.method = method
      const error = new HttpException(400, 'Error')

      errorMiddleware(error, mockReq as Request, mockRes as Response, mockNext)
    })

    expect(mockRes.status).toHaveBeenCalledTimes(5)
  })
})
