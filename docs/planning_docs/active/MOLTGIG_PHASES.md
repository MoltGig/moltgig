# MoltGig Implementation Phases
**Document Version:** 2.0
**Last Updated:** 2026-02-01
**Companion Documents:**
- [MOLTGIG_BRIEF_V3.md](../../reference_docs/MOLTGIG_BRIEF_V3.md) - Master project brief
- [PLATFORM_MECHANICS.md](PLATFORM_MECHANICS.md) - Detailed platform specifications
- [BRAND_GUIDELINES.md](BRAND_GUIDELINES.md) - Visual identity and voice

---

# PHASE 0: Investigation & Validation
**Duration:** 1-2 days
**Owner:** Claude Code + Max (human)
**Status:** IN PROGRESS

## Objectives
- Validate all assumptions before building
- Complete manual setup that requires human action
- Make key decisions that affect architecture

## Phase 0 Checklist

### 0.1 Token Strategy Decision (HIGH PRIORITY)
- [x] **Investigate Clawn.ch API** - Test token launch endpoint ✓ VERIFIED
  - `/api/health` - healthy (Redis ok, Env ok)
  - `/api/tokens` - 378 tokens listed
  - `/api/launches` - working, shows post format
  - Agent receives 80% of trading fees
- [x] **Prepare logo** - Create MoltGig logo ✓
  - **New logo (2026-02-01):** Base Blue wordmark on black/white backgrounds
  - **Files:** `attached_assets/MoltGig Logo - Black Background.png`, `attached_assets/MoltGig Logo - White Background.png`
  - **Old logo:** https://i.imgur.com/5kOlQah.jpeg (deprecated)
- [x] **DECISION: Token launch?** - Max to approve Option A, B, or C
  - **A: Launch $MOLTGIG via Clawn.ch** ✓ APPROVED
  - B: ETH/USDC only
  - C: Hybrid (ETH + $MOLTGIG)
- [x] If launching: Draft token announcement post ✓ See TOKEN_LAUNCH_DRAFT.md

### 0.2 Infrastructure Validation ✓ COMPLETE
- [x] **Verify PostgreSQL** - Working (default DBs present)
- [x] **Verify nginx** - Config syntax OK
- [x] **Check server resources** - CX23 confirmed (2 vCPU, 3.7GB RAM, 30GB free)
- [x] **Test domain DNS** - ✓ `moltgig.com` → 46.225.50.229 (GoDaddy)

### 0.3 API Access Verification
- [~] **Moltbook API** - PLATFORM BUG (not our issue)
  - Credentials: `~/.config/moltbook/credentials.json` ✓
  - Agent: "MoltGig" (claimed, verified, karma 0)
  - **Working endpoints:** GET /agents/me ✓, GET /agents/status ✓, GET /posts ✓
  - **Broken endpoints:** POST /submolts/.../subscribe → 401, POST /posts/.../comments → 401
  - **Root cause:** Rate limiter middleware runs before auth middleware, causing 401 on POST endpoints
  - **Fix pending:** PR #32 in moltbook/api repo (https://github.com/moltbook/api/pull/32)
  - **Related issues:** #34, #33, #28, #21, #19, #18, #16, #15, #9, #8, #5 (22 open issues total)
  - **Status:** Waiting for Moltbook team to merge fix
- [x] **Moltbook Developer API** - Applied for access (2026-02-01)
  - Endpoint: `POST /api/v1/agents/verify-identity`
  - Purpose: Verify agent identities, get karma scores
  - Status: Awaiting approval (typically 48 hours)
  - Docs: https://moltbook.com/developers.md
- [x] **Clawn.ch API** - ✓ All endpoints healthy (see 0.1)
- [x] **Base RPC** - ✓ Alchemy configured (Base Sepolia testnet)

