/**
 * Redis 缓存服务
 * 支持集群部署，生产级实现
 */

import { createClient, type RedisClientType } from 'redis'
import { logger } from '@/utils/loggers'
import { REDIS_URL, REDIS_PREFIX, REDIS_ENABLED } from '@/config'

/**
 * 缓存配置
 */
export interface CacheOptions {
  /** TTL 秒数 */
  ttl?: number
}

/**
 * 缓存服务接口
 */
export interface ICacheService {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, options?: CacheOptions): Promise<void>
  del(key: string): Promise<void>
  has(key: string): Promise<boolean>
  clear(pattern?: string): Promise<void>
  disconnect(): Promise<void>
}

/**
 * Redis 缓存服务
 * 生产环境推荐使用
 */
export class RedisCacheService implements ICacheService {
  private client: RedisClientType
  private readonly prefix: string
  private connected = false

  constructor(url: string, prefix = 'cache:') {
    this.prefix = prefix
    this.client = createClient({ url })

    this.client.on('error', err => {
      logger.error('Redis Client Error:', err)
    })

    this.client.on('connect', () => {
      this.connected = true
      logger.info(`Redis connected: ${url}`)
    })

    this.client.on('disconnect', () => {
      this.connected = false
      logger.warn('Redis disconnected')
    })
  }

  /**
   * 连接 Redis
   */
  async connect(): Promise<void> {
    if (!this.connected) {
      await this.client.connect()
    }
  }

  /**
   * 获取完整的缓存键
   */
  private getKey(key: string): string {
    return `${this.prefix}${key}`
  }

  async get<T>(key: string): Promise<T | null> {
    const fullKey = this.getKey(key)
    const value = await this.client.get(fullKey)

    if (!value) {
      return null
    }

    try {
      return JSON.parse(value) as T
    } catch {
      return value as unknown as T
    }
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const fullKey = this.getKey(key)
    const serialized = JSON.stringify(value)

    if (options?.ttl) {
      await this.client.setEx(fullKey, options.ttl, serialized)
    } else {
      await this.client.set(fullKey, serialized)
    }
  }

  async del(key: string): Promise<void> {
    const fullKey = this.getKey(key)
    await this.client.del(fullKey)
  }

  async has(key: string): Promise<boolean> {
    const fullKey = this.getKey(key)
    const exists = await this.client.exists(fullKey)
    return exists === 1
  }

  async clear(pattern?: string): Promise<void> {
    const searchPattern = pattern ? `${this.prefix}${pattern}*` : `${this.prefix}*`
    const keys = await this.client.keys(searchPattern)

    if (keys.length > 0) {
      await this.client.del(keys)
    }
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.client.disconnect()
      this.connected = false
    }
  }

  /**
   * 获取连接状态
   */
  isConnected(): boolean {
    return this.connected
  }

  /**
   * 获取原始 Redis 客户端（用于高级操作）
   */
  getClient(): RedisClientType {
    return this.client
  }
}

// ============ 单例管理 ============

let cacheInstance: ICacheService | null = null

/**
 * 初始化缓存服务
 */
export async function initCacheService(): Promise<ICacheService> {
  if (cacheInstance) {
    return cacheInstance
  }

  if (REDIS_ENABLED && REDIS_URL) {
    const redisService = new RedisCacheService(REDIS_URL, REDIS_PREFIX)
    await redisService.connect()
    cacheInstance = redisService
    logger.info('Cache service initialized (Redis)')
  } else {
    throw new Error('Redis is required for cache service. Set REDIS_ENABLED=true and REDIS_URL in environment.')
  }

  return cacheInstance
}

/**
 * 获取缓存服务实例
 */
export function getCacheService(): ICacheService {
  if (!cacheInstance) {
    throw new Error('Cache service not initialized. Call initCacheService() first.')
  }
  return cacheInstance
}

/**
 * 关闭缓存服务
 */
export async function closeCacheService(): Promise<void> {
  if (cacheInstance) {
    await cacheInstance.disconnect()
    cacheInstance = null
    logger.info('Cache service closed')
  }
}

/**
 * 缓存装饰器工厂
 */
export function Cacheable(keyPrefix: string, ttl?: number) {
  return function (_target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: unknown[]) {
      const cache = getCacheService()
      const cacheKey = `${keyPrefix}:${propertyKey}:${JSON.stringify(args)}`

      // 尝试从缓存获取
      const cached = await cache.get(cacheKey)
      if (cached !== null) {
        return cached
      }

      // 执行原方法
      const result = await originalMethod.apply(this, args)

      // 存入缓存
      await cache.set(cacheKey, result, { ttl })

      return result
    }

    return descriptor
  }
}
