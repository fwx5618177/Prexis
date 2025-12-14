/**
 * 常量定义测试
 */
import { describe, it, expect } from 'vitest'
import { HTTP_STATUS, MESSAGES, PAGINATION, ENVIRONMENTS, LOG_LEVELS } from '@/shared/constants'

describe('Constants', () => {
  describe('HTTP_STATUS', () => {
    it('should have correct status codes', () => {
      expect(HTTP_STATUS.OK).toBe(200)
      expect(HTTP_STATUS.CREATED).toBe(201)
      expect(HTTP_STATUS.BAD_REQUEST).toBe(400)
      expect(HTTP_STATUS.UNAUTHORIZED).toBe(401)
      expect(HTTP_STATUS.FORBIDDEN).toBe(403)
      expect(HTTP_STATUS.NOT_FOUND).toBe(404)
      expect(HTTP_STATUS.CONFLICT).toBe(409)
      expect(HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(500)
    })
  })

  describe('MESSAGES', () => {
    it('should have correct messages', () => {
      expect(MESSAGES.SUCCESS).toBe('Success')
      expect(MESSAGES.CREATED).toBe('Created successfully')
      expect(MESSAGES.UPDATED).toBe('Updated successfully')
      expect(MESSAGES.DELETED).toBe('Deleted successfully')
      expect(MESSAGES.NOT_FOUND).toBe('Resource not found')
      expect(MESSAGES.UNAUTHORIZED).toBe('Unauthorized access')
      expect(MESSAGES.FORBIDDEN).toBe('Access forbidden')
      expect(MESSAGES.VALIDATION_ERROR).toBe('Validation failed')
      expect(MESSAGES.INTERNAL_ERROR).toBe('Internal server error')
    })
  })

  describe('PAGINATION', () => {
    it('should have correct default values', () => {
      expect(PAGINATION.DEFAULT_PAGE).toBe(1)
      expect(PAGINATION.DEFAULT_LIMIT).toBe(10)
      expect(PAGINATION.MAX_LIMIT).toBe(100)
    })

    it('should have reasonable limits', () => {
      expect(PAGINATION.DEFAULT_LIMIT).toBeLessThanOrEqual(PAGINATION.MAX_LIMIT)
      expect(PAGINATION.DEFAULT_PAGE).toBeGreaterThan(0)
    })
  })

  describe('ENVIRONMENTS', () => {
    it('should have correct environment values', () => {
      expect(ENVIRONMENTS.DEV).toBe('dev')
      expect(ENVIRONMENTS.PROD).toBe('prod')
      expect(ENVIRONMENTS.TEST).toBe('test')
    })
  })

  describe('LOG_LEVELS', () => {
    it('should have correct log levels', () => {
      expect(LOG_LEVELS.ERROR).toBe('error')
      expect(LOG_LEVELS.WARN).toBe('warn')
      expect(LOG_LEVELS.INFO).toBe('info')
      expect(LOG_LEVELS.DEBUG).toBe('debug')
    })
  })
})
