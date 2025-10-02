#!/bin/bash

# Chunk-Based RAG System Test Script
# Tests all components end-to-end

set -e  # Exit on error

BASE_URL="${BASE_URL:-http://localhost:3000}"
AUTH_TOKEN="${AUTH_TOKEN:-}"

echo "🧪 Testing Chunk-Based RAG System"
echo "================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check backfill stats
echo "📊 Test 1: Checking chunk statistics..."
RESPONSE=$(curl -s -X GET "$BASE_URL/api/chunks/backfill" \
  -H "Authorization: Bearer $AUTH_TOKEN")

if echo "$RESPONSE" | jq -e '.total_sources' > /dev/null 2>&1; then
  TOTAL=$(echo "$RESPONSE" | jq '.total_sources')
  WITH_CHUNKS=$(echo "$RESPONSE" | jq '.sources_with_chunks')
  WITHOUT=$(echo "$RESPONSE" | jq '.sources_without_chunks')

  echo -e "${GREEN}✓${NC} Stats retrieved successfully"
  echo "  Total sources: $TOTAL"
  echo "  With chunks: $WITH_CHUNKS"
  echo "  Without chunks: $WITHOUT"
else
  echo -e "${RED}✗${NC} Failed to get stats"
  echo "Response: $RESPONSE"
  exit 1
fi

echo ""

# Test 2: Test chunk search
echo "🔍 Test 2: Testing chunk-based search..."
SEARCH_RESPONSE=$(curl -s -X POST "$BASE_URL/api/search/enhanced" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "query": "test search",
    "mode": "chunks",
    "threshold": 0.5,
    "limit": 5
  }')

if echo "$SEARCH_RESPONSE" | jq -e '.results' > /dev/null 2>&1; then
  RESULT_COUNT=$(echo "$SEARCH_RESPONSE" | jq '.total')
  SEARCH_MODE=$(echo "$SEARCH_RESPONSE" | jq -r '.search_mode')

  echo -e "${GREEN}✓${NC} Search completed successfully"
  echo "  Results: $RESULT_COUNT"
  echo "  Mode: $SEARCH_MODE"

  # Check if results have chunks
  if [ "$RESULT_COUNT" -gt 0 ]; then
    HAS_CHUNK=$(echo "$SEARCH_RESPONSE" | jq -e '.results[0].chunk' > /dev/null 2>&1 && echo "yes" || echo "no")
    if [ "$HAS_CHUNK" == "yes" ]; then
      CHUNK_CONTENT=$(echo "$SEARCH_RESPONSE" | jq -r '.results[0].chunk.content' | cut -c 1-50)
      echo "  First chunk preview: ${CHUNK_CONTENT}..."
    fi
  fi
else
  echo -e "${RED}✗${NC} Search failed"
  echo "Response: $SEARCH_RESPONSE"
  exit 1
fi

echo ""

# Test 3: Test hybrid search
echo "🔄 Test 3: Testing hybrid search..."
HYBRID_RESPONSE=$(curl -s -X POST "$BASE_URL/api/search/enhanced" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "query": "important findings",
    "mode": "hybrid",
    "threshold": 0.6,
    "limit": 10
  }')

if echo "$HYBRID_RESPONSE" | jq -e '.results' > /dev/null 2>&1; then
  HYBRID_COUNT=$(echo "$HYBRID_RESPONSE" | jq '.total')
  HAS_GROUPED=$(echo "$HYBRID_RESPONSE" | jq -e '.grouped_by_source' > /dev/null 2>&1 && echo "yes" || echo "no")

  echo -e "${GREEN}✓${NC} Hybrid search completed"
  echo "  Results: $HYBRID_COUNT"
  echo "  Has grouped results: $HAS_GROUPED"
else
  echo -e "${RED}✗${NC} Hybrid search failed"
  echo "Response: $HYBRID_RESPONSE"
  exit 1
fi

echo ""

# Test 4: Check if chunks have embeddings
echo "🔢 Test 4: Verifying chunk embeddings..."
STATS=$(curl -s -X GET "$BASE_URL/api/chunks/backfill" \
  -H "Authorization: Bearer $AUTH_TOKEN")

TOTAL_CHUNKS=$(echo "$STATS" | jq '.total_chunks')
WITH_EMBEDDINGS=$(echo "$STATS" | jq '.chunks_with_embeddings')

if [ "$TOTAL_CHUNKS" -gt 0 ]; then
  EMBED_RATE=$(echo "scale=2; $WITH_EMBEDDINGS * 100 / $TOTAL_CHUNKS" | bc)
  echo -e "${GREEN}✓${NC} Chunks have embeddings"
  echo "  Total chunks: $TOTAL_CHUNKS"
  echo "  With embeddings: $WITH_EMBEDDINGS (${EMBED_RATE}%)"

  if (( $(echo "$EMBED_RATE < 80" | bc -l) )); then
    echo -e "${YELLOW}⚠${NC} Warning: Less than 80% of chunks have embeddings"
    echo "  Run: curl -X POST $BASE_URL/api/chunks/backfill"
  fi
else
  echo -e "${YELLOW}⚠${NC} No chunks found"
  echo "  Run backfill: curl -X POST $BASE_URL/api/chunks/backfill"
fi

echo ""

# Test 5: Performance test
echo "⚡ Test 5: Performance test..."
START_TIME=$(date +%s%N)

curl -s -X POST "$BASE_URL/api/search/enhanced" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "query": "performance test",
    "mode": "chunks",
    "limit": 20
  }' > /dev/null

END_TIME=$(date +%s%N)
DURATION=$(( ($END_TIME - $START_TIME) / 1000000 ))

echo -e "${GREEN}✓${NC} Search completed"
echo "  Latency: ${DURATION}ms"

if [ $DURATION -lt 1000 ]; then
  echo -e "  ${GREEN}Excellent!${NC} Sub-second response"
elif [ $DURATION -lt 2000 ]; then
  echo -e "  ${YELLOW}Good${NC} Under 2 seconds"
else
  echo -e "  ${RED}Slow${NC} Over 2 seconds - check HNSW index"
fi

echo ""

# Summary
echo "================================="
echo "📋 Test Summary"
echo "================================="

if [ "$TOTAL_CHUNKS" -gt 0 ] && [ "$WITH_EMBEDDINGS" -gt 0 ]; then
  echo -e "${GREEN}✓${NC} Database: content_chunks table exists and populated"
else
  echo -e "${RED}✗${NC} Database: No chunks found - run backfill"
fi

if [ "$RESULT_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✓${NC} Search API: Returns chunk results"
else
  echo -e "${YELLOW}⚠${NC} Search API: No results (may be normal if no matching content)"
fi

if [ "$HAS_GROUPED" == "yes" ]; then
  echo -e "${GREEN}✓${NC} Grouping: Results grouped by source"
else
  echo -e "${YELLOW}⚠${NC} Grouping: Not grouped (may be normal for some modes)"
fi

if [ $DURATION -lt 1000 ]; then
  echo -e "${GREEN}✓${NC} Performance: Sub-second search"
else
  echo -e "${YELLOW}⚠${NC} Performance: Could be optimized"
fi

echo ""
echo "🎉 Testing complete!"
echo ""
echo "Next steps:"
echo "1. If chunks = 0: Run backfill with POST /api/chunks/backfill"
echo "2. If no embeddings: Check OPENAI_API_KEY is set"
echo "3. If slow: Verify HNSW index exists (check migration)"
echo "4. Test UI: Open http://localhost:3000 and try search"
