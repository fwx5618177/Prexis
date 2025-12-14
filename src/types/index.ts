// 全局类型定义

import { Router } from 'express'

export interface ApiResponse<T = unknown> {
  data: T
  message: string
  success?: boolean
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ErrorResponse {
  error: string
  message: string
  statusCode: number
  timestamp: string
}

// 通用查询参数（从请求获取时为字符串）
export interface QueryParams {
  page?: string | number
  limit?: string | number
  search?: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

// 数据库实体基础接口
export interface BaseEntity {
  id: number | string
  createdAt?: Date
  updatedAt?: Date
}

// 环境变量类型
export interface EnvConfig {
  NODE_ENV: string
  PORT: number
  DATABASE_URL: string
  SECRET_KEY: string
  LOG_FORMAT: string
  LOG_DIR: string
  ORIGIN: string
  CREDENTIALS: boolean
}

// 路由接口
export interface Routes {
  path?: string
  router: Router
}
