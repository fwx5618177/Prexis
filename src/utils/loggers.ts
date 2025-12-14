/**
 * 日志系统
 * 生产环境使用异步批量写入，减少同步 IO 阻塞
 */
import { LOG_DIR } from '@config'
import { isDev, isProd } from '@/shared/utils'
import path from 'path'
import winston from 'winston'
import chalk from 'chalk'
import winstonDaily from 'winston-daily-rotate-file'
import { existsSync, mkdirSync } from 'fs'

/**
 * 异步日志缓冲管理器
 * 生产环境下批量写入日志，减少 IO 操作
 */
class AsyncLogBuffer {
  private buffer: Array<{ level: string; message: string; timestamp: string }> = []
  private readonly maxSize: number
  private readonly flushIntervalMs: number
  private timer: ReturnType<typeof setInterval> | null = null
  private readonly writeCallback: (entries: Array<{ level: string; message: string; timestamp: string }>) => void

  constructor(
    writeCallback: (entries: Array<{ level: string; message: string; timestamp: string }>) => void,
    maxSize = 50,
    flushIntervalMs = 1000,
  ) {
    this.writeCallback = writeCallback
    this.maxSize = maxSize
    this.flushIntervalMs = flushIntervalMs
    this.startTimer()
  }

  add(level: string, message: string, timestamp: string): void {
    this.buffer.push({ level, message, timestamp })
    if (this.buffer.length >= this.maxSize) {
      this.flush()
    }
  }

  private startTimer(): void {
    this.timer = setInterval(() => {
      if (this.buffer.length > 0) {
        this.flush()
      }
    }, this.flushIntervalMs)
  }

  flush(): void {
    if (this.buffer.length === 0) return
    const entries = this.buffer.splice(0)
    setImmediate(() => this.writeCallback(entries))
  }

  destroy(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    this.flush()
  }
}

/**
 * 获取日志目录路径
 */
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
;[logDir, path.join(logDir, 'debug'), path.join(logDir, 'error')].forEach(dir => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
})

if (isDev()) {
  console.log(`📝 日志文件将保存到: ${logDir}`)
}

/**
 * 日志格式
 */
const logFormat = winston.format.printf(
  ({ timestamp, level, message }: winston.Logform.TransformableInfo): string => `${timestamp} [${level}]: ${message}`,
)

const coloredFormat = winston.format.printf(
  ({ timestamp, level, message }: winston.Logform.TransformableInfo): string =>
    `${timestamp} [${chalk.red(level)}]: ${message}`,
)

/**
 * 创建文件日志传输
 */
const createFileTransport = (level: string, dirname: string): winstonDaily => {
  return new winstonDaily({
    level,
    datePattern: 'YYYY-MM-DD',
    dirname,
    filename: `%DATE%.log`,
    maxFiles: 30,
    json: false,
    zippedArchive: true,
    handleExceptions: level === 'error',
  })
}

// 创建基础传输
const debugTransport = createFileTransport('debug', path.join(logDir, 'debug'))
const errorTransport = createFileTransport('error', path.join(logDir, 'error'))

/*
 * Log Level
 * error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6
 */
const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    isProd() ? logFormat : coloredFormat,
  ),
  transports: [debugTransport, errorTransport],
  exitOnError: false,
})

// 控制台输出
logger.add(
  new winston.transports.Console({
    format: winston.format.combine(winston.format.splat(), winston.format.colorize()),
    level: isDev() ? 'debug' : 'info',
  }),
)

/**
 * 生产环境异步日志缓冲
 * 在生产环境下，通过缓冲减少日志 IO 操作
 */
let asyncBuffer: AsyncLogBuffer | null = null

if (isProd()) {
  asyncBuffer = new AsyncLogBuffer(
    entries => {
      // 批量写入日志
      for (const entry of entries) {
        // 使用底层方法直接写入，避免重复格式化
        if (entry.level === 'error') {
          errorTransport.log?.(entry as never, () => {})
        } else {
          debugTransport.log?.(entry as never, () => {})
        }
      }
    },
    50, // 缓冲 50 条
    1000, // 或 1 秒刷新一次
  )

  // 优雅关闭时刷新缓冲区
  process.on('beforeExit', () => {
    asyncBuffer?.destroy()
  })
}

/**
 * Morgan 日志流
 */
const stream = {
  write: (message: string) => {
    logger.info(message.substring(0, message.lastIndexOf('\n')))
  },
}

/**
 * 结构化日志辅助方法
 */
export const logWithContext = (
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string,
  context?: Record<string, unknown>,
): void => {
  const contextStr = context ? ` ${JSON.stringify(context)}` : ''
  logger[level](`${message}${contextStr}`)
}

export { logger, stream }
