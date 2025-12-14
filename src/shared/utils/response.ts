/**
 * API 响应工具函数
 */

import { ApiResponse, PaginatedResponse, QueryParams } from '@/types'
import { MESSAGES, PAGINATION } from '../constants'

/**
 * 创建标准 API 响应
 */
export function createApiResponse<T>(data: T, message: string = MESSAGES.SUCCESS, success = true): ApiResponse<T> {
  return {
    data,
    message,
    success,
  }
}

/**
 * 创建分页响应
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number = PAGINATION.DEFAULT_PAGE,
  limit: number = PAGINATION.DEFAULT_LIMIT,
  message: string = MESSAGES.SUCCESS,
): PaginatedResponse<T> {
  return {
    data,
    message,
    success: true,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

/**
 * 验证分页参数
 */
export function validatePaginationParams(query: QueryParams) {
  const page = Math.max(1, parseInt(String(query.page)) || PAGINATION.DEFAULT_PAGE)
  const limit = Math.min(PAGINATION.MAX_LIMIT, Math.max(1, parseInt(String(query.limit)) || PAGINATION.DEFAULT_LIMIT))

  return { page, limit }
}
