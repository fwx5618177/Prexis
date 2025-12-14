/**
 * 环境判断工具函数
 */

import { ENVIRONMENTS } from '../constants'

/**
 * 获取当前环境
 */
export function getEnv(): string {
  return process.env.NODE_ENV || ENVIRONMENTS.DEV
}

/**
 * 判断是否为开发环境
 */
export function isDev(): boolean {
  return getEnv() === ENVIRONMENTS.DEV
}

/**
 * 判断是否为生产环境
 */
export function isProd(): boolean {
  return getEnv() === ENVIRONMENTS.PROD
}

/**
 * 判断是否为测试环境
 */
export function isTest(): boolean {
  return getEnv() === ENVIRONMENTS.TEST
}
