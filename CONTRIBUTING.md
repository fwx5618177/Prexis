# 贡献指南

感谢你对 Prexis 的关注！我们欢迎任何形式的贡献，包括但不限于：

- 报告 Bug
- 提交功能建议
- 改进文档
- 提交代码修复或新功能

## 行为准则

参与本项目即表示你同意遵守我们的行为准则：

- 尊重所有贡献者
- 保持友善和专业的沟通
- 接受建设性的批评
- 专注于对社区最有利的事情

## 如何贡献

### 报告 Bug

1. 在 [Issues](https://github.com/fwx5618177/prexis/issues) 中搜索是否已有相同问题
2. 如果没有，创建新 Issue 并包含以下信息：
   - 清晰的问题描述
   - 复现步骤
   - 期望行为与实际行为
   - 运行环境（Node.js 版本、操作系统等）
   - 相关日志或截图

### 提交功能建议

1. 在 Issues 中搜索是否已有类似建议
2. 创建新 Issue，描述：
   - 功能的使用场景
   - 期望的实现方式
   - 可能的实现思路（可选）

### 提交代码

#### 开发环境设置

```bash
# Fork 并克隆仓库
git clone https://github.com/YOUR_USERNAME/prexis.git
cd prexis

# 安装依赖
pnpm install

# 配置环境
cp .env.example .env

# 启动开发服务器
pnpm dev
```

#### 开发流程

1. **创建分支**
   ```bash
   git checkout -b feature/your-feature-name
   # 或
   git checkout -b fix/your-bug-fix
   ```

2. **编写代码**
   - 遵循现有的代码风格
   - 添加必要的测试
   - 更新相关文档

3. **代码检查**
   ```bash
   pnpm lint          # 代码规范检查
   pnpm typecheck     # 类型检查
   pnpm test          # 运行测试
   ```

4. **提交变更**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

   提交信息格式遵循 [Conventional Commits](https://www.conventionalcommits.org/)：
   - `feat:` 新功能
   - `fix:` Bug 修复
   - `docs:` 文档更新
   - `style:` 代码格式（不影响功能）
   - `refactor:` 代码重构
   - `test:` 测试相关
   - `chore:` 构建/工具相关

5. **推送并创建 PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   在 GitHub 上创建 Pull Request

#### Pull Request 规范

- PR 标题应清晰描述变更内容
- PR 描述中说明：
  - 变更的目的
  - 实现方式
  - 测试情况
  - 相关 Issue（如有）
- 确保所有 CI 检查通过
- 至少需要一位维护者 review

### 改进文档

文档同样重要！你可以：

- 修复文档中的错误
- 改进现有文档的表述
- 添加使用示例
- 翻译文档

## 代码规范

### TypeScript

- 使用 TypeScript 严格模式
- 为公共 API 添加 JSDoc 注释
- 避免使用 `any` 类型
- 优先使用 `interface` 而非 `type`

### 命名规范

- 文件名：`kebab-case`（如 `auth.middleware.ts`）
- 类名：`PascalCase`（如 `AuthMiddleware`）
- 函数/变量：`camelCase`（如 `validateToken`）
- 常量：`UPPER_SNAKE_CASE`（如 `MAX_RETRY_COUNT`）

### 测试

- 为新功能编写单元测试
- 测试覆盖率不应低于现有水平
- 测试文件放在 `tests/` 目录下，结构与 `src/` 对应

## 发布流程

版本发布由维护者负责，遵循 [Semantic Versioning](https://semver.org/)：

- `MAJOR`：不兼容的 API 变更
- `MINOR`：向后兼容的新功能
- `PATCH`：向后兼容的 Bug 修复

## 获取帮助

如有任何问题，可以：

- 在 Issues 中提问
- 查阅项目文档

## 致谢

感谢所有为 Prexis 做出贡献的开发者！
