/**
 * HttpException 测试
 */
import { describe, it, expect } from 'vitest'
import { HttpException } from '@/exceptions/HttpException'

describe('HttpException', () => {
  it('should create an exception with status and message', () => {
    const exception = new HttpException(404, 'Not Found')

    expect(exception.status).toBe(404)
    expect(exception.message).toBe('Not Found')
  })

  it('should be an instance of Error', () => {
    const exception = new HttpException(500, 'Internal Server Error')

    expect(exception).toBeInstanceOf(Error)
    expect(exception).toBeInstanceOf(HttpException)
  })

  it('should have correct name property', () => {
    const exception = new HttpException(400, 'Bad Request')

    expect(exception.name).toBe('Error')
  })

  it('should create common HTTP errors', () => {
    const badRequest = new HttpException(400, 'Bad Request')
    const unauthorized = new HttpException(401, 'Unauthorized')
    const forbidden = new HttpException(403, 'Forbidden')
    const notFound = new HttpException(404, 'Not Found')
    const conflict = new HttpException(409, 'Conflict')
    const serverError = new HttpException(500, 'Internal Server Error')

    expect(badRequest.status).toBe(400)
    expect(unauthorized.status).toBe(401)
    expect(forbidden.status).toBe(403)
    expect(notFound.status).toBe(404)
    expect(conflict.status).toBe(409)
    expect(serverError.status).toBe(500)
  })

  it('should handle empty message', () => {
    const exception = new HttpException(500, '')

    expect(exception.message).toBe('')
  })
})
