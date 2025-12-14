/**
 * Route 模板生成器
 */

export function generateRoute(pascalCase: string, camelCase: string, kebabCase: string): string {
  return `/**
 * ${pascalCase} Route
 */

import { Router } from 'express'
import { Routes } from '@types'
import ${pascalCase}Controller from '../controllers/${kebabCase}.controller'
import { Create${pascalCase}Dto, Update${pascalCase}Dto } from '../dtos/${kebabCase}.dto'
import validationMiddleware from '@/middlewares/validation.middleware'

class ${pascalCase}Route implements Routes {
  public path = '/${kebabCase}'
  public router: Router = Router()
  public ${camelCase}Controller = new ${pascalCase}Controller()

  constructor() {
    this.initializeRoutes()
  }

  private initializeRoutes() {
    // GET /${kebabCase} - 获取列表
    this.router.get(
      \`\${this.path}\`,
      this.${camelCase}Controller.getAll,
    )

    // GET /${kebabCase}/:id - 获取详情
    this.router.get(
      \`\${this.path}/:id(\\\\d+)\`,
      this.${camelCase}Controller.getById,
    )

    // POST /${kebabCase} - 创建
    this.router.post(
      \`\${this.path}\`,
      validationMiddleware(Create${pascalCase}Dto, 'body'),
      this.${camelCase}Controller.create,
    )

    // PUT /${kebabCase}/:id - 更新
    this.router.put(
      \`\${this.path}/:id(\\\\d+)\`,
      validationMiddleware(Update${pascalCase}Dto, 'body', true),
      this.${camelCase}Controller.update,
    )

    // DELETE /${kebabCase}/:id - 删除
    this.router.delete(
      \`\${this.path}/:id(\\\\d+)\`,
      this.${camelCase}Controller.delete,
    )
  }
}

export default ${pascalCase}Route
`
}
