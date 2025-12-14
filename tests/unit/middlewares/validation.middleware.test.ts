import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Request, Response, NextFunction } from 'express'
import { IsString, IsNumber, IsOptional } from 'class-validator'
import validationMiddleware from '@/middlewares/validation.middleware'

// 测试用的 DTO
class TestDto {
  @IsString()
  name!: string

  @IsNumber()
  age!: number

  @IsOptional()
  @IsString()
  optional?: string
}

describe('Validation Middleware', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: NextFunction

  beforeEach(() => {
    mockReq = {
      body: {},
      query: {},
      params: {},
    }
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    }
    mockNext = vi.fn()
  })

  it('should call next() when validation passes', async () => {
    mockReq.body = { name: 'John', age: 25 }
    const middleware = validationMiddleware(TestDto, 'body')

    await middleware(mockReq as Request, mockRes as Response, mockNext)

    // 等待异步验证完成
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(mockNext).toHaveBeenCalled()
  })

  it('should call next with error when validation fails', async () => {
    mockReq.body = { name: 123, age: 'invalid' } // 错误的类型
    const middleware = validationMiddleware(TestDto, 'body')

    await middleware(mockReq as Request, mockRes as Response, mockNext)

    // 等待异步验证完成
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(mockNext).toHaveBeenCalledWith(expect.any(Error))
  })

  it('should validate query parameters', async () => {
    mockReq.query = { name: 'John', age: '25' }
    const middleware = validationMiddleware(TestDto, 'query', true)

    await middleware(mockReq as Request, mockRes as Response, mockNext)

    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(mockNext).toHaveBeenCalled()
  })

  it('should validate params', async () => {
    mockReq.params = { name: 'John', age: '25' }
    const middleware = validationMiddleware(TestDto, 'params', true)

    await middleware(mockReq as Request, mockRes as Response, mockNext)

    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(mockNext).toHaveBeenCalled()
  })

  it('should allow optional fields to be missing', async () => {
    mockReq.body = { name: 'John', age: 25 }
    const middleware = validationMiddleware(TestDto, 'body')

    await middleware(mockReq as Request, mockRes as Response, mockNext)

    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(mockNext).toHaveBeenCalled()
    // 不应该有错误
    const lastCall = (mockNext as any).mock.calls[0]
    expect(lastCall[0]).toBeUndefined()
  })

  it('should reject non-whitelisted properties by default', async () => {
    mockReq.body = { name: 'John', age: 25, extraField: 'not allowed' }
    const middleware = validationMiddleware(TestDto, 'body', false, true, true)

    await middleware(mockReq as Request, mockRes as Response, mockNext)

    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(mockNext).toHaveBeenCalledWith(expect.any(Error))
  })
})
