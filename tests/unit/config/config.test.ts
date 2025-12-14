import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('Config', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('Default Values', () => {
    it('should have default NODE_ENV as dev', async () => {
      delete process.env.NODE_ENV
      const config = await import('@/config')

      expect(config.NODE_ENV).toBe('dev')
    })

    it('should have default PORT as 3000', async () => {
      delete process.env.PORT
      const config = await import('@/config')

      expect(config.PORT).toBe('3000')
    })
  })

  describe('CREDENTIALS', () => {
    it('should return true when CREDENTIALS is "true"', async () => {
      process.env.CREDENTIALS = 'true'
      const config = await import('@/config')

      expect(config.CREDENTIALS).toBe(true)
    })

    it('should return false when CREDENTIALS is not "true"', async () => {
      process.env.CREDENTIALS = 'false'
      const config = await import('@/config')

      expect(config.CREDENTIALS).toBe(false)
    })

    it('should return false when CREDENTIALS is empty string', async () => {
      process.env.CREDENTIALS = ''
      const config = await import('@/config')

      expect(config.CREDENTIALS).toBe(false)
    })
  })

  describe('Environment Variables', () => {
    it('should export SECRET_KEY from environment', async () => {
      process.env.SECRET_KEY = 'test-secret'
      const config = await import('@/config')

      expect(config.SECRET_KEY).toBe('test-secret')
    })

    it('should export LOG_FORMAT from environment', async () => {
      process.env.LOG_FORMAT = 'combined'
      const config = await import('@/config')

      expect(config.LOG_FORMAT).toBe('combined')
    })

    it('should export LOG_DIR from environment', async () => {
      process.env.LOG_DIR = './logs'
      const config = await import('@/config')

      expect(config.LOG_DIR).toBe('./logs')
    })

    it('should export ORIGIN from environment', async () => {
      process.env.ORIGIN = 'http://localhost:3000'
      const config = await import('@/config')

      expect(config.ORIGIN).toBe('http://localhost:3000')
    })
  })
})
