/**
 * Index 模板生成器
 */

interface GenerateOptions {
  dto: boolean
  service: boolean
  controller: boolean
  route: boolean
}

export function generateIndex(pascalCase: string, kebabCase: string, options: GenerateOptions): string {
  const exports: string[] = []

  if (options.controller) {
    exports.push(`export { default as ${pascalCase}Controller } from './controllers/${kebabCase}.controller'`)
  }

  if (options.service) {
    exports.push(`export { default as ${pascalCase}Service } from './services/${kebabCase}.service'`)
  }

  if (options.route) {
    exports.push(`export { default as ${pascalCase}Route } from './routes/${kebabCase}.route'`)
  }

  if (options.dto) {
    exports.push(`export * from './dtos/${kebabCase}.dto'`)
  }

  return exports.join('\n') + '\n'
}
