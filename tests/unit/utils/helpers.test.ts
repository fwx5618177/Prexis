/**
 * 通用工具函数测试
 */
import { describe, it, expect, vi } from 'vitest'
import { generateRandomString, sleep, safeJsonParse, formatFileSize } from '@/shared/utils'

describe('General Utils', () => {
  describe('generateRandomString', () => {
    it('should generate a string of default length 8', () => {
      const result = generateRandomString()
      expect(result).toHaveLength(8)
    })

    it('should generate a string of specified length', () => {
      const result = generateRandomString(16)
      expect(result).toHaveLength(16)
    })

    it('should only contain alphanumeric characters', () => {
      const result = generateRandomString(100)
      expect(result).toMatch(/^[A-Za-z0-9]+$/)
    })

    it('should generate different strings on each call', () => {
      const results = new Set()
      for (let i = 0; i < 100; i++) {
        results.add(generateRandomString(20))
      }
      // 100次调用应该产生接近100个不同的值
      expect(results.size).toBeGreaterThan(95)
    })

    it('should handle length of 0', () => {
      const result = generateRandomString(0)
      expect(result).toBe('')
    })
  })

  describe('sleep', () => {
    it('should delay execution for specified milliseconds', async () => {
      const start = Date.now()
      await sleep(100)
      const elapsed = Date.now() - start

      expect(elapsed).toBeGreaterThanOrEqual(95) // 允许一些误差
      expect(elapsed).toBeLessThan(200)
    })

    it('should resolve without a value', async () => {
      const result = await sleep(10)
      expect(result).toBeUndefined()
    })
  })

  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      const result = safeJsonParse('{"name":"test","value":123}', {})

      expect(result).toEqual({ name: 'test', value: 123 })
    })

    it('should return default value for invalid JSON', () => {
      const defaultValue = { error: true }
      const result = safeJsonParse('not valid json', defaultValue)

      expect(result).toEqual(defaultValue)
    })

    it('should parse JSON arrays', () => {
      const result = safeJsonParse('[1,2,3]', [])

      expect(result).toEqual([1, 2, 3])
    })

    it('should parse primitive values', () => {
      expect(safeJsonParse('"hello"', '')).toBe('hello')
      expect(safeJsonParse('123', 0)).toBe(123)
      expect(safeJsonParse('true', false)).toBe(true)
      expect(safeJsonParse('null', 'default')).toBeNull()
    })

    it('should handle empty string', () => {
      const result = safeJsonParse('', 'default')
      expect(result).toBe('default')
    })
  })

  describe('formatFileSize', () => {
    it('should format 0 bytes', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
    })

    it('should format bytes', () => {
      expect(formatFileSize(500)).toBe('500 Bytes')
    })

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1536)).toBe('1.5 KB')
    })

    it('should format megabytes', () => {
      expect(formatFileSize(1048576)).toBe('1 MB')
      expect(formatFileSize(1572864)).toBe('1.5 MB')
    })

    it('should format gigabytes', () => {
      expect(formatFileSize(1073741824)).toBe('1 GB')
    })

    it('should format terabytes', () => {
      expect(formatFileSize(1099511627776)).toBe('1 TB')
    })

    it('should handle decimal precision', () => {
      expect(formatFileSize(1500)).toBe('1.46 KB')
      expect(formatFileSize(1234567890)).toBe('1.15 GB')
    })
  })
})
