#!/bin/bash

# 完整性能测试
# 测试所有主要接口

set -e

BASE_URL="${BASE_URL:-http://localhost:3000}"

echo "🔥 Prexis Full Benchmark Suite"
echo "==============================="
echo ""

# 检查服务是否运行
if ! curl -s "$BASE_URL/health" > /dev/null 2>&1; then
  echo "❌ Server not running at $BASE_URL"
  echo "Please start the server first: pnpm dev"
  exit 1
fi

SCRIPT_DIR="$(dirname "$0")"
RESULTS_DIR="$SCRIPT_DIR/../results"
mkdir -p "$RESULTS_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "📍 Test Environment:"
echo "  URL: $BASE_URL"
echo "  Time: $(date)"
echo ""

# 测试配置
WARMUP_DURATION=3
WARMUP_CONNECTIONS=10
TEST_DURATION=10
TEST_CONNECTIONS=100

echo "🔄 Warmup phase (${WARMUP_DURATION}s, ${WARMUP_CONNECTIONS} connections)..."
npx autocannon -c $WARMUP_CONNECTIONS -d $WARMUP_DURATION "$BASE_URL/health" > /dev/null 2>&1
echo "✅ Warmup complete"
echo ""

# 测试函数
run_test() {
  local name=$1
  local url=$2
  local method=${3:-GET}
  local body=$4

  echo "🧪 Testing: $name"
  echo "   URL: $url"

  local result_file="$RESULTS_DIR/${name}_${TIMESTAMP}.json"

  if [ "$method" = "POST" ] && [ -n "$body" ]; then
    npx autocannon \
      -c $TEST_CONNECTIONS \
      -d $TEST_DURATION \
      -m POST \
      -H "Content-Type: application/json" \
      -b "$body" \
      -j \
      "$url" > "$result_file" 2>/dev/null
  else
    npx autocannon \
      -c $TEST_CONNECTIONS \
      -d $TEST_DURATION \
      -j \
      "$url" > "$result_file" 2>/dev/null
  fi

  if command -v jq &> /dev/null; then
    local rps=$(jq '.requests.average' "$result_file")
    local latency=$(jq '.latency.average' "$result_file")
    local p99=$(jq '.latency.p99' "$result_file")
    echo "   RPS: $rps | Latency: ${latency}ms (p99: ${p99}ms)"
  fi
  echo ""
}

# 运行测试
echo "═══════════════════════════════════════════"
echo "Running tests with $TEST_CONNECTIONS connections for ${TEST_DURATION}s each"
echo "═══════════════════════════════════════════"
echo ""

run_test "health" "$BASE_URL/health"
run_test "swagger" "$BASE_URL/api-docs/"
run_test "graphql_mock" "$BASE_URL/graphql/mock" "POST" '{"query":"{ listPosts { id title } }"}'

echo "═══════════════════════════════════════════"
echo "✅ All tests complete!"
echo "📁 Results saved to: $RESULTS_DIR"
echo "═══════════════════════════════════════════"
