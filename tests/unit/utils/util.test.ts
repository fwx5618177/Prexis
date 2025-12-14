import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isEmpty } from '@/utils/util'

describe('Utils', () => {
  describe('isEmpty', () => {
    it('should return true for null', () => {
      expect(isEmpty(null)).toBe(true)
    })

    it('should return true for undefined', () => {
      expect(isEmpty(undefined)).toBe(true)
    })

    it('should return true for empty string', () => {
      expect(isEmpty('')).toBe(true)
    })

    it('should return true for empty object', () => {
      expect(isEmpty({})).toBe(true)
    })

    it('should return false for non-empty string', () => {
      expect(isEmpty('hello')).toBe(false)
    })

    it('should return false for number', () => {
      expect(isEmpty(0)).toBe(false)
      expect(isEmpty(42)).toBe(false)
    })

    it('should return false for non-empty object', () => {
      expect(isEmpty({ key: 'value' })).toBe(false)
    })

    it('should return false for array with elements', () => {
      expect(isEmpty([1, 2, 3])).toBe(false)
    })

    it('should return true for empty array', () => {
      expect(isEmpty([])).toBe(true)
    })
  })
})
