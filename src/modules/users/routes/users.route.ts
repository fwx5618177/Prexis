import UserController from '../controllers/users.controller'
import { CreateUserDto } from '../dtos/users.dto'
import { Routes } from '@types'
import validationMiddleware from '@/middlewares/validation.middleware'
import { Router } from 'express'

class UserRoute implements Routes {
  public path = '/users'
  public router: Router = Router()
  public usersController: UserController = new UserController()

  constructor() {
    this.initializeRoutes()
  }

  private initializeRoutes() {
    this.router.get(`${this.path}`, this.usersController.getUsers)
    this.router.get(`${this.path}/:id(\\d+)`, this.usersController.getUserById)
    this.router.post(`${this.path}`, validationMiddleware(CreateUserDto, 'body'), this.usersController.createUser)
    this.router.put(
      `${this.path}/:id(\\d+)`,
      validationMiddleware(CreateUserDto, 'body', true),
      this.usersController.updateUser,
    )
    this.router.delete(`${this.path}/:id(\\d+)`, this.usersController.deleteUser)
  }
}

export default UserRoute
