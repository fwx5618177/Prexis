/**
 * 模块生成器 - 生成 dto, service, controller, route
 */

import * as fs from 'fs'
import * as path from 'path'
import { generateDto } from '../templates/dto.template'
import { generateService } from '../templates/service.template'
import { generateController } from '../templates/controller.template'
import { generateRoute } from '../templates/route.template'
import { generateIndex } from '../templates/index.template'

interface GenerateOptions {
  path: string
  dto: boolean
  service: boolean
  controller: boolean
  route: boolean
}

/**
 * 将名称转换为各种格式
 */
function formatName(name: string) {
  // kebab-case -> PascalCase
  const pascalCase = name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('')

  // kebab-case -> camelCase
  const camelCase = pascalCase.charAt(0).toLowerCase() + pascalCase.slice(1)

  // 保持 kebab-case
  const kebabCase = name.toLowerCase().replace(/\s+/g, '-')

  return { pascalCase, camelCase, kebabCase }
}

/**
 * 创建目录（如果不存在）
 */
function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

/**
 * 生成模块
 */
export function generateModule(name: string, options: GenerateOptions) {
  const { pascalCase, camelCase, kebabCase } = formatName(name)
  const modulePath = path.join(process.cwd(), options.path, kebabCase)

  console.log(`\n🚀 正在生成模块: ${pascalCase}\n`)

  // 检查模块是否已存在
  if (fs.existsSync(modulePath)) {
    console.log(`❌ 模块 "${kebabCase}" 已存在于 ${modulePath}`)
    process.exit(1)
  }

  // 创建模块目录
  ensureDir(modulePath)

  const files: { path: string; content: string; name: string }[] = []

  // 生成 DTO
  if (options.dto) {
    const dtoDir = path.join(modulePath, 'dtos')
    ensureDir(dtoDir)
    files.push({
      path: path.join(dtoDir, `${kebabCase}.dto.ts`),
      content: generateDto(pascalCase, camelCase),
      name: 'DTO',
    })
  }

  // 生成 Service
  if (options.service) {
    const serviceDir = path.join(modulePath, 'services')
    ensureDir(serviceDir)
    files.push({
      path: path.join(serviceDir, `${kebabCase}.service.ts`),
      content: generateService(pascalCase, camelCase, kebabCase),
      name: 'Service',
    })
  }

  // 生成 Controller
  if (options.controller) {
    const controllerDir = path.join(modulePath, 'controllers')
    ensureDir(controllerDir)
    files.push({
      path: path.join(controllerDir, `${kebabCase}.controller.ts`),
      content: generateController(pascalCase, camelCase, kebabCase),
      name: 'Controller',
    })
  }

  // 生成 Route
  if (options.route) {
    const routeDir = path.join(modulePath, 'routes')
    ensureDir(routeDir)
    files.push({
      path: path.join(routeDir, `${kebabCase}.route.ts`),
      content: generateRoute(pascalCase, camelCase, kebabCase),
      name: 'Route',
    })
  }

  // 生成 index.ts
  files.push({
    path: path.join(modulePath, 'index.ts'),
    content: generateIndex(pascalCase, kebabCase, options),
    name: 'Index',
  })

  // 写入所有文件
  files.forEach(({ path: filePath, content, name }) => {
    fs.writeFileSync(filePath, content)
    const relativePath = path.relative(process.cwd(), filePath)
    console.log(`  ✅ ${name}: ${relativePath}`)
  })

  console.log(`\n✨ 模块 "${pascalCase}" 生成完成!\n`)
  console.log('📝 下一步:')
  console.log(`  1. 在 src/routes.ts 中导入并注册路由:`)
  console.log(`     import { ${pascalCase}Route } from '@modules/${kebabCase}'`)
  console.log(`     routes.push(new ${pascalCase}Route())`)
  console.log(`  2. 根据需要修改 DTO、Service 和 Controller`)
  console.log()
}
