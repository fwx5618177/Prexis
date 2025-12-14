/**
 * WebSocket 服务
 * 管理 WebSocket 连接和消息处理
 */

import { WebSocket, WebSocketServer, type ServerOptions } from 'ws'
import type { Server as HttpServer } from 'http'
import type { IncomingMessage } from 'http'
import { logger } from '@/utils/loggers'
import { WS_PATH, WS_HEARTBEAT_INTERVAL } from '@/config'

/**
 * 扩展 WebSocket 接口
 */
interface ExtendedWebSocket extends WebSocket {
  isAlive: boolean
  clientId: string
  rooms: Set<string>
}

/**
 * 消息处理器
 */
export interface WebSocketMessageHandler {
  (ws: ExtendedWebSocket, data: unknown, service: WebSocketService): void | Promise<void>
}

/**
 * 房间信息
 */
export interface WebSocketRoom {
  name: string
  clients: Set<string>
}

/**
 * WebSocket 服务类
 */
export class WebSocketService {
  private wss: WebSocketServer | null = null
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private clients: Map<string, ExtendedWebSocket> = new Map()
  private rooms: Map<string, WebSocketRoom> = new Map()
  private messageHandlers: Map<string, WebSocketMessageHandler> = new Map()

  private readonly path: string
  private readonly heartbeatInterval: number
  private readonly maxPayload: number

  constructor(options: { path?: string; heartbeatInterval?: number; maxPayload?: number } = {}) {
    this.path = options.path ?? WS_PATH
    this.heartbeatInterval = options.heartbeatInterval ?? WS_HEARTBEAT_INTERVAL
    this.maxPayload = options.maxPayload ?? 1024 * 1024
  }

  /**
   * 附加到 HTTP 服务器
   */
  attach(server: HttpServer): void {
    if (this.wss) {
      logger.warn('WebSocket server already attached')
      return
    }

    const wsOptions: ServerOptions = {
      server,
      path: this.path,
      maxPayload: this.maxPayload,
    }

    this.wss = new WebSocketServer(wsOptions)
    this.setupEventHandlers()
    this.startHeartbeat()

    logger.info(`WebSocket server attached on path: ${this.path}`)
  }

  /**
   * 注册消息处理器
   */
  on(type: string, handler: WebSocketMessageHandler): void {
    this.messageHandlers.set(type, handler)
  }

  /**
   * 移除消息处理器
   */
  off(type: string): void {
    this.messageHandlers.delete(type)
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    if (!this.wss) return

    this.wss.on('connection', (ws: WebSocket, _req: IncomingMessage) => {
      const extWs = ws as ExtendedWebSocket
      extWs.isAlive = true
      extWs.clientId = this.generateClientId()
      extWs.rooms = new Set()

      this.clients.set(extWs.clientId, extWs)

      logger.debug(`WebSocket client connected: ${extWs.clientId}`)

      // 发送欢迎消息
      this.send(extWs, {
        type: 'connected',
        clientId: extWs.clientId,
        timestamp: Date.now(),
      })

      extWs.on('pong', () => {
        extWs.isAlive = true
      })

      extWs.on('message', async (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString())
          const { type, ...payload } = message

          if (type && this.messageHandlers.has(type)) {
            const handler = this.messageHandlers.get(type)!
            await handler(extWs, payload, this)
          } else {
            // 默认回显
            this.send(extWs, { type: 'echo', data: message })
          }
        } catch {
          this.send(extWs, { type: 'error', message: 'Invalid JSON message' })
        }
      })

      extWs.on('close', () => {
        // 从所有房间移除
        extWs.rooms.forEach(room => this.leaveRoom(extWs, room))
        this.clients.delete(extWs.clientId)
        logger.debug(`WebSocket client disconnected: ${extWs.clientId}`)
      })

      extWs.on('error', (error: Error) => {
        logger.error(`WebSocket client error [${extWs.clientId}]: ${error.message}`)
      })
    })

    this.wss.on('error', (error: Error) => {
      logger.error(`WebSocket server error: ${error.message}`)
    })
  }

  /**
   * 启动心跳检测
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.clients.forEach((ws, clientId) => {
        if (!ws.isAlive) {
          ws.terminate()
          this.clients.delete(clientId)
          return
        }
        ws.isAlive = false
        ws.ping()
      })
    }, this.heartbeatInterval)
  }

  /**
   * 生成客户端 ID
   */
  private generateClientId(): string {
    return `ws_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
  }

  /**
   * 发送消息给指定客户端
   */
  send(ws: ExtendedWebSocket | string, data: unknown): void {
    const client = typeof ws === 'string' ? this.clients.get(ws) : ws
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data))
    }
  }

  /**
   * 广播消息到所有客户端
   */
  broadcast(data: unknown, excludeClientId?: string): void {
    const message = JSON.stringify(data)
    this.clients.forEach((client, id) => {
      if (id !== excludeClientId && client.readyState === WebSocket.OPEN) {
        client.send(message)
      }
    })
  }

  /**
   * 加入房间
   */
  joinRoom(ws: ExtendedWebSocket, roomName: string): void {
    if (!this.rooms.has(roomName)) {
      this.rooms.set(roomName, { name: roomName, clients: new Set() })
    }
    const room = this.rooms.get(roomName)!
    room.clients.add(ws.clientId)
    ws.rooms.add(roomName)
  }

  /**
   * 离开房间
   */
  leaveRoom(ws: ExtendedWebSocket, roomName: string): void {
    const room = this.rooms.get(roomName)
    if (room) {
      room.clients.delete(ws.clientId)
      ws.rooms.delete(roomName)
      if (room.clients.size === 0) {
        this.rooms.delete(roomName)
      }
    }
  }

  /**
   * 向房间广播
   */
  broadcastToRoom(roomName: string, data: unknown, excludeClientId?: string): void {
    const room = this.rooms.get(roomName)
    if (!room) return

    const message = JSON.stringify(data)
    room.clients.forEach(clientId => {
      if (clientId !== excludeClientId) {
        const client = this.clients.get(clientId)
        if (client && client.readyState === WebSocket.OPEN) {
          client.send(message)
        }
      }
    })
  }

  /**
   * 获取在线客户端数量
   */
  getClientCount(): number {
    return this.clients.size
  }

  /**
   * 获取房间列表
   */
  getRooms(): string[] {
    return Array.from(this.rooms.keys())
  }

  /**
   * 关闭服务
   */
  async close(): Promise<void> {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }

    if (this.wss) {
      return new Promise((resolve, reject) => {
        this.wss!.close(err => {
          if (err) reject(err)
          else {
            logger.info('WebSocket server closed')
            resolve()
          }
        })
      })
    }
  }
}

/**
 * WebSocket 服务单例
 */
let wsServiceInstance: WebSocketService | null = null

export function getWebSocketService(): WebSocketService {
  if (!wsServiceInstance) {
    wsServiceInstance = new WebSocketService()
  }
  return wsServiceInstance
}

export function resetWebSocketService(): void {
  if (wsServiceInstance) {
    wsServiceInstance.close()
    wsServiceInstance = null
  }
}
