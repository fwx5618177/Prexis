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


