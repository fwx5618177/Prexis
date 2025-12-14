/**
 * WebSocket 路由
 * 提供 WebSocket 管理的 HTTP API
 */

import { Router } from 'express'
import { Routes } from '@types'
import { WebSocketController } from '../controllers/websocket.controller'

class WebSocketRoute implements Routes {
  public path = '/api/websocket'
  public router: Router = Router()
  private controller: WebSocketController = new WebSocketController()

  constructor() {
    this.initializeRoutes()
  }

  private initializeRoutes(): void {
    /**
     * @swagger
     * /api/websocket/status:
     *   get:
     *     summary: 获取 WebSocket 服务状态
     *     tags: [WebSocket]
     *     responses:
     *       200:
     *         description: WebSocket 状态信息
     */
    this.router.get(`${this.path}/status`, this.controller.getStatus)

    /**
     * @swagger
     * /api/websocket/broadcast:
     *   post:
     *     summary: 广播消息
     *     tags: [WebSocket]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               message:
     *                 type: string
     *               room:
     *                 type: string
     *     responses:
     *       200:
     *         description: 消息已广播
     */
    this.router.post(`${this.path}/broadcast`, this.controller.broadcast)
  }
}

export default WebSocketRoute
