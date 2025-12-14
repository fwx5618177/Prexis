/**
 * API 响应工具函数测试
 */
import { describe, it, expect } from 'vitest'
import { createApiResponse, createPaginatedResponse, validatePaginationParams } from '@/shared/utils'

describe('API Response Utils', () => {
  describe('createApiResponse', () => {
    it('should create a success response with data', () => {
      const data = { id: 1, name: 'Test' }
      const response = createApiResponse(data)

      expect(response).toEqual({
        data: { id: 1, name: 'Test' },
        message: 'Success',
        success: true,
      })
    })

    it('should create a response with custom message', () => {
      const data = { id: 1 }
      const response = createApiResponse(data, 'Custom message')

      expect(response.message).toBe('Custom message')
    })

    it('should create a failure response', () => {
      const data = null
      const response = createApiResponse(data, 'Error occurred', false)

      expect(response.success).toBe(false)
      expect(response.message).toBe('Error occurred')
    })

    it('should handle array data', () => {
      const data = [1, 2, 3]
      const response = createApiResponse(data)

      expect(response.data).toEqual([1, 2, 3])
    })
  })

  describe('createPaginatedResponse', () => {
    it('should create a paginated response with defaults', () => {
      const data = [{ id: 1 }, { id: 2 }]
      const response = createPaginatedResponse(data, 100)

      expect(response).toEqual({
        data: [{ id: 1 }, { id: 2 }],
        message: 'Success',
        success: true,
        pagination: {
          page: 1,
          limit: 10,
          total: 100,
          totalPages: 10,
        },
      })
    })

    it('should calculate totalPages correctly', () => {
      const data = [{ id: 1 }]
      const response = createPaginatedResponse(data, 25, 1, 10)

      expect(response.pagination.totalPages).toBe(3)
    })

    it('should handle custom page and limit', () => {
      const data: unknown[] = []
      const response = createPaginatedResponse(data, 50, 3, 20)

      expect(response.pagination).toEqual({
        page: 3,
        limit: 20,
        total: 50,
        totalPages: 3,
      })
    })

    it('should handle empty data', () => {
      const response = createPaginatedResponse([], 0)

      expect(response.data).toEqual([])
      expect(response.pagination.total).toBe(0)
      expect(response.pagination.totalPages).toBe(0)
    })
  })

  describe('validatePaginationParams', () => {
    it('should return defaults for empty query', () => {
      const result = validatePaginationParams({})

      expect(result).toEqual({ page: 1, limit: 10 })
    })

    it('should parse valid page and limit', () => {
      const result = validatePaginationParams({ page: '3', limit: '20' })

      expect(result).toEqual({ page: 3, limit: 20 })
    })

    it('should enforce minimum page of 1', () => {
      const result = validatePaginationParams({ page: '0' })

      expect(result.page).toBe(1)
    })

    it('should enforce minimum page of 1 for negative values', () => {
      const result = validatePaginationParams({ page: '-5' })

      expect(result.page).toBe(1)
    })

    it('should enforce maximum limit of 100', () => {
      const result = validatePaginationParams({ limit: '500' })

      expect(result.limit).toBe(100)
    })

    it('should use default when limit is 0 or invalid', () => {
      const result = validatePaginationParams({ limit: '0' })

      // parseInt('0') = 0, Math.max(1, 0) = 1, but the logic uses || which treats 0 as falsy
      // So it falls back to DEFAULT_LIMIT
      expect(result.limit).toBe(10)
    })

    it('should handle non-numeric values', () => {
      const result = validatePaginationParams({ page: 'abc', limit: 'xyz' })

      expect(result).toEqual({ page: 1, limit: 10 })
    })
  })
})
