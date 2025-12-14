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
- ✅ **Testing** - Vitest with 100+ unit tests
- 📈 **Performance** - 8K+ RPS with single process

## 📦 Tech Stack

| Category | Technology |
|----------|------------|
| Runtime | Node.js 20+, TypeScript 5.x |
| Framework | Express 4.x, GraphQL |
| ORM | Prisma 5.x |
| Build | SWC, pnpm |
| Testing | Vitest |
| Deploy | Docker, Kubernetes |

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
├── services/           # Shared services
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
| `GET /health` | Health check |
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


