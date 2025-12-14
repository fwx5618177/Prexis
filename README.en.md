# Prexis

[中文文档](./README.md)

## What is Prexis?

Prexis is an **enterprise-grade Node.js API development framework** built on Express, designed for production-ready backend services.

If you've used Express, you know its flexibility is a double-edged sword — it's quick to start with, but building a real project requires selecting and integrating numerous middleware, toolchains, and project structures. Prexis solves exactly this: **it's a battle-tested collection of Express best practices**, letting you focus on business logic instead of reinventing the wheel.

## Why Choose Prexis?

### Compared to Vanilla Express

| Aspect | Vanilla Express | Prexis |
|--------|-----------------|--------|
| Project Structure | DIY | Standardized modular architecture, ready to use |
| Type Safety | Manual TypeScript setup | Complete TypeScript support with comprehensive types |
| Request Validation | Requires third-party libs | Built-in class-validator declarative validation |
| Error Handling | Basic middleware | Unified exception handling, structured error responses |
| API Documentation | Manual writing | Auto-generated Swagger docs |
| Security | Configure individually | Pre-configured Helmet/CORS/HPP/Rate Limit |
| Database | None | Prisma ORM integrated |
| Authentication | DIY | JWT authentication out of the box |
| Fault Tolerance | None | Built-in circuit breaker pattern |
| Testing | DIY setup | Vitest framework with 200+ test cases |
| Deployment | DIY scripts | Docker/K8s configurations included |

### Compared to Other Frameworks

| Feature | Prexis | NestJS | Fastify |
|---------|--------|--------|---------|
| Learning Curve | Low (Express knowledge) | High (decorators, DI) | Medium |
| Underlying Framework | Express | Express/Fastify | Own |
| Flexibility | High | Medium (strong conventions) | High |
| Performance | High (27k+ RPS) | Medium | Very High |
| GraphQL | Built-in | Requires module | Requires plugin |
| TypeScript | Native support | Mandatory | Optional |
| Enterprise Features | Circuit breaker/Tracing/Logging | Comprehensive | Requires plugins |

**Prexis's Position**: Between lightweight Express and heavyweight NestJS. It retains Express's simplicity and flexibility while providing enterprise features — no new programming paradigms to learn.

## Core Advantages

### 1. Zero-Config Startup
```bash
pnpm install && pnpm dev
```
No need to agonize over project structure or toolchain choices — clone and go.

### 2. Modular Architecture
Each business domain is an independent module with DTO, Service, Controller, and Route:
```
src/modules/users/
├── dtos/           # Data Transfer Objects
├── services/       # Business logic
├── controllers/    # Request handlers
└── routes/         # Route definitions
```

### 3. CLI Scaffolding
Generate standard modules with one command, maintaining consistent code style:
```bash
pnpm gen product    # Auto-creates all product module files
```

### 4. Production-Grade Reliability
- **Circuit Breaker**: Prevents cascade failures with automatic degradation and recovery
- **Rate Limiting**: Prevents API abuse
- **Structured Logging**: Winston + log rotation
- **Distributed Tracing**: OpenTelemetry integration

### 5. High Performance
Achieves **27,600+ RPS** in PM2 cluster mode with p99 latency of just 15ms.

## Use Cases

- Small to medium-sized backend API services
- MVP projects requiring fast delivery
- Upgrade path for Express-based teams
- Scenarios requiring REST + GraphQL dual protocols
- Long-term projects with maintainability requirements

## Core Features

### Developer Experience
- **TypeScript Support** - Complete type safety for improved code quality and development efficiency
- **Modular Architecture** - Clear directory structure for team collaboration and code maintenance
- **CLI Code Generation** - Built-in command-line tool for rapid module scaffolding
- **Hot Reload** - Nodemon-based development server with instant code changes
- **Code Standards** - ESLint + Prettier + Husky for full code quality assurance

### API Capabilities
- **REST + GraphQL** - Dual protocol support for flexible business scenarios
- **WebSocket** - Built-in WS server for real-time bidirectional communication
- **Swagger Documentation** - Auto-generated API docs with online testing
- **Request Validation** - Declarative parameter validation based on class-validator
- **JWT Authentication** - Complete user authentication and authorization

### Enterprise Features
- **Circuit Breaker** - Opossum-based circuit breaker pattern to prevent cascade failures
- **Rate Limiting** - Built-in request frequency control to prevent API abuse
- **Security Middleware** - Helmet, CORS, HPP multi-layer security protection
- **Structured Logging** - Winston logging system with log rotation and multiple outputs
- **Distributed Tracing** - OpenTelemetry integration for trace support
- **HTTP/2 Support** - Native HTTP/2 server with multiplexing and Server Push

