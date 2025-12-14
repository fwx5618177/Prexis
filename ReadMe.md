# Prexis


[English Documentation](./README.en.md)

## 什么是 Prexis？

Prexis 是一个基于 Express 的**企业级 Node.js API 开发框架**，专为构建生产环境的后端服务而设计。

如果你用过 Express，你一定知道它的灵活性是把双刃剑——上手快，但构建正式项目时需要自己选型和集成大量中间件、工具链、项目结构。Prexis 解决的正是这个问题：**它是一套经过生产验证的 Express 最佳实践集合**，让你专注于业务逻辑，而不是重复造轮子。

## 为什么选择 Prexis？

### 与原生 Express 对比

| 维度 | 原生 Express | Prexis |
|------|-------------|--------|
| 项目结构 | 需自行规划 | 标准化模块架构，开箱即用 |
| 类型安全 | 需手动配置 TypeScript | 完整 TypeScript 支持，类型定义完善 |
| 请求验证 | 需集成第三方库 | 内置 class-validator 声明式校验 |
| 错误处理 | 基础中间件 | 统一异常处理，结构化错误响应 |
| API 文档 | 需手动编写 | Swagger 自动生成 |
| 安全防护 | 需逐一配置 | Helmet/CORS/HPP/Rate Limit 预配置 |
| 数据库 | 无 | Prisma ORM 集成 |
| 认证授权 | 需自行实现 | JWT 认证开箱即用 |
| 容错机制 | 无 | 熔断器模式内置 |
| 测试覆盖 | 需自行搭建 | Vitest 测试框架，200+ 用例 |
| 部署方案 | 需自行编写 | Docker/K8s 配置齐全 |

### 与其他框架对比

| 特性 | Prexis | NestJS | Fastify |
|------|--------|--------|---------|
| 学习曲线 | 低（Express 基础即可） | 高（需学习装饰器、依赖注入） | 中 |
| 底层框架 | Express | Express/Fastify | 自有 |
| 灵活性 | 高 | 中（强约定） | 高 |
| 性能 | 高（27k+ RPS） | 中 | 极高 |
| GraphQL | 内置 | 需安装模块 | 需插件 |
| TypeScript | 原生支持 | 强制使用 | 可选 |
| 企业特性 | 熔断器/追踪/日志 | 完善 | 需插件 |

**Prexis 的定位**：介于轻量级 Express 和重量级 NestJS 之间。保留 Express 的简洁和灵活，同时提供企业级功能，无需学习新的编程范式。

## 核心优势

### 1. 零配置启动
```bash
pnpm install && pnpm dev
```
无需纠结项目结构、工具链选型，clone 即用。

### 2. 模块化架构
每个业务领域独立成模块，包含 DTO、Service、Controller、Route：
```
src/modules/users/
├── dtos/           # 数据传输对象
├── services/       # 业务逻辑
├── controllers/    # 请求处理
└── routes/         # 路由定义
```

### 3. CLI 脚手架
一键生成标准模块，保持代码风格统一：
```bash
pnpm gen product    # 自动创建 product 模块全部文件
```

### 4. 生产级可靠性
- **熔断器**：防止级联故障，服务自动降级恢复
- **速率限制**：防止 API 滥用
- **结构化日志**：Winston + 日志轮转
- **分布式追踪**：OpenTelemetry 集成

### 5. 高性能
PM2 集群模式下达到 **27,600+ RPS**，p99 延迟仅 15ms。

## 适用场景

- 中小型后端 API 服务
- 需要快速交付的 MVP 项目
- Express 技术栈团队的升级选择
- 需要 REST + GraphQL 双协议的场景
- 对可维护性有要求的长期项目

## 核心特性

### 开发体验
- **TypeScript 支持** - 完整的类型安全，提升代码质量和开发效率
- **模块化架构** - 清晰的目录结构，便于团队协作和代码维护
- **CLI 代码生成** - 内置命令行工具，快速生成业务模块脚手架
- **热重载开发** - 基于 nodemon 的开发服务器，代码修改即时生效
- **代码规范** - ESLint + Prettier + Husky 全链路代码质量保障

### API 能力
- **REST + GraphQL** - 双协议支持，灵活应对不同业务场景
- **WebSocket** - 内置 WS 服务，支持实时双向通信
- **Swagger 文档** - 自动生成 API 文档，支持在线测试
- **请求验证** - 基于 class-validator 的声明式参数校验
- **JWT 认证** - 完整的用户认证和授权机制

### 企业级功能
- **熔断器** - 基于 opossum 的断路器模式，防止级联故障
- **速率限制** - 内置请求频率控制，防止 API 滥用
- **安全中间件** - Helmet、CORS、HPP 多层安全防护
- **结构化日志** - Winston 日志系统，支持日志轮转和多输出
- **分布式追踪** - OpenTelemetry 集成，支持链路追踪
- **HTTP/2 支持** - 原生 HTTP/2 服务器，支持多路复用和 Server Push

