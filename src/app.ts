import express from 'express'
import http from 'http'
import cors from 'cors'
import helmet from 'helmet'
import hpp from 'hpp'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import chalk from 'chalk'
import http2Express from 'http2-express-bridge'
import { Routes } from '@types'
import {
  LOG_FORMAT,
  NODE_ENV,
  ORIGIN,
  PORT,
  HOST,
  CREDENTIALS,
  HTTP2_ENABLED,
  HTTP2_CERT_PATH,
  HTTP2_KEY_PATH,
  HTTP2_PORT,
  WORKER_POOL_ENABLED,
  WORKER_POOL_SIZE,
  WORKER_TASK_TIMEOUT,
} from '@config'
import { isProd } from '@/shared/utils'
import { logger, stream } from '@/utils/loggers'
import swaggerJSDoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import errorMiddleware from '@/middlewares/error.middleware'
import { WebSocketModule, type WebSocketConfig } from '@/modules/websocket'
import { Http2Server } from '@/services/http2.service'
import { WorkerPool, WorkerTask, WorkerResult } from '@/services/worker.service'
import { applyPerformanceOptimizations, slowRequestLogger, timeoutMiddleware } from '@/services/performance.service'
import { resolve } from 'path'
import { existsSync } from 'fs'

/**
 * App 配置选项
 */
export interface AppConfig {
  /** WebSocket 配置 */
  wsConfig?: WebSocketConfig
  /** 是否启用 HTTP/2 */
  enableHttp2?: boolean
  /** 是否启用 Worker Pool */
  enableWorkerPool?: boolean
  /** 请求超时时间 (毫秒) */
  requestTimeout?: number
  /** 慢请求阈值 (毫秒) */
  slowRequestThreshold?: number
  /** 是否信任代理 */
  trustProxy?: boolean | string | number
}

class App {
  public app: express.Application
  public server: http.Server
  public env: string
  public port: string | number
  public host: string
  private isReady = false
  private wsModule: WebSocketModule | null = null
  private http2Server: Http2Server | null = null
  private workerPool: WorkerPool | null = null
  private config: AppConfig

  constructor(routes: Routes[], config: AppConfig = {}) {
    // 使用 http2-express-bridge 创建兼容 HTTP/2 的 Express 应用
    this.app = http2Express(express)
    this.server = http.createServer(this.app)
    this.env = NODE_ENV || 'dev'
    this.port = PORT || 3000
    this.host = HOST || '0.0.0.0'
    this.config = config

    // 应用性能优化
    this.initializePerformanceOptimizations()
    this.initializeMiddlewares()
    this.initializeRoutes(routes)
    this.initializeSwagger()
    this.initializeWebSocket(config.wsConfig)
    this.initializeErrorHandling()

    // 初始化 Worker Pool
    if (config.enableWorkerPool ?? WORKER_POOL_ENABLED) {
      this.initializeWorkerPool()
    }
  }

  /**
   * 启动服务器
   */
  public async listen(): Promise<void> {
    // 启动 HTTP/1.1 服务器
    await this.startHttpServer()

    // 启动 HTTP/2 服务器 (如果启用)
    if (this.config.enableHttp2 ?? HTTP2_ENABLED) {
      await this.startHttp2Server()
    }
  }

  /**
   * 启动 HTTP/1.1 服务器
   */
  private async startHttpServer(): Promise<void> {
    return new Promise(resolve => {
      this.server.listen(Number(this.port), this.host, () => {
        this.isReady = true
        this.logServerInfo()
        resolve()
      })
    })
  }

  /**
   * 启动 HTTP/2 服务器
   */
  private async startHttp2Server(): Promise<void> {
    const certPath = resolve(process.cwd(), HTTP2_CERT_PATH)
    const keyPath = resolve(process.cwd(), HTTP2_KEY_PATH)

    // 检查证书是否存在
    if (!existsSync(certPath) || !existsSync(keyPath)) {
      logger.warn(`HTTP/2 certificates not found. Skipping HTTP/2 server.`)
      logger.warn(`Expected: ${certPath} and ${keyPath}`)
      logger.info(`Generate with: npm run certs:generate`)
      return
    }

    try {
      this.http2Server = new Http2Server(this.app)
      await this.http2Server.start({
        certPath,
        keyPath,
        port: HTTP2_PORT,
        host: this.host,
      })
      logger.info(`HTTP/2 Server: ${chalk.blue('https://' + this.host + ':' + HTTP2_PORT)}`)
    } catch (error) {
      logger.error('Failed to start HTTP/2 server:', error)
    }
  }

