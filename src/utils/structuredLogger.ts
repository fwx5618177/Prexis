/**
 * 结构化日志系统
 * 支持 JSON 格式输出、request-id 追踪、上下文信息
 */

import { LOG_DIR } from '@config'
import { isDev } from '@/shared/utils'
import path from 'path'
import winston from 'winston'
import winstonDaily from 'winston-daily-rotate-file'
import { existsSync, mkdirSync } from 'fs'
import { Request } from 'express'

// 日志上下文接口
export interface LogContext {
  requestId?: string
  userId?: number | string
  method?: string
  path?: string
  duration?: number
  statusCode?: number
  [key: string]: unknown
}

// logs dir - 确保日志文件生成在项目根目录的 logs 文件夹中
const getLogDir = (): string => {
  const envLogDir = LOG_DIR && LOG_DIR !== 'undefined' ? String(LOG_DIR) : 'logs'

  if (path.isAbsolute(envLogDir)) {
    return envLogDir
  }

  if (envLogDir.includes('../')) {
    console.warn(`⚠️  LOG_DIR 配置可能有误: ${envLogDir}，将使用项目根目录的 logs 文件夹`)
    return path.join(process.cwd(), 'logs')
  }

  return path.join(process.cwd(), envLogDir)
}

const logDir: string = getLogDir()

// 创建日志目录
const ensureLogDirs = () => {
  const dirs = [logDir, path.join(logDir, 'debug'), path.join(logDir, 'error')]
  dirs.forEach(dir => {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
  })
}

ensureLogDirs()

// 启动时显示日志目录信息
if (isDev()) {
  console.log(`📝 日志文件将保存到: ${logDir}`)
}

// JSON 格式（生产环境）
const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
)

// 可读格式（开发环境）
const readableFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, requestId, duration, ...meta }) => {
    const reqId = requestId && typeof requestId === 'string' ? `[${requestId.slice(0, 8)}]` : ''
    const dur = duration ? ` ${duration}ms` : ''
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : ''
    return `${timestamp} ${level}: ${reqId}${message}${dur}${metaStr}`
  }),
)

// 创建 logger
const logger = winston.createLogger({
  level: isDev() ? 'debug' : 'info',
  format: isDev() ? readableFormat : jsonFormat,
  defaultMeta: {
    service: 'prexis',
    env: process.env.NODE_ENV || 'dev',
  },
  transports: [
    // debug log
    new winstonDaily({
      level: 'debug',
      datePattern: 'YYYY-MM-DD',
      dirname: path.join(logDir, 'debug'),
      filename: '%DATE%.log',
      maxFiles: 30,
      json: !isDev(),
      zippedArchive: true,
    }),
    // error log
    new winstonDaily({
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      dirname: path.join(logDir, 'error'),
      filename: '%DATE%.log',
      maxFiles: 30,
      handleExceptions: true,
      json: !isDev(),
      zippedArchive: true,
    }),
  ],
})

// 控制台输出
logger.add(
  new winston.transports.Console({
    format: readableFormat,
  }),
)

/**
 * 带上下文的日志记录器
 */
export class ContextLogger {
  private context: LogContext

  constructor(context: LogContext = {}) {
    this.context = context
  }

  /**
   * 从 Request 创建日志记录器
   */
  static fromRequest(req: Request): ContextLogger {
    return new ContextLogger({
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      userId: (req as any).user?.id,
    })
  }

  private log(level: string, message: string, meta: Record<string, unknown> = {}) {
    logger.log(level, message, { ...this.context, ...meta })
  }

  info(message: string, meta: Record<string, unknown> = {}) {
    this.log('info', message, meta)
  }

  error(message: string, meta: Record<string, unknown> = {}) {
    this.log('error', message, meta)
  }

  warn(message: string, meta: Record<string, unknown> = {}) {
    this.log('warn', message, meta)
  }

  debug(message: string, meta: Record<string, unknown> = {}) {
    this.log('debug', message, meta)
  }
}

// Morgan stream（兼容旧代码）
const stream = {
  write: (message: string) => {
    logger.info(message.substring(0, message.lastIndexOf('\n')))
  },
}

export { logger, stream }
