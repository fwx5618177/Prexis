/**
 * 错误中间件
 * 统一错误响应格式
 */

import { HttpException } from '@/exceptions/HttpException'
import { ErrorResponse } from '@/types'
import { logger } from '@/utils/loggers'
import { NextFunction, Request, Response } from 'express'

const errorMiddleware = (
  error: HttpException,
  req: Request,
  res: Response<ErrorResponse>,
  _next: NextFunction,
): void => {
  const status: number = error.status || 500
  const message: string = error.message || 'Something went wrong'

  logger.error(`[${req.method}] ${req.path} >> StatusCode: ${status}, Message: ${message}`)

  const errorResponse: ErrorResponse = {
    error: error.name || 'Error',
    message,
    statusCode: status,
    timestamp: new Date().toISOString(),
  }

  res.status(status).json(errorResponse)
}

export default errorMiddleware