  /**
   * 日志输出服务器信息
   */
  private logServerInfo(): void {
    logger.info(`=====================================`)
    logger.info(`======= ENV: ${chalk.red(this.env)} =======`)
    logger.info(`Listening on ${chalk.green(this.host + ':' + this.port)}`)
    logger.info(`Link: ${chalk.bgGreenBright('http://' + this.host + ':' + this.port)}/`)
    logger.info(`Swagger: ${chalk.cyan('http://' + this.host + ':' + this.port + '/api-docs')}`)
    logger.info(`GraphQL: ${chalk.magenta('http://' + this.host + ':' + this.port + '/graphql')}`)
    if (this.wsModule) {
      logger.info(`WebSocket: ${chalk.yellow('ws://' + this.host + ':' + this.port + '/ws')}`)
    }
    if (this.workerPool) {
      const status = this.workerPool.getStatus()
      logger.info(`Worker Pool: ${chalk.cyan(status.total + ' workers ready')}`)
    }
    logger.info(`=====================================`)
  }

  public getServer(): express.Application {
    return this.app
  }

  public getHttpServer(): http.Server {
    return this.server
  }

  public getHttp2Server(): Http2Server | null {
    return this.http2Server
  }

  public getReadyStatus(): boolean {
    return this.isReady
  }

  /**
   * 获取 Worker Pool 实例
   */
  public getWorkerPool(): WorkerPool | null {
    return this.workerPool
  }

  /**
   * 执行 Worker 任务
   */
  public async executeWorkerTask<T, R>(task: WorkerTask<T>): Promise<WorkerResult<R>> {
    if (!this.workerPool) {
      throw new Error('Worker pool is not enabled. Set WORKER_POOL_ENABLED=true')
    }
    return this.workerPool.execute<T, R>(task)
  }

  /**
   * 初始化性能优化
   */
  private initializePerformanceOptimizations(): void {
    applyPerformanceOptimizations(this.app, {
      disableXPoweredBy: true,
      disableEtag: !isProd(), // 生产环境保留 ETag
      enableKeepAlive: true,
      keepAliveTimeout: 65000,
      trustProxy: this.config.trustProxy ?? isProd(),
    })

    // 请求超时
    if (this.config.requestTimeout) {
      this.app.use(timeoutMiddleware(this.config.requestTimeout))
    }

    // 慢请求日志
    if (this.config.slowRequestThreshold) {
      this.app.use(slowRequestLogger(this.config.slowRequestThreshold))
    }
  }

  /**
   * 初始化 Worker Pool
   */
  private initializeWorkerPool(): void {
    const workerScript = resolve(__dirname, 'services', 'worker.runner.js')

    // 检查 worker 脚本是否存在
    if (!existsSync(workerScript)) {
      logger.warn(`Worker script not found: ${workerScript}`)
      logger.warn(`Worker pool disabled. Build the project first.`)
      return
    }

    try {
      this.workerPool = new WorkerPool(workerScript, {
        size: WORKER_POOL_SIZE,
        timeout: WORKER_TASK_TIMEOUT,
      })
      logger.info(`Worker pool initialized with ${WORKER_POOL_SIZE} workers`)
    } catch (error) {
      logger.error('Failed to initialize worker pool:', error)
    }
  }

  private initializeMiddlewares(): void {
    // 请求日志 - 始终启用
    this.app.use(morgan(LOG_FORMAT, { stream }))

    this.app.use(
      cors({
        origin: ORIGIN,
        credentials: CREDENTIALS,
      }),
    )

    this.app.use(hpp() as express.RequestHandler)
    this.app.use(
      helmet({
        contentSecurityPolicy: isProd() ? undefined : false,
        crossOriginEmbedderPolicy: false,
      }),
    )
    this.app.use(compression() as express.RequestHandler)

    this.app.use(express.json())
    this.app.use(express.urlencoded({ extended: false }))
    this.app.use(cookieParser())
  }

  private initializeRoutes(routes: Routes[]): void {
    routes.forEach(route => {
      this.app.use('/', route.router)
    })
  }

  private initializeSwagger(): void {
    const options = {
      swaggerDefinition: {
        info: {
          title: 'Prexis API',
          version: '1.0.0',
          description: 'Prexis API Documentation',
        },
        host: `${this.host}:${this.port}`,
        basePath: '/api',
      },
      explorer: true,
      apis: ['**/*.ts'],
    }

    const specs = swaggerJSDoc(options)
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs))
  }

  private initializeWebSocket(config?: WebSocketConfig): void {
    if (config?.enabled === false) {
      return
    }
    this.wsModule = WebSocketModule.getInstance(config)
    this.wsModule.attach(this.server)
  }

  public getWebSocketModule(): WebSocketModule | null {
    return this.wsModule
  }

  private initializeErrorHandling(): void {
    this.app.use(errorMiddleware)
  }

  /**
   * 优雅关闭服务
   */
  public async shutdown(): Promise<void> {
    logger.info('Shutting down server...')

    // 关闭 Worker Pool
    if (this.workerPool) {
      await this.workerPool.shutdown()
    }

    // 关闭 HTTP/2 服务器
    if (this.http2Server) {
      await this.http2Server.close()
    }

    // 关闭 WebSocket
    if (this.wsModule) {
      await this.wsModule.close()
    }

    // 关闭 HTTP 服务器
    await new Promise<void>((resolve, reject) => {
      this.server.close(err => {
        if (err) reject(err)
        else resolve()
      })
    })

    logger.info('Server shutdown complete')
  }
}

export default App
