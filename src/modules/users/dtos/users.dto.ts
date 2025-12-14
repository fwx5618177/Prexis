import { IsEmail, IsString } from 'class-validator'
import { User } from '@prisma/client'

export class CreateUserDto {
  @IsEmail()
  public email!: string

  @IsString()
  public password!: string
}

/**
 * 用户公开信息类型（不包含密码）
 */
export type UserPublic = Omit<User, 'password'>

/**
 * 从用户对象中移除敏感信息
 */
export function excludePassword(user: User): UserPublic {
  const { password: _password, ...userWithoutPassword } = user
  return userWithoutPassword
}

/**
 * 从用户数组中移除敏感信息
 */
export function excludePasswordFromUsers(users: User[]): UserPublic[] {
  return users.map(excludePassword)
}
