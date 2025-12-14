import { SECRET_KEY } from '@/config'
import { CreateUserDto } from '@modules/users/dtos/users.dto'
import { HttpException } from '@/exceptions/HttpException'
import { DataStoredInToken, TokenData } from '../interfaces/auth.interface'
import { isEmpty } from '@/utils/util'
import { User } from '@prisma/client'
import { hash, compare } from 'bcryptjs'
import { sign } from 'jsonwebtoken'
import prisma from '@/prisma/client'

class AuthService {
  public users = prisma.user

  public async signUp(userData: CreateUserDto): Promise<User> {
    if (isEmpty(userData)) throw new HttpException(400, "can't sign up")

    const findUser: User = (await this.users.findUnique({
      where: {
        email: userData.email,
      },
    })) as User

    if (findUser) throw new HttpException(409, `email: ${userData.email} already exists`)

    const hashedPassword = await hash(userData.password, 10)
    const createUserData: User = (await this.users.create({
      data: {
        ...userData,
        password: hashedPassword,
      },
    })) as User

    return createUserData
  }

  public async login(userData: CreateUserDto): Promise<{
    cookie: string
    findUser: User
  }> {
    if (isEmpty(userData)) throw new HttpException(400, "can't login")

    const findUser: User = (await this.users.findUnique({
      where: {
        email: userData.email,
      },
    })) as User

    if (!findUser) throw new HttpException(409, 'email: ${userData.email} not found')

    const isPasswordMarching: boolean = await compare(userData.password, findUser.password)

    if (!isPasswordMarching) throw new HttpException(409, 'Your pwd not matching')

    const tokenData = this.createToken(findUser)
    const cookie = this.createCookie(tokenData)

    return {
      cookie,
      findUser,
    }
  }

  public async logOut(userData: User): Promise<User> {
    if (isEmpty(userData)) throw new HttpException(400, 'not user data')

    const findUser: User = (await this.users.findFirst({
      where: {
        email: userData.email,
        password: userData.password,
      },
    })) as User

    if (!findUser) throw new HttpException(409, 'not user')

    return findUser
  }

  public createToken(user: User): TokenData {
    const dataStoredInToken: DataStoredInToken = {
      id: user.id,
    }

    const secretKey: string = SECRET_KEY as string
    const expiresIn: number = 60 * 60

    return {
      expiresIn,
      token: sign(dataStoredInToken, secretKey, {
        expiresIn,
      }),
    }
  }

  public createCookie(tokenData: TokenData): string {
    return `Authorization=${tokenData.token}; HttpOnly; Max-Age=${tokenData.expiresIn};`
  }
}

export default AuthService
