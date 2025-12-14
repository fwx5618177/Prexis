/**
 * 环境变量配置
 * 本地开发: 从 .env 文件加载
 * 生产环境: 由运行时注入 (Docker / K8s / CI)
 */

import { config } from 'dotenv'

config()

// ============ 应用配置 ============
export const NODE_ENV = process.env.NODE_ENV ?? 'dev'
export const PORT = process.env.PORT ?? '3000'
export const HOST = process.env.HOST ?? '0.0.0.0'
export const CREDENTIALS = process.env.CREDENTIALS === 'true'
export const ORIGIN = process.env.ORIGIN ?? '*'

// ============ 安全配置 ============
export const SECRET_KEY = process.env.SECRET_KEY ?? 'default-secret-key'
export const CSRF_ENABLED = process.env.CSRF_ENABLED === 'true'
export const CSRF_SECRET = process.env.CSRF_SECRET ?? SECRET_KEY

// ============ 日志配置 ============
export const LOG_FORMAT = process.env.LOG_FORMAT ?? 'dev'
export const LOG_DIR = process.env.LOG_DIR ?? 'logs'

// ============ Redis 配置 ============
export const REDIS_ENABLED = process.env.REDIS_ENABLED === 'true'
export const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379'
export const REDIS_PREFIX = process.env.REDIS_PREFIX ?? 'prexis:'

// ============ WebSocket 配置 ============
export const WS_PATH = process.env.WS_PATH ?? '/ws'
export const WS_HEARTBEAT_INTERVAL = parseInt(process.env.WS_HEARTBEAT_INTERVAL ?? '30000', 10)

// ============ OpenTelemetry 配置 ============
export const OTEL_ENABLED = process.env.OTEL_ENABLED === 'true'
export const OTEL_SERVICE_NAME = process.env.OTEL_SERVICE_NAME ?? 'prexis'
export const OTEL_SERVICE_VERSION = process.env.npm_package_version ?? '1.0.0'
export const OTEL_EXPORTER_ENDPOINT = process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318'
export const OTEL_SAMPLING_RATIO = parseFloat(process.env.OTEL_SAMPLING_RATIO ?? '1.0')

// ============ 速率限制配置 ============
export const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000', 10)
export const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10)
export const AUTH_RATE_LIMIT_WINDOW_MS = parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? '900000', 10)
export const AUTH_RATE_LIMIT_MAX = parseInt(process.env.AUTH_RATE_LIMIT_MAX ?? '10', 10)
