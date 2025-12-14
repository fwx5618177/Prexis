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
- ✅ **测试覆盖** - Vitest，200+ 单元测试
- 📈 **高性能** - PM2 集群模式 27,600+ RPS
- ⚡ **熔断器** - 企业级故障容错 (opossum)

## 📊 性能基准测试

> 真实测试数据，测试环境：MacBook Pro (14 核 Apple Silicon)

| 模式 | 平均 RPS | 最大 RPS | 平均延迟 | p99 延迟 | 提升倍数 |
|------|----------|----------|----------|----------|----------|
| 单进程 | 8,570 | 8,879 | 5.33ms | 9ms | 基准 |
| PM2 集群 (14核) | **27,608** | **33,983** | **1.34ms** | 15ms | **3.2x** |

**测试配置：**
- 工具：`autocannon -c 50 -d 10`
- 端点：`GET /health`
- 环境：Node.js 20+，生产模式

## 📦 技术栈

| 分类 | 技术 |
|------|------|
| 运行时 | Node.js 20+, TypeScript 5.9 |
| 框架 | Express 4.22, GraphQL |
| ORM | Prisma 6.x |
| 容错 | opossum（熔断器） |
| 构建 | SWC, pnpm |
| 测试 | Vitest |
| 部署 | Docker, Kubernetes, PM2 |

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
│   └── health/         # 健康检查（含熔断器保护）
├── services/           # 共享服务
│   └── circuit-breaker.service.ts
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

## 🛠️ CLI 工具

Prexis 内置 CLI 工具，用于快速生成模块和清理项目。

### 生成模块

```bash
# 生成新的 API 模块 (dto, service, controller, route)
pnpm gen <模块名>

# 示例
pnpm gen product          # 创建 src/modules/product/
pnpm gen user-profile     # 创建 src/modules/user-profile/
pnpm gen order-item       # 创建 src/modules/order-item/
```

**生成结构：**
```
src/modules/<模块名>/
├── index.ts
├── dtos/
│   └── <模块名>.dto.ts
├── services/
│   └── <模块名>.service.ts
├── controllers/
│   └── <模块名>.controller.ts
└── routes/
    └── <模块名>.route.ts
```

**可选参数：**
```bash
pnpm gen product --no-dto         # 不生成 DTO
pnpm gen product --no-service     # 不生成 Service
pnpm gen product --no-controller  # 不生成 Controller
pnpm gen product --no-route       # 不生成 Route
```

### 清理示例模块

删除示例模块（users、graphql），准备生产使用：

```bash
pnpm clean:examples       # 交互式确认
pnpm clean:examples -y    # 跳过确认
```

### 列出模块

```bash
pnpm cli:list             # 列出所有现有模块
```

### 生成后操作

在 `src/routes.ts` 中注册新路由：

```typescript
import { ProductRoute } from '@modules/product'

const routes: Routes[] = [
  // ... 现有路由
  new ProductRoute(),
]
```

## 🌐 API 端点

| 端点 | 说明 |
|------|------|
| `GET /health` | 健康检查（存活探针） |
| `GET /ready` | 就绪检查（含熔断器保护） |
| `GET /circuit-breaker/status` | 熔断器状态 |
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
