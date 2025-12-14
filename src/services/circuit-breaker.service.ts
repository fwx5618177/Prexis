/**
 * Circuit Breaker (熔断器) 服务
 * 用于保护外部服务调用，防止级联故障
 *
 * 状态说明：
 * - CLOSED: 正常状态，请求正常通过
 * - OPEN: 故障状态，直接拒绝请求（快速失败）
 * - HALF-OPEN: 恢复测试，允许少量请求通过检测是否恢复
 */

import CircuitBreaker from 'opossum'
import { logger } from '@/utils/loggers'

/**
 * 熔断器配置选项
 */
export interface CircuitBreakerOptions {
  /** 超时时间 (毫秒)，默认 3000 */
  timeout?: number
  /** 触发熔断的错误阈值百分比，默认 50 */
  errorThresholdPercentage?: number
  /** 熔断后重试间隔 (毫秒)，默认 30000 */
  resetTimeout?: number
  /** 滚动窗口内的最小请求数，默认 10 */
  volumeThreshold?: number
  /** 滚动统计窗口大小 (毫秒)，默认 10000 */
  rollingCountTimeout?: number
  /** 熔断器名称 */
  name?: string
}

/**
 * 熔断器状态
 */
export interface CircuitBreakerStatus {
  /** 熔断器名称 */
  name: string
  /** 当前状态 */
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN'
  /** 是否开启 */
  isOpen: boolean
  /** 统计信息 */
  stats: {
    /** 成功次数 */
    successes: number
    /** 失败次数 */
    failures: number
    /** 拒绝次数 (熔断时) */
    rejects: number
    /** 超时次数 */
    timeouts: number
    /** 回退次数 */
    fallbacks: number
    /** 成功率 */
    successRate: number
  }
}

/**
 * 默认配置
 */
const DEFAULT_OPTIONS: Required<Omit<CircuitBreakerOptions, 'name'>> = {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
  volumeThreshold: 10,
  rollingCountTimeout: 10000,
}

/**
 * 熔断器管理器
 * 用于管理多个熔断器实例
 */
class CircuitBreakerManager {
  private breakers: Map<string, CircuitBreaker> = new Map()

  /**
   * 创建或获取熔断器
   * @param name 熔断器名称
   * @param action 被保护的异步函数
   * @param options 配置选项
   */
  create<T extends unknown[], R>(
    name: string,
    action: (...args: T) => Promise<R>,
    options: CircuitBreakerOptions = {},
  ): CircuitBreaker<T, R> {
    // 如果已存在，返回现有实例
    if (this.breakers.has(name)) {
      return this.breakers.get(name) as CircuitBreaker<T, R>
    }

    const mergedOptions = {
      ...DEFAULT_OPTIONS,
      ...options,
      name,
    }

    const breaker = new CircuitBreaker(action, mergedOptions)

    // 注册事件监听
    this.registerEvents(breaker, name)

    // 保存实例
    this.breakers.set(name, breaker)

    logger.info(`Circuit breaker "${name}" created`)

    return breaker
  }

  /**
   * 获取现有熔断器
   */
  get<T extends unknown[], R>(name: string): CircuitBreaker<T, R> | undefined {
    return this.breakers.get(name) as CircuitBreaker<T, R> | undefined
  }

  /**
   * 获取熔断器状态
   */
  getStatus(name: string): CircuitBreakerStatus | undefined {
    const breaker = this.breakers.get(name)
    if (!breaker) return undefined

    const stats = breaker.stats
    const total = stats.successes + stats.failures

    return {
      name,
      state: breaker.opened ? 'OPEN' : breaker.halfOpen ? 'HALF_OPEN' : 'CLOSED',
      isOpen: breaker.opened,
      stats: {
        successes: stats.successes,
        failures: stats.failures,
        rejects: stats.rejects,
        timeouts: stats.timeouts,
        fallbacks: stats.fallbacks,
        successRate: total > 0 ? (stats.successes / total) * 100 : 100,
      },
    }
  }