### 部署运维
- **容器化** - Docker / Docker Compose 一键部署
- **Kubernetes** - 提供 K8s 部署配置，支持水平扩展
- **PM2 集群** - 多进程集群模式，充分利用多核 CPU
- **健康检查** - 存活探针和就绪探针，适配容器编排
- **发布策略** - 内置蓝绿部署、金丝雀发布配置
- **自动扩缩容** - HPA 配置，基于 CPU 利用率自动扩缩

### 测试覆盖
- **Vitest 测试框架** - 200+ 单元测试用例
- **覆盖率报告** - 完整的代码覆盖率统计
- **HTTP 测试** - 提供 REST Client 测试文件

## 技术栈

| 分类 | 技术 | 版本要求 |
|------|------|----------|
| 运行时 | Node.js | >= 20.10.0 |
| 语言 | TypeScript | 5.9+ |
| Web 框架 | Express | 4.22+ |
| 网络协议 | HTTP/1.1, HTTP/2 | - |
| 数据库 ORM | Prisma | 6.x |
| API 协议 | REST, GraphQL | 16.x |
| 容错组件 | opossum | 9.x |
| 构建工具 | SWC | - |
| 包管理 | pnpm | >= 9.0.0 |
| 测试框架 | Vitest | - |
| 容器化 | Docker, Kubernetes | - |

## 性能基准

> 测试环境：MacBook Pro (14 核 Apple Silicon)

| 运行模式 | 平均 RPS | 最大 RPS | 平均延迟 | p99 延迟 | 性能提升 |
|----------|----------|----------|----------|----------|----------|
| 单进程 | 8,570 | 8,879 | 5.33ms | 9ms | 基准 |
| PM2 集群 (14核) | **27,608** | **33,983** | **1.34ms** | 15ms | **3.2x** |

**测试配置：**
- 工具：`autocannon -c 50 -d 10`
- 端点：`GET /health`
- 环境：Node.js 20+，生产模式

## 快速开始

### 环境要求

- Node.js >= 20.10.0
- pnpm >= 9.0.0

### 安装与运行

```bash
# 克隆项目
git clone https://github.com/fwx5618177/prexis.git
cd prexis

# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env

# 启动开发服务器
pnpm dev
```

服务启动后访问：
- API 服务：http://localhost:3000
- HTTP/2 服务：https://localhost:3001（需启用 HTTP/2）
- Swagger 文档：http://localhost:3000/api-docs
- GraphQL：http://localhost:3000/graphql
- WebSocket：ws://localhost:3000/ws

## 项目结构

```
prexis/
├── src/
│   ├── app.ts                 # Express 应用配置
│   ├── server.ts              # 服务入口
│   ├── routes.ts              # 路由注册
│   ├── config/                # 配置管理
│   ├── exceptions/            # 自定义异常
│   ├── middlewares/           # 中间件
│   │   ├── auth.middleware.ts       # JWT 认证
│   │   ├── cors.middlewares.ts      # CORS 配置
│   │   ├── csrf.middleware.ts       # CSRF 防护
│   │   ├── error.middleware.ts      # 错误处理
│   │   ├── rateLimit.middleware.ts  # 速率限制
│   │   ├── requestId.middleware.ts  # 请求 ID
│   │   ├── telemetry.middleware.ts  # 链路追踪
│   │   └── validation.middleware.ts # 参数验证
│   ├── modules/               # 业务模块
│   │   ├── auth/              # 认证模块
│   │   ├── users/             # 用户模块
│   │   ├── health/            # 健康检查
│   │   ├── graphql/           # GraphQL 模块
│   │   ├── websocket/         # WebSocket 模块
│   │   └── worker/            # Worker 线程模块
│   ├── services/              # 公共服务
│   │   ├── circuit-breaker.service.ts  # 熔断器
│   │   ├── http2.service.ts            # HTTP/2 支持
│   │   ├── performance.service.ts      # 性能优化
│   │   ├── redis.service.ts            # Redis 客户端
│   │   └── worker.service.ts           # Worker 线程池
│   ├── shared/                # 共享工具
│   ├── types/                 # TypeScript 类型定义
│   └── utils/                 # 工具函数
├── cli/                       # CLI 代码生成工具
├── prisma/                    # Prisma 数据库配置
├── tests/                     # 测试用例
├── http/                      # HTTP 测试文件
├── docs/                      # 文档
└── benchmark/                 # 性能测试脚本
```

## 常用命令

### 开发

