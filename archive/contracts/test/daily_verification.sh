#!/bin/bash
# Daily verification routine - runs every morning
# Reports only verifiable, tested facts

echo "=== DAILY MOLTGIG VERIFICATION REPORT ==="
echo "Date: $(date)"
echo "Agent: MoltGig (ID: 4dd590cb-63ad-4dad-bafb-ce379ccce32b)"
echo ""

# Color codes for results
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔬 RUNNING COMPREHENSIVE TESTS..."

# 1. System Health Check
echo "1. SYSTEM STATUS:"
echo "   Node.js: $(node --version 2>/dev/null || echo 'NOT INSTALLED')"
echo "   Git: $(git --version 2>/dev/null || echo 'NOT INSTALLED')"
echo "   Curl: $(curl --version 2>/dev/null | head -1 || echo 'NOT INSTALLED')"

# 2. Moltbook Connection Test
echo ""
echo "2. MOLTBOOK CONNECTION:"
MOLTBOOK_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer moltbook_sk_6OidlgiT5U3GQwHgdkd1qG02D1RC9Lr_" \
  "https://www.moltbook.com/api/v1/agents/me")

if [ "$MOLTBOOK_STATUS" = "200" ]; then
    echo -e "   ${GREEN}✅ Agent accessible${NC}"
else
    echo -e "   ${RED}❌ Agent not accessible (HTTP $MOLTBOOK_STATUS)${NC}"
fi

# 3. Posting Test
echo ""
echo "3. POSTING CAPABILITY:"
POST_TEST=$(curl -s -X POST "https://www.moltbook.com/api/v1/posts" \
  -H "Authorization: Bearer moltbook_sk_6OidlgiT5U3GQwHgdkd1qG02D1RC9Lr_" \
  -H "Content-Type: application/json" \
  -d '{"submolt": "general", "title": "Daily Test", "content": "Automated verification test"}')

if echo "$POST_TEST" | grep -q '"success":true'; then
    echo -e "   ${GREEN}✅ Can post${NC}"
    POST_STATUS="WORKING"
elif echo "$POST_TEST" | grep -q '"error":"Failed to create post"'; then
    echo -e "   ${RED}❌ Cannot post - API error${NC}"
    POST_STATUS="FAILED"
else
    echo -e "   ${RED}❌ Cannot post - Unknown error${NC}"
    POST_STATUS="UNKNOWN_ERROR"
fi

# 4. Recent Activity Check
echo ""
echo "4. RECENT ACTIVITY:"
RECENT_POSTS=$(curl -s "https://www.moltbook.com/api/v1/posts?sort=new&limit=5" \
  -H "Authorization: Bearer moltbook_sk_6OidlgiT5U3GQwHgdkd1qG02D1RC9Lr_" | grep -o '"id":"[^"]*"' | wc -l)
echo "   Recent posts found: $RECENT_POSTS"

# 5. Smart Contract Status
echo ""
echo "5. SMART CONTRACTS:"
if [ -f "contracts/MoltGigEscrow.sol" ]; then
    echo -e "   ${GREEN}✅ Contract files exist${NC}"
    CONTRACT_STATUS="EXIST"
    
    # Check if compiled
    if [ -f "build/contracts/MoltGigEscrow.json" ]; then
        echo -e "   ${GREEN}✅ Contracts compiled${NC}"
        COMPILED_STATUS="COMPILED"
    else
        echo -e "   ${YELLOW}⚠️  Contracts not compiled${NC}"
        COMPILED_STATUS="NOT_COMPILED"
    fi
else
    echo -e "   ${RED}❌ Contract files missing${NC}"
    CONTRACT_STATUS="MISSING"
fi

# 6. Blockchain Connection
echo ""
echo "6. BLOCKCHAIN CONNECTION:"
BASE_TEST=$(curl -s "https://api.basescan.org/api?module=block&action=getblockcount" 2>/dev/null || echo "FAILED")
if echo "$BASE_TEST" | grep -q '"status":"1"'; then
    echo -e "   ${GREEN}✅ Base blockchain accessible${NC}"
    BLOCKCHAIN_STATUS="ACCESSIBLE"
else
    echo -e "   ${RED}❌ Base blockchain not accessible${NC}"
    BLOCKCHAIN_STATUS="NOT_ACCESSIBLE"
fi

# 7. GitHub Status
echo ""
echo "7. GITHUB STATUS:"
GITHUB_TEST=$(curl -s "https://api.github.com/users/moltgig" 2>/dev/null | head -5)
if echo "$GITHUB_TEST" | grep -q '"login":"moltgig"'; then
    echo -e "   ${GREEN}✅ GitHub account exists${NC}"
    GITHUB_STATUS="EXISTS"
else
    echo -e "   ${RED}❌ GitHub account not found${NC}"
    GITHUB_STATUS="NOT_FOUND"
fi

# Summary
echo ""
echo "=== TEST SUMMARY ==="
echo "Moltbook Access: $([ "$MOLTBOOK_STATUS" = "200" ] && echo "✅" || echo "❌")"
echo "Posting Capability: $POST_STATUS"
echo "Smart Contracts: $CONTRACT_STATUS"
echo "Blockchain Access: $BLOCKCHAIN_STATUS"
echo "GitHub Account: $GITHUB_STATUS"
echo ""
echo "=== VERIFICATION COMMANDS FOR MAX ==="
echo "To verify Moltbook: curl -H 'Authorization: Bearer moltbook_sk_6OidlgiT5U3GQwHgdkd1qG02D1RC9Lr_' https://www.moltbook.com/api/v1/agents/me"
echo "To verify contracts: ls -la contracts/"
echo "To verify GitHub: curl https://api.github.com/users/moltgig"
echo "To verify Base: curl https://api.basescan.org/api?module=block&action=getblockcount"
echo ""
echo "=== ACTIONABLE NEXT STEPS ==="
if [ "$POST_STATUS" = "FAILED" ]; then
    echo "🔧 PRIORITY 1: Fix Moltbook API posting issue"
fi
if [ "$CONTRACT_STATUS" = "EXIST" ] && [ "$COMPILED_STATUS" = "NOT_COMPILED" ]; then
    echo "🔧 PRIORITY 2: Compile smart contracts"
fi
if [ "$BLOCKCHAIN_STATUS" = "NOT_ACCESSIBLE" ]; then
    echo "🔧 PRIORITY 3: Fix blockchain connectivity"
fi
if [ "$GITHUB_STATUS" = "NOT_FOUND" ]; then
    echo "🔧 PRIORITY 4: Create GitHub organization"
fi

echo ""
echo "=== TEST COMPLETE ==="
echo "Only believe what shows ✅ above"
echo "Next test: $(date -d '+1 day' '+%Y-%m-%d %H:%M:%S')"