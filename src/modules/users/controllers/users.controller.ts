import { NextFunction, Request, Response } from 'express'
import UserService from '../services/users.service'
import { CreateUserDto, excludePassword, excludePasswordFromUsers, UserPublic } from '../dtos/users.dto'
import { ApiResponse } from '@/types'

class UserController {
  public userService: UserService = new UserService()

  public getUsers = async (
    req: Request,
    res: Response<ApiResponse<UserPublic[]>>,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const findAllUsersData = await this.userService.findAllUser()

      res.status(200).json({
        data: excludePasswordFromUsers(findAllUsersData),
        message: 'Users retrieved successfully',
        success: true,
      })
    } catch (err) {
      next(err)
    }
  }

  public getUserById = async (
    req: Request,
    res: Response<ApiResponse<UserPublic>>,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = Number(req.params.id)
      const findOneUserData = await this.userService.findUserById(userId)

      res.status(200).json({
        data: excludePassword(findOneUserData),
        message: 'User retrieved successfully',
        success: true,
      })
    } catch (err) {
      next(err)
    }
  }

  public createUser = async (
    req: Request,
    res: Response<ApiResponse<UserPublic>>,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userData: CreateUserDto = req.body
      const createUserData = await this.userService.createUser(userData)

      res.status(201).json({
        data: excludePassword(createUserData),
        message: 'User created successfully',
        success: true,
      })
    } catch (err) {
      next(err)
    }
  }

  public updateUser = async (
    req: Request,
    res: Response<ApiResponse<UserPublic>>,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = Number(req.params.id)
      const userData: CreateUserDto = req.body
      const updateUserData = await this.userService.updateUser(userId, userData)

      res.status(200).json({
        data: excludePassword(updateUserData),
        message: 'User updated successfully',
        success: true,
      })
    } catch (err) {
      next(err)
    }
  }

  public deleteUser = async (
    req: Request,
    res: Response<ApiResponse<UserPublic>>,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = Number(req.params.id)
      const deleteUserData = await this.userService.deleteUser(userId)

      res.status(200).json({
        data: excludePassword(deleteUserData),
        message: 'User deleted successfully',
        success: true,
      })
    } catch (err) {
      next(err)
    }
  }
}

export default UserController
