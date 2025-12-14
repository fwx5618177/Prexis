/**
 * 环境工具函数测试
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// 在测试前需要清除模块缓存，因为环境变量在模块加载时就被读取了
describe('Environment Utils', () => {
  const originalEnv = process.env.NODE_ENV

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
    vi.resetModules()
  })

  describe('getEnv', () => {
    it('should return current NODE_ENV value', async () => {
      process.env.NODE_ENV = 'dev'
      const { getEnv } = await import('@/shared/utils')
      expect(getEnv()).toBe('dev')
    })

    it('should return "dev" as default when NODE_ENV is undefined', async () => {
      delete process.env.NODE_ENV
      const { getEnv } = await import('@/shared/utils')
      expect(getEnv()).toBe('dev')
    })
  })

  describe('isDev', () => {
    it('should return true when NODE_ENV is "dev"', async () => {
      process.env.NODE_ENV = 'dev'
      const { isDev } = await import('@/shared/utils')
      expect(isDev()).toBe(true)
    })

    it('should return false when NODE_ENV is "prod"', async () => {
      process.env.NODE_ENV = 'prod'
      const { isDev } = await import('@/shared/utils')
      expect(isDev()).toBe(false)
    })
  })

  describe('isProd', () => {
    it('should return true when NODE_ENV is "prod"', async () => {
      process.env.NODE_ENV = 'prod'
      const { isProd } = await import('@/shared/utils')
      expect(isProd()).toBe(true)
    })

    it('should return false when NODE_ENV is "dev"', async () => {
      process.env.NODE_ENV = 'dev'
      const { isProd } = await import('@/shared/utils')
      expect(isProd()).toBe(false)
    })
  })

  describe('isTest', () => {
    it('should return true when NODE_ENV is "test"', async () => {
      process.env.NODE_ENV = 'test'
      const { isTest } = await import('@/shared/utils')
      expect(isTest()).toBe(true)
    })

    it('should return false when NODE_ENV is "dev"', async () => {
      process.env.NODE_ENV = 'dev'
      const { isTest } = await import('@/shared/utils')
      expect(isTest()).toBe(false)
    })
  })
})
