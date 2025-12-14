/**
 * Express 类型扩展
 * 扩展 Express Request 接口，添加自定义属性
 */

import 'express'

declare global {
  namespace Express {
    interface Request {
      /** 请求唯一标识符 */
      requestId: string
      /** 请求开始时间戳 */
      startTime: number
    }
  }
}
