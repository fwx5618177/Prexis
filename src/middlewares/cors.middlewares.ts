/**
 * 跨域中间件
 */
import { Response, Request, NextFunction } from 'express'

const whiteList: string[] = [
  'http://localhost:3001',
  'http://192.168.3.49:3000',
  'https://apollo-server-landing-page.cdn.apollographql.com',
]

const CorsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const origin: string = req.headers.origin as string

    if (whiteList.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin)
    }

    res.header('Access-Control-Allow-Credentials', 'true')
    res.header(
      'Access-Control-Allow-Headers',
      'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method',
    )
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PATCH, PUT, DELETE')
    res.header('Allow', 'GET, POST, PATCH, OPTIONS, PUT, DELETE')
    res.header('X-Powered-By', 'Prexis')
    res.header('Content-Type', 'application/json; charset=utf-8')
    res.header('Access-Control-Max-Age', '86400')

    next()
  } catch (err) {
    next(err)
  }
}

export default CorsMiddleware
