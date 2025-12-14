/**
 * DTO 模板生成器
 */

export function generateDto(pascalCase: string, camelCase: string): string {
  return `import { IsString, IsOptional, IsInt, Min } from 'class-validator'

/**
 * 创建 ${pascalCase} DTO
 */
export class Create${pascalCase}Dto {
  @IsString()
  public name!: string

  @IsOptional()
  @IsString()
  public description?: string
}

/**
 * 更新 ${pascalCase} DTO
 */
export class Update${pascalCase}Dto {
  @IsOptional()
  @IsString()
  public name?: string

  @IsOptional()
  @IsString()
  public description?: string
}

/**
 * 查询 ${pascalCase} DTO
 */
export class Query${pascalCase}Dto {
  @IsOptional()
  @IsInt()
  @Min(1)
  public page?: number = 1

  @IsOptional()
  @IsInt()
  @Min(1)
  public limit?: number = 10

  @IsOptional()
  @IsString()
  public search?: string
}

/**
 * ${pascalCase} 响应类型
 */
export interface ${pascalCase}Response {
  id: number
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
}
`
}