### Deployment & Operations
- **Containerization** - Docker / Docker Compose one-click deployment
- **Kubernetes** - K8s deployment configurations for horizontal scaling
- **PM2 Cluster** - Multi-process cluster mode for full CPU utilization
- **Health Checks** - Liveness and readiness probes for container orchestration
- **Release Strategies** - Built-in Blue-Green and Canary deployment configurations
- **Auto Scaling** - HPA configuration for CPU-based automatic scaling

### Test Coverage
- **Vitest Framework** - 200+ unit test cases
- **Coverage Reports** - Complete code coverage statistics
- **HTTP Tests** - REST Client test files included

## Tech Stack

| Category | Technology | Version |
|----------|------------|---------|
| Runtime | Node.js | >= 20.10.0 |
| Language | TypeScript | 5.9+ |
| Web Framework | Express | 4.22+ |
| Network Protocol | HTTP/1.1, HTTP/2 | - |
| Database ORM | Prisma | 6.x |
| API Protocol | REST, GraphQL | 16.x |
| Resilience | opossum | 9.x |
| Build Tool | SWC | - |
| Package Manager | pnpm | >= 9.0.0 |
| Test Framework | Vitest | - |
| Container | Docker, Kubernetes | - |

## Performance Benchmarks

> Test Environment: MacBook Pro (14-core Apple Silicon)

| Mode | Avg RPS | Max RPS | Avg Latency | p99 Latency | Improvement |
|------|---------|---------|-------------|-------------|-------------|
| Single Process | 8,570 | 8,879 | 5.33ms | 9ms | Baseline |
| PM2 Cluster (14 cores) | **27,608** | **33,983** | **1.34ms** | 15ms | **3.2x** |

**Test Configuration:**
- Tool: `autocannon -c 50 -d 10`
- Endpoint: `GET /health`
- Environment: Node.js 20+, Production mode

## Quick Start

### Prerequisites

- Node.js >= 20.10.0
- pnpm >= 9.0.0

### Installation

```bash
# Clone the repository
git clone https://github.com/fwx5618177/prexis.git
cd prexis

# Install dependencies
pnpm install

# Configure environment variables
cp .env.example .env

# Start development server
pnpm dev
```

After startup, visit:
- API Service: http://localhost:3000
- HTTP/2 Service: https://localhost:3001 (when HTTP/2 enabled)
- Swagger Docs: http://localhost:3000/api-docs
- GraphQL: http://localhost:3000/graphql
- WebSocket: ws://localhost:3000/ws

## Project Structure

```
prexis/
├── src/
│   ├── app.ts                 # Express application config
│   ├── server.ts              # Server entry point
│   ├── routes.ts              # Route registration
│   ├── config/                # Configuration management
│   ├── exceptions/            # Custom exceptions
│   ├── middlewares/           # Middleware
│   │   ├── auth.middleware.ts       # JWT authentication
│   │   ├── cors.middlewares.ts      # CORS config
│   │   ├── csrf.middleware.ts       # CSRF protection
│   │   ├── error.middleware.ts      # Error handling
│   │   ├── rateLimit.middleware.ts  # Rate limiting
│   │   ├── requestId.middleware.ts  # Request ID
│   │   ├── telemetry.middleware.ts  # Tracing
│   │   └── validation.middleware.ts # Parameter validation
│   ├── modules/               # Business modules
│   │   ├── auth/              # Authentication module
│   │   ├── users/             # Users module
│   │   ├── health/            # Health check
│   │   ├── graphql/           # GraphQL module
│   │   ├── websocket/         # WebSocket module
│   │   └── worker/            # Worker thread module
│   ├── services/              # Shared services
│   │   ├── circuit-breaker.service.ts  # Circuit breaker
│   │   ├── http2.service.ts            # HTTP/2 support
│   │   ├── performance.service.ts      # Performance optimization
│   │   ├── redis.service.ts            # Redis client
│   │   └── worker.service.ts           # Worker thread pool
│   ├── shared/                # Shared utilities
│   ├── types/                 # TypeScript type definitions
│   └── utils/                 # Utility functions
├── cli/                       # CLI code generation tool
├── prisma/                    # Prisma database config
├── tests/                     # Test cases
├── http/                      # HTTP test files
├── docs/                      # Documentation
└── benchmark/                 # Performance test scripts
```

