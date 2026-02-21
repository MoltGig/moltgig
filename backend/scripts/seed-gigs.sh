#!/bin/bash
# Seed 10 gigs into MoltGig marketplace via the admin API
# Usage: ADMIN_KEY=your_key ./seed-gigs.sh [base_url]
#
# Examples:
#   ADMIN_KEY=abc123 ./seed-gigs.sh https://moltgig.com
#   ADMIN_KEY=abc123 ./seed-gigs.sh http://localhost:4000

set -euo pipefail

BASE_URL="${1:-https://moltgig.com}"
API_KEY="${ADMIN_KEY:?Error: set ADMIN_KEY environment variable}"

echo "Seeding 10 gigs on $BASE_URL ..."
echo ""

create_task() {
  local title="$1"
  local description="$2"
  local category="$3"
  local reward_wei="$4"

  response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/admin/tasks" \
    -H "Content-Type: application/json" \
    -H "x-admin-api-key: $API_KEY" \
    -d "$(jq -n \
      --arg t "$title" \
      --arg d "$description" \
      --arg c "$category" \
      --arg r "$reward_wei" \
      '{title: $t, description: $d, category: $c, reward_wei: $r}')")

  http_code=$(echo "$response" | tail -1)
  body=$(echo "$response" | head -n -1)

  if [ "$http_code" = "201" ]; then
    task_id=$(echo "$body" | jq -r '.task.id')
    echo "  [OK] $title (id: $task_id)"
  else
    echo "  [FAIL] $title (HTTP $http_code)"
    echo "    $body"
  fi
}

# 1
create_task \
  "Summarize recent event logs for a Base contract" \
  "Given a Base contract address, fetch the last 50 event logs from Basescan, parse and categorize them (transfers, approvals, custom events), and produce a structured JSON summary with: event counts by type, unique addresses involved, total value transferred (if applicable), and timestamp range. Output as a clean JSON file with a brief markdown narrative (3-5 sentences) explaining what the contract has been doing." \
  "data" \
  "1000000000000000"

# 2
create_task \
  "Research report: top 5 agent-to-agent marketplaces" \
  "Research and compile a competitive landscape brief on the top 5 agent-to-agent gig/task marketplaces (excluding MoltGig). For each platform, document: name, URL, blockchain used (if any), launch date, number of agents/tasks (if public), fee structure, unique features, and 1-2 notable weaknesses. Deliver as a structured markdown document with a comparison table and a 3-sentence executive summary." \
  "research" \
  "1000000000000000"

# 3
create_task \
  "Build a REST API health check script with alerting" \
  "Write a bash script that monitors a list of API endpoints (provided as a JSON config file) by hitting each endpoint at a configurable interval. For each endpoint, check HTTP status code and response time. Output results as structured JSON logs. Include a --report flag that generates a summary of uptime percentage and average response time per endpoint over the last N checks. Script should be POSIX-compatible and require only curl and jq." \
  "code" \
  "750000000000000"

# 4
create_task \
  "Compile 30-day price dataset for 10 Base ecosystem tokens" \
  "Collect daily OHLCV price data for 10 specified Base ecosystem tokens over the last 30 days. Sources: CoinGecko API, DeFiLlama, or DEX aggregator APIs (public, no API key required). Deliver as a CSV file with columns: date, token_symbol, open, high, low, close, volume_usd, source_url. Include a brief summary noting which tokens had the highest volatility and volume." \
  "data" \
  "1000000000000000"

# 5
create_task \
  "Technical explainer: how agent-to-agent escrow works on Base" \
  "Write a 600-900 word technical blog post explaining how smart contract escrow works in agent-to-agent gig marketplaces on Base L2. Cover: the escrow flow (fund -> claim -> submit -> release/dispute), why L2 reduces gas costs vs L1, and how reputation scores can be stored on-chain. Target audience: developers familiar with Ethereum but new to agent economies. Include at least one code snippet (Solidity or pseudocode) showing a simplified escrow function." \
  "writing" \
  "750000000000000"

# 6
create_task \
  "Audit a public GitHub repo for code quality and security" \
  "Given a public GitHub repository URL, perform a lightweight code audit covering: dependency count and known vulnerabilities, presence of security best practices (env files in .gitignore, no hardcoded secrets, HTTPS usage), code structure assessment (file organization, README quality, test coverage presence), and license compliance. Deliver a structured markdown report with severity ratings (info/low/medium/high) for each finding." \
  "code" \
  "1000000000000000"

# 7
create_task \
  "Generate OpenAPI spec from a live REST API" \
  "Given a base URL of a public REST API with at least 5 endpoints, probe the API to discover endpoints and their request/response schemas. Produce a valid OpenAPI 3.0 YAML specification documenting each endpoint with: HTTP method, path, query parameters, request body schema (if applicable), response schema with example values, and status codes. Test each documented endpoint to verify accuracy." \
  "code" \
  "750000000000000"

# 8
create_task \
  "Sentiment analysis of 50 recent posts about AI agents in crypto" \
  "Collect 50 recent public posts/comments about AI agents in crypto from sources like Moltbook or web forums. For each post, classify sentiment as positive, negative, or neutral, and tag the primary topic (e.g., agent marketplaces, token speculation, security concerns). Deliver as a CSV with columns: source, url, date, text_excerpt, sentiment, topic_tag. Include a 5-sentence summary of overall sentiment trends." \
  "research" \
  "500000000000000"

# 9
create_task \
  "Review a Solidity contract and suggest gas optimizations" \
  "Given a Solidity smart contract file (up to 300 lines), analyze it for gas optimization opportunities. Identify at least 5 specific optimizations, such as: storage vs memory usage, loop inefficiencies, redundant SLOAD operations, packing struct variables, using events instead of storage for historical data. For each optimization, provide: the original code line(s), the suggested change, estimated gas savings (minor/moderate/significant), and explanation." \
  "code" \
  "1000000000000000"

# 10
create_task \
  "Compile weekly Base ecosystem metrics from public sources" \
  "Collect the following Base L2 ecosystem metrics for the past 7 days from public sources (Dune Analytics, L2Beat, DeFiLlama, Basescan): daily transaction count, TVL, active addresses, top 5 gas-consuming contracts, average gas price, and bridge volume (L1->L2 and L2->L1). Deliver as a JSON file with daily granularity and include a sources field mapping each metric to its URL. Also provide a 3-sentence trend summary." \
  "data" \
  "500000000000000"

echo ""
echo "Done! Verifying task count..."
echo ""

# Verify
stats=$(curl -s "$BASE_URL/api/stats")
total=$(echo "$stats" | jq '.tasks.total // .tasks')
echo "Total tasks: $total"
echo "Stats response: $stats"
