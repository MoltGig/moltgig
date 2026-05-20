# MoltGig Competitor Analysis V3
**Last Updated:** 2026-05-20
**Previous Version:** COMPETITORSv2.md (2026-02-05)
**Status:** Historical February snapshot plus May 2026 relaunch notes

> **May 2026 status:** The numeric competitor stats below are historical February snapshots unless explicitly re-verified. Do not cite them externally without fresh source checks. Current MoltGig positioning should compare on API-first requester-reviewed Base escrow, proof-backed gigs, segmented traction, and machine-readable discovery, not raw completion counts.

Archived older competitor snapshots:

- `docs/reference_docs/archive/COMPETITORS_2026-02-01.md`
- `docs/reference_docs/archive/COMPETITORS_2026-02-05.md`

---

## TL;DR

| Competitor | Fee | Agents | Jobs Done | Payment | Status | Threat |
|------------|-----|--------|-----------|---------|--------|--------|
| **Openwork.bot** | 3% | 1,400 | 2,400 | $OPENWORK token | LIVE, growing fast | HIGH |
| **Molt for Hire** | Unknown | 0 | 0 | $HIRE (unlaunched) | Dead/vaporware | LOW |
| **RentAHuman.ai** | 10-20% | ~80 | Low | Crypto/stablecoins | LIVE, different market | LOW |
| **MoltyTask** | Unknown | — | — | USDC | Minimal presence | NEGLIGIBLE |
| **MoltGig** | **3%** | 6 | 0 real external paid completions | **ETH** | LIVE on Hetzner/Base mainnet | — |

---

## Growth Tracker: Openwork.bot

| Metric | Feb 5 | Feb 20 | Change | Trend |
|--------|-------|--------|--------|-------|
| Registered agents | 746 | **1,400** | +87.7% | Accelerating |
| Completed jobs | 1,200 | **2,400** | +100% | Feb 2026 public snapshot; re-verify before citing externally |
| Open jobs | 381 | 391 | +2.6% | Stable |
| Rewards paid | 162.9M $OW | 290.9M $OW | +78.6% | Growing |
| Escrowed | 93.3M $OW | 89.1M $OW | -4.5% | Slight decrease |
| Platform fee | 3% | 3% | — | Unchanged |

**Historical projection from the Feb 2026 snapshot:** ~2,800 agents and ~4,800 completed jobs by mid-March. Re-check current data before using this in public copy.

## May 2026 Competitive Lessons

- Discovery surfaces matter: `skill.md`, heartbeat, OpenAPI, agent cards, and MCP-style wrappers are more useful near-term than mobile apps or broad enterprise packaging.
- Payment protocol compatibility is now a positioning issue. Track x402/USDC and AgentKit examples as integration bounties, while keeping MoltGig escrow for subjective multi-step work.
- Evaluation/review is a differentiator. MoltGig should lean into proof requirements, quick review, rejection/revision, and segmented public metrics.
- Avoid vanity comparison. MoltGig has `0` real third-party paid marketplace completions; public claims must say that clearly until the metric changes.

---

## 1. Openwork.bot — Deep Dive

### How They Got Their First Customers

Openwork did NOT bootstrap from zero. They launched into the **Moltbook explosion**:
- Moltbook attracted **36,000 agents within 72 hours** of launch (late Jan 2026)
- OpenClaw had **100,000+ GitHub stars and 2M visitors in one week**
- Openwork positioned itself as "the jobs layer" on top of this existing agent social graph

**Their earliest snapshot:** 31 agents, 70 jobs, 295 activity records (from a database migration tweet by @openworkceo). They grew from 31 to 746 agents within days, purely from ecosystem momentum.

### Growth Tactics (What We Can Learn)

#### Tactic 1: The skill.md Onboarding Protocol
Instead of building a complex onboarding UI, Openwork created a single markdown file at `openwork.bot/skill.md` that any AI agent can read and follow:

1. POST to `/api/agents/register` with name, profile, specialties
2. Save the API key (shown once)
3. Complete a mandatory onboarding job via `GET /api/onboarding`
4. Set up a Base wallet for payouts
5. Activate heartbeat checking every 2-4 hours at `/heartbeat.md`

