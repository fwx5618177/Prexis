/**
 * Worker 任务路由
 * 提供 CPU 密集型任务的 API 接口
 */

import { Router, Request, Response, NextFunction, IRouter } from 'express'
import { Routes } from '@types'
import { WORKER_POOL_ENABLED } from '@config'
import { WorkerPool, WorkerTask, WorkerResult } from '@/services/worker.service'
import { resolve } from 'path'
import { existsSync } from 'fs'
import { logger } from '@/utils/loggers'

// 单例 Worker Pool
let workerPool: WorkerPool | null = null

/**
 * 获取 Worker Pool 实例
 */
function getWorkerPool(): WorkerPool | null {
  if (workerPool) return workerPool

  if (!WORKER_POOL_ENABLED) {
    return null
  }

  const workerScript = resolve(__dirname, '../../services/worker.runner.js')

  if (!existsSync(workerScript)) {
    logger.warn(`Worker script not found: ${workerScript}`)
    return null
  }

  workerPool = new WorkerPool(workerScript, {
    timeout: 30000,
  })

  return workerPool
}

/**
 * Worker 任务路由
 */
class WorkerRoute implements Routes {
  public path = '/api/worker'
  public router: IRouter = Router()

  constructor() {
    this.initializeRoutes()
  }

  private initializeRoutes(): void {
    /**
     * @swagger
     * /api/worker/status:
     *   get:
     *     summary: 获取 Worker Pool 状态
     *     tags: [Worker]
     *     responses:
     *       200:
     *         description: Worker Pool 状态
     */
    this.router.get(`${this.path}/status`, this.getStatus)

    /**
     * @swagger
     * /api/worker/execute:
     *   post:
     *     summary: 执行 Worker 任务
     *     tags: [Worker]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               type:
     *                 type: string
     *                 description: 任务类型
     *               data:
     *                 type: object
     *                 description: 任务数据
     *     responses:
     *       200:
     *         description: 任务执行结果
     *       400:
     *         description: 参数错误
     *       503:
     *         description: Worker Pool 未启用
     */
    this.router.post(`${this.path}/execute`, this.executeTask)

    /**
     * @swagger
     * /api/worker/fibonacci:
     *   get:
     *     summary: 计算斐波那契数列
     *     tags: [Worker]
     *     parameters:
     *       - in: query
     *         name: n
     *         schema:
     *           type: integer
     *         description: 计算第 n 个斐波那契数
     *     responses:
     *       200:
     *         description: 计算结果
     */
    this.router.get(`${this.path}/fibonacci`, this.fibonacci)

    /**
     * @swagger
     * /api/worker/hash:
     *   post:
     *     summary: 计算哈希
     *     tags: [Worker]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               input:
     *                 type: string
     *               iterations:
     *                 type: integer
     *     responses:
     *       200:
     *         description: 哈希结果
     */
    this.router.post(`${this.path}/hash`, this.hash)

    /**
     * @swagger
     * /api/worker/primes:
     *   get:
     *     summary: 生成质数列表
     *     tags: [Worker]
     *     parameters:
     *       - in: query
     *         name: max
     *         schema:
     *           type: integer
     *         description: 最大值
     *     responses:
     *       200:
     *         description: 质数列表
     */
    this.router.get(`${this.path}/primes`, this.generatePrimes)

    /**
     * @swagger
     * /api/worker/sort:
     *   post:
     *     summary: 排序数组
     *     tags: [Worker]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               array:
     *                 type: array
     *                 items:
     *                   type: number
     *               algorithm:
     *                 type: string
     *                 enum: [quick, merge, heap]
     *     responses:
     *       200:
     *         description: 排序结果
     */
    this.router.post(`${this.path}/sort`, this.sort)
  }

  /**
   * 获取 Worker Pool 状态
   */
  private getStatus = (_req: Request, res: Response): void => {
    const pool = getWorkerPool()

    if (!pool) {
      res.json({
        enabled: false,
        message: 'Worker Pool is not enabled. Set WORKER_POOL_ENABLED=true',
      })
      return
    }

    const status = pool.getStatus()
    res.json({
      enabled: true,
      ...status,
    })
  }

