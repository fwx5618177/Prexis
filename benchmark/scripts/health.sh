#!/bin/bash

# 健康检查性能测试
# 用于测试框架基础性能

set -e

BASE_URL="${BASE_URL:-http://localhost:3000}"
DURATION="${DURATION:-10}"
CONNECTIONS="${CONNECTIONS:-100}"

echo "🏥 Prexis Health Check Benchmark"
echo "================================"
echo "URL: $BASE_URL/health"
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
RESULT_FILE="$RESULTS_DIR/health_${TIMESTAMP}.json"

echo "🚀 Running benchmark..."
echo ""

# 运行 autocannon
npx autocannon \
  -c "$CONNECTIONS" \
  -d "$DURATION" \
  -j \
  "$BASE_URL/health" > "$RESULT_FILE"

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
