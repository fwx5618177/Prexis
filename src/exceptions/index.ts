/**
 * HTTP 异常类及其子类
 * 提供类型安全的异常处理
 */

export class HttpException extends Error {
  public status: number
  public override message: string
  public code?: string

  constructor(status: number, message: string, code?: string) {
    super(message)
    this.status = status
    this.message = message
    this.code = code
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

// 4xx 客户端错误

/** 400 Bad Request - 请求参数错误 */
export class BadRequestException extends HttpException {
  constructor(message = 'Bad Request', code = 'BAD_REQUEST') {
    super(400, message, code)
  }
}

/** 401 Unauthorized - 未认证 */
export class UnauthorizedException extends HttpException {
  constructor(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    super(401, message, code)
  }
}

/** 403 Forbidden - 无权限 */
export class ForbiddenException extends HttpException {
  constructor(message = 'Forbidden', code = 'FORBIDDEN') {
    super(403, message, code)
  }
}

/** 404 Not Found - 资源不存在 */
export class NotFoundException extends HttpException {
  constructor(message = 'Not Found', code = 'NOT_FOUND') {
    super(404, message, code)
  }
}

/** 409 Conflict - 资源冲突 */
export class ConflictException extends HttpException {
  constructor(message = 'Conflict', code = 'CONFLICT') {
    super(409, message, code)
  }
}

/** 422 Unprocessable Entity - 验证失败 */
export class ValidationException extends HttpException {
  public errors?: Record<string, string[]>

  constructor(message = 'Validation Failed', errors?: Record<string, string[]>, code = 'VALIDATION_ERROR') {
    super(422, message, code)
    this.errors = errors
  }
}

/** 429 Too Many Requests - 请求过于频繁 */
export class TooManyRequestsException extends HttpException {
  constructor(message = 'Too Many Requests', code = 'RATE_LIMITED') {
    super(429, message, code)
  }
}

// 5xx 服务端错误

/** 500 Internal Server Error - 服务器内部错误 */
export class InternalServerException extends HttpException {
  constructor(message = 'Internal Server Error', code = 'INTERNAL_ERROR') {
    super(500, message, code)
  }
}

/** 502 Bad Gateway - 网关错误 */
export class BadGatewayException extends HttpException {
  constructor(message = 'Bad Gateway', code = 'BAD_GATEWAY') {
    super(502, message, code)
  }
}

/** 503 Service Unavailable - 服务不可用 */
export class ServiceUnavailableException extends HttpException {
  constructor(message = 'Service Unavailable', code = 'SERVICE_UNAVAILABLE') {
    super(503, message, code)
  }
}

/** 504 Gateway Timeout - 网关超时 */
export class GatewayTimeoutException extends HttpException {
  constructor(message = 'Gateway Timeout', code = 'GATEWAY_TIMEOUT') {
    super(504, message, code)
  }
}
