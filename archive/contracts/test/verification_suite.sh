#!/bin/bash
# MoltGig Automated Testing Suite
# Every claim must pass these tests before reporting

echo "=== MOLTGIG AUTOMATED TESTING ==="
echo "Timestamp: $(date)"
echo ""

# Test 1: Moltbook API Functionality
echo "🔍 TEST 1: Moltbook API Posting"
if [ -z "$MOLTBOOK_API_KEY" ]; then
    echo "⚠️ Moltbook posting: SKIPPED - set MOLTBOOK_API_KEY to test archived script"
    MOLTBOOK_STATUS="SKIPPED"
else
    MOLTBOOK_TEST=$(curl -s -X POST "https://www.moltbook.com/api/v1/posts" \
      -H "Authorization: Bearer $MOLTBOOK_API_KEY" \
      -H "Content-Type: application/json" \
      -d '{"submolt": "general", "title": "AUTOMATED TEST", "content": "Testing automated verification"}')

    if echo "$MOLTBOOK_TEST" | grep -q '"success":true'; then
        echo "✅ Moltbook posting: WORKING"
        MOLTBOOK_STATUS="WORKING"
    else
        echo "❌ Moltbook posting: FAILED - $MOLTBOOK_TEST"
        MOLTBOOK_STATUS="FAILED"
    fi
fi

# Test 2: Smart Contract Deployment
echo "🔍 TEST 2: Smart Contract Status"
# Check if contracts are actually deployed
if [ -f "contracts/MoltGigEscrow.sol" ]; then
    echo "✅ Smart contract files: EXIST"
    CONTRACT_FILES="EXIST"
else
    echo "❌ Smart contract files: MISSING"
    CONTRACT_FILES="MISSING"
fi

# Test 3: GitHub Repository
echo "🔍 TEST 3: GitHub Repository"
GITHUB_TEST=$(curl -s "https://api.github.com/users/moltgig" | head -10)
if echo "$GITHUB_TEST" | grep -q '"login":"moltgig"'; then
    echo "✅ GitHub account: EXISTS"
    GITHUB_STATUS="EXISTS"
else
    echo "❌ GitHub account: NOT FOUND"
    GITHUB_STATUS="NOT_FOUND"
fi

# Test 4: Base Blockchain Connection
echo "🔍 TEST 4: Base Blockchain"
BASE_TEST=$(curl -s "https://api.basescan.org/api?module=block&action=getblockcount" 2>/dev/null || echo "CONNECTION_FAILED")
if echo "$BASE_TEST" | grep -q '"status":"1"'; then
    echo "✅ Base blockchain: ACCESSIBLE"
    BASE_STATUS="ACCESSIBLE"
else
    echo "❌ Base blockchain: NOT ACCESSIBLE"
    BASE_STATUS="NOT_ACCESSIBLE"
fi

# Test 5: Development Environment
echo "🔍 TEST 5: Development Environment"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js: INSTALLED ($NODE_VERSION)"
    NODE_STATUS="INSTALLED"
else
    echo "❌ Node.js: NOT INSTALLED"
    NODE_STATUS="NOT_INSTALLED"
fi

# Test 6: Smart Contract Compilation
echo "🔍 TEST 6: Contract Compilation"
if [ -f "contracts/MoltGigEscrow.sol" ]; then
    # Try to compile (basic syntax check)
    if solc --version &> /dev/null; then
        COMPILE_TEST=$(solc contracts/MoltGigEscrow.sol --combined-json abi,bin 2>&1 | head -5)
        if echo "$COMPILE_TEST" | grep -q "error"; then
            echo "❌ Contract compilation: HAS ERRORS"
            COMPILE_STATUS="HAS_ERRORS"
        else
            echo "✅ Contract compilation: SUCCESS"
            COMPILE_STATUS="SUCCESS"
        fi
    else
        echo "⚠️  Contract compilation: SOLC NOT AVAILABLE"
        COMPILE_STATUS="SOLC_UNAVAILABLE"
    fi
else
    echo "❌ Contract compilation: FILES MISSING"
    COMPILE_STATUS="FILES_MISSING"
fi

# Summary Report
echo ""
echo "=== TEST RESULTS SUMMARY ==="
echo "Moltbook API: $MOLTBOOK_STATUS"
echo "Contract Files: $CONTRACT_FILES"
echo "GitHub Account: $GITHUB_STATUS"
echo "Base Blockchain: $BASE_STATUS"
echo "Node.js: $NODE_STATUS"
echo "Contract Compilation: $COMPILE_STATUS"
echo ""
echo "=== VERIFICATION COMMANDS ==="
echo "To verify Moltbook: curl -H 'Authorization: Bearer [token]' https://www.moltbook.com/api/v1/agents/me"
echo "To verify contracts: ls -la contracts/"
echo "To verify GitHub: curl https://api.github.com/users/moltgig"
echo "To verify Base: curl https://api.basescan.org/api?module=block&action=getblockcount"
echo ""
echo "=== REAL STATUS ==="
echo "Only report claims that show ✅ above"
echo "Timestamp: $(date)"
