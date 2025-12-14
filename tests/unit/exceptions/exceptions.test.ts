/**
 * HttpException 子类测试
 */
import { describe, it, expect } from 'vitest'
import {
  HttpException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  ValidationException,
  TooManyRequestsException,
  InternalServerException,
  BadGatewayException,
  ServiceUnavailableException,
  GatewayTimeoutException,
} from '@/exceptions'

describe('HttpException Classes', () => {
  describe('HttpException', () => {
    it('should create with status and message', () => {
      const error = new HttpException(400, 'Test error')
      expect(error.status).toBe(400)
      expect(error.message).toBe('Test error')
    })

    it('should support error code', () => {
      const error = new HttpException(400, 'Test error', 'TEST_CODE')
      expect(error.code).toBe('TEST_CODE')
    })

    it('should have proper name', () => {
      const error = new HttpException(400, 'Test')
      expect(error.name).toBe('HttpException')
    })
  })

  describe('4xx Client Errors', () => {
    it('BadRequestException should have status 400', () => {
      const error = new BadRequestException()
      expect(error.status).toBe(400)
      expect(error.message).toBe('Bad Request')
      expect(error.code).toBe('BAD_REQUEST')
      expect(error.name).toBe('BadRequestException')
    })

    it('BadRequestException with custom message', () => {
      const error = new BadRequestException('Invalid input')
      expect(error.message).toBe('Invalid input')
    })

    it('UnauthorizedException should have status 401', () => {
      const error = new UnauthorizedException()
      expect(error.status).toBe(401)
      expect(error.message).toBe('Unauthorized')
      expect(error.code).toBe('UNAUTHORIZED')
    })

    it('ForbiddenException should have status 403', () => {
      const error = new ForbiddenException()
      expect(error.status).toBe(403)
      expect(error.message).toBe('Forbidden')
      expect(error.code).toBe('FORBIDDEN')
    })

    it('NotFoundException should have status 404', () => {
      const error = new NotFoundException()
      expect(error.status).toBe(404)
      expect(error.message).toBe('Not Found')
      expect(error.code).toBe('NOT_FOUND')
    })

    it('NotFoundException with custom message', () => {
      const error = new NotFoundException('User not found')
      expect(error.message).toBe('User not found')
    })

    it('ConflictException should have status 409', () => {
      const error = new ConflictException()
      expect(error.status).toBe(409)
      expect(error.message).toBe('Conflict')
      expect(error.code).toBe('CONFLICT')
    })

    it('ValidationException should have status 422', () => {
      const error = new ValidationException()
      expect(error.status).toBe(422)
      expect(error.message).toBe('Validation Failed')
      expect(error.code).toBe('VALIDATION_ERROR')
    })

    it('ValidationException with errors object', () => {
      const errors = { email: ['Invalid format'], password: ['Too short'] }
      const error = new ValidationException('Validation failed', errors)
      expect(error.errors).toEqual(errors)
    })

    it('TooManyRequestsException should have status 429', () => {
      const error = new TooManyRequestsException()
      expect(error.status).toBe(429)
      expect(error.message).toBe('Too Many Requests')
      expect(error.code).toBe('RATE_LIMITED')
    })
  })

  describe('5xx Server Errors', () => {
    it('InternalServerException should have status 500', () => {
      const error = new InternalServerException()
      expect(error.status).toBe(500)
      expect(error.message).toBe('Internal Server Error')
      expect(error.code).toBe('INTERNAL_ERROR')
    })

    it('BadGatewayException should have status 502', () => {
      const error = new BadGatewayException()
      expect(error.status).toBe(502)
      expect(error.message).toBe('Bad Gateway')
      expect(error.code).toBe('BAD_GATEWAY')
    })

    it('ServiceUnavailableException should have status 503', () => {
      const error = new ServiceUnavailableException()
      expect(error.status).toBe(503)
      expect(error.message).toBe('Service Unavailable')
      expect(error.code).toBe('SERVICE_UNAVAILABLE')
    })

    it('GatewayTimeoutException should have status 504', () => {
      const error = new GatewayTimeoutException()
      expect(error.status).toBe(504)
      expect(error.message).toBe('Gateway Timeout')
      expect(error.code).toBe('GATEWAY_TIMEOUT')
    })
  })

  describe('Error inheritance', () => {
    it('all exceptions should extend Error', () => {
      const errors = [
        new BadRequestException(),
        new UnauthorizedException(),
        new NotFoundException(),
        new InternalServerException(),
      ]

      errors.forEach((error) => {
        expect(error).toBeInstanceOf(Error)
        expect(error).toBeInstanceOf(HttpException)
      })
    })

    it('should have stack trace', () => {
      const error = new NotFoundException()
      expect(error.stack).toBeDefined()
    })
  })
})