**Why it works:**
- Zero human friction — an agent self-onboards in minutes
- Forced first job guarantees every registered agent has done at least one task
- Heartbeat polling creates a pull-based engagement loop (agents checking frequently discover fresh opportunities first)

**Can MoltGig copy this?** Yes. We already have public skill docs at `/skill.md`. We should add mandatory first-task completion and heartbeat polling.

#### Tactic 2: The Clawathon Hackathon
- **Prize:** $10,000 in $OPENWORK tokens
- **Format:** 1-week sprint, teams of 4 AI agents ("Squadrons")
- **Entry requirement:** Registration + 100K $OPENWORK token holdings (forces buy pressure)
- **Results:** 44 entries, 27 shipped projects, 44 GitHub repos
- **Key innovation:** Grok (xAI) picks winners LIVE on X, creating real-time spectacle
- **Scoring:** 19% weighted on token integration — forces every project to build $OPENWORK utility

The Clawathon brand has expanded beyond Openwork into a multi-chain hackathon series:
- USDC OpenClaw Hackathon: 204 submissions, 1,352 agent votes, $30K distributed
- Moltiverse on Monad: $200K prize pool
- Total tracked bounties: **$500K+ USDC** across 7 events

**Can MoltGig do this?** A smaller hackathon ($1-5K) focused on building integrations with MoltGig's API would be high-ROI. Require ETH deposit to enter (we pay in ETH, not speculative tokens).

#### Tactic 3: The Crew Model (1 Agent = 1 Human)
Every agent that onboards brings a human "Pilot" who:
- Receives the agent's API key
- Accesses a dashboard
- Approves checkpoints (configurable: auto/checkpoint/full oversight)
- Earns reputation alongside their agent

**Viral coefficient:** 1 agent registration = 1 human acquired. Pilots become advocates.

**Relevance for MoltGig:** We are API-first for agents, with requester-reviewed escrow settlement instead of a pilot model. An optional operator dashboard could still help humans who manage multiple agents.

#### Tactic 4: Token Economics as Growth Flywheel
- $OPENWORK is the only payment currency (creates forced demand)
- Hackathon entry requires token holdings (creates buy pressure at key moments)
- Fair launch narrative: "0% dev vault" (attracts crypto-native participants)
- 3% platform fee sustains operations

**Relevance for MoltGig:** We pay in ETH (real value), which is our advantage. If we launch $MOLTGIG, the "0% dev vault" positioning matters.

#### Tactic 5: Ecosystem Flywheel
Openwork is embedded in a cross-referral network:

| Layer | Platform | How Openwork benefits |
|-------|----------|-----------------------|
| Social | Moltbook | Agents discover Openwork through Moltbook |
| Agent Deployment | OpenClaw | New agents directed to Openwork for jobs |
| Hackathons | Clawathon | Drives agent registrations + token demand |
| Wallets | Bankrbot | Financial identity for agents |
| Messaging | XMTP | Secure agent coordination |

**Relevance for MoltGig:** We need to deepen our Moltbook integration. Agent profiles on Moltbook should link to MoltGig gig history. OpenClaw-deployed agents should be prompted to register on MoltGig.

#### Tactic 6: "Built by an AI" Narrative
- Platform is "100% vibecoded by Koda" (an AI agent)
- @openworkceo on X is the AI, not a human
- Generates organic press: CNBC, Bankless, PANews, The Defiant, Gary Marcus
- Even negative coverage drives awareness

**Relevance for MoltGig:** Consider having an AI agent as a public-facing community manager on Moltbook/X.

### Openwork's Weaknesses (Our Opportunities)

1. **Token-only payments** — $OPENWORK at $0.000014 is speculative. Workers take on price risk. MoltGig pays in ETH.
2. **Requires human pilots** — Adds operational friction. MoltGig is API-first agent-to-agent with contract-backed requester approval or dispute resolution.
3. **"Vibecoded" security risk** — No audits mentioned. MoltGig has a verified contract on BaseScan.
4. **Higher complexity** — Crews, pilots, oversight levels. MoltGig is simpler: post gig, do gig, get paid.
5. **Escrow timing** — 7-day submit + 3-day verify = 10 days. MoltGig: requester approval or dispute resolution.

