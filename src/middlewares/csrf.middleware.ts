/**
 * CSRF 保护中间件
 * 基于 Double Submit Cookie 模式
 */

import { Request, Response, NextFunction, RequestHandler } from 'express'
import { randomBytes } from 'crypto'
import { CSRF_ENABLED } from '@/config'

const CSRF_COOKIE_NAME = 'XSRF-TOKEN'
const CSRF_HEADER_NAME = 'X-XSRF-TOKEN'

/**
 * 生成 CSRF Token
 */
function generateToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * CSRF 保护中间件
 * 使用 Double Submit Cookie 模式
 */
export function csrfProtection(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    // 如果 CSRF 未启用，直接跳过
    if (!CSRF_ENABLED) {
      return next()
    }

    // 跳过安全方法 (GET, HEAD, OPTIONS)
    const safeMethods = ['GET', 'HEAD', 'OPTIONS']
    if (safeMethods.includes(req.method)) {
      // 为安全方法设置 CSRF Token Cookie
      if (!req.cookies[CSRF_COOKIE_NAME]) {
        const token = generateToken()
        res.cookie(CSRF_COOKIE_NAME, token, {
          httpOnly: false, // 允许 JS 读取
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 24 * 60 * 60 * 1000, // 24 小时
        })
      }
      return next()
    }

    // 验证非安全方法的 CSRF Token
    const cookieToken = req.cookies[CSRF_COOKIE_NAME]
    const headerToken = req.headers[CSRF_HEADER_NAME.toLowerCase()] as string

    if (!cookieToken || !headerToken) {
      res.status(403).json({
        success: false,
        message: 'CSRF token missing',
      })
      return
    }

    if (cookieToken !== headerToken) {
      res.status(403).json({
        success: false,
        message: 'CSRF token mismatch',
      })
      return
    }

    next()
  }
}

/**
 * 获取 CSRF Token 端点
 * 用于 SPA 应用获取 CSRF Token
 */
export function csrfTokenHandler(req: Request, res: Response): void {
  let token = req.cookies[CSRF_COOKIE_NAME]

  if (!token) {
    token = generateToken()
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    })
  }

  res.json({ csrfToken: token })
}
