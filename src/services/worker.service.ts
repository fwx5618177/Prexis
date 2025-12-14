/**
 * Worker 线程池服务
 * 用于处理 CPU 密集型任务，避免阻塞主事件循环
 */

import { Worker } from 'worker_threads'
import { cpus } from 'os'
import { resolve } from 'path'
import { existsSync } from 'fs'
import { logger } from '@/utils/loggers'

/**
 * Worker 任务类型
 */
export interface WorkerTask<T = unknown> {
  type: string
  data: T
}

/**
 * Worker 任务结果
 */
export interface WorkerResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  duration: number
}

/**
 * Worker 池配置
 */
export interface WorkerPoolConfig {
  /** Worker 数量 (默认 CPU 核心数 - 1) */
  size?: number
  /** 任务超时时间 (毫秒) */
  timeout?: number
}

/**
 * 队列中的任务项
 */
interface QueuedTask {
  task: WorkerTask<unknown>
  resolve: (result: WorkerResult<unknown>) => void
  reject: (error: Error) => void
}

/**
 * Worker 池管理器
 * 复用 Worker 线程，避免频繁创建销毁
 */
export class WorkerPool {
  private workers: Worker[] = []
  private taskQueue: QueuedTask[] = []
  private availableWorkers: Worker[] = []
  private readonly timeout: number
  private isShutdown = false

  constructor(workerScript: string, config: WorkerPoolConfig = {}) {
    const size = config.size || Math.max(1, cpus().length - 1)
    this.timeout = config.timeout ?? 30000

    for (let i = 0; i < size; i++) {
      const worker = new Worker(workerScript)
      this.workers.push(worker)
      this.availableWorkers.push(worker)
    }

    logger.info(`Worker pool initialized with ${size} workers`)
  }

  /**
   * 执行任务
   */
  execute<T, R>(task: WorkerTask<T>): Promise<WorkerResult<R>> {
    return new Promise((resolve, reject) => {
      if (this.isShutdown) {
        reject(new Error('Worker pool is shutdown'))
        return
      }

      const worker = this.availableWorkers.pop()

      if (worker) {
        this.runTask(worker, task, resolve as (result: WorkerResult<unknown>) => void, reject)
      } else {
        // 没有可用 worker，加入队列
        this.taskQueue.push({
          task: task as WorkerTask<unknown>,
          resolve: resolve as (result: WorkerResult<unknown>) => void,
          reject,
        })
      }
    })
  }

  private runTask(
    worker: Worker,
    task: WorkerTask<unknown>,
    resolveTask: (result: WorkerResult<unknown>) => void,
    rejectTask: (error: Error) => void,
  ): void {
    const timeoutId = setTimeout(() => {
      worker.terminate()
      rejectTask(new Error(`Task timeout after ${this.timeout}ms`))
    }, this.timeout)

    const cleanup = (): void => {
      clearTimeout(timeoutId)
      worker.removeAllListeners('message')
      worker.removeAllListeners('error')

      // Worker 可用，检查队列
      const nextTask = this.taskQueue.shift()
      if (nextTask) {
        this.runTask(worker, nextTask.task, nextTask.resolve, nextTask.reject)
      } else {
        this.availableWorkers.push(worker)
      }
    }

    worker.once('message', (result: WorkerResult<unknown>) => {
      cleanup()
      resolveTask(result)
    })

    worker.once('error', (error: Error) => {
      cleanup()
      rejectTask(error)
    })

    worker.postMessage(task)
  }

  /**
   * 关闭所有 Worker
   */
  async shutdown(): Promise<void> {
    this.isShutdown = true

    // 清空队列
    for (const queuedTask of this.taskQueue) {
      queuedTask.reject(new Error('Worker pool is shutting down'))
    }
    this.taskQueue = []

    // 终止所有 worker
    await Promise.all(this.workers.map(w => w.terminate()))
    this.workers = []
    this.availableWorkers = []
    logger.info('Worker pool shutdown complete')
  }

  /**
   * 获取池状态
   */
  getStatus(): { total: number; available: number; queued: number } {
    return {
      total: this.workers.length,
      available: this.availableWorkers.length,
      queued: this.taskQueue.length,
    }
  }
}

/**
 * 获取默认 Worker 脚本路径
 */
export function getWorkerScriptPath(): string | null {
  const scriptPath = resolve(__dirname, 'worker.runner.js')
  if (existsSync(scriptPath)) {
    return scriptPath
  }
  return null
}
