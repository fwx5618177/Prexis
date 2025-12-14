/**
 * WebSocket 模块配置
 * 集成 WebSocket 到 Express 应用
 */

import type { Server as HttpServer } from 'http'
import { WebSocketService, getWebSocketService } from './services/websocket.service'
import { logger } from '@/utils/loggers'

export interface WebSocketConfig {
  /** WebSocket 路径 */
  path?: string
  /** 心跳间隔 (ms) */
  heartbeatInterval?: number
  /** 最大消息大小 (bytes) */
  maxPayload?: number
  /** 是否启用 */
  enabled?: boolean
}

/**
 * WebSocket 模块
 * 负责初始化和配置 WebSocket 服务
 */
export class WebSocketModule {
  private static instance: WebSocketModule | null = null
  private wsService: WebSocketService
  private config: WebSocketConfig

  private constructor(config: WebSocketConfig = {}) {
    this.config = {
      path: config.path ?? '/ws',
      heartbeatInterval: config.heartbeatInterval ?? 30000,
      maxPayload: config.maxPayload ?? 1024 * 1024,
      enabled: config.enabled ?? true,
    }
    this.wsService = getWebSocketService()
  }

  /**
   * 获取模块实例
   */
  static getInstance(config?: WebSocketConfig): WebSocketModule {
    if (!WebSocketModule.instance) {
      WebSocketModule.instance = new WebSocketModule(config)
    }
    return WebSocketModule.instance
  }

  /**
   * 附加到 HTTP 服务器
   */
  attach(server: HttpServer): void {
    if (!this.config.enabled) {
      logger.info('WebSocket is disabled')
      return
    }

    this.wsService.attach(server)
    this.registerDefaultHandlers()
  }

  /**
   * 注册默认消息处理器
   */
  private registerDefaultHandlers(): void {
    // ping-pong 处理
    this.wsService.on('ping', (ws, _data, service) => {
      service.send(ws, { type: 'pong', timestamp: Date.now() })
    })

    // 加入房间
    this.wsService.on('join', (ws, data, service) => {
      const { room } = data as { room?: string }
      if (room) {
        service.joinRoom(ws, room)
        service.send(ws, { type: 'joined', room })
        logger.debug(`Client ${ws.clientId} joined room: ${room}`)
      }
    })

    // 离开房间
    this.wsService.on('leave', (ws, data, service) => {
      const { room } = data as { room?: string }
      if (room) {
        service.leaveRoom(ws, room)
        service.send(ws, { type: 'left', room })
        logger.debug(`Client ${ws.clientId} left room: ${room}`)
      }
    })

    // 房间消息
    this.wsService.on('room_message', (ws, data, service) => {
      const { room, message } = data as { room?: string; message?: string }
      if (room && message) {
        service.broadcastToRoom(
          room,
          {
            type: 'room_message',
            room,
            message,
            from: ws.clientId,
          },
          ws.clientId,
        )
      }
    })
  }

  /**
   * 获取 WebSocket 服务
   */
  getService(): WebSocketService {
    return this.wsService
  }

  /**
   * 获取配置
   */
  getConfig(): WebSocketConfig {
    return this.config
  }
}
