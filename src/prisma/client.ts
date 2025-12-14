/**
 * Prisma 客户端单例
 * 支持连接池优化配置
 */

import { PrismaClient } from '@prisma/client'
import { isDev, isProd } from '@/shared/utils'
import { logger } from '@/utils/loggers'

declare global {
  var prisma: PrismaClient | undefined
}

/**
 * 数据库连接池配置
 * 通过 DATABASE_URL 参数配置: ?connection_limit=10&pool_timeout=10
 *
 * 推荐配置 (在 .env 中设置):
 * - connection_limit: 连接池大小 (默认 num_cpus * 2 + 1)
 * - pool_timeout: 获取连接超时秒数 (默认 10)
 *
 * 示例: DATABASE_URL="postgresql://...?connection_limit=20&pool_timeout=15"
 */
const prismaClientSingleton = (): PrismaClient => {
  const client = new PrismaClient({
    log: isDev()
      ? [
          { level: 'query', emit: 'event' },
          { level: 'info', emit: 'stdout' },
          { level: 'warn', emit: 'stdout' },
          { level: 'error', emit: 'stdout' },
        ]
      : [{ level: 'error', emit: 'stdout' }],
  })

  // 开发环境记录慢查询
  if (isDev()) {
    client.$on('query' as never, (e: { query: string; duration: number }) => {
      if (e.duration > 100) {
        logger.warn(`Slow query (${e.duration}ms): ${e.query}`)
      }
    })
  }

  return client
}

// 开发模式下使用全局变量避免热重载时创建多个实例
const prisma = globalThis.prisma ?? prismaClientSingleton()

if (!isProd()) {
  globalThis.prisma = prisma
}

/**
 * 优雅关闭数据库连接
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect()
  logger.info('Database connection closed')
}

/**
 * 健康检查
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch {
    return false
  }
}

export default prisma
