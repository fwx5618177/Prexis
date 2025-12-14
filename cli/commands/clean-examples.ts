/**
 * 清理示例模块命令
 */

import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'

// 示例模块列表（可以安全删除）
const EXAMPLE_MODULES = ['users', 'graphql']

// 核心模块列表（不应删除）
const CORE_MODULES = ['health', 'auth', 'websocket', 'worker']

interface CleanOptions {
  yes: boolean
  keepHealth: boolean
}

/**
 * 清理示例模块
 */
export async function cleanExamples(options: CleanOptions) {
  const modulesPath = path.join(process.cwd(), 'src/modules')

  if (!fs.existsSync(modulesPath)) {
    console.log('❌ 未找到 modules 目录')
    process.exit(1)
  }

  // 获取当前存在的示例模块
  const existingModules = fs.readdirSync(modulesPath).filter((f) => fs.statSync(path.join(modulesPath, f)).isDirectory())

  const modulesToDelete = existingModules.filter((m) => EXAMPLE_MODULES.includes(m))

  if (modulesToDelete.length === 0) {
    console.log('\n✅ 没有需要删除的示例模块\n')
    return
  }

  console.log('\n🗑️  将删除以下示例模块:\n')
  modulesToDelete.forEach((m) => {
    console.log(`  • ${m}`)
  })
  console.log()

  // 确认删除
  if (!options.yes) {
    const confirmed = await confirm('确定要删除这些模块吗？')
    if (!confirmed) {
      console.log('\n❌ 操作已取消\n')
      return
    }
  }

  // 删除模块
  for (const module of modulesToDelete) {
    const modulePath = path.join(modulesPath, module)
    fs.rmSync(modulePath, { recursive: true, force: true })
    console.log(`  ✅ 已删除: ${module}`)
  }

  // 清理 routes.ts 中的引用
  cleanRoutesFile(modulesToDelete)

  // 清理测试文件
  cleanTestFiles(modulesToDelete)

  // 清理 http 测试文件
  cleanHttpFiles(modulesToDelete)

  console.log('\n✨ 示例模块清理完成!\n')
  console.log('📝 下一步:')
  console.log('  1. 运行 pnpm build 确保编译通过')
  console.log('  2. 运行 pnpm test 确保测试通过')
  console.log('  3. 使用 pnpm gen <name> 创建你自己的模块')
  console.log()
}

/**
 * 确认提示
 */
function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(`${message} (y/N) `, (answer) => {
      rl.close()
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes')
    })
  })
}

/**
 * 清理 routes.ts 中的引用
 */
function cleanRoutesFile(modules: string[]) {
  const routesPath = path.join(process.cwd(), 'src/routes.ts')

  if (!fs.existsSync(routesPath)) {
    return
  }

  let content = fs.readFileSync(routesPath, 'utf-8')
  let modified = false

  for (const module of modules) {
    const pascalCase = module.charAt(0).toUpperCase() + module.slice(1)

    // 删除 import 语句
    const importRegex = new RegExp(`import.*from.*['"]@modules/${module}['"].*\n?`, 'g')
    if (importRegex.test(content)) {
      content = content.replace(importRegex, '')
      modified = true
    }

    // 删除 route 注册
    const routeRegex = new RegExp(`\\s*new ${pascalCase}Route\\(\\),?\n?`, 'gi')
    if (routeRegex.test(content)) {
      content = content.replace(routeRegex, '')
      modified = true
    }
  }

  if (modified) {
    // 清理多余的逗号和空行
    content = content.replace(/,(\s*\])/g, '$1')
    content = content.replace(/\n{3,}/g, '\n\n')

    fs.writeFileSync(routesPath, content)
    console.log('  ✅ 已更新: src/routes.ts')
  }
}

/**
 * 清理测试文件
 */
function cleanTestFiles(modules: string[]) {
  const testsPath = path.join(process.cwd(), 'tests')

  if (!fs.existsSync(testsPath)) {
    return
  }

  for (const module of modules) {
    // 删除模块测试目录
    const moduleTestPath = path.join(testsPath, 'unit/modules', module)
    if (fs.existsSync(moduleTestPath)) {
      fs.rmSync(moduleTestPath, { recursive: true, force: true })
      console.log(`  ✅ 已删除测试: tests/unit/modules/${module}`)
    }

    // 删除服务测试文件
    const serviceTestPath = path.join(testsPath, `unit/services/${module}.service.test.ts`)
    if (fs.existsSync(serviceTestPath)) {
      fs.rmSync(serviceTestPath)
      console.log(`  ✅ 已删除测试: tests/unit/services/${module}.service.test.ts`)
    }
  }
}

/**
 * 清理 HTTP 测试文件
 */
function cleanHttpFiles(modules: string[]) {
  const httpPath = path.join(process.cwd(), 'http')

  if (!fs.existsSync(httpPath)) {
    return
  }

  for (const module of modules) {
    const patterns = [`${module}.http`, `${module}-*.http`]

    const files = fs.readdirSync(httpPath)
    for (const file of files) {
      if (file.startsWith(module) && file.endsWith('.http')) {
        fs.rmSync(path.join(httpPath, file))
        console.log(`  ✅ 已删除: http/${file}`)
      }
    }
  }
}
