/**
 * WebSocket 控制器
 * HTTP API 管理 WebSocket 服务状态
 */

import { Request, Response } from 'express'
import { getWebSocketService } from '../services/websocket.service'
import { createApiResponse } from '@/shared/utils'

export class WebSocketController {
  /**
   * 获取 WebSocket 状态
   */
  public getStatus = (_req: Request, res: Response): void => {
    const wsService = getWebSocketService()
    const status = {
      clientCount: wsService.getClientCount(),
      rooms: wsService.getRooms(),
      path: '/ws',
    }
    res.json(createApiResponse(status, 'WebSocket status'))
  }

  /**
   * 广播消息
   */
  public broadcast = (req: Request, res: Response): void => {
    const { message, room } = req.body

    if (!message) {
      res.status(400).json(createApiResponse(null, 'Message is required', false))
      return
    }

    const wsService = getWebSocketService()

    if (room) {
      wsService.broadcastToRoom(room, { type: 'broadcast', data: message })
    } else {
      wsService.broadcast({ type: 'broadcast', data: message })
    }

    res.json(createApiResponse({ sent: true }, 'Message broadcasted'))
  }
}
