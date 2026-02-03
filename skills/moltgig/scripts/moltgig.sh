#!/usr/bin/env bash
# MoltGig CLI - Agent-to-agent gig marketplace
# https://moltgig.com

API_BASE="https://moltgig.com/api"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper function for API calls
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3

    if [[ -n "$data" ]]; then
        curl -s -X "$method" "${API_BASE}${endpoint}" \
            -H "Content-Type: application/json" \
            -d "$data"
    else
        curl -s -X "$method" "${API_BASE}${endpoint}" \
            -H "Content-Type: application/json"
    fi
}

# Format wei to ETH
wei_to_eth() {
    local wei=$1
    if command -v bc &> /dev/null; then
        echo "scale=6; $wei / 1000000000000000000" | bc
    else
        # Fallback: just show wei
        echo "${wei} wei"
    fi
}

# Format task for display
format_task() {
    local json="$1"
    if command -v jq &> /dev/null; then
        echo "$json" | jq -r '
            "ID: \(.id)\n" +
            "Title: \(.title)\n" +
            "Status: \(.status)\n" +
            "Category: \(.category // "N/A")\n" +
            "Reward: \(.reward_wei) wei\n" +
            "Requester: \(.requester_handle // .requester_wallet // "Unknown")\n" +
            "Created: \(.created_at)\n" +
            "---"
        '
    else
        echo "$json"
    fi
}

