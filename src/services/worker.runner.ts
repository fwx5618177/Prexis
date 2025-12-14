/**
 * Worker Runner - 在 Worker 线程中运行的任务处理器
 * 此文件会被编译后在 Worker 线程中执行
 */

import { parentPort } from 'worker_threads'
import { createHash } from 'crypto'

interface WorkerTask {
  type: string
  data: unknown
}

interface WorkerResult {
  success: boolean
  data?: unknown
  error?: string
  duration: number
}

// ============ 类型安全的任务数据接口 ============

interface FibonacciData {
  n: number
}

interface SortData {
  array: number[]
  algorithm?: 'quick' | 'merge' | 'heap'
}

interface PrimeData {
  n: number
}

interface GeneratePrimesData {
  max: number
}

interface HashData {
  input: string
  iterations?: number
  algorithm?: string
}

interface VerifyHashData {
  input: string
  hash: string
  iterations?: number
  algorithm?: string
}

interface ProcessJsonData {
  items: unknown[]
  transform?: string
}

interface MatrixData {
  a: number[][]
  b: number[][]
}

interface GrayscaleData {
  pixels: number[][]
}

interface TextAnalysisData {
  text: string
}

interface CompressData {
  input: string
}

// ============ 任务处理器 ============

/**
 * 斐波那契计算 (递归版，用于演示 CPU 密集)
 */
function fibonacci(data: unknown): number {
  const { n } = data as FibonacciData
  const fib = (num: number): number => {
    if (num <= 1) return num
    return fib(num - 1) + fib(num - 2)
  }
  return fib(n)
}

/**
 * 迭代版斐波那契 (更高效)
 */
function fibonacciIterative(data: unknown): number {
  const { n } = data as FibonacciData
  if (n <= 1) return n
  let a = 0,
    b = 1
  for (let i = 2; i <= n; i++) {
    const temp = a + b
    a = b
    b = temp
  }
  return b
}

/**
 * 数组排序
 */
function sortArray(data: unknown): number[] {
  const { array, algorithm = 'quick' } = data as SortData
  const arr = [...array]

  switch (algorithm) {
    case 'merge':
      return mergeSort(arr)
    case 'heap':
      return heapSort(arr)
    default:
      return arr.sort((a, b) => a - b)
  }
}

/**
 * 质数检测
 */
function isPrime(data: unknown): boolean {
  const { n } = data as PrimeData
  if (n < 2) return false
  if (n === 2) return true
  if (n % 2 === 0) return false
  const sqrt = Math.sqrt(n)
  for (let i = 3; i <= sqrt; i += 2) {
    if (n % i === 0) return false
  }
  return true
}

/**
 * 生成质数列表 (埃拉托斯特尼筛法)
 */
function generatePrimes(data: unknown): number[] {
  const { max } = data as GeneratePrimesData
  const sieve = new Array(max + 1).fill(true)
  sieve[0] = sieve[1] = false

  for (let i = 2; i <= Math.sqrt(max); i++) {
    if (sieve[i]) {
      for (let j = i * i; j <= max; j += i) {
        sieve[j] = false
      }
    }
  }

  const primes: number[] = []
  for (let i = 0; i <= max; i++) {
    if (sieve[i]) primes.push(i)
  }
  return primes
}

/**
 * 哈希计算 (PBKDF2 模拟)
 */
function computeHash(data: unknown): string {
  const { input, iterations = 10000, algorithm = 'sha256' } = data as HashData
  let result = input

  for (let i = 0; i < iterations; i++) {
    result = createHash(algorithm).update(result).digest('hex')
  }

  return result
}

/**
 * 验证哈希
 */
function verifyHash(data: unknown): boolean {
  const { input, hash, iterations, algorithm } = data as VerifyHashData
  const computed = computeHash({ input, iterations, algorithm })
  return computed === hash
}

/**
 * JSON 数据处理
 */
function processJson(data: unknown): unknown[] {
  const { items, transform = 'enrich' } = data as ProcessJsonData

  switch (transform) {
    case 'enrich':
      return items.map((item, index) => {
        if (typeof item === 'object' && item !== null) {
          return {
            ...item,
            _index: index,
            _timestamp: Date.now(),
            _processed: true,
          }
        }
        return { value: item, _index: index, _timestamp: Date.now(), _processed: true }
      })
    case 'filter':
      return items.filter(item => item !== null && item !== undefined)
    case 'flatten':
      return items.flat(Infinity) as unknown[]
    default:
      return items
  }
}

/**
 * 矩阵乘法
 */
