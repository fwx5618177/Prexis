import express from 'express'
import http from 'http'
import cors from 'cors'
import helmet from 'helmet'
import hpp from 'hpp'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import chalk from 'chalk'
import { Routes } from '@types'
import { LOG_FORMAT, NODE_ENV, ORIGIN, PORT, HOST, CREDENTIALS } from '@config'
import { isProd } from '@/shared/utils'
import { logger, stream } from '@/utils/loggers'
import swaggerJSDoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import errorMiddleware from '@/middlewares/error.middleware'
import { WebSocketModule, type WebSocketConfig } from '@/modules/websocket'

class App {
  public app: express.Application
  public server: http.Server
  public env: string
  public port: string | number
  public host: string
  private isReady = false
  private wsModule: WebSocketModule | null = null

  constructor(routes: Routes[], wsConfig?: WebSocketConfig) {
    this.app = express()
    this.server = http.createServer(this.app)
    this.env = NODE_ENV || 'dev'
    this.port = PORT || 3000
    this.host = HOST || '0.0.0.0'

    this.initializeMiddlewares()
    this.initializeRoutes(routes)
    this.initializeSwagger()
    this.initializeWebSocket(wsConfig)
    this.initializeErrorHandling()
  }

  /**
   * 启动服务器
   */
  public async listen(): Promise<void> {
    this.server.listen(Number(this.port), this.host, () => {
      this.isReady = true
      logger.info(`=====================================`)
      logger.info(`======= ENV: ${chalk.red(this.env)} =======`)
      logger.info(`Listening on ${chalk.green(this.host + ':' + this.port)}`)
      logger.info(`Link: ${chalk.bgGreenBright('http://' + this.host + ':' + this.port)}/`)
      logger.info(`Swagger: ${chalk.cyan('http://' + this.host + ':' + this.port + '/api-docs')}`)
      logger.info(`GraphQL: ${chalk.magenta('http://' + this.host + ':' + this.port + '/graphql')}`)
      if (this.wsModule) {
        logger.info(`WebSocket: ${chalk.yellow('ws://' + this.host + ':' + this.port + '/ws')}`)
      }
      logger.info(`=====================================`)
    })
  }

  public getServer(): express.Application {
    return this.app
  }

  public getReadyStatus(): boolean {
    return this.isReady
  }

  private initializeMiddlewares(): void {
    this.app.use(morgan(LOG_FORMAT || 'combined', { stream }))

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
}

export default App