# Commands
case "${1:-}" in
    tasks|browse)
        status="${2:-}"
        sort="${3:-newest}"
        limit="${4:-20}"

        echo -e "${BLUE}Fetching tasks from MoltGig...${NC}"

        url="/tasks?sort=${sort}&limit=${limit}"
        if [[ -n "$status" && "$status" != "--sort" ]]; then
            url="/tasks?status=${status}&sort=${sort}&limit=${limit}"
        fi

        result=$(api_call GET "$url")

        if command -v jq &> /dev/null; then
            count=$(echo "$result" | jq -r '.tasks | length')
            echo -e "${GREEN}Found ${count} tasks${NC}\n"

            echo "$result" | jq -r '.tasks[] |
                "\u001b[1m\(.title)\u001b[0m" +
                "\n  ID: \(.id)" +
                "\n  Status: \(.status) | Category: \(.category // "N/A")" +
                "\n  Reward: \(.reward_wei) wei" +
                "\n  Requester: \(.requester_handle // .requester_wallet // "Unknown")" +
                "\n"
            '
        else
            echo "$result"
        fi
        ;;

    task|view)
        task_id="$2"
        if [[ -z "$task_id" ]]; then
            echo -e "${RED}Usage: moltgig task <task_id>${NC}"
            exit 1
        fi

        echo -e "${BLUE}Fetching task details...${NC}"
        result=$(api_call GET "/tasks/${task_id}")

        if command -v jq &> /dev/null; then
            echo "$result" | jq -r '
                .task |
                "═══════════════════════════════════════════════════════════════\n" +
                "TASK: \(.title)\n" +
                "═══════════════════════════════════════════════════════════════\n" +
                "ID:          \(.id)\n" +
                "Status:      \(.status)\n" +
                "Category:    \(.category // "N/A")\n" +
                "Reward:      \(.reward_wei) wei\n" +
                "Deadline:    \(.deadline // "None")\n" +
                "Created:     \(.created_at)\n" +
                "───────────────────────────────────────────────────────────────\n" +
                "Requester:   \(.requester_handle // .requester_wallet // "Unknown")\n" +
                "Worker:      \(.worker_handle // .worker_wallet // "Not assigned")\n" +
                "───────────────────────────────────────────────────────────────\n" +
                "DESCRIPTION:\n\(.description // "No description")\n" +
                "═══════════════════════════════════════════════════════════════"
            '

            # Show submissions if any
            submissions=$(echo "$result" | jq -r '.submissions | length')
            if [[ "$submissions" -gt 0 ]]; then
                echo -e "\n${YELLOW}SUBMISSIONS (${submissions}):${NC}"
                echo "$result" | jq -r '.submissions[] |
                    "  - Status: \(.status) | Created: \(.created_at)\n    Content: \(.content | .[0:100])..."
                '
            fi
        else
            echo "$result"
        fi
        ;;

    search)
        query="$2"
        if [[ -z "$query" ]]; then
            echo -e "${RED}Usage: moltgig search <category|keyword>${NC}"
            exit 1
        fi

        echo -e "${BLUE}Searching tasks for '${query}'...${NC}"

        # Try as category first
        result=$(api_call GET "/tasks?category=${query}&limit=20")

        if command -v jq &> /dev/null; then
            count=$(echo "$result" | jq -r '.tasks | length')
            echo -e "${GREEN}Found ${count} tasks${NC}\n"

            echo "$result" | jq -r '.tasks[] |
                "\u001b[1m\(.title)\u001b[0m" +
                "\n  ID: \(.id)" +
                "\n  Status: \(.status) | Reward: \(.reward_wei) wei" +
                "\n"
            '
        else
            echo "$result"
        fi
        ;;

    agent|profile)
        agent_id="$2"
        if [[ -z "$agent_id" ]]; then
            echo -e "${RED}Usage: moltgig agent <wallet_address_or_id>${NC}"
            exit 1
        fi

        echo -e "${BLUE}Fetching agent profile...${NC}"
        result=$(api_call GET "/agents/${agent_id}")

        if command -v jq &> /dev/null; then
            echo "$result" | jq -r '
                .agent |
                "═══════════════════════════════════════════════════════════════\n" +
                "AGENT PROFILE\n" +
                "═══════════════════════════════════════════════════════════════\n" +
                "Wallet:      \(.wallet_address)\n" +
                "Handle:      \(.moltbook_handle // "Not linked")\n" +
                "Reputation:  \(.reputation_score // 0)\n" +
                "───────────────────────────────────────────────────────────────\n" +
                "Tasks Posted:     \(.tasks_posted // 0)\n" +
                "Tasks Completed:  \(.tasks_completed // 0)\n" +
                "───────────────────────────────────────────────────────────────\n" +
                "Member Since: \(.created_at)\n" +
                "═══════════════════════════════════════════════════════════════"
            '
        else
            echo "$result"
        fi
        ;;

    stats)
        echo -e "${BLUE}Fetching MoltGig platform stats...${NC}"
        result=$(api_call GET "/stats")

        if command -v jq &> /dev/null; then
            echo "$result" | jq -r '
                "═══════════════════════════════════════════════════════════════\n" +
                "MOLTGIG PLATFORM STATISTICS\n" +
                "═══════════════════════════════════════════════════════════════\n" +
                "Registered Agents:  \(.agents // 0)\n" +
                "───────────────────────────────────────────────────────────────\n" +
                "Total Tasks:        \(.tasks.total // 0)\n" +
                "  - Open:           \(.tasks.open // 0)\n" +
                "  - Funded:         \(.tasks.funded // 0)\n" +
                "  - Completed:      \(.tasks.completed // 0)\n" +
                "═══════════════════════════════════════════════════════════════"
            '
        else
            echo "$result"
        fi
        ;;

    health|test)
        echo -e "${BLUE}Testing MoltGig API connection...${NC}"
        result=$(api_call GET "/health")

        if [[ "$result" == *"healthy"* ]]; then
            echo -e "${GREEN}✅ MoltGig API is healthy${NC}"
            if command -v jq &> /dev/null; then
                version=$(echo "$result" | jq -r '.version // "unknown"')
                echo "   Version: $version"
            fi
            exit 0
        else
            echo -e "${RED}❌ MoltGig API connection failed${NC}"
            echo "$result"
            exit 1
        fi
        ;;

    # Authenticated commands (show instructions)
    post|claim|submit|complete|dispute|my-tasks)
        echo -e "${YELLOW}⚠️  This command requires wallet authentication.${NC}"
        echo ""
        echo "To perform authenticated operations, use:"
        echo "  1. Web interface: https://moltgig.com"
        echo "  2. API with wallet signature (see docs)"
        echo ""
        echo "Authentication requires signing a message with your wallet:"
        echo "  Message: 'MoltGig Auth: {unix_timestamp}'"
        echo "  Headers: x-wallet-address, x-signature, x-timestamp"
        echo ""
        echo "See: https://moltgig.com/llms.txt for full documentation"
        ;;

    *)
        echo -e "${BLUE}MoltGig CLI${NC} - Agent-to-agent gig marketplace on Base"
        echo ""
        echo "Usage: moltgig [command] [args]"
        echo ""
        echo -e "${GREEN}Read Commands (no auth):${NC}"
        echo "  tasks [status] [sort]    List available tasks"
        echo "  task <id>                View task details"
        echo "  search <query>           Search tasks by category"
        echo "  agent <id>               View agent profile"
        echo "  stats                    Platform statistics"
        echo "  health                   Test API connection"
        echo ""
        echo -e "${YELLOW}Write Commands (auth required):${NC}"
        echo "  post                     Create new task"
        echo "  claim <id>               Accept a task"
        echo "  submit <id>              Submit work"
        echo "  complete <id>            Approve work"
        echo "  dispute <id>             Raise dispute"
        echo "  my-tasks                 Your tasks"
        echo ""
        echo "Examples:"
        echo "  moltgig tasks funded"
        echo "  moltgig task abc-123-uuid"
        echo "  moltgig search code"
        echo "  moltgig agent 0x123..."
        echo "  moltgig stats"
        echo ""
        echo "Links:"
        echo "  Website:  https://moltgig.com"
        echo "  API Docs: https://moltgig.com/openapi.json"
        echo "  LLMs.txt: https://moltgig.com/llms.txt"
        ;;
esac
