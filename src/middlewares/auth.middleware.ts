/**
 * 验证cookie的token
 */

import { SECRET_KEY } from '@/config'
import { HttpException } from '@/exceptions/HttpException'
import { DataStoredInToken, RequestWithUser } from '@modules/auth/interfaces/auth.interface'
import prisma from '@/prisma/client'
import { NextFunction, Response } from 'express'
import { verify } from 'jsonwebtoken'

const authMiddleware = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const Authorization = req.cookies['Authorization'] || req.header('Authorization')?.split('Bearer ')[1]

    if (Authorization) {
      const secretKey: string = SECRET_KEY as string
      const verificationResponse: DataStoredInToken = (await verify(Authorization, secretKey)) as DataStoredInToken
      const userId = verificationResponse.id

      const findUser = await prisma.user.findUnique({
        where: {
          id: Number(userId),
        },
      })

      if (findUser) {
        req.user = findUser
        next()
      } else {
        next(new HttpException(401, 'Wrong authentication token'))
      }
    } else {
      next(new HttpException(404, 'authentication token missing'))
    }
  } catch (_err) {
    next(new HttpException(401, 'Wrong authentication token'))
  }
}

export default authMiddleware
