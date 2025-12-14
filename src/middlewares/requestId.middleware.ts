/**
 * Request ID 中间件
 * 为每个请求生成唯一标识符，用于日志追踪
 */

import { Request, Response, NextFunction } from 'express'
import { randomUUID } from 'crypto'
// 导入类型扩展
import '@/types/express.d'

export const REQUEST_ID_HEADER = 'X-Request-ID'

/**
 * 生成或获取请求 ID
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // 优先使用客户端传入的 request-id（支持链路追踪）
  const requestId = (req.headers[REQUEST_ID_HEADER.toLowerCase()] as string) || randomUUID()

  // 记录请求开始时间
  req.requestId = requestId
  req.startTime = Date.now()

  // 在响应头中返回 request-id
  res.setHeader(REQUEST_ID_HEADER, requestId)

  next()
}

/**
 * 获取请求持续时间（毫秒）
 */
export const getRequestDuration = (req: Request): number => {
  return Date.now() - (req.startTime || Date.now())
}
