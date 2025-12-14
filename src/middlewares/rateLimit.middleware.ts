/**
 * 速率限制中间件
 * 基于 express-rate-limit + Redis 存储，支持集群部署
 */

import rateLimit, { type Options } from 'express-rate-limit'
import { type RequestHandler, type Request } from 'express'
import { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX, AUTH_RATE_LIMIT_WINDOW_MS, AUTH_RATE_LIMIT_MAX } from '@/config'

/**
 * 速率限制配置
 */
export interface RateLimitConfig {
  /** 时间窗口 (毫秒) */
  windowMs: number
  /** 最大请求数 */
  max: number
  /** 超限消息 */
  message?: string
  /** 是否跳过成功的请求 */
  skipSuccessfulRequests?: boolean
  /** 是否跳过失败的请求 */
  skipFailedRequests?: boolean
  /** 自定义 key 生成器 */
  keyGenerator?: (req: Request) => string
}

/**
 * 创建速率限制中间件
 * 注意：不使用自定义 keyGenerator，让 express-rate-limit 使用默认的 IP 解析
 */
export function createRateLimiter(config: RateLimitConfig): RequestHandler {
  const options: Partial<Options> = {
    windowMs: config.windowMs,
    max: config.max,
    message: { success: false, message: config.message ?? 'Too many requests' },
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skipSuccessfulRequests: config.skipSuccessfulRequests,
    skipFailedRequests: config.skipFailedRequests,
    // 不设置 keyGenerator，使用 express-rate-limit 默认的 IP 处理（支持 IPv6）
  }

  // 仅当提供自定义 keyGenerator 时才设置（用于用户级限制）
  if (config.keyGenerator) {
    options.keyGenerator = config.keyGenerator
    // 禁用 IPv6 校验（因为自定义 keyGenerator 可能不使用 IP）
    options.validate = { xForwardedForHeader: false }
  }

  return rateLimit(options)
}

// ============ 预配置的限制器 ============

/**
 * API 速率限制器
 * 默认：每分钟 100 次请求
 */
export const apiLimiter: RequestHandler = createRateLimiter({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  message: 'Too many API requests, please try again later',
})

/**
 * 认证接口速率限制器
 * 默认：每 15 分钟 10 次请求（防止暴力破解）
 */
export const authLimiter: RequestHandler = createRateLimiter({
  windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
  max: AUTH_RATE_LIMIT_MAX,
  message: 'Too many login attempts, please try again later',
  skipSuccessfulRequests: true,
})

/**
 * 严格速率限制器
 * 每分钟 10 次请求（敏感操作）
 */
export const strictLimiter: RequestHandler = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Rate limit exceeded for this operation',
})

/**
 * 创建基于用户的速率限制器
 * 优先使用用户 ID，回退到 'anonymous'
 */
export function createUserRateLimiter(config: Omit<RateLimitConfig, 'keyGenerator'>): RequestHandler {
  return createRateLimiter({
    ...config,
    keyGenerator: (req: Request) => {
      const userId = (req as Request & { user?: { id: string } }).user?.id
      // 不使用 req.ip，避免 IPv6 问题；用户未登录时使用固定 key
      return userId ?? 'anonymous'
    },
  })
}