```bash
pnpm dev              # 启动开发服务器（热重载）
pnpm build            # 构建生产版本
pnpm start            # 启动生产服务
pnpm start:cluster    # PM2 集群模式启动
```

### 测试

```bash
pnpm test             # 运行测试
pnpm test:watch       # 监听模式测试
pnpm test:coverage    # 生成覆盖率报告
```

### 代码质量

```bash
pnpm lint             # ESLint 检查
pnpm lint:fix         # 自动修复
pnpm format           # Prettier 格式化
pnpm typecheck        # TypeScript 类型检查
```

### 数据库

```bash
pnpm prisma:generate  # 生成 Prisma 客户端
pnpm prisma:migrate   # 执行数据库迁移
```

## CLI 工具

Prexis 内置 CLI 工具，快速生成标准化的业务模块代码。

### 生成模块

```bash
# 生成完整模块（包含 dto、service、controller、route）
pnpm gen <模块名>

# 示例
pnpm gen product          # 创建 src/modules/product/
pnpm gen user-profile     # 创建 src/modules/user-profile/
pnpm gen order-item       # 创建 src/modules/order-item/
```

生成的模块结构：

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

### 选项参数

```bash
pnpm gen product --no-dto         # 不生成 DTO
pnpm gen product --no-service     # 不生成 Service
pnpm gen product --no-controller  # 不生成 Controller
pnpm gen product --no-route       # 不生成 Route
```

### 其他命令

```bash
pnpm cli:list             # 列出所有现有模块
pnpm clean:examples       # 清理示例模块
pnpm clean:examples -y    # 跳过确认直接清理
```

### 注册路由

生成模块后，在 `src/routes.ts` 中注册：

```typescript
import { ProductRoute } from '@modules/product'

const routes: Routes[] = [
  // ... 其他路由
  new ProductRoute(),
]
```

## API 端点

| 端点 | 方法/协议 | 说明 |
|------|----------|------|
| `/health` | GET | 存活探针 |
| `/ready` | GET | 就绪探针（含熔断器保护） |
| `/circuit-breaker/status` | GET | 熔断器状态 |
| `/api-docs` | GET | Swagger API 文档 |
| `/graphql` | POST | GraphQL 端点 |
| `/ws` | WebSocket | 实时双向通信 |
| `/api/auth/login` | POST | 用户登录 |
| `/api/auth/register` | POST | 用户注册 |
| `/api/users` | GET | 用户列表 |

## Docker 部署

### 开发环境

```bash
docker compose --profile dev up
```

### 生产环境

```bash
docker compose --profile prod up -d
```

## Kubernetes 部署

### 基础部署

```bash
kubectl apply -f k8s.yaml
```

### 蓝绿部署

蓝绿部署通过同时运行两个版本（蓝色=当前版本，绿色=新版本），实现零停机发布：

```bash
# 1. 部署新版本（绿色环境）
kubectl set image deployment/prexis-green prexis=prexis:v2.0.0

# 2. 验证新版本
kubectl rollout status deployment/prexis-green

# 3. 切换流量到新版本
kubectl patch service prexis -p '{"spec":{"selector":{"version":"green"}}}'

# 4. 回滚（如有问题）
kubectl patch service prexis -p '{"spec":{"selector":{"version":"blue"}}}'
```

### 金丝雀发布

金丝雀发布将小部分流量导向新版本，逐步验证后再全量发布：

```bash
# 1. 部署金丝雀版本（默认 replicas: 0）
kubectl scale deployment/prexis-canary --replicas=1

# 2. 金丝雀接收约 10% 流量（1/10 pods）
# 主 Deployment 9 个副本 + 金丝雀 1 个副本

# 3. 监控金丝雀指标
kubectl logs -l version=canary --tail=100

# 4. 逐步扩大金丝雀比例
kubectl scale deployment/prexis-canary --replicas=3
kubectl scale deployment/prexis --replicas=7

# 5. 全量发布
kubectl set image deployment/prexis prexis=prexis:v2.0.0
kubectl scale deployment/prexis-canary --replicas=0
```

### 自动扩缩容

项目内置 HPA 配置，基于 CPU 利用率自动扩缩：

```bash
# 查看 HPA 状态
kubectl get hpa prexis-hpa

# 手动调整副本数范围
kubectl patch hpa prexis-hpa -p '{"spec":{"minReplicas":3,"maxReplicas":20}}'
```

## 贡献指南

欢迎参与贡献！请阅读 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解如何参与项目开发。

参与本项目即表示你同意遵守我们的 [行为准则](./CODE_OF_CONDUCT.md)。

## 许可证

本项目采用 [MIT](./LICENSE) 许可证开源。

Copyright (c) 2024-present [fwx5618177](https://github.com/fwx5618177)


