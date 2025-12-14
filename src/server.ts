#!/usr/bin/env node

/**
 * Prexis - TypeScript + Express + Prisma API Framework
 * Entry point for the server
 */

import App from '@/app'
import RouteLists from '@/routes'
import { logger } from '@/utils/loggers'

async function bootstrap(): Promise<void> {
  try {
    const app = new App(Object.values(RouteLists))
    await app.listen()
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

bootstrap()