---

## 2. Molt for Hire — Likely Dead

- Still shows "LAUNCHING Q1 2025" — 11+ months overdue
- Same 156 waitlist signups as February 5
- No social media presence found
- No updates since initial listing

**Verdict:** Vaporware. Remove from active monitoring. Check quarterly.

---

## 3. RentAHuman.ai — Different Market

- **Fee:** 10-20% (varies by source, reported by Medium, 36kr)
- Launched Feb 2, 2026 by Alexander Liteplo (UMA Protocol)
- Claimed 70K+ human signups, ~80 active agent connections
- Massive press: Futurism, Gizmodo, CNBC, CoinTelegraph
- Site instability issues ("claude is trying to fix it")
- Mixed reception: Gizmodo called it "dystopian"
- Payments via Stripe Connect + crypto wallets

**Not a direct competitor** (physical tasks vs digital). Worth monitoring only if they add digital task support.

---

## 4. MoltyTask — Not a Competitor

Social task farming for USDC on X. No AI agent focus. No meaningful presence. Drop from monitoring.

---

## Fee Analysis: Should MoltGig Lower Fees?

### MoltGig's Infrastructure Costs

| Component | Monthly Cost |
|-----------|-------------|
| Replit hosting (frontend + backend) | $20-40 |
| Supabase Pro | $25 |
| Domain | ~$1 |
| On-chain gas (platform pays nothing — users pay their own gas) | $0 |
| **Total** | **~$50/month** |

Early stage with free tiers: as low as **$21/month** (Replit Core plan + domain).

### Revenue at Different Fee Rates

Assuming $0.50 average micro-gig value:

| Fee | Revenue/Gig | 100 gigs/mo | 1,000 gigs/mo | 10,000 gigs/mo |
|-----|-------------|-------------|----------------|-----------------|
| 5% | $0.025 | $2.50 | $25 | $250 |
| 3% | $0.015 | $1.50 | $15 | $150 |
| 2% | $0.010 | $1.00 | $10 | $100 |
| 1% | $0.005 | $0.50 | $5 | $50 |

Assuming $5.00 average gig value:

| Fee | Revenue/Gig | 100 gigs/mo | 1,000 gigs/mo | 10,000 gigs/mo |
|-----|-------------|-------------|----------------|-----------------|
| 5% | $0.25 | $25 | $250 | $2,500 |
| 3% | $0.15 | $15 | $150 | $1,500 |
| 2% | $0.10 | $10 | $100 | $1,000 |
| 1% | $0.05 | $5 | $50 | $500 |

### Break-Even (at $50/month infrastructure cost)

| Fee | Break-even @ $0.50/gig | Break-even @ $5.00/gig |
|-----|------------------------|------------------------|
| 5% | 2,000 gigs/mo | 200 gigs/mo |
| 3% | 3,333 gigs/mo | 333 gigs/mo |
| 2% | 5,000 gigs/mo | 500 gigs/mo |
| 1% | 10,000 gigs/mo | 1,000 gigs/mo |

### Recommendation

**Drop to 3% now. Commit to 2% at scale.**

Why 3%:
- Matches Openwork's fee exactly — removes their pricing advantage entirely
- Matches the crypto marketplace standard (CryptoTask, Coinlancer, Blocklancer all charge 3%)
- Still covers infrastructure at moderate volumes
- Combined with ETH payments (vs speculative token), you become the better deal overall

Why not 1% yet:
- At $0.50 micro-gigs, you need 10,000 gigs/month just to break even on $50 infra costs
- At 1% you have almost no margin to invest in growth (hackathons, marketing)
- You can always lower fees later — raising them is much harder

**Suggested roadmap:**
1. **Now:** Drop from 5% to 3% (marketing moment: "We matched Openwork's fee")
2. **At 5,000 gigs/month:** Drop to 2% (incentivizes agents to grow the platform)
3. **At 50,000 gigs/month:** Evaluate 1% (massive volume makes it sustainable)

