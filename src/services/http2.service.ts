/**
 * HTTP/2 服务器
 * 支持 Server Push、多路复用等特性
 *
 * 注意：HTTP/2 需要 HTTPS，开发环境需要自签名证书
 */

import http2, { Http2SecureServer, ServerHttp2Stream } from 'http2'
import { readFileSync, existsSync } from 'fs'
import express, { Application } from 'express'
import http2Express from 'http2-express-bridge'
import { logger } from '@/utils/loggers'

/**
 * HTTP/2 服务器配置
 */
export interface Http2Config {
  /** 证书文件路径 */
  certPath: string
  /** 私钥文件路径 */
  keyPath: string
  /** 端口 */
  port: number
  /** 主机 */
  host?: string
}

/**
 * Server Push 配置
 */
export interface PushConfig {
  /** 推送的资源路径 */
  path: string
  /** 资源类型 */
  contentType: string
  /** 资源内容或文件路径 */
  content: string | Buffer
  /** 是否是文件路径 */
  isFilePath?: boolean
}

/**
 * HTTP/2 服务器封装
 */
export class Http2Server {
  private server: Http2SecureServer | null = null
  private app: Application
  private pushResources: Map<string, PushConfig[]> = new Map()

  constructor(app: Application) {
    this.app = app
  }

  /**
   * 启动 HTTP/2 服务器
   */
  async start(config: Http2Config): Promise<void> {
    // 检查证书文件
    if (!existsSync(config.certPath)) {
      throw new Error(`Certificate file not found: ${config.certPath}`)
    }
    if (!existsSync(config.keyPath)) {
      throw new Error(`Key file not found: ${config.keyPath}`)
    }

    const options: http2.SecureServerOptions = {
      cert: readFileSync(config.certPath),
      key: readFileSync(config.keyPath),
      allowHTTP1: true, // 向后兼容 HTTP/1.1
    }

    // 直接将 Express app 传给 createSecureServer（按照 http2-express-bridge 文档）
    this.server = http2.createSecureServer(
      options,
      this.app as unknown as (req: http2.Http2ServerRequest, res: http2.Http2ServerResponse) => void,
    )

    // 处理 HTTP/2 流 (用于 Server Push)
    this.server.on('stream', (stream: ServerHttp2Stream, headers: http2.IncomingHttpHeaders) => {
      const path = headers[':path'] as string
      const method = headers[':method'] as string

      // 执行 Server Push (如果已注册)
      this.handleServerPush(stream, path)

      // 记录请求
      logger.debug(`HTTP/2 Stream: ${method} ${path}`)
    })

    // 错误处理
    this.server.on('error', (err: Error) => {
      logger.error('HTTP/2 Server error:', err)
    })

    this.server.on('sessionError', (err: Error) => {
      logger.error('HTTP/2 Session error:', err)
    })

    const host = config.host ?? '0.0.0.0'

    return new Promise(resolve => {
      this.server!.listen(config.port, host, () => {
        logger.info(`HTTP/2 Server running on https://${host}:${config.port}`)
        resolve()
      })
    })
  }

  /**
   * 注册 Server Push 资源
   * @param triggerPath 触发推送的请求路径
   * @param resources 要推送的资源列表
   */
  registerPush(triggerPath: string, resources: PushConfig[]): void {
    this.pushResources.set(triggerPath, resources)
    logger.debug(`Registered push resources for ${triggerPath}: ${resources.length} items`)
  }

  /**
   * 处理 Server Push
   */
  private handleServerPush(stream: ServerHttp2Stream, path: string): void {
    const resources = this.pushResources.get(path)

    if (!resources || resources.length === 0) {
      return
    }

    for (const resource of resources) {
      // 检查客户端是否支持 push
      if (!stream.pushAllowed) {
        logger.debug('Client does not support Server Push')
        return
      }

      stream.pushStream(
        { ':path': resource.path },
        (err: Error | null, pushStream: ServerHttp2Stream) => {
          if (err) {
            logger.error('Push stream error:', err)
            return
          }

          let content: Buffer

          if (resource.isFilePath && typeof resource.content === 'string') {
            try {
              content = readFileSync(resource.content)
            } catch {
              logger.error(`Failed to read push resource: ${resource.content}`)
              pushStream.close()
              return
            }
          } else {
            content = Buffer.isBuffer(resource.content)
              ? resource.content
              : Buffer.from(resource.content)
          }

          pushStream.respond({
            ':status': 200,
            'content-type': resource.contentType,
            'content-length': content.length,
          })

          pushStream.end(content)
          logger.debug(`Pushed: ${resource.path}`)
        },
      )
    }
  }

  /**
   * 关闭服务器
   */
  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        resolve()
        return
      }

      this.server.close(err => {
        if (err) {
          reject(err)
        } else {
          this.server = null
          resolve()
        }
      })
    })
  }

  /**
   * 获取服务器实例
   */
  getServer(): Http2SecureServer | null {
    return this.server
  }
}

/**
 * 创建自签名证书的命令 (开发用)
 *
 * ```bash
 * mkdir -p certs
 * openssl req -x509 -newkey rsa:2048 -nodes \
 *   -keyout certs/localhost.key \
 *   -out certs/localhost.crt \
 *   -days 365 \
 *   -subj "/CN=localhost"
 * ```
 */
export const SELF_SIGNED_CERT_COMMAND = `
mkdir -p certs
openssl req -x509 -newkey rsa:2048 -nodes \\
  -keyout certs/localhost.key \\
  -out certs/localhost.crt \\
  -days 365 \\
  -subj "/CN=localhost"
`.trim()

/**
 * 快速创建 HTTP/2 服务器
 */
export function createHttp2Server(app: Application): Http2Server {
  return new Http2Server(app)
}

/**
 * 常用 MIME 类型
 */
export const MimeTypes = {
  HTML: 'text/html; charset=utf-8',
  CSS: 'text/css; charset=utf-8',
  JS: 'application/javascript; charset=utf-8',
  JSON: 'application/json; charset=utf-8',
  PNG: 'image/png',
  JPG: 'image/jpeg',
  SVG: 'image/svg+xml',
  WOFF2: 'font/woff2',
} as const

// ============ 使用示例 ============
/*
import { createHttp2Server, MimeTypes } from '@/services/http2.service'
import App from '@/app'
import RouteLists from '@/routes'

const app = new App(Object.values(RouteLists))
const http2 = createHttp2Server(app.getServer())

// 注册 Server Push
http2.registerPush('/index.html', [
  { path: '/styles/main.css', contentType: MimeTypes.CSS, content: 'styles/main.css', isFilePath: true },
  { path: '/scripts/app.js', contentType: MimeTypes.JS, content: 'scripts/app.js', isFilePath: true },
])

// 启动 HTTP/2 服务器
await http2.start({
  port: 443,
  certPath: 'certs/localhost.crt',
  keyPath: 'certs/localhost.key',
})
*/
