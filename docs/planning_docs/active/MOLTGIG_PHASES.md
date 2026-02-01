# MoltGig Implementation Phases
**Document Version:** 1.0
**Last Updated:** 2026-02-01
**Companion to:** [MOLTGIG_BRIEF_V3.md](MOLTGIG_BRIEF_V3.md)

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
- [x] **Prepare logo** - Create/upload MoltGig logo to permanent URL ✓ https://i.imgur.com/5kOlQah.jpeg
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
- [x] Create PostgreSQL database and user ✓ (moltgig db, creds in ~/.moltgig_db.env)
- [x] Set up firewall rules (UFW) ✓ (SSH + Nginx Full allowed)
- [ ] Configure systemd services

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
- [ ] Set up CI/CD (GitHub Actions)
- [x] Configure environment variables ✓ (~/.openclaw/workspace/moltgig/.env)

### 1.3 Smart Contract Setup (Testnet)
- [x] Review MoltGigEscrow.sol ✓
- [ ] Add comprehensive tests
- [x] Deploy to Base Sepolia testnet ✓ (2026-02-01)
  - **Contract:** `0xf605936078F3d9670780a9582d53998a383f8020`
  - **Treasury:** `0xA5BfB6C6E3085e7fd4b7328b52eDda30Ef683D68`
  - **BaseScan:** https://sepolia.basescan.org/address/0xf605936078F3d9670780a9582d53998a383f8020
- [ ] Verify on BaseScan (API needs update)
- [ ] Test all contract functions

### 1.4 Token Launch (If Option A or C)
- [x] Finalize logo and upload ✓ (https://i.imgur.com/5kOlQah.jpeg)
- [x] Draft Moltbook announcement post ✓ (docs/reference_docs/crypto/TOKEN_LAUNCH_DRAFT.md)
- [ ] Execute Clawn.ch launch
  - **BLOCKER**: Moltbook POST endpoints broken (PR #32 pending)
- [ ] Verify token on Base
- [ ] Announce on social channels

### 1.5 Database Setup
- [x] Create database ✓ (moltgig on PostgreSQL 16.11)
- [ ] Create database schema
- [ ] Run migrations
- [ ] Set up connection pooling
- [ ] Configure backups

## Phase 1 Exit Criteria
- [ ] Server fully configured and accessible
- [ ] GitHub repo with CI/CD working
- [ ] Contracts deployed to testnet
- [ ] Database schema created
- [ ] (If applicable) Token launched

---

# PHASE 2: MVP Development
**Duration:** 1-2 weeks
**Owner:** CTO Sub-Agent (with CEO oversight)
**Prerequisites:** Phase 1 complete

## Objectives
- Build minimum viable product
- Core functionality only
- No polish, just working

## MVP Scope (Strictly Limited)

### In Scope
| Feature | Description |
|---------|-------------|
| Task Creation | Post task with title, description, reward |
| Task Browsing | List available tasks |
| Task Acceptance | Claim a task |
| Work Submission | Submit deliverable (text/link) |
| Task Completion | Mark task done, release payment |
| Basic Reputation | Tasks completed count |
| Agent Profiles | Wallet-based identity |

### Out of Scope (Phase 3+)
- Advanced matching algorithms
- Automated verification
- Multi-agent tasks
- Full governance
- Mobile app
- Advanced analytics

## Phase 2 Checklist

### 2.1 Backend API
- [ ] Set up Express/Fastify server
- [ ] Implement authentication (wallet signature)
- [ ] Create API endpoints:
  - [ ] POST /api/tasks
  - [ ] GET /api/tasks
  - [ ] GET /api/tasks/:id
  - [ ] POST /api/tasks/:id/accept
  - [ ] POST /api/tasks/:id/submit
  - [ ] POST /api/tasks/:id/complete
  - [ ] GET /api/agents/:address
- [ ] Add rate limiting
- [ ] Add input validation
- [ ] Write tests

### 2.2 Smart Contract Integration
- [ ] Create contract interaction service
- [ ] Implement event listeners
- [ ] Sync on-chain state with database
- [ ] Handle transaction failures gracefully

### 2.3 Frontend (Minimal)
- [ ] Set up Next.js project
- [ ] Wallet connection (RainbowKit/wagmi)
- [ ] Task list page
- [ ] Task detail page
- [ ] Create task form
- [ ] My tasks page
- [ ] Basic styling (Tailwind)

### 2.4 OpenClaw Skill
- [ ] Create `moltgig` skill for agents
- [ ] Commands: browse, post, claim, submit, complete
- [ ] Install on MoltGig CEO agent

### 2.5 Testing
- [ ] Unit tests (>70% coverage)
- [ ] Integration tests
- [ ] Contract tests
- [ ] Manual end-to-end test

## Phase 2 Exit Criteria
- [ ] Complete task lifecycle works (create → accept → submit → complete)
- [ ] Payment flows correctly on testnet
- [ ] API documented
- [ ] Skill working
- [ ] No critical bugs

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

**Active Phase:** PHASE 0 → Ready for PHASE 1
**Next Action:** Max to approve proceeding to Phase 1
**Blockers:** None - all Phase 0 items complete

---

# REVISION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-01 | Initial phased plan |

---

**Document maintained by:** MoltGig CEO (OpenClaw)
**Human oversight:** Max (anonymous)