## Common Commands

### Development

```bash
pnpm dev              # Start development server (hot reload)
pnpm build            # Build for production
pnpm start            # Start production server
pnpm start:cluster    # Start with PM2 cluster mode
```

### Testing

```bash
pnpm test             # Run tests
pnpm test:watch       # Watch mode tests
pnpm test:coverage    # Generate coverage report
```

### Code Quality

```bash
pnpm lint             # ESLint check
pnpm lint:fix         # Auto fix
pnpm format           # Prettier format
pnpm typecheck        # TypeScript type check
```

### Database

```bash
pnpm prisma:generate  # Generate Prisma client
pnpm prisma:migrate   # Run database migrations
```

## CLI Tool

Prexis includes a CLI tool for rapid generation of standardized business module code.

### Generate Module

```bash
# Generate complete module (includes dto, service, controller, route)
pnpm gen <module-name>

# Examples
pnpm gen product          # Creates src/modules/product/
pnpm gen user-profile     # Creates src/modules/user-profile/
pnpm gen order-item       # Creates src/modules/order-item/
```

Generated module structure:

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

### Options

```bash
pnpm gen product --no-dto         # Skip DTO generation
pnpm gen product --no-service     # Skip Service generation
pnpm gen product --no-controller  # Skip Controller generation
pnpm gen product --no-route       # Skip Route generation
```

### Other Commands

```bash
pnpm cli:list             # List all existing modules
pnpm clean:examples       # Clean example modules
pnpm clean:examples -y    # Skip confirmation
```

### Register Routes

After generating a module, register it in `src/routes.ts`:

```typescript
import { ProductRoute } from '@modules/product'

const routes: Routes[] = [
  // ... other routes
  new ProductRoute(),
]
```

## API Endpoints

| Endpoint | Method/Protocol | Description |
|----------|-----------------|-------------|
| `/health` | GET | Liveness probe |
| `/ready` | GET | Readiness probe (with circuit breaker) |
| `/circuit-breaker/status` | GET | Circuit breaker status |
| `/api-docs` | GET | Swagger API documentation |
| `/graphql` | POST | GraphQL endpoint |
| `/ws` | WebSocket | Real-time bidirectional communication |
| `/api/auth/login` | POST | User login |
| `/api/auth/register` | POST | User registration |
| `/api/users` | GET | User list |

## Docker Deployment

### Development Environment

```bash
docker compose --profile dev up
```

### Production Environment

```bash
docker compose --profile prod up -d
```

## Kubernetes Deployment

### Basic Deployment

```bash
kubectl apply -f k8s.yaml
```

### Blue-Green Deployment

Blue-Green deployment runs two versions simultaneously (blue=current, green=new) for zero-downtime releases:

```bash
# 1. Deploy new version (green environment)
kubectl set image deployment/prexis-green prexis=prexis:v2.0.0

# 2. Verify new version
kubectl rollout status deployment/prexis-green

# 3. Switch traffic to new version
kubectl patch service prexis -p '{"spec":{"selector":{"version":"green"}}}'

# 4. Rollback (if issues)
kubectl patch service prexis -p '{"spec":{"selector":{"version":"blue"}}}'
```

### Canary Deployment

Canary deployment routes a small percentage of traffic to the new version for gradual validation:

```bash
# 1. Deploy canary version (default replicas: 0)
kubectl scale deployment/prexis-canary --replicas=1

# 2. Canary receives ~10% traffic (1/10 pods)
# Main Deployment 9 replicas + Canary 1 replica

# 3. Monitor canary metrics
kubectl logs -l version=canary --tail=100

# 4. Gradually increase canary ratio
kubectl scale deployment/prexis-canary --replicas=3
kubectl scale deployment/prexis --replicas=7

# 5. Full rollout
kubectl set image deployment/prexis prexis=prexis:v2.0.0
kubectl scale deployment/prexis-canary --replicas=0
```

### Auto Scaling

The project includes HPA configuration for CPU-based auto-scaling:

```bash
# Check HPA status
kubectl get hpa prexis-hpa

# Manually adjust replica range
kubectl patch hpa prexis-hpa -p '{"spec":{"minReplicas":3,"maxReplicas":20}}'
```

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) to learn how to participate in project development.

By participating in this project, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md).

## License

This project is licensed under the [MIT](./LICENSE) License.

Copyright (c) 2024-present [fwx5618177](https://github.com/fwx5618177)
