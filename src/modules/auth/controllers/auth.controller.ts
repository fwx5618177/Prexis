import { CreateUserDto } from '../../users/dtos/users.dto'
import { RequestWithUser } from '../interfaces/auth.interface'
import AuthService from '../services/auth.service'
import { User } from '@prisma/client'
import { NextFunction, Request, Response } from 'express'

class AuthController {
  public authService = new AuthService()

  public signUp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData: CreateUserDto = req.body
      const signUpUserData: User = await this.authService.signUp(userData)

      res.status(201).json({
        data: signUpUserData,
        message: 'sign up',
      })
    } catch (err) {
      next(err)
    }
  }

  public logIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData: CreateUserDto = req.body
      const { cookie, findUser } = await this.authService.login(userData)

      res.setHeader('Set-Cookie', [cookie])
      res.status(200).json({
        data: findUser,
        message: 'login',
      })
    } catch (err) {
      next(err)
    }
  }

  public logOut = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData: User = req.user
      const logOutUserData: User = await this.authService.logOut(userData)

      res.setHeader('Set-Cookie', ['Authorization=; Max-age=0'])
      res.status(200).json({
        data: logOutUserData,
        message: 'logout',
      })
    } catch (err) {
      next(err)
    }
  }
}

export default AuthController
