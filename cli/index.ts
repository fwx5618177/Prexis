#!/usr/bin/env node
/**
 * Prexis CLI - 快速生成模块和清理示例
 *
 * 命令:
 *   pnpm gen <module-name>    生成新模块 (dto, service, controller, route)
 *   pnpm clean:examples       删除示例模块，准备生产使用
 */

import { Command } from 'commander'
import { generateModule } from './generators/module.generator'
import { cleanExamples } from './commands/clean-examples'
import { version } from '../package.json'

const program = new Command()

program
  .name('prexis')
  .description('Prexis CLI - 快速生成 API 模块和管理项目')
  .version(version)

// 生成模块命令
program
  .command('generate <name>')
  .alias('g')
  .description('生成新的 API 模块 (dto, service, controller, route)')
  .option('-p, --path <path>', '自定义模块路径', 'src/modules')
  .option('--no-dto', '不生成 DTO')
  .option('--no-service', '不生成 Service')
  .option('--no-controller', '不生成 Controller')
  .option('--no-route', '不生成 Route')
  .action((name: string, options) => {
    generateModule(name, options)
  })

// 清理示例命令
program
  .command('clean')
  .alias('c')
  .description('删除示例模块 (users, graphql)，准备生产使用')
  .option('-y, --yes', '跳过确认提示')
  .option('--keep-health', '保留 health 模块', true)
  .action((options) => {
    cleanExamples(options)
  })

// 列出模块命令
program
  .command('list')
  .alias('ls')
  .description('列出所有现有模块')
  .action(() => {
    const fs = require('fs')
    const path = require('path')
    const modulesPath = path.join(process.cwd(), 'src/modules')

    if (!fs.existsSync(modulesPath)) {
      console.log('❌ 未找到 modules 目录')
      return
    }

    const modules = fs
      .readdirSync(modulesPath)
      .filter((f: string) => fs.statSync(path.join(modulesPath, f)).isDirectory())

    console.log('\n📦 现有模块:\n')
    modules.forEach((m: string) => {
      console.log(`  • ${m}`)
    })
    console.log()
  })

program.parse()
