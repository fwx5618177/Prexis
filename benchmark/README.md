# Benchmark 性能测试

本目录包含 Prexis 框架的性能测试脚本。

## 📊 真实基准测试结果

> 测试环境：MacBook Pro (14 核 Apple Silicon), Node.js 20+, 生产模式

### 健康检查端点 (`GET /health`)

| 模式 | 平均 RPS | 最大 RPS | 平均延迟 | p99 延迟 | 总请求数 |
|------|----------|----------|----------|----------|----------|
| 单进程 | 8,570 | 8,879 | 5.33ms | 9ms | 86k/10s |
| PM2 集群 (14核) | **27,608** | **33,983** | **1.34ms** | 15ms | **276k/10s** |

**性能提升：3.2x (单进程 → PM2 集群)**

### 就绪检查端点 (`GET /ready`)

带 Circuit Breaker 保护的数据库健康检查：

| 指标 | 数值 |
|------|------|
| 平均 RPS | 26,446 |
| 平均延迟 | 1.39ms |
| Circuit Breaker 开销 | < 1% |

### 测试配置

```bash
# 测试命令
npx autocannon -c 50 -d 10 http://localhost:3000/health

# 参数说明
# -c 50: 50 个并发连接
# -d 10: 持续 10 秒
```

## 工具

- **autocannon** - HTTP 基准测试工具
- **clinic** - Node.js 性能诊断工具（可选）

## 安装

```bash
# 安装 autocannon（全局）
npm install -g autocannon

# 或使用 npx 直接运行
npx autocannon http://localhost:3000/health
```

## 运行测试

### 快速测试

```bash
# 基础健康检查测试
./benchmark/scripts/health.sh

# 完整 API 测试
./benchmark/scripts/full.sh

# GraphQL 测试
./benchmark/scripts/graphql.sh
```

### 单进程模式

```bash
# 启动单进程服务
NODE_ENV=prod node dist/server.js

# 运行基准测试
npx autocannon -c 50 -d 10 http://localhost:3000/health
```

### PM2 集群模式

```bash
# 启动 PM2 集群
pm2 start ecosystem.config.js --env production

# 运行基准测试
npx autocannon -c 50 -d 10 http://localhost:3000/health

# 停止集群
pm2 delete all
```

### 使用 autocannon 直接测试

```bash
# 健康检查（10 秒，100 并发）
autocannon -c 100 -d 10 http://localhost:3000/health

# 就绪检查（含 Circuit Breaker）
autocannon -c 50 -d 10 http://localhost:3000/ready

# Circuit Breaker 状态
curl http://localhost:3000/circuit-breaker/status

# GraphQL Mock 查询
autocannon -c 50 -d 10 -m POST \
  -H "Content-Type: application/json" \
  -b '{"query":"{ listPosts { id title } }"}' \
  http://localhost:3000/graphql/mock
```

## 测试场景

| 场景 | 并发 | 持续时间 | 目标 RPS |
|------|------|----------|----------|
| 冷启动 | 10 | 5s | 基准线 |
| 常规负载 | 100 | 30s | >1000 |
| 压力测试 | 500 | 60s | 稳定性 |
| 峰值负载 | 1000 | 10s | 极限 |

## 结果输出

测试结果保存在 `benchmark/results/` 目录，包含：

- JSON 格式的详细数据
- 延迟百分位统计
- 吞吐量趋势

## 监控指标

- **Latency** - 请求延迟（p50, p95, p99）
- **Throughput** - 每秒请求数（RPS）
- **Errors** - 错误率
- **Memory** - 内存使用情况
- **CPU** - CPU 使用率