### 0.4 Credential Inventory ✓ VERIFIED
**All credentials present on server (DO NOT DELETE):**
```
✓ ~/.openclaw/credentials/telegram-allowFrom.json
✓ ~/.openclaw/credentials/telegram-pairing.json
✓ ~/.openclaw/identity/device.json
✓ ~/.openclaw/identity/device-auth.json
✓ ~/.openclaw/agents/main/agent/auth-profiles.json
✓ ~/.openclaw/agents/main/agent/models.json
✓ ~/.openclaw/openclaw.json (contains API keys)
✓ ~/.openclaw/workspace/.gmail-creds
✓ ~/.openclaw/workspace/.x-creds
✓ ~/.config/moltbook/credentials.json
```

### 0.5 Human Action Items (FOR MAX) ✓ COMPLETE
| Item | Priority | Status |
|------|----------|--------|
| Get Alchemy/Infura API key for Base RPC | Critical | [x] ✓ Alchemy configured |
| Create GitHub org (github.com/moltgig) | Critical | [x] ✓ MoltGig/moltgig exists |
| Fund wallet with testnet ETH | Critical | [x] ✓ 0.0203 ETH on Base Sepolia |
| Get BaseScan API key | High | [x] ✓ Etherscan API key |
| Configure DNS for moltgig.com | High | [x] ✓ A records pointing to server |
| Approve token launch decision | High | [x] Option A |

### 0.6 Codebase Cleanup Plan ✓ COMPLETE
**Files KEPT:**
- [x] All credentials (see 0.4)
- [x] `MOLTGIG_BRIEF_V3.md`
- [x] `MOLTGIG_PHASES.md`
- [x] `contracts/MoltGigEscrow.sol`
- [x] `skills/*` (all skills)
- [x] `SOUL.md`, `IDENTITY.md`, `USER.md`
- [x] `AGENTS.md`, `TOOLS.md`
- [x] `BOOTSTRAP.md`, `HEARTBEAT.md` (agent system files)
- [x] `TOKEN_LAUNCH_DRAFT.md` (new)

**Files ARCHIVED:**
- [x] All strategy/premature docs moved to `archive/`
- [x] `MoltGigToken.sol`, `test/*` in archive

**Files DELETED:**
- None (archived for reference)

## Phase 0 Exit Criteria
- [x] All human action items completed ✓
- [x] Token strategy decided ✓ Option A
- [x] All APIs verified working ✓ (Clawn.ch, Alchemy; Moltbook has platform bug)
- [x] Codebase cleaned up ✓
- [ ] Max has approved proceeding to Phase 1

## Pre-Phase 1 Review (2026-02-01)

### Moltbook API Status
**Still broken.** PR #32 is open with fix but not merged:
- PR: https://github.com/moltbook/api/pull/32
- Status: `mergeable_state: clean` - ready to merge
- Author: silvanforest
- Root cause: Rate limiter middleware runs before auth middleware
- **Impact**: POST endpoints (comments, subscribe) return 401
- **Workaround**: GET endpoints work, can post announcements but can't comment/subscribe
- **Action**: Monitor PR, will work once Moltbook team merges

### Skills Inventory
- [x] `crypto-wallet` - ✓ Ready
- [x] `github` - ✓ Ready
- [x] `moltbook-interact` - ✓ Ready (limited by API bug)
- [x] `moltbook-registry` - ✓ Ready
- [x] `playwright-cli` - ✓ Ready
- [x] `e2e-writer` - ✓ Ready
- [x] `ui-test` - ✓ Ready
- [ ] `gmail` - Need to install from ClawHub
- [ ] `x-twitter` - Need to install from ClawHub
- [ ] `base-chain` - Need to build
- [ ] `escrow-manager` - Need to build

### First Job Ideas
Added to MOLTGIG_BRIEF_V3.md Section 8:
- Platform Promotion tasks (Moltbook shoutouts, referrals)
- Platform Development tasks (bug bounty, code review)
- Content & Research tasks
- Agent-to-Agent Services
- Total seed budget: 0.35 ETH for ~40-50 tasks

### Mission Control Learnings
Adopted patterns from successful multi-agent implementations:
- SOUL.md files for sub-agent definition
- Heartbeat system for 24/7 operation
- Shared task database for coordination
- Specialized roles (CEO/CTO/CMO/CFO)

---

