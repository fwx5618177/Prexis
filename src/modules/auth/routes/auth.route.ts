import AuthController from '../controllers/auth.controller'
import { CreateUserDto } from '../../users/dtos/users.dto'
import { Routes } from '@types'
import authMiddleware from '@/middlewares/auth.middleware'
import validationMiddleware from '@/middlewares/validation.middleware'
import { authLimiter } from '@/middlewares/rateLimit.middleware'
import { Router } from 'express'

class AuthRoute implements Routes {
  public path = '/'
  public router: Router = Router()
  public authController = new AuthController()

  constructor() {
    this.initializeRoutes()
  }

  private initializeRoutes() {
    // 登录/注册接口使用 authLimiter (10次/15分钟)
    this.router.post(
      `${this.path}signup`,
      authLimiter,
      validationMiddleware(CreateUserDto, 'body'),
      this.authController.signUp,
    )
    this.router.post(
      `${this.path}login`,
      authLimiter,
      validationMiddleware(CreateUserDto, 'body'),
      this.authController.logIn,
    )
    // authMiddleware 将 user 注入到 req 中，logOut 使用 RequestWithUser 类型
    this.router.post(
      `${this.path}logout`,
      authMiddleware as unknown as Parameters<typeof this.router.post>[1],
      this.authController.logOut as unknown as Parameters<typeof this.router.post>[1],
    )
  }
}

export default AuthRoute
