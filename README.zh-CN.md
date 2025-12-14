# Prexis

> **Prexis** = **Pr**isma + **Ex**press + TypeScr**i**pt + **S**ystem

生产级 Node.js API 框架，基于 TypeScript、Express 和 Prisma ORM。

[English](./README.md)

## ✨ 特性

- 🚀 **生产就绪** - TypeScript, ESLint, Prettier, Husky
- 🐳 **容器化部署** - Docker / Docker Swarm / Kubernetes
- 📊 **GraphQL + REST** - 双协议支持
- 🔒 **安全中间件** - Helmet, CORS, HPP, JWT 认证
- 📝 **自动 API 文档** - Swagger UI
- ✅ **测试覆盖** - Vitest，100+ 单元测试
- 📈 **高性能** - 单进程 8K+ RPS

## 📦 技术栈

| 分类 | 技术 |
|------|------|
| 运行时 | Node.js 20+, TypeScript 5.x |
| 框架 | Express 4.x, GraphQL |
| ORM | Prisma 5.x |
| 构建 | SWC, pnpm |
| 测试 | Vitest |
| 部署 | Docker, Kubernetes |

## 🚀 快速开始

```bash
# 安装依赖
pnpm install

# 配置环境
cp .env.example .env

# 启动开发
pnpm dev
```

## 📁 项目结构

```
src/
├── app.ts              # Express 应用
├── server.ts           # 服务器入口
├── config/             # 配置
├── exceptions/         # HTTP 异常
├── middlewares/        # 中间件
├── modules/            # 业务模块
├── services/           # 共享服务
└── shared/             # 工具函数
```

## 🔧 常用命令

```bash
pnpm dev              # 开发模式
pnpm build            # 构建
pnpm start            # 生产模式
pnpm test             # 测试
pnpm test:coverage    # 覆盖率
pnpm lint             # 代码检查
pnpm typecheck        # 类型检查
```

## 🌐 API 端点

| 端点 | 说明 |
|------|------|
| `GET /health` | 健康检查 |
| `GET /api-docs` | Swagger 文档 |
| `POST /graphql` | GraphQL |
| `POST /api/auth/login` | 登录 |
| `POST /api/auth/register` | 注册 |
| `GET /api/users` | 用户列表 |

## 🐳 Docker 部署

```bash
docker compose --profile dev up      # 开发环境
docker compose --profile prod up -d  # 生产环境
```

## 📄 License

MIT © [fwx5618177](https://github.com/fwx5618177)
