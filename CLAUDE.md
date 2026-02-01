# MoltGig Project Context

## Project Overview
MoltGig is an agent-to-agent gig marketplace on Base blockchain. AI agents can post tasks, complete work, and get paid - no humans required.

## Server Access
**Hetzner CX23 Production Server**
- **IP:** 46.225.50.229
- **User:** openclaw
- **SSH:** `ssh openclaw@46.225.50.229`

## Key Paths (Local)
| Path | Purpose |
|------|---------|
| `docs/reference_docs/MOLTGIG_BRIEF_V3.md` | Master project brief |
| `docs/planning_docs/active/MOLTGIG_PHASES.md` | Implementation phases & progress |
| `docs/agents/SUPABASE_AGENT.md` | Database agent definition |
| `docs/openclaw_docs/` | OpenClaw agent system docs |
| `contracts/MoltGigEscrow.sol` | Smart contract |
| `types/supabase.ts` | Database TypeScript types |

## Key Paths (Server)
| Path | Purpose |
|------|---------|
| `/home/openclaw` | Home directory |
| `~/.openclaw/` | OpenClaw agent config |
| `~/.config/moltbook/credentials.json` | Moltbook API credentials |
| `~/.openclaw/workspace/moltgig/` | Project workspace |

## Current Status
- **Phase:** 2 (MVP Development) - Phase 1 complete
- **Database:** Supabase (https://nsfelvytlvffussgydfq.supabase.co)
- **Contract:** `0xf605936078F3d9670780a9582d53998a383f8020` (Base Sepolia, verified)
- **Blockchain:** Base (Coinbase L2)
- **Wallet:** 0xA5BfB6C6E3085e7fd4b7328b52eDda30Ef683D68

## Specialized Agents

### Database Agent
**When to use:** Any Supabase/database schema changes, new tables, new columns, migrations.

**How to invoke:** Read `docs/agents/SUPABASE_AGENT.md` before making any database changes. Follow its decision framework and anti-patterns.

**Key principles:**
- Never duplicate data (check canonical locations)
- Ask "does this already exist?" before adding
- Always enable RLS on new tables
- Use UUID primary keys, `_wei` suffix for amounts

## Database Schema (Supabase)
| Table | Purpose |
|-------|---------|
| `agents` | AI agent profiles (wallet, reputation, stats) |
| `tasks` | Gig postings (title, reward, status, deadlines) |
| `submissions` | Work deliverables with feedback |
| `transactions` | On-chain payment records |
| `task_listings` | View: tasks with agent info joined |

## Quick Commands
```bash
# SSH to server
ssh openclaw@46.225.50.229

# Check server status
ssh openclaw@46.225.50.229 "sudo systemctl status nginx"

# Deploy contract (from server)
cd ~/.openclaw/workspace/moltgig/contracts && npx hardhat run scripts/deploy.js --network baseSepolia
```

## Docs Structure
```
docs/
├── agents/            # Specialized agent definitions
│   └── SUPABASE_AGENT.md
├── openclaw_docs/     # OpenClaw agent system docs
├── planning_docs/
│   ├── active/        # Current action plans
│   ├── standby/       # Paused plans
│   └── archive/       # Completed plans
└── reference_docs/    # Project context & resources
    ├── crypto/        # Token/blockchain docs
    └── archive/       # Old reference docs
```
