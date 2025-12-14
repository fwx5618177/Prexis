/**
 * WebSocket 模块
 * 提供 WebSocket 服务的统一入口
 */

export { WebSocketModule, type WebSocketConfig } from './websocket.module'
export { WebSocketController } from './controllers/websocket.controller'
export { WebSocketService, getWebSocketService } from './services/websocket.service'
export type { WebSocketMessageHandler, WebSocketRoom } from './services/websocket.service'
