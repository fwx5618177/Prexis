/**
 * OpenTelemetry 遥测中间件
 * 分布式追踪和可观测性支持
 *
 * 使用方式：
 * 1. 在 server.ts 启动时调用 initTelemetry()
 * 2. 在 Express 中使用 createTracingMiddleware() 或 simpleTracingMiddleware
 *
 */

import { Request, Response, NextFunction, RequestHandler } from 'express'
import { logger } from '@/utils/loggers'
import {
  OTEL_ENABLED,
  OTEL_SERVICE_NAME,
  OTEL_SERVICE_VERSION,
  OTEL_EXPORTER_ENDPOINT,
  OTEL_SAMPLING_RATIO,
} from '@/config'

// OpenTelemetry 类型定义
import type { Tracer, Span, SpanStatusCode as SpanStatusCodeType } from '@opentelemetry/api'

/**
 * 遥测配置接口
 */
export interface TelemetryConfig {
  enabled: boolean
  serviceName: string
  serviceVersion: string
  exporterEndpoint: string
  samplingRatio: number
}

/**
 * 追踪中间件选项
 */
export interface TracingMiddlewareOptions {
  /** 是否记录请求体 */
  logRequestBody?: boolean
  /** 是否记录响应体 */
  logResponseBody?: boolean
  /** 忽略的路径 */
  ignorePaths?: string[]
}

/**
 * 获取遥测配置（从统一配置读取）
 */
export function getTelemetryConfig(): TelemetryConfig {
  return {
    enabled: OTEL_ENABLED,
    serviceName: OTEL_SERVICE_NAME,
    serviceVersion: OTEL_SERVICE_VERSION,
    exporterEndpoint: OTEL_EXPORTER_ENDPOINT,
    samplingRatio: OTEL_SAMPLING_RATIO,
  }
}

// 模块级别的 SDK 实例引用
let sdkInstance: { shutdown: () => Promise<void> } | null = null

/**
 * 初始化 OpenTelemetry
 * 检测是否安装了 OpenTelemetry 依赖，如果安装则初始化
 */
export async function initTelemetry(): Promise<void> {
  const config = getTelemetryConfig()

  if (!config.enabled) {
    logger.info('OpenTelemetry is disabled')
    return
  }

  try {
    // 动态导入 OpenTelemetry 模块
    const [sdkNodeModule, autoInstrModule, exporterModule, resourcesModule, semConvModule] = await Promise.all([
      import('@opentelemetry/sdk-node'),
      import('@opentelemetry/auto-instrumentations-node'),
      import('@opentelemetry/exporter-trace-otlp-http'),
      import('@opentelemetry/resources'),
      import('@opentelemetry/semantic-conventions'),
    ])

    const { NodeSDK } = sdkNodeModule
    const { getNodeAutoInstrumentations } = autoInstrModule
    const { OTLPTraceExporter } = exporterModule
    const { resourceFromAttributes } = resourcesModule
    const { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } = semConvModule

    const traceExporter = new OTLPTraceExporter({
      url: `${config.exporterEndpoint}/v1/traces`,
    })

    const sdk = new NodeSDK({
      resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: config.serviceName,
        [ATTR_SERVICE_VERSION]: config.serviceVersion,
      }),
      traceExporter,
      instrumentations: [
        getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-fs': { enabled: false },
          '@opentelemetry/instrumentation-express': { enabled: true },
          '@opentelemetry/instrumentation-http': { enabled: true },
        }),
      ],
    })

    sdk.start()
    sdkInstance = sdk

    // 优雅关闭
    process.on('SIGTERM', () => {
      sdk.shutdown().then(
        () => logger.info('OpenTelemetry SDK shut down'),
        (err: Error) => logger.error('Error shutting down OpenTelemetry SDK', err),
      )
    })

    logger.info(`OpenTelemetry initialized: ${config.serviceName} -> ${config.exporterEndpoint}`)
  } catch (error) {
    const err = error as NodeJS.ErrnoException
    if (err.code === 'ERR_MODULE_NOT_FOUND' || err.code === 'MODULE_NOT_FOUND') {
      logger.warn(
        'OpenTelemetry dependencies not installed. Run: pnpm add @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node @opentelemetry/exporter-trace-otlp-http @opentelemetry/resources @opentelemetry/semantic-conventions',
      )
    } else {
      logger.error('Failed to initialize OpenTelemetry:', error)
    }
  }
}

/**
 * 关闭 OpenTelemetry
 */
export async function shutdownTelemetry(): Promise<void> {
  if (sdkInstance) {
    await sdkInstance.shutdown()
    sdkInstance = null
    logger.info('OpenTelemetry shut down')
  }
}

/**
 * 手动创建 Span 的辅助函数
 */
export async function withSpan<T>(
  name: string,
  fn: () => Promise<T>,
  attributes?: Record<string, string | number | boolean>,
): Promise<T> {
  try {
    const api = await import('@opentelemetry/api')
    const { trace, SpanStatusCode } = api
    const tracer: Tracer = trace.getTracer('prexis')

    return tracer.startActiveSpan(name, async (span: Span) => {
      try {
        if (attributes) {
          Object.entries(attributes).forEach(([key, value]) => {
            span.setAttribute(key, value)
          })
        }
        const result = await fn()
        span.setStatus({ code: SpanStatusCode.OK as SpanStatusCodeType })
        return result
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR as SpanStatusCodeType,
          message: error instanceof Error ? error.message : 'Unknown error',
        })
        throw error
      } finally {
        span.end()
      }
    })
  } catch {
    // OpenTelemetry 未安装，直接执行函数
    return fn()
  }
}

/**
 * 创建追踪中间件
 * 在每个请求中添加 trace-id 和 span-id 到响应头
 */
export function createTracingMiddleware(options: TracingMiddlewareOptions = {}): RequestHandler {
  const { ignorePaths = ['/health', '/metrics', '/favicon.ico'] } = options

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // 忽略指定路径
    if (ignorePaths.some(path => req.path.startsWith(path))) {
      return next()
    }

    try {
      const api = await import('@opentelemetry/api')
      const { trace, context } = api
      const span = trace.getSpan(context.active())

      if (span) {
        const spanContext = span.spanContext()
        res.setHeader('X-Trace-Id', spanContext.traceId)
        res.setHeader('X-Span-Id', spanContext.spanId)

        // 添加请求属性
        span.setAttribute('http.client_ip', req.ip ?? 'unknown')
        span.setAttribute('http.user_agent', req.get('user-agent') ?? 'unknown')

        if (req.headers['x-request-id']) {
          span.setAttribute('http.request_id', req.headers['x-request-id'] as string)
        }
      }
    } catch {
      // OpenTelemetry 未安装，跳过
    }

    next()
  }
}
