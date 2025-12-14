import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock logger
vi.mock('@/utils/loggers', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

describe('Circuit Breaker Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('withCircuitBreaker', () => {
    it('should execute action successfully', async () => {
      const { withCircuitBreaker, circuitBreakerManager } = await import(
        '@/services/circuit-breaker.service'
      )

      const mockAction = vi.fn().mockResolvedValue('success')
      const protectedAction = withCircuitBreaker('test-success', mockAction)

      const result = await protectedAction()

      expect(result).toBe('success')
      expect(mockAction).toHaveBeenCalled()

      // Cleanup
      circuitBreakerManager.shutdown()
    })

    it('should propagate errors from action', async () => {
      const { withCircuitBreaker, circuitBreakerManager } = await import(
        '@/services/circuit-breaker.service'
      )

      const mockAction = vi.fn().mockRejectedValue(new Error('Service unavailable'))
      const protectedAction = withCircuitBreaker('test-error', mockAction)

      await expect(protectedAction()).rejects.toThrow('Service unavailable')

      // Cleanup
      circuitBreakerManager.shutdown()
    })

    it('should pass arguments to action', async () => {
      const { withCircuitBreaker, circuitBreakerManager } = await import(
        '@/services/circuit-breaker.service'
      )

      const mockAction = vi.fn().mockImplementation((a: number, b: number) => Promise.resolve(a + b))
      const protectedAction = withCircuitBreaker('test-args', mockAction)

      const result = await protectedAction(2, 3)

      expect(result).toBe(5)
      expect(mockAction).toHaveBeenCalledWith(2, 3)

      // Cleanup
      circuitBreakerManager.shutdown()
    })
  })

  describe('withCircuitBreakerAndFallback', () => {
    it('should use fallback when action fails', async () => {
      const { withCircuitBreakerAndFallback, circuitBreakerManager } = await import(
        '@/services/circuit-breaker.service'
      )

      const mockAction = vi.fn().mockRejectedValue(new Error('Failed'))
      const mockFallback = vi.fn().mockReturnValue('fallback-value')

      const protectedAction = withCircuitBreakerAndFallback(
        'test-fallback',
        mockAction,
        mockFallback,
        { volumeThreshold: 1 },
      )

      const result = await protectedAction()

      expect(result).toBe('fallback-value')
      expect(mockFallback).toHaveBeenCalled()

      // Cleanup
      circuitBreakerManager.shutdown()
    })
  })

  describe('CircuitBreakerManager', () => {
    it('should return existing breaker for same name', async () => {
      const { circuitBreakerManager } = await import('@/services/circuit-breaker.service')

      const action1 = vi.fn().mockResolvedValue('a')
      const action2 = vi.fn().mockResolvedValue('b')

      const breaker1 = circuitBreakerManager.create('duplicate-name', action1)
      const breaker2 = circuitBreakerManager.create('duplicate-name', action2)

      expect(breaker1).toBe(breaker2)

      // Cleanup
      circuitBreakerManager.shutdown()
    })

    it('should get status correctly', async () => {
      const { circuitBreakerManager, withCircuitBreaker } = await import(
        '@/services/circuit-breaker.service'
      )

      const mockAction = vi.fn().mockResolvedValue('ok')
      const protectedAction = withCircuitBreaker('test-status', mockAction)

      await protectedAction()

      const status = circuitBreakerManager.getStatus('test-status')

      expect(status).toBeDefined()
      expect(status!.name).toBe('test-status')
      expect(status!.state).toBe('CLOSED')
      expect(status!.isOpen).toBe(false)
      expect(status!.stats.successes).toBeGreaterThanOrEqual(1)

      // Cleanup
      circuitBreakerManager.shutdown()
    })

    it('should return undefined for non-existent breaker', async () => {
      const { circuitBreakerManager } = await import('@/services/circuit-breaker.service')

      const status = circuitBreakerManager.getStatus('non-existent')

      expect(status).toBeUndefined()
    })

    it('should get all statuses', async () => {
      const { circuitBreakerManager, withCircuitBreaker } = await import(
        '@/services/circuit-breaker.service'
      )

      withCircuitBreaker('breaker-1', vi.fn().mockResolvedValue('a'))
      withCircuitBreaker('breaker-2', vi.fn().mockResolvedValue('b'))

      const statuses = circuitBreakerManager.getAllStatus()

      expect(statuses.length).toBeGreaterThanOrEqual(2)
      expect(statuses.some(s => s.name === 'breaker-1')).toBe(true)
      expect(statuses.some(s => s.name === 'breaker-2')).toBe(true)

      // Cleanup
      circuitBreakerManager.shutdown()
    })

    it('should reset breaker', async () => {
      const { circuitBreakerManager, withCircuitBreaker } = await import(
        '@/services/circuit-breaker.service'
      )

      withCircuitBreaker('test-reset', vi.fn().mockResolvedValue('ok'))

      const result = circuitBreakerManager.reset('test-reset')

      expect(result).toBe(true)

      // Cleanup
      circuitBreakerManager.shutdown()
    })

    it('should return false when resetting non-existent breaker', async () => {
      const { circuitBreakerManager } = await import('@/services/circuit-breaker.service')

      const result = circuitBreakerManager.reset('non-existent')

      expect(result).toBe(false)
    })

    it('should shutdown all breakers', async () => {
      const { circuitBreakerManager, withCircuitBreaker } = await import(
        '@/services/circuit-breaker.service'
      )

      withCircuitBreaker('shutdown-1', vi.fn().mockResolvedValue('a'))
      withCircuitBreaker('shutdown-2', vi.fn().mockResolvedValue('b'))

      circuitBreakerManager.shutdown()

      const statuses = circuitBreakerManager.getAllStatus()
      expect(statuses.length).toBe(0)
    })
  })

  describe('Circuit Breaker Options', () => {
    it('should respect custom timeout', async () => {
      const { withCircuitBreaker, circuitBreakerManager } = await import(
        '@/services/circuit-breaker.service'
      )

      const slowAction = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('slow'), 2000)),
      )

      const protectedAction = withCircuitBreaker('test-timeout', slowAction, {
        timeout: 100,
      })

      await expect(protectedAction()).rejects.toThrow()

      // Cleanup
      circuitBreakerManager.shutdown()
    })
  })
})
