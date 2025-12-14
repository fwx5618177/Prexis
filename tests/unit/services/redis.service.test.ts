import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock Redis client
const mockRedisClient = {
  connect: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn().mockResolvedValue(undefined),
  get: vi.fn(),
  set: vi.fn().mockResolvedValue('OK'),
  setEx: vi.fn().mockResolvedValue('OK'),
  del: vi.fn().mockResolvedValue(1),
  exists: vi.fn(),
  keys: vi.fn().mockResolvedValue([]),
  on: vi.fn(),
}

vi.mock('redis', () => ({
  createClient: vi.fn(() => mockRedisClient),
}))

vi.mock('@/utils/loggers', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/config', () => ({
  REDIS_ENABLED: true,
  REDIS_URL: 'redis://localhost:6379',
  REDIS_PREFIX: 'test:',
}))

describe('Redis Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('RedisCacheService', () => {
    it('should create instance with default prefix', async () => {
      const { RedisCacheService } = await import('@/services/redis.service')
      const service = new RedisCacheService('redis://localhost:6379')

      expect(service).toBeDefined()
    })

    it('should create instance with custom prefix', async () => {
      const { RedisCacheService } = await import('@/services/redis.service')
      const service = new RedisCacheService('redis://localhost:6379', 'myapp:')

      expect(service).toBeDefined()
    })

    describe('connect', () => {
      it('should connect to Redis', async () => {
        const { RedisCacheService } = await import('@/services/redis.service')
        const service = new RedisCacheService('redis://localhost:6379')

        await service.connect()

        expect(mockRedisClient.connect).toHaveBeenCalled()
      })
    })

    describe('get', () => {
      it('should return null for non-existent key', async () => {
        mockRedisClient.get.mockResolvedValueOnce(null)

        const { RedisCacheService } = await import('@/services/redis.service')
        const service = new RedisCacheService('redis://localhost:6379', 'test:')

        const result = await service.get('non-existent')

        expect(result).toBeNull()
        expect(mockRedisClient.get).toHaveBeenCalledWith('test:non-existent')
      })

      it('should return parsed JSON value', async () => {
        const testData = { name: 'test', value: 123 }
        mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(testData))

        const { RedisCacheService } = await import('@/services/redis.service')
        const service = new RedisCacheService('redis://localhost:6379', 'test:')

        const result = await service.get('json-key')

        expect(result).toEqual(testData)
      })

      it('should return raw string if not valid JSON', async () => {
        mockRedisClient.get.mockResolvedValueOnce('plain string')

        const { RedisCacheService } = await import('@/services/redis.service')
        const service = new RedisCacheService('redis://localhost:6379', 'test:')

        const result = await service.get('string-key')

        expect(result).toBe('plain string')
      })
    })

    describe('set', () => {
      it('should set value without TTL', async () => {
        const { RedisCacheService } = await import('@/services/redis.service')
        const service = new RedisCacheService('redis://localhost:6379', 'test:')

        await service.set('key', { data: 'value' })

        expect(mockRedisClient.set).toHaveBeenCalledWith('test:key', '{"data":"value"}')
      })

      it('should set value with TTL', async () => {
        const { RedisCacheService } = await import('@/services/redis.service')
        const service = new RedisCacheService('redis://localhost:6379', 'test:')

        await service.set('key', { data: 'value' }, { ttl: 3600 })

        expect(mockRedisClient.setEx).toHaveBeenCalledWith('test:key', 3600, '{"data":"value"}')
      })

      it('should serialize complex objects', async () => {
        const { RedisCacheService } = await import('@/services/redis.service')
        const service = new RedisCacheService('redis://localhost:6379', 'test:')

        const complexData = {
          users: [{ id: 1, name: 'John' }],
          metadata: { total: 1 },
        }

        await service.set('complex', complexData)

        expect(mockRedisClient.set).toHaveBeenCalledWith('test:complex', JSON.stringify(complexData))
      })
    })

    describe('del', () => {
      it('should delete a key', async () => {
        const { RedisCacheService } = await import('@/services/redis.service')
        const service = new RedisCacheService('redis://localhost:6379', 'test:')

        await service.del('key-to-delete')

        expect(mockRedisClient.del).toHaveBeenCalledWith('test:key-to-delete')
      })
    })

    describe('has', () => {
      it('should return true if key exists', async () => {
        mockRedisClient.exists.mockResolvedValueOnce(1)

        const { RedisCacheService } = await import('@/services/redis.service')
        const service = new RedisCacheService('redis://localhost:6379', 'test:')

        const result = await service.has('existing-key')

        expect(result).toBe(true)
        expect(mockRedisClient.exists).toHaveBeenCalledWith('test:existing-key')
      })

      it('should return false if key does not exist', async () => {
        mockRedisClient.exists.mockResolvedValueOnce(0)

        const { RedisCacheService } = await import('@/services/redis.service')
        const service = new RedisCacheService('redis://localhost:6379', 'test:')

        const result = await service.has('non-existent-key')

        expect(result).toBe(false)
      })
    })

    describe('clear', () => {
      it('should clear all keys with prefix', async () => {
        mockRedisClient.keys.mockResolvedValueOnce(['test:key1', 'test:key2'])

        const { RedisCacheService } = await import('@/services/redis.service')
        const service = new RedisCacheService('redis://localhost:6379', 'test:')

        await service.clear()

        expect(mockRedisClient.keys).toHaveBeenCalledWith('test:*')
        expect(mockRedisClient.del).toHaveBeenCalledWith(['test:key1', 'test:key2'])
      })

      it('should clear keys matching pattern', async () => {
        mockRedisClient.keys.mockResolvedValueOnce(['test:user:1', 'test:user:2'])

        const { RedisCacheService } = await import('@/services/redis.service')
        const service = new RedisCacheService('redis://localhost:6379', 'test:')

        await service.clear('user:')

        expect(mockRedisClient.keys).toHaveBeenCalledWith('test:user:*')
      })

      it('should not call del if no keys found', async () => {
        mockRedisClient.keys.mockResolvedValueOnce([])
        mockRedisClient.del.mockClear()

        const { RedisCacheService } = await import('@/services/redis.service')
        const service = new RedisCacheService('redis://localhost:6379', 'test:')

        await service.clear()

        expect(mockRedisClient.del).not.toHaveBeenCalled()
      })
    })

    describe('disconnect', () => {
      it('should disconnect from Redis', async () => {
        const { RedisCacheService } = await import('@/services/redis.service')
        const service = new RedisCacheService('redis://localhost:6379', 'test:')

        // 模拟连接状态
        await service.connect()
        // 触发 connect 事件处理器
        const connectHandler = mockRedisClient.on.mock.calls.find((call) => call[0] === 'connect')?.[1]
        if (connectHandler) connectHandler()

        await service.disconnect()

        expect(mockRedisClient.disconnect).toHaveBeenCalled()
      })
    })

    describe('isConnected', () => {
      it('should return connection status', async () => {
        const { RedisCacheService } = await import('@/services/redis.service')
        const service = new RedisCacheService('redis://localhost:6379', 'test:')

        expect(service.isConnected()).toBe(false)
      })
    })

    describe('getClient', () => {
      it('should return raw Redis client', async () => {
        const { RedisCacheService } = await import('@/services/redis.service')
        const service = new RedisCacheService('redis://localhost:6379', 'test:')

        const client = service.getClient()

        expect(client).toBeDefined()
      })
    })
  })

  describe('ICacheService interface', () => {
    it('should implement all required methods', async () => {
      const { RedisCacheService } = await import('@/services/redis.service')
      const service = new RedisCacheService('redis://localhost:6379')

      expect(typeof service.get).toBe('function')
      expect(typeof service.set).toBe('function')
      expect(typeof service.del).toBe('function')
      expect(typeof service.has).toBe('function')
      expect(typeof service.clear).toBe('function')
      expect(typeof service.disconnect).toBe('function')
    })
  })
})