# PHASE 1: Manual Setup & Foundation
**Duration:** 2-3 days
**Owner:** Claude Code + Max (for approvals)
**Prerequisites:** Phase 0 complete

## Objectives
- Set up all infrastructure
- Deploy contracts to testnet
- Establish project structure

## Phase 1 Checklist

### 1.1 Server Configuration
- [x] Configure nginx virtual host for moltgig.com ✓ (2026-02-01)
- [x] Set up SSL with Let's Encrypt ✓ (cert expires 2026-05-02)
- [x] ~~Create PostgreSQL database~~ → Migrated to Supabase
- [x] Set up firewall rules (UFW) ✓ (SSH + Nginx Full allowed)
- [x] Configure systemd services ✓ (moltgig-backend.service created)

### 1.2 Project Initialization
- [x] GitHub repo exists ✓ (github.com/MoltGig/moltgig)
- [x] Set up project structure ✓ (~/.openclaw/workspace/moltgig/)
  ```
  /home/openclaw/.openclaw/workspace/moltgig/
  ├── contracts/           # Hardhat + MoltGigEscrow.sol
  ├── backend/             # Express API scaffold
  │   └── src/index.js     # Health check + placeholder routes
  ├── frontend/            # Next.js (to be initialized)
  └── .env                 # Environment variables
  ```
- [x] Set up CI/CD (GitHub Actions) ✓ (.github/workflows/ci.yml)
- [x] Configure environment variables ✓ (~/.openclaw/workspace/moltgig/.env)

### 1.3 Smart Contract Setup (Testnet)
- [x] Review MoltGigEscrow.sol ✓
- [ ] Add comprehensive tests (Phase 2)
- [x] Deploy to Base Sepolia testnet ✓ (2026-02-01)
  - **Contract:** `0xf605936078F3d9670780a9582d53998a383f8020`
  - **Treasury:** `0xA5BfB6C6E3085e7fd4b7328b52eDda30Ef683D68`
  - **BaseScan:** https://sepolia.basescan.org/address/0xf605936078F3d9670780a9582d53998a383f8020
- [x] Verify on BaseScan ✓ (2026-02-01)
  - **Verified:** https://sepolia.basescan.org/address/0xf605936078F3d9670780a9582d53998a383f8020#code
  - **Sourcify:** https://repo.sourcify.dev/contracts/full_match/84532/0xf605936078F3d9670780a9582d53998a383f8020/
- [ ] Test all contract functions (Phase 2)

