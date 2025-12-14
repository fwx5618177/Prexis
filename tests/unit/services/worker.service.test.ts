import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock Worker class
class MockWorker {
  on = vi.fn()
  once = vi.fn()
  postMessage = vi.fn()
  terminate = vi.fn().mockResolvedValue(0)
  removeAllListeners = vi.fn()
}

// Mock worker_threads
vi.mock('worker_threads', () => ({
  isMainThread: true,
  parentPort: null,
  workerData: null,
  Worker: MockWorker,
}))

// Mock logger
vi.mock('@/utils/loggers', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

describe('Worker Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('WorkerPool', () => {
    it('should create worker pool with default size', async () => {
      const { WorkerPool } = await import('@/services/worker.service')
      const pool = new WorkerPool(__filename)

      expect(pool).toBeDefined()

      const status = pool.getStatus()
      expect(status.total).toBeGreaterThan(0)
      expect(status.available).toBeGreaterThan(0)
      expect(status.queued).toBe(0)

      await pool.shutdown()
    })

    it('should create worker pool with custom size', async () => {
      const { WorkerPool } = await import('@/services/worker.service')
      const pool = new WorkerPool(__filename, { size: 2 })

      const status = pool.getStatus()
      expect(status.total).toBe(2)

      await pool.shutdown()
    })

    it('should get status correctly', async () => {
      const { WorkerPool } = await import('@/services/worker.service')
      const pool = new WorkerPool(__filename, { size: 4 })

      const status = pool.getStatus()

      expect(status).toHaveProperty('total')
      expect(status).toHaveProperty('available')
      expect(status).toHaveProperty('queued')
      expect(typeof status.total).toBe('number')
      expect(typeof status.available).toBe('number')
      expect(typeof status.queued).toBe('number')

      await pool.shutdown()
    })

    it('should shutdown all workers', async () => {
      const { WorkerPool } = await import('@/services/worker.service')
      const pool = new WorkerPool(__filename, { size: 2 })

      await pool.shutdown()

      const status = pool.getStatus()
      expect(status.total).toBe(0)
      expect(status.available).toBe(0)
    })
  })

  describe('WorkerTask interface', () => {
    it('should define correct task structure', async () => {
      const { WorkerPool } = await import('@/services/worker.service')

      const task = {
        type: 'fibonacci',
        data: { n: 10 },
      }

      expect(task).toHaveProperty('type')
      expect(task).toHaveProperty('data')
    })
  })

  describe('WorkerResult interface', () => {
    it('should define correct result structure', () => {
      const result = {
        success: true,
        data: 55,
        duration: 100,
      }

      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('duration')
    })

    it('should handle error result', () => {
      const result = {
        success: false,
        error: 'Task failed',
        duration: 50,
      }

      expect(result.success).toBe(false)
      expect(result.error).toBe('Task failed')
    })
  })

})
