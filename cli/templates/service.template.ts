/**
 * Service 模板生成器
 */

export function generateService(pascalCase: string, camelCase: string, kebabCase: string): string {
  return `/**
 * ${pascalCase} Service
 */

import { HttpException } from '@/exceptions/HttpException'
import { isEmpty } from '@/utils/util'
import { Create${pascalCase}Dto, Update${pascalCase}Dto, ${pascalCase}Response } from '../dtos/${kebabCase}.dto'

class ${pascalCase}Service {
  // TODO: 注入 Prisma 模型
  // private ${camelCase}s = prisma.${camelCase}

  /**
   * 获取所有 ${pascalCase}
   */
  public async findAll(): Promise<${pascalCase}Response[]> {
    // TODO: 实现数据库查询
    // const data = await this.${camelCase}s.findMany()
    // return data

    return []
  }

  /**
   * 根据 ID 获取 ${pascalCase}
   */
  public async findById(id: number): Promise<${pascalCase}Response> {
    if (isEmpty(id)) {
      throw new HttpException(400, '${pascalCase} ID is required')
    }

    // TODO: 实现数据库查询
    // const data = await this.${camelCase}s.findUnique({ where: { id } })
    // if (!data) throw new HttpException(404, '${pascalCase} not found')
    // return data

    throw new HttpException(404, '${pascalCase} not found')
  }

  /**
   * 创建 ${pascalCase}
   */
  public async create(dto: Create${pascalCase}Dto): Promise<${pascalCase}Response> {
    if (isEmpty(dto)) {
      throw new HttpException(400, 'Invalid ${camelCase} data')
    }

    // TODO: 实现数据库创建
    // const data = await this.${camelCase}s.create({ data: dto })
    // return data

    throw new HttpException(501, 'Not implemented')
  }

  /**
   * 更新 ${pascalCase}
   */
  public async update(id: number, dto: Update${pascalCase}Dto): Promise<${pascalCase}Response> {
    if (isEmpty(id)) {
      throw new HttpException(400, '${pascalCase} ID is required')
    }

    // TODO: 实现数据库更新
    // const exists = await this.${camelCase}s.findUnique({ where: { id } })
    // if (!exists) throw new HttpException(404, '${pascalCase} not found')
    //
    // const data = await this.${camelCase}s.update({
    //   where: { id },
    //   data: dto,
    // })
    // return data

    throw new HttpException(501, 'Not implemented')
  }

  /**
   * 删除 ${pascalCase}
   */
  public async delete(id: number): Promise<void> {
    if (isEmpty(id)) {
      throw new HttpException(400, '${pascalCase} ID is required')
    }

    // TODO: 实现数据库删除
    // const exists = await this.${camelCase}s.findUnique({ where: { id } })
    // if (!exists) throw new HttpException(404, '${pascalCase} not found')
    //
    // await this.${camelCase}s.delete({ where: { id } })

    throw new HttpException(501, 'Not implemented')
  }
}

export default ${pascalCase}Service
`
}
