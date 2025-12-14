import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Prisma client
vi.mock('@/prisma/client', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}))

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  hash: vi.fn().mockResolvedValue('hashedPassword'),
  compare: vi.fn(),
}))

// Mock jsonwebtoken
vi.mock('jsonwebtoken', () => ({
  sign: vi.fn().mockReturnValue('mockToken'),
}))

// Mock config
vi.mock('@/config', () => ({
  SECRET_KEY: 'test-secret-key',
}))

import AuthService from '@/modules/auth/services/auth.service'
import prisma from '@/prisma/client'
import { compare } from 'bcryptjs'

describe('AuthService', () => {
  let authService: AuthService

  beforeEach(() => {
    vi.clearAllMocks()
    authService = new AuthService()
  })

  describe('createToken', () => {
    it('should create a token with user id', () => {
      const user = { id: 1, email: 'test@test.com', password: 'hashedPassword' }

      const result = authService.createToken(user as any)

      expect(result).toHaveProperty('token')
      expect(result).toHaveProperty('expiresIn')
      expect(result.expiresIn).toBe(3600) // 60 * 60
    })
  })

  describe('createCookie', () => {
    it('should create a valid cookie string', () => {
      const tokenData = { token: 'testToken', expiresIn: 3600 }

      const result = authService.createCookie(tokenData)

      expect(result).toContain('Authorization=testToken')
      expect(result).toContain('HttpOnly')
      expect(result).toContain('Max-Age=3600')
    })
  })

  describe('signUp', () => {
    it('should throw error when userData is empty', async () => {
      await expect(authService.signUp({} as any)).rejects.toThrow("can't sign up")
    })

    it('should throw error when email already exists', async () => {
      const existingUser = { id: 1, email: 'test@test.com' }
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(existingUser as any)

      await expect(
        authService.signUp({ email: 'test@test.com', password: 'password123' }),
      ).rejects.toThrow('already exists')
    })

    it('should create user when email is unique', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)
      vi.mocked(prisma.user.create).mockResolvedValueOnce({
        id: 1,
        email: 'new@test.com',
        password: 'hashedPassword',
      } as any)

      const result = await authService.signUp({ email: 'new@test.com', password: 'password123' })

      expect(result.email).toBe('new@test.com')
      expect(prisma.user.create).toHaveBeenCalled()
    })
  })

  describe('login', () => {
    it('should throw error when userData is empty', async () => {
      await expect(authService.login({} as any)).rejects.toThrow("can't login")
    })

    it('should throw error when user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)

      await expect(
        authService.login({ email: 'notfound@test.com', password: 'password' }),
      ).rejects.toThrow('not found')
    })

    it('should throw error when password does not match', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 1,
        email: 'test@test.com',
        password: 'hashedPassword',
      } as any)
      vi.mocked(compare).mockResolvedValueOnce(false as any)

      await expect(
        authService.login({ email: 'test@test.com', password: 'wrongPassword' }),
      ).rejects.toThrow('not matching')
    })

    it('should return cookie and user when login successful', async () => {
      const user = { id: 1, email: 'test@test.com', password: 'hashedPassword' }
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(user as any)
      vi.mocked(compare).mockResolvedValueOnce(true as any)

      const result = await authService.login({ email: 'test@test.com', password: 'password' })

      expect(result).toHaveProperty('cookie')
      expect(result).toHaveProperty('findUser')
      expect(result.findUser.email).toBe('test@test.com')
    })
  })

  describe('logOut', () => {
    it('should throw error when userData is empty', async () => {
      await expect(authService.logOut({} as any)).rejects.toThrow('not user data')
    })

    it('should throw error when user not found', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(null)

      await expect(
        authService.logOut({ email: 'test@test.com', password: 'password' } as any),
      ).rejects.toThrow('not user')
    })

    it('should return user when logout successful', async () => {
      const user = { id: 1, email: 'test@test.com', password: 'password' }
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(user as any)

      const result = await authService.logOut(user as any)

      expect(result.email).toBe('test@test.com')
    })
  })
})