function matrixMultiply(data: unknown): number[][] {
  const { a, b } = data as MatrixData
  const rowsA = a.length
  const colsA = a[0]?.length ?? 0
  const colsB = b[0]?.length ?? 0

  if (colsA !== b.length) {
    throw new Error('Matrix dimensions do not match for multiplication')
  }

  const result: number[][] = Array(rowsA)
    .fill(null)
    .map(() => Array(colsB).fill(0))

  for (let i = 0; i < rowsA; i++) {
    for (let j = 0; j < colsB; j++) {
      for (let k = 0; k < colsA; k++) {
        const aVal = a[i]?.[k] ?? 0
        const bVal = b[k]?.[j] ?? 0
        result[i]![j]! += aVal * bVal
      }
    }
  }

  return result
}

/**
 * 图像灰度化
 */
function grayscale(data: unknown): number[][] {
  const { pixels } = data as GrayscaleData
  return pixels.map(row =>
    row.map(pixel => {
      const r = (pixel >> 16) & 0xff
      const g = (pixel >> 8) & 0xff
      const b = pixel & 0xff
      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
      return (gray << 16) | (gray << 8) | gray
    }),
  )
}

/**
 * 文本分析
 */
function textAnalysis(data: unknown): {
  totalWords: number
  uniqueWords: number
  avgWordLength: number
  topWords: [string, number][]
} {
  const { text } = data as TextAnalysisData
  const words = text.toLowerCase().match(/\b\w+\b/g) ?? []
  const wordFreq: Record<string, number> = {}

  for (const word of words) {
    wordFreq[word] = (wordFreq[word] ?? 0) + 1
  }

  const sortedWords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 100)

  return {
    totalWords: words.length,
    uniqueWords: Object.keys(wordFreq).length,
    avgWordLength: words.length > 0 ? words.reduce((sum, w) => sum + w.length, 0) / words.length : 0,
    topWords: sortedWords,
  }
}

/**
 * RLE 压缩
 */
function compress(data: unknown): string {
  const { input } = data as CompressData
  if (!input) return ''

  let result = ''
  let count = 1

  for (let i = 1; i <= input.length; i++) {
    if (i < input.length && input[i] === input[i - 1]) {
      count++
    } else {
      result += count > 1 ? `${count}${input[i - 1]}` : input[i - 1]
      count = 1
    }
  }

  return result
}

// ============ 辅助排序函数 ============

function mergeSort(arr: number[]): number[] {
  if (arr.length <= 1) return arr

  const mid = Math.floor(arr.length / 2)
  const left = mergeSort(arr.slice(0, mid))
  const right = mergeSort(arr.slice(mid))

  return merge(left, right)
}

function merge(left: number[], right: number[]): number[] {
  const result: number[] = []
  let i = 0,
    j = 0

  while (i < left.length && j < right.length) {
    const leftVal = left[i]!
    const rightVal = right[j]!
    if (leftVal <= rightVal) {
      result.push(leftVal)
      i++
    } else {
      result.push(rightVal)
      j++
    }
  }

  return result.concat(left.slice(i)).concat(right.slice(j))
}

function heapSort(arr: number[]): number[] {
  const n = arr.length

  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    heapify(arr, n, i)
  }

  for (let i = n - 1; i > 0; i--) {
    const temp = arr[0]!
    arr[0] = arr[i]!
    arr[i] = temp
    heapify(arr, i, 0)
  }

  return arr
}

function heapify(arr: number[], n: number, i: number): void {
  let largest = i
  const left = 2 * i + 1
  const right = 2 * i + 2

  if (left < n && arr[left]! > arr[largest]!) largest = left
  if (right < n && arr[right]! > arr[largest]!) largest = right

  if (largest !== i) {
    const temp = arr[i]!
    arr[i] = arr[largest]!
    arr[largest] = temp
    heapify(arr, n, largest)
  }
}

// ============ 任务处理器映射 ============

type TaskHandler = (data: unknown) => unknown

const taskHandlers: Record<string, TaskHandler> = {
  fibonacci,
  fibonacciIterative,
  sort: sortArray,
  isPrime,
  generatePrimes,
  hash: computeHash,
  verifyHash,
  processJson,
  matrixMultiply,
  grayscale,
  textAnalysis,
  compress,
}

// ============ Worker 主循环 ============

if (parentPort) {
  parentPort.on('message', (task: WorkerTask) => {
    const startTime = Date.now()

    try {
      const handler = taskHandlers[task.type]

      if (!handler) {
        parentPort!.postMessage({
          success: false,
          error: `Unknown task type: ${task.type}`,
          duration: Date.now() - startTime,
        } as WorkerResult)
        return
      }

      const result = handler(task.data)

      parentPort!.postMessage({
        success: true,
        data: result,
        duration: Date.now() - startTime,
      } as WorkerResult)
    } catch (error) {
      parentPort!.postMessage({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      } as WorkerResult)
    }
  })
}

// 导出任务类型供类型检查
export type TaskType = keyof typeof taskHandlers
