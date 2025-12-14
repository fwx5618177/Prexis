/**
 * 验证传输数据的DTO验证中间件
 */

import { plainToClass } from 'class-transformer'
import { RequestHandler } from 'express'
import { validate, ValidationError } from 'class-validator'
import { HttpException } from '@/exceptions/HttpException'

const validationMiddleware = (
  type: any,
  value: string | 'body' | 'query' | 'params' = 'body',
  skipMissingProperties = false,
  whitelist = true,
  forbidNonWhitelisted = true,
): RequestHandler => {
  return (req, res, next) => {
    validate(plainToClass(type, req[value as 'body' | 'query' | 'params' | 'body']), {
      skipMissingProperties,
      whitelist,
      forbidNonWhitelisted,
    }).then((errors: ValidationError[]) => {
      if (errors.length > 0) {
        const message = errors
          .map((error: ValidationError) => Object.values(error.constraints as Record<string, string>))
          .join(', ')

        next(new HttpException(400, message))
      } else {
        next()
      }
    })
  }
}

export default validationMiddleware
