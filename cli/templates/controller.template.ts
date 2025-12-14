/**
 * Controller 模板生成器
 */

export function generateController(pascalCase: string, camelCase: string, kebabCase: string): string {
  return `/**
 * ${pascalCase} Controller
 */

import { NextFunction, Request, Response } from 'express'
import ${pascalCase}Service from '../services/${kebabCase}.service'
import { Create${pascalCase}Dto, Update${pascalCase}Dto, ${pascalCase}Response } from '../dtos/${kebabCase}.dto'
import { ApiResponse } from '@/types'

class ${pascalCase}Controller {
  public ${camelCase}Service = new ${pascalCase}Service()

  /**
   * GET / - 获取所有 ${pascalCase}
   */
  public getAll = async (
    req: Request,
    res: Response<ApiResponse<${pascalCase}Response[]>>,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = await this.${camelCase}Service.findAll()

      res.status(200).json({
        data,
        message: '${pascalCase} list retrieved successfully',
        success: true,
      })
    } catch (err) {
      next(err)
    }
  }

  /**
   * GET /:id - 根据 ID 获取 ${pascalCase}
   */
  public getById = async (
    req: Request,
    res: Response<ApiResponse<${pascalCase}Response>>,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = Number(req.params.id)
      const data = await this.${camelCase}Service.findById(id)

      res.status(200).json({
        data,
        message: '${pascalCase} retrieved successfully',
        success: true,
      })
    } catch (err) {
      next(err)
    }
  }

  /**
   * POST / - 创建 ${pascalCase}
   */
  public create = async (
    req: Request,
    res: Response<ApiResponse<${pascalCase}Response>>,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const dto: Create${pascalCase}Dto = req.body
      const data = await this.${camelCase}Service.create(dto)

      res.status(201).json({
        data,
        message: '${pascalCase} created successfully',
        success: true,
      })
    } catch (err) {
      next(err)
    }
  }

  /**
   * PUT /:id - 更新 ${pascalCase}
   */
  public update = async (
    req: Request,
    res: Response<ApiResponse<${pascalCase}Response>>,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = Number(req.params.id)
      const dto: Update${pascalCase}Dto = req.body
      const data = await this.${camelCase}Service.update(id, dto)

      res.status(200).json({
        data,
        message: '${pascalCase} updated successfully',
        success: true,
      })
    } catch (err) {
      next(err)
    }
  }

  /**
   * DELETE /:id - 删除 ${pascalCase}
   */
  public delete = async (
    req: Request,
    res: Response<ApiResponse<void>>,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = Number(req.params.id)
      await this.${camelCase}Service.delete(id)

      res.status(200).json({
        data: undefined,
        message: '${pascalCase} deleted successfully',
        success: true,
      })
    } catch (err) {
      next(err)
    }
  }
}

export default ${pascalCase}Controller
`
}
