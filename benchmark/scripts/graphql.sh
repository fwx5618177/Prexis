#!/bin/bash

# GraphQL 性能测试
# 测试 GraphQL 接口性能

set -e

BASE_URL="${BASE_URL:-http://localhost:3000}"
DURATION="${DURATION:-10}"
CONNECTIONS="${CONNECTIONS:-50}"

echo "🔮 Prexis GraphQL Benchmark"
echo "==========================="
echo "URL: $BASE_URL/graphql/mock"
echo "Duration: ${DURATION}s"
echo "Connections: $CONNECTIONS"
echo ""

# 检查服务是否运行
if ! curl -s "$BASE_URL/health" > /dev/null 2>&1; then
  echo "❌ Server not running at $BASE_URL"
  echo "Please start the server first: pnpm dev"
  exit 1
fi

# 创建结果目录
RESULTS_DIR="$(dirname "$0")/../results"
mkdir -p "$RESULTS_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RESULT_FILE="$RESULTS_DIR/graphql_${TIMESTAMP}.json"

echo "🚀 Running GraphQL benchmark..."
echo ""

# GraphQL 查询
QUERY='{"query":"{ listPosts { id title content } }"}'

# 运行 autocannon
npx autocannon \
  -c "$CONNECTIONS" \
  -d "$DURATION" \
  -m POST \
  -H "Content-Type: application/json" \
  -b "$QUERY" \
  -j \
  "$BASE_URL/graphql/mock" > "$RESULT_FILE"

echo ""
echo "📊 Results saved to: $RESULT_FILE"
echo ""

# 解析并显示结果
if command -v jq &> /dev/null; then
  echo "📈 Summary:"
  echo "  Requests/sec: $(jq '.requests.average' "$RESULT_FILE")"
  echo "  Latency avg:  $(jq '.latency.average' "$RESULT_FILE")ms"
  echo "  Latency p99:  $(jq '.latency.p99' "$RESULT_FILE")ms"
  echo "  Throughput:   $(jq '.throughput.average' "$RESULT_FILE") bytes/sec"
fi