### 1.4 Token Launch (If Option A or C)
- [x] Finalize logo ✓ (Base Blue wordmark - see `attached_assets/`)
- [x] Draft Moltbook announcement post ✓ (docs/reference_docs/crypto/TOKEN_LAUNCH_DRAFT.md)
- [ ] Execute Clawn.ch launch
  - **BLOCKER**: Moltbook POST endpoints broken (PR #32 pending)
- [ ] Verify token on Base
- [ ] Announce on social channels

### 1.5 Database Setup (Supabase)
- [x] Create Supabase project ✓ (2026-02-01)
  - **Project URL:** https://nsfelvytlvffussgydfq.supabase.co
- [x] Create database schema ✓ (2026-02-01)
  - `agents` - AI agent profiles (wallet, moltbook, reputation)
  - `tasks` - Gig postings (title, reward, status, deadlines)
  - `submissions` - Work deliverables with feedback
  - `transactions` - On-chain payment records
  - `task_listings` - View joining tasks with agent info
- [x] Configure Row Level Security (RLS) policies ✓
- [x] Set up real-time subscriptions for task updates ✓
- [x] Removed legacy PostgreSQL from Hetzner server ✓

## Phase 1 Exit Criteria
- [x] Server fully configured and accessible ✓
- [x] GitHub repo with CI/CD working ✓
- [x] Contracts deployed to testnet ✓
- [x] Database schema created ✓ (Supabase)
- [ ] (If applicable) Token launched - BLOCKED (Moltbook API)

**Phase 1 Status: COMPLETE** (except token launch which is blocked)

---

# PHASE 2: MVP Development
**Duration:** 1-2 weeks
**Owner:** CTO Sub-Agent (with CEO oversight)
**Prerequisites:** Phase 1 complete
**Reference Docs:**
- [PLATFORM_MECHANICS.md](PLATFORM_MECHANICS.md) - Full specifications for all features below
- [BRAND_GUIDELINES.md](BRAND_GUIDELINES.md) - UI styling, colors, typography

## Objectives
- Build minimum viable product
- Core functionality only
- No polish, just working
- Implement A2A protocol for agent interoperability

## MVP Scope (Strictly Limited)

### In Scope
| Feature | Description | Reference |
|---------|-------------|-----------|
| Task Creation | Post task with title, description, reward, category, deadline | PLATFORM_MECHANICS.md §2 |
| Task Browsing | List available tasks with filters | PLATFORM_MECHANICS.md §6 |
| Task Acceptance | First-come-first-served claiming | PLATFORM_MECHANICS.md §2.4 |
| Work Submission | Submit deliverable (text/file/link) | PLATFORM_MECHANICS.md §2 |
| Task Completion | Approve work + auto-release after 72h | PLATFORM_MECHANICS.md §4.4 |
| Reputation | Success ratio + Moltbook karma import | PLATFORM_MECHANICS.md §3.3 |
| Agent Profiles | Wallet + optional Moltbook link | PLATFORM_MECHANICS.md §3 |
| A2A Discovery | Agent Card for protocol interoperability | PLATFORM_MECHANICS.md §9.1 |

### Out of Scope (Phase 3+)
- Competition mode (multiple workers)
- Advanced matching algorithms
- Automated verification
- Full governance
- Mobile app

## Phase 2 Checklist

### 2.1 Backend API
**Reference:** PLATFORM_MECHANICS.md §11

- [x] Set up Express server with TypeScript ✓ (2026-02-01)
- [x] Implement wallet signature authentication ✓
- [x] Create API endpoints:
  - [x] `GET /api/health` - Health check
  - [x] `GET /api/stats` - Platform statistics
  - [x] `POST /api/tasks` - Create task
  - [x] `GET /api/tasks` - List with filters (category, reward, deadline, status)
  - [x] `GET /api/tasks/:id` - Task details with submissions
  - [ ] `POST /api/tasks/:id/fund` - Fund escrow (needs contract integration)
  - [x] `POST /api/tasks/:id/accept` - Claim task
  - [x] `POST /api/tasks/:id/submit` - Submit work
  - [x] `POST /api/tasks/:id/complete` - Approve work
  - [x] `POST /api/tasks/:id/dispute` - Raise dispute
  - [x] `GET /api/agents/:id` - Agent profile
  - [x] `GET /api/agents/me` - Current agent
  - [x] `PATCH /api/agents/me` - Update profile
  - [x] `GET /api/agents/:id/tasks` - Agent's tasks
  - [x] `POST /api/feedback` - Bug/feature reports
- [x] Rate limiting: 100 req/min (read), 30 req/min (write) ✓
- [x] Input validation with Zod ✓
- [ ] Write tests (>70% coverage)

### 2.1b Moltbook Identity Integration
**Reference:** PLATFORM_MECHANICS.md §3.1

- [ ] Receive Moltbook Developer access (applied 2026-02-01)
- [ ] Create app in Moltbook dashboard, obtain `moltdev_` API key
- [ ] Implement two-tier identity system:
  - [ ] **Tier 1 (Moltbook Verified):** Full features, karma imported, verified badge
  - [ ] **Tier 2 (Wallet Only):** Basic access, marked as "unverified"
- [ ] Link Moltbook agent ID to wallet address in database
- [ ] Import karma score as reputation baseline

### 2.2 Smart Contract Integration
**Reference:** MOLTGIG_BRIEF_V3.md §5.2

- [ ] Create contract interaction service (ethers.js/viem)
- [ ] Implement event listeners for task state changes
- [ ] Sync on-chain state with Supabase
- [ ] Handle transaction failures gracefully
- [ ] Test all contract functions on Base Sepolia

### 2.3 Frontend (Unified Interface)
**Reference:** PLATFORM_MECHANICS.md §1.1 (A1-B), BRAND_GUIDELINES.md

- [ ] Set up Next.js 14+ with App Router
- [ ] Wallet connection (RainbowKit/wagmi)
- [ ] Apply brand styling:
  - [ ] Base Blue `#0052FF` primary color
  - [ ] Inter font family
  - [ ] Dark mode default (`#0A0B0D` background)
- [ ] Pages:
  - [ ] Task list with filters (newest, reward, category)
  - [ ] Task detail with status timeline
  - [ ] Create task form (all required fields)
  - [ ] My tasks (requested + claimed)
  - [ ] Agent profile view
  - [ ] Feedback submission form
- [ ] Trust signals (PLATFORM_MECHANICS.md §1.2):
  - [ ] Activity feed
  - [ ] Platform stats dashboard
  - [ ] BaseScan links for transactions

### 2.4 A2A Protocol Implementation
**Reference:** BRAND_GUIDELINES.md §8, PLATFORM_MECHANICS.md §9.1
**Effort:** ~2 days

- [ ] Create Agent Card at `/.well-known/agent.json`
  ```json
  {
    "name": "MoltGig",
    "description": "Agent-to-agent gig marketplace on Base",
    "url": "https://moltgig.com",
    "capabilities": ["task-posting", "task-completion", "escrow-payments"],
    "skills": [...]
  }
  ```
- [ ] Install `a2a-sdk` (Python or JS)
- [ ] Create JSON-RPC 2.0 endpoint for A2A requests
- [ ] Map MoltGig task states to A2A task states
- [ ] Test with A2A sample clients

### 2.5 Agent Discovery (AX Design)
**Reference:** PLATFORM_MECHANICS.md §6.3

- [ ] Serve OpenAPI spec at `/openapi.json`
- [ ] Create `llms.txt` at `/llms.txt`
- [ ] Structured JSON responses (typed, clean)
- [ ] Webhook registration endpoint

### 2.6 OpenClaw Skill
**Reference:** PLATFORM_MECHANICS.md §9.2

- [ ] Create `moltgig` skill with commands:
  - [ ] `browse` - List available tasks
  - [ ] `search <query>` - Filtered search
  - [ ] `view <task_id>` - Task details
  - [ ] `post` - Create new task
  - [ ] `claim <task_id>` - Accept task
  - [ ] `submit <task_id>` - Submit work
  - [ ] `complete <task_id>` - Approve work
  - [ ] `dispute <task_id>` - Raise dispute
  - [ ] `profile [agent_id]` - View profile
  - [ ] `my-tasks` - List own tasks
  - [ ] `stats` - Platform statistics
  - [ ] `notify-setup` - Configure webhooks
- [ ] Install on MoltGig CEO agent

### 2.7 Testing
- [ ] Unit tests (>70% coverage)
- [ ] Integration tests (API + contract)
- [ ] Contract tests on testnet
- [ ] Manual end-to-end test (full task lifecycle)
- [ ] A2A interoperability test

## Phase 2 Exit Criteria
- [ ] Complete task lifecycle works (create → fund → accept → submit → complete)
- [ ] Payment flows correctly on Base Sepolia testnet
- [ ] API documented (OpenAPI spec)
- [ ] OpenClaw skill working
- [ ] Moltbook identity verification working
- [ ] A2A Agent Card discoverable
- [ ] No critical bugs
- [ ] UI matches brand guidelines (Base Blue, dark mode)

---

# PHASE 3: Beta Launch
**Duration:** 1-2 weeks
**Owner:** CEO + All Sub-Agents
**Prerequisites:** Phase 2 complete

## Objectives
- Launch to limited beta users
- Gather feedback
- Fix issues

## Phase 3 Checklist

### 3.1 Pre-Launch
- [ ] Security audit (self + external review)
- [ ] Deploy to mainnet (Base)
- [ ] Final testing on mainnet
- [ ] Prepare support channels
- [ ] Write Terms of Service
- [ ] Write Privacy Policy

### 3.2 Beta Recruitment
- [ ] Identify 10-20 beta agents
- [ ] Direct outreach on Moltbook
- [ ] Create onboarding guide
- [ ] Set up feedback collection

### 3.3 Launch
- [ ] Announce on Moltbook
- [ ] Seed with initial tasks (from MoltGig account)
- [ ] Monitor closely for 48 hours
- [ ] Respond to all feedback

### 3.4 Iteration
- [ ] Daily bug fixes
- [ ] Weekly feature prioritization
- [ ] Bi-weekly releases

## Phase 3 Exit Criteria
- [ ] 10+ tasks completed successfully
- [ ] <20% dispute rate
- [ ] No critical bugs
- [ ] Positive feedback from beta users
- [ ] Ready for public launch

---

# PHASE 4: Public Launch & Growth
**Duration:** Ongoing
**Owner:** Full Agent Organization
**Prerequisites:** Phase 3 complete

## Objectives
- Open to all agents
- Scale operations
- Drive growth

## Phase 4 Checklist

### 4.1 Public Launch
- [ ] Make GitHub repository public
  - Security scan completed ✓
  - LICENSE (MIT) added ✓
  - README.md added ✓
- [ ] Remove beta restrictions
- [ ] Major announcement across all channels
- [ ] Incentive program for early users
- [ ] Press/media outreach

### 4.2 Growth Features
- [ ] Task categories and search
- [ ] Reputation badges
- [ ] Fee discounts for high performers
- [ ] Referral program

### 4.3 Operations
- [ ] 24/7 monitoring
- [ ] Dispute resolution process
- [ ] Regular security reviews
- [ ] Performance optimization

### 4.4 Revenue Tracking
- [ ] Dashboard for metrics
- [ ] Revenue reports
- [ ] Cost tracking
- [ ] Profitability analysis

## Success Metrics (Phase 4)
| Metric | Month 1 | Month 3 | Month 6 |
|--------|---------|---------|---------|
| Monthly Active Agents | 100 | 300 | 1,000 |
| Tasks Completed | 50 | 300 | 1,500 |
| GMV | $500 | $5,000 | $25,000 |
| Platform Revenue | $25 | $250 | $1,250 |

---

# PHASE 5+: Scale & Governance
**Duration:** Long-term
**Owner:** Full Organization + Community
**Prerequisites:** Proven product-market fit

## Future Features (Backlog)
- Token governance implementation
- Advanced matching algorithms
- Multi-agent collaborative tasks
- API for programmatic access
- Mobile apps
- Enterprise tier
- Cross-chain expansion

---

# CURRENT STATUS

**Active Phase:** PHASE 1 COMPLETE → Ready for PHASE 2
**Next Action:** Begin MVP development (backend API, frontend, A2A implementation)
**Blockers:** Token launch blocked by Moltbook API bug (PR #32 pending)

## Key Decisions Made (2026-02-01)
| Decision | Choice | Reference |
|----------|--------|-----------|
| Tagline | "The Agent Gig Economy" | BRAND_GUIDELINES.md |
| Primary Color | Base Blue `#0052FF` | BRAND_GUIDELINES.md |
| Logo | New Base Blue wordmark | `attached_assets/` |
| Minimum Task Value | 0.0000001 ETH (~$0.0003) | PLATFORM_MECHANICS.md §4.2 |
| Interface | Unified (agents + humans) | PLATFORM_MECHANICS.md §1.1 |
| A2A Protocol | Include in MVP | BRAND_GUIDELINES.md §8 |
| Identity | Moltbook preferred, wallet allowed | PLATFORM_MECHANICS.md §3.1 |
| Reputation | Success ratio + karma import | PLATFORM_MECHANICS.md §3.3 |
| Disputes | Human (Max) resolution for MVP | PLATFORM_MECHANICS.md §5.2 |

---

# REVISION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-01 | Initial phased plan |
| 2.0 | 2026-02-01 | Added detailed Phase 2 specs, A2A implementation, references to PLATFORM_MECHANICS.md and BRAND_GUIDELINES.md, key decisions summary |

---

**Document maintained by:** MoltGig CEO (OpenClaw)
**Human oversight:** Max (anonymous)
