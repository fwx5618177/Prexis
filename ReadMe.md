# Prexis

> **Prexis** = **Pr**isma + **Ex**press + TypeScr**i**pt + **S**ystem

A production-ready Node.js API framework built with TypeScript, Express, and Prisma ORM.

[中文文档](./README.zh-CN.md)

## ✨ Features

- 🚀 **Production Ready** - TypeScript, ESLint, Prettier, Husky
- 🐳 **Containerized** - Docker / Docker Swarm / Kubernetes
- 📊 **GraphQL + REST** - Dual protocol support
- 🔒 **Security** - Helmet, CORS, HPP, JWT authentication
- 📝 **Auto API Docs** - Swagger UI
- ✅ **Testing** - Vitest with 200+ unit tests
- 📈 **High Performance** - 27,600+ RPS (PM2 cluster mode)
- ⚡ **Circuit Breaker** - Enterprise-level fault tolerance with opossum

## 📊 Performance Benchmarks

> Real benchmark data collected on MacBook Pro (14-core Apple Silicon)

| Mode | Avg RPS | Max RPS | Avg Latency | p99 Latency | Improvement |
|------|---------|---------|-------------|-------------|-------------|
| Single Process | 8,570 | 8,879 | 5.33ms | 9ms | Baseline |
| PM2 Cluster (14 cores) | **27,608** | **33,983** | **1.34ms** | 15ms | **3.2x** |

**Test Configuration:**
- Tool: `autocannon -c 50 -d 10`
- Endpoint: `GET /health`
- Environment: Node.js 20+, Production mode

## 📦 Tech Stack

| Category | Technology |
|----------|------------|
| Runtime | Node.js 20+, TypeScript 5.9 |
| Framework | Express 4.22, GraphQL |
| ORM | Prisma 6.x |
| Resilience | opossum (Circuit Breaker) |
| Build | SWC, pnpm |
| Testing | Vitest |
| Deploy | Docker, Kubernetes, PM2 |

## 🚀 Quick Start

```bash
# Install
pnpm install

# Setup
cp .env.example .env

# Development
pnpm dev
```

## 📁 Structure

```
src/
├── app.ts              # Express application
├── server.ts           # Server entry
├── config/             # Configuration
├── exceptions/         # HTTP exceptions
├── middlewares/        # Middleware
├── modules/            # Business modules
│   └── health/         # Health check with Circuit Breaker
├── services/           # Shared services
│   └── circuit-breaker.service.ts
└── shared/             # Utilities
```

## 🔧 Commands

```bash
pnpm dev              # Development
pnpm build            # Build
pnpm start            # Production
pnpm test             # Test
pnpm test:coverage    # Coverage
pnpm lint             # Lint
pnpm typecheck        # Type check
```

## 🛠️ CLI Tool

Prexis includes a CLI for rapid module generation and project cleanup.

### Generate Module

```bash
# Generate a new API module (dto, service, controller, route)
pnpm gen <module-name>

# Examples
pnpm gen product          # Creates src/modules/product/
pnpm gen user-profile     # Creates src/modules/user-profile/
pnpm gen order-item       # Creates src/modules/order-item/
```

**Generated structure:**
```
src/modules/<module-name>/
├── index.ts
├── dtos/
│   └── <module-name>.dto.ts
├── services/
│   └── <module-name>.service.ts
├── controllers/
│   └── <module-name>.controller.ts
└── routes/
    └── <module-name>.route.ts
```

**Options:**
```bash
pnpm gen product --no-dto         # Skip DTO generation
pnpm gen product --no-service     # Skip Service generation
pnpm gen product --no-controller  # Skip Controller generation
pnpm gen product --no-route       # Skip Route generation
```

### Clean Examples

Remove example modules (users, graphql) for production use:

```bash
pnpm clean:examples       # Interactive confirmation
pnpm clean:examples -y    # Skip confirmation
```

### List Modules

```bash
pnpm cli:list             # List all existing modules
```

### After Generation

Register your new route in `src/routes.ts`:

```typescript
import { ProductRoute } from '@modules/product'

const routes: Routes[] = [
  // ... existing routes
  new ProductRoute(),
]
```

## 🌐 API

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check (liveness) |
| `GET /ready` | Readiness check with Circuit Breaker |
| `GET /circuit-breaker/status` | Circuit Breaker states |
| `GET /api-docs` | Swagger docs |
| `POST /graphql` | GraphQL |
| `POST /api/auth/login` | Login |
| `POST /api/auth/register` | Register |
| `GET /api/users` | Users |

## 🐳 Docker

```bash
docker compose --profile dev up      # Development
docker compose --profile prod up -d  # Production
```

## 📄 License

MIT © [fwx5618177](https://github.com/fwx5618177)


