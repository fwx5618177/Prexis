# Benchmark 性能测试

本目录包含 Prexis 框架的性能测试脚本。

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

### 使用 autocannon 直接测试

```bash
# 健康检查（10 秒，100 并发）
autocannon -c 100 -d 10 http://localhost:3000/health

# 用户列表（需要数据库）
autocannon -c 50 -d 10 http://localhost:3000/users

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
