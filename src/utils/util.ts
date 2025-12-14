import fs from 'fs'
import path from 'path'

/**
 * 检查值是否为空
 * @param value - 要检查的值
 * @returns 如果值为空则返回 true
 */
export const isEmpty = (value: string | number | object | null | undefined): boolean => {
  if (value === null || value === undefined) {
    return true
  }
  if (typeof value === 'string' && value === '') {
    return true
  }
  if (typeof value === 'object' && Object.keys(value).length === 0) {
    return true
  }
  return false
}

/**
 * 同步加载 GraphQL schema 文件
 * @param filePath - 文件路径（支持绝对路径和相对路径）
 * @returns GraphQL schema 字符串
 */
export const loadGraphqlFileSync = (filePath: string): string => {
  // 如果是绝对路径，直接使用；否则相对于当前工作目录
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath)

  return fs.readFileSync(absolutePath, { encoding: 'utf8' })
}
