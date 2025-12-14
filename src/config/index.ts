/**
 * Prexis 配置中心
 * 统一管理所有环境变量配置
 *
 * 开发环境: 从 .env 文件加载
 * 生产环境: 由运行时注入 (Docker / K8s / CI)
 */

import { config } from 'dotenv'
import { cpus } from 'os'

// 加载 .env 文件
config()

const { env } = process

// ============ 辅助函数 ============

const parseBoolean = (value: string | undefined, defaultValue = false): boolean => {
  if (value === undefined) return defaultValue
  return value.toLowerCase() === 'true'
}

const parseNumber = (value: string | undefined, defaultValue: number): number => {
  if (value === undefined) return defaultValue
  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? defaultValue : parsed
}

const parseFloat_ = (value: string | undefined, defaultValue: number): number => {
  if (value === undefined) return defaultValue
  const parsed = parseFloat(value)
  return isNaN(parsed) ? defaultValue : parsed
}

// ============ 应用配置 ============

// NODE_ENV 只支持 dev 和 prod
export const NODE_ENV: 'dev' | 'prod' = env.NODE_ENV === 'prod' ? 'prod' : 'dev'
export const PORT = parseNumber(env.PORT, 3000)
export const HOST = env.HOST ?? '0.0.0.0'
export const CREDENTIALS = parseBoolean(env.CREDENTIALS)
export const ORIGIN = env.ORIGIN ?? '*'

// ============ 安全配置 ============

export const SECRET_KEY = env.SECRET_KEY ?? 'default-secret-key-change-in-production'
export const CSRF_ENABLED = parseBoolean(env.CSRF_ENABLED)
export const CSRF_SECRET = env.CSRF_SECRET ?? SECRET_KEY

// ============ 日志配置 ============

// 日志格式: dev, combined, common, short, tiny (不支持禁用)
export const LOG_FORMAT = env.LOG_FORMAT ?? (NODE_ENV === 'prod' ? 'combined' : 'dev')
export const LOG_DIR = env.LOG_DIR ?? 'logs'

// ============ Redis 配置 ============

export const REDIS_ENABLED = parseBoolean(env.REDIS_ENABLED)
export const REDIS_URL = env.REDIS_URL ?? 'redis://localhost:6379'
export const REDIS_PREFIX = env.REDIS_PREFIX ?? 'prexis:'

// ============ WebSocket 配置 ============

export const WS_PATH = env.WS_PATH ?? '/ws'
export const WS_HEARTBEAT_INTERVAL = parseNumber(env.WS_HEARTBEAT_INTERVAL, 30000)

// ============ OpenTelemetry 配置 ============

export const OTEL_ENABLED = parseBoolean(env.OTEL_ENABLED)
export const OTEL_SERVICE_NAME = env.OTEL_SERVICE_NAME ?? 'prexis'
export const OTEL_SERVICE_VERSION = env.npm_package_version ?? '1.0.0'
export const OTEL_EXPORTER_ENDPOINT = env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318'
export const OTEL_SAMPLING_RATIO = parseFloat_(env.OTEL_SAMPLING_RATIO, 1.0)

// ============ 速率限制配置 ============

export const RATE_LIMIT_WINDOW_MS = parseNumber(env.RATE_LIMIT_WINDOW_MS, 60000)
export const RATE_LIMIT_MAX = parseNumber(env.RATE_LIMIT_MAX, 100)
export const AUTH_RATE_LIMIT_WINDOW_MS = parseNumber(env.AUTH_RATE_LIMIT_WINDOW_MS, 900000)
export const AUTH_RATE_LIMIT_MAX = parseNumber(env.AUTH_RATE_LIMIT_MAX, 10)

// ============ HTTP/2 配置 ============

// 开发环境自动启用 HTTP/2 (使用自动生成的开发证书)
export const HTTP2_ENABLED = parseBoolean(env.HTTP2_ENABLED, NODE_ENV === 'dev')
export const HTTP2_CERT_PATH = env.HTTP2_CERT_PATH ?? 'certs/server.crt'
export const HTTP2_KEY_PATH = env.HTTP2_KEY_PATH ?? 'certs/server.key'
export const HTTP2_PORT = parseNumber(env.HTTP2_PORT, 3443)

// ============ Worker 池配置 ============

export const WORKER_POOL_ENABLED = parseBoolean(env.WORKER_POOL_ENABLED)
export const WORKER_POOL_SIZE = parseNumber(env.WORKER_POOL_SIZE, 0) || Math.max(1, cpus().length - 1)
export const WORKER_TASK_TIMEOUT = parseNumber(env.WORKER_TASK_TIMEOUT, 30000)

// ============ 性能配置 ============

export const REQUEST_TIMEOUT = parseNumber(env.REQUEST_TIMEOUT, 30000)
export const SLOW_REQUEST_THRESHOLD = parseNumber(env.SLOW_REQUEST_THRESHOLD, 3000)
export const KEEP_ALIVE_TIMEOUT = parseNumber(env.KEEP_ALIVE_TIMEOUT, 65000)

// ============ 配置对象导出 (便于解构) ============

export const appConfig = {
  nodeEnv: NODE_ENV,
  port: PORT,
  host: HOST,
  credentials: CREDENTIALS,
  origin: ORIGIN,
} as const

export const securityConfig = {
  secretKey: SECRET_KEY,
  csrfEnabled: CSRF_ENABLED,
  csrfSecret: CSRF_SECRET,
} as const

export const logConfig = {
  format: LOG_FORMAT,
  dir: LOG_DIR,
} as const

export const redisConfig = {
  enabled: REDIS_ENABLED,
  url: REDIS_URL,
  prefix: REDIS_PREFIX,
} as const

export const wsConfig = {
  path: WS_PATH,
  heartbeatInterval: WS_HEARTBEAT_INTERVAL,
} as const

export const otelConfig = {
  enabled: OTEL_ENABLED,
  serviceName: OTEL_SERVICE_NAME,
  serviceVersion: OTEL_SERVICE_VERSION,
  exporterEndpoint: OTEL_EXPORTER_ENDPOINT,
  samplingRatio: OTEL_SAMPLING_RATIO,
} as const

export const rateLimitConfig = {
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  authWindowMs: AUTH_RATE_LIMIT_WINDOW_MS,
  authMax: AUTH_RATE_LIMIT_MAX,
} as const

export const http2Config = {
  enabled: HTTP2_ENABLED,
  certPath: HTTP2_CERT_PATH,
  keyPath: HTTP2_KEY_PATH,
  port: HTTP2_PORT,
} as const

export const workerConfig = {
  enabled: WORKER_POOL_ENABLED,
  poolSize: WORKER_POOL_SIZE,
  taskTimeout: WORKER_TASK_TIMEOUT,
} as const

export const performanceConfig = {
  requestTimeout: REQUEST_TIMEOUT,
  slowRequestThreshold: SLOW_REQUEST_THRESHOLD,
  keepAliveTimeout: KEEP_ALIVE_TIMEOUT,
} as const

// ============ 辅助判断函数 ============

export const isProd = (): boolean => NODE_ENV === 'prod'
export const isDev = (): boolean => NODE_ENV === 'dev'