  /**
   * 执行通用 Worker 任务
   */
  private executeTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pool = getWorkerPool()

      if (!pool) {
        res.status(503).json({
          success: false,
          error: 'Worker Pool is not enabled',
        })
        return
      }

      const { type, data } = req.body

      if (!type) {
        res.status(400).json({
          success: false,
          error: 'Task type is required',
        })
        return
      }

      const task: WorkerTask = { type, data }
      const result: WorkerResult = await pool.execute(task)

      res.json(result)
    } catch (error) {
      next(error)
    }
  }

  /**
   * 计算斐波那契
   */
  private fibonacci = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const n = parseInt(req.query.n as string) || 10

      // 限制 n 的大小防止过长计算
      if (n > 45) {
        res.status(400).json({
          success: false,
          error: 'n must be <= 45 to prevent timeout',
        })
        return
      }

      const pool = getWorkerPool()

      if (!pool) {
        // 降级到主线程计算
        const startTime = Date.now()
        const fib = (n: number): number => (n <= 1 ? n : fib(n - 1) + fib(n - 2))
        const result = fib(n)
        res.json({
          success: true,
          data: result,
          duration: Date.now() - startTime,
          worker: false,
        })
        return
      }

      const result = await pool.execute({ type: 'fibonacci', data: { n } })
      res.json({ ...result, worker: true })
    } catch (error) {
      next(error)
    }
  }

  /**
   * 计算哈希
   */
  private hash = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { input, iterations = 10000, algorithm = 'sha256' } = req.body

      if (!input) {
        res.status(400).json({
          success: false,
          error: 'input is required',
        })
        return
      }

      const pool = getWorkerPool()

      if (!pool) {
        res.status(503).json({
          success: false,
          error: 'Worker Pool is not enabled for CPU-intensive hash',
        })
        return
      }

      const result = await pool.execute({
        type: 'hash',
        data: { input, iterations, algorithm },
      })

      res.json(result)
    } catch (error) {
      next(error)
    }
  }

  /**
   * 生成质数
   */
  private generatePrimes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const max = parseInt(req.query.max as string) || 1000

      if (max > 10000000) {
        res.status(400).json({
          success: false,
          error: 'max must be <= 10000000',
        })
        return
      }

      const pool = getWorkerPool()

      if (!pool) {
        // 降级到主线程
        const startTime = Date.now()
        const sieve = new Array(max + 1).fill(true)
        sieve[0] = sieve[1] = false
        for (let i = 2; i <= Math.sqrt(max); i++) {
          if (sieve[i]) {
            for (let j = i * i; j <= max; j += i) {
              sieve[j] = false
            }
          }
        }
        const primes = sieve.reduce((acc: number[], isPrime, num) => {
          if (isPrime) acc.push(num)
          return acc
        }, [])

        res.json({
          success: true,
          data: { count: primes.length, sample: primes.slice(0, 100) },
          duration: Date.now() - startTime,
          worker: false,
        })
        return
      }

      const result = await pool.execute({ type: 'generatePrimes', data: { max } })

      if (result.success && Array.isArray(result.data)) {
        res.json({
          ...result,
          data: { count: result.data.length, sample: result.data.slice(0, 100) },
          worker: true,
        })
      } else {
        res.json({ ...result, worker: true })
      }
    } catch (error) {
      next(error)
    }
  }

  /**
   * 排序数组
   */
  private sort = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { array, algorithm = 'quick' } = req.body

      if (!Array.isArray(array)) {
        res.status(400).json({
          success: false,
          error: 'array is required and must be an array',
        })
        return
      }

      if (array.length > 1000000) {
        res.status(400).json({
          success: false,
          error: 'array length must be <= 1000000',
        })
        return
      }

      const pool = getWorkerPool()

      if (!pool) {
        // 降级到主线程
        const startTime = Date.now()
        const sorted = [...array].sort((a, b) => a - b)
        res.json({
          success: true,
          data: sorted,
          duration: Date.now() - startTime,
          worker: false,
        })
        return
      }

      const result = await pool.execute({
        type: 'sort',
        data: { array, algorithm },
      })

      res.json({ ...result, worker: true })
    } catch (error) {
      next(error)
    }
  }
}

export default WorkerRoute