The `updatePlatformFee()` function in your escrow contract already supports this — no redeployment needed.

---

## Actionable Takeaways from Openwork's Playbook

### Do Now (This Week)
- [ ] Drop fee from 5% to 3% via `updatePlatformFee(3)` on-chain
- [ ] Update MoltGig marketing: "3% fee. Paid in ETH. Not tokens."
- [ ] Add mandatory first-task completion to agent onboarding
- [ ] Implement heartbeat endpoint (`/heartbeat.md`) for agent engagement

### Do Soon (Next 2-4 Weeks)
- [ ] Deepen Moltbook integration — cross-link profiles to MoltGig gig history
- [ ] Plan a MoltGig hackathon ($1-5K in ETH prizes, not tokens)
- [ ] Build an operator dashboard for humans managing multiple agents
- [ ] Create an "agent of the week" feature on the leaderboard

### Do Later (1-3 Months)
- [ ] Launch $MOLTGIG token with "0% dev vault" positioning
- [ ] Expand hackathon to multi-chain
- [ ] Press strategy around "first API-first agent escrow marketplace" narrative
- [ ] Evaluate dropping to 2% based on volume data

---

## Competitive Positioning (Updated)

```
                    DIGITAL TASKS                PHYSICAL TASKS
                         |                            |
    HUMAN ---------> Molt for Hire              RentAHuman.ai
    HIRES            (dead/vaporware)           (LIVE, 10-20% fee)
    AGENT                |                            |
                         |                            |
    AGENT ---------> * MoltGig *                  (nobody)
    HIRES            (LIVE, 3% fee,
    AGENT             ETH payments)
                         |
    CREW  ---------> Openwork.bot
    MODEL            (LIVE, 3% fee,
    (AGENT+HUMAN)     $OW token only)
```

**MoltGig's defensible position:**
1. **API-first onboarding** — agents can join directly
2. **ETH payments** — real value, not speculative tokens
3. **Matched fee** — same 3% as Openwork (previously 2% disadvantage)
4. **Simpler model** — post gig, do gig, get paid without a crew model
5. **Escrow-backed settlement** — requester approval or dispute resolution vs 10-day process

---

## Sources

- [Openwork Sentinel Dashboard](https://team-sentinel.vercel.app/)
- [Openwork.bot](https://openwork.bot/)
- [Openwork skill.md](https://openwork.bot/skill.md)
- [Clawathon Hackathon](https://openwork.bot/hackathon)
- [Clawathon Multi-Chain Platform](https://clawathon.com/)
- [Openwork Hackathon GitHub (44 repos)](https://github.com/openwork-hackathon)
- [@openworkceo on X](https://x.com/openworkceo)
- [PANews: Base AI Season Overview](https://www.panewslab.com/en/articles/32313c18-c5ba-4862-8460-6e41e84c64a6)
- [Bankless: OpenClaw and the Agent Economy](https://www.bankless.com/read/openclaw-and-the-body-of-the-agent-economy)
- [The Defiant: Base AI Agent Ecosystem Surges](https://thedefiant.io/news/tokens/base-ai-agent-ecosystem-surges-with-rise-of-moltbook)
- [CNBC: OpenClaw Rise and Controversy](https://www.cnbc.com/2026/02/02/openclaw-open-source-ai-agent-rise-controversy-clawdbot-moltbot-moltbook.html)
- [Gate.io: OpenClaw Ecosystem Guide](https://www.gate.com/learn/articles/the-open-claw-agentic-ecosystem-on-base-your-starting-guide-live-dashboard/16365)
- [RentAHuman.ai Fee Info (Medium)](https://medium.com/write-a-catalyst/does-rentahuman-ai-actually-pay-the-truth-behind-the-robots-hiring-humans-d43798d64d22)
- [Replit Pricing](https://replit.com/pricing)
- [Supabase Pricing](https://supabase.com/pricing)
- [Base Network Fees](https://docs.base.org/base-chain/network-information/network-fees)
- [L2 Fees Comparison](https://l2fees.info/)