  /**
   * 获取所有熔断器状态
   */
  getAllStatus(): CircuitBreakerStatus[] {
    const statuses: CircuitBreakerStatus[] = []
    for (const name of this.breakers.keys()) {
      const status = this.getStatus(name)
      if (status) statuses.push(status)
    }
    return statuses
  }

  /**
   * 重置熔断器
   */
  reset(name: string): boolean {
    const breaker = this.breakers.get(name)
    if (!breaker) return false

    breaker.close()
    logger.info(`Circuit breaker "${name}" reset to CLOSED`)
    return true
  }

  /**
   * 关闭所有熔断器
   */
  shutdown(): void {
    for (const [name, breaker] of this.breakers) {
      breaker.shutdown()
      logger.info(`Circuit breaker "${name}" shutdown`)
    }
    this.breakers.clear()
  }

  /**
   * 注册熔断器事件
   */
  private registerEvents(breaker: CircuitBreaker, name: string): void {
    breaker.on('success', () => {
      logger.debug(`[${name}] Request succeeded`)
    })

    breaker.on('failure', (error: Error) => {
      logger.warn(`[${name}] Request failed: ${error.message}`)
    })

    breaker.on('timeout', () => {
      logger.warn(`[${name}] Request timeout`)
    })

    breaker.on('reject', () => {
      logger.warn(`[${name}] Request rejected (circuit open)`)
    })

    breaker.on('open', () => {
      logger.error(`[${name}] Circuit OPENED - Too many failures`)
    })

    breaker.on('halfOpen', () => {
      logger.info(`[${name}] Circuit HALF-OPEN - Testing recovery`)
    })

    breaker.on('close', () => {
      logger.info(`[${name}] Circuit CLOSED - Service recovered`)
    })

    breaker.on('fallback', () => {
      logger.info(`[${name}] Fallback executed`)
    })
  }
}

// 单例实例
export const circuitBreakerManager = new CircuitBreakerManager()

/**
 * 创建带熔断保护的函数
 *
 * @example
 * ```typescript
 * // 定义外部服务调用
 * const fetchUser = async (id: string) => {
 *   const response = await fetch(`https://api.example.com/users/${id}`)
 *   return response.json()
 * }
 *
 * // 创建熔断保护
 * const protectedFetchUser = withCircuitBreaker('user-service', fetchUser, {
 *   timeout: 5000,
 *   errorThresholdPercentage: 60,
 * })
 *
 * // 使用
 * try {
 *   const user = await protectedFetchUser('123')
 * } catch (error) {
 *   // 处理错误或熔断
 * }
 * ```
 */
export function withCircuitBreaker<T extends unknown[], R>(
  name: string,
  action: (...args: T) => Promise<R>,
  options: CircuitBreakerOptions = {},
): (...args: T) => Promise<R> {
  const breaker = circuitBreakerManager.create(name, action, options)

  return (...args: T): Promise<R> => {
    return breaker.fire(...args)
  }
}

/**
 * 创建带回退的熔断保护函数
 *
 * @example
 * ```typescript
 * const protectedFetch = withCircuitBreakerAndFallback(
 *   'external-api',
 *   fetchData,
 *   () => ({ cached: true, data: cachedData }),
 *   { timeout: 3000 }
 * )
 * ```
 */
export function withCircuitBreakerAndFallback<T extends unknown[], R>(
  name: string,
  action: (...args: T) => Promise<R>,
  fallback: (...args: T) => R | Promise<R>,
  options: CircuitBreakerOptions = {},
): (...args: T) => Promise<R> {
  const breaker = circuitBreakerManager.create(name, action, options)
  breaker.fallback(fallback)

  return (...args: T): Promise<R> => {
    return breaker.fire(...args)
  }
}

// 导出类型
export { CircuitBreaker }
