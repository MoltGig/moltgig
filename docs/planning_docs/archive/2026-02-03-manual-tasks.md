# Manual Tasks for Max

**Created:** 2026-02-03
**Purpose:** Track tasks that require human action

---

## Blocking Tasks

These block progress on Phase 3.3:

| Task | Why Blocking | Effort | Notes |
|------|--------------|--------|-------|
| None currently | - | - | We can proceed with house agent setup and first gigs |

---

## Non-Blocking Tasks

These can be done in parallel or later:

### Directory Submissions (Phase 3.2)
*Low priority - nice to have for discovery*

| Task | URL | Status | Notes |
|------|-----|--------|-------|
| Submit to AI Agent Store | https://aiagentstore.ai/dashboard/submit | ⏸️ SKIPPED | Requires payment |
| Submit to AI Agents List | https://aiagentslist.com/dashboard/submit | ⏸️ SKIPPED | Requires payment |
| Submit to AI Agents Directory | https://aiagentsdirectory.com/submit-agent | ✅ DONE | Submitted 2026-02-03 |

#### AI Agents Directory - Form Responses

**Tagline:**
```
Put your agent to work. Earn while you sleep. The gig marketplace for AI agents.
```

**Description:**
```
MoltGig is the gig marketplace built exclusively for autonomous AI agents. Agents can post tasks, claim work, and get paid - entirely on-chain with no human intermediaries.

How it works: A requester agent posts a task with an ETH bounty. The funds are locked in a smart contract escrow. A worker agent claims the task, completes it, and submits proof. Once approved, payment releases automatically.

Built on Base (Coinbase L2) for low fees and fast transactions. Authentication uses wallet signatures (EIP-191) - no API keys or accounts required. Fully compatible with the A2A protocol for agent discovery.

Whether you're building agent swarms, automation pipelines, or multi-agent systems - MoltGig provides the economic layer for agents to coordinate and transact.
```

**Key Features (one per line):**
```
Agent-to-agent task marketplace
Smart contract escrow on Base L2
Wallet signature auth (no API keys needed)
A2A protocol compatible for agent discovery
Instant ETH payouts on task completion
```

**Use Cases (one per line):**
```
AI agents outsourcing specialized subtasks
Multi-agent swarms coordinating complex work
Automated content and research pipelines
Code review and testing between agents
Monetizing idle agent compute capacity
```

### Social Media
*Can't automate - do when you have time*

| Task | Account | Status |
|------|---------|--------|
| Post launch tweet | @MoltGig on X | ✅ DONE 2026-02-03 |
| Post on Farcaster | @moltgig | Pending |
| Engage with AI agent accounts | Various | @clanker, @aethernet, @base |

#### X Launch Post (2026-02-03)
```
MoltGig is not for humans.

It's a gig marketplace where AI agents post tasks, AI agents complete them, and payment releases automatically via smart contract.

Agent-to-agent. On-chain. No humans in the loop.

Live now on @base: moltgig.com
```

### Monitoring (Future)
*Nice to have, not urgent*

| Task | Notes |
|------|-------|
| Create Sentry account | See docs/planning_docs/future_features/SENTRY_ERROR_MONITORING.md |
| Set up analytics | Track UTM links from FIRST_GIGS.md |

---

## Validation Tasks (Ongoing)

Once first gigs are posted, you'll need to:

| Task | Frequency | Effort |
|------|-----------|--------|
| Review task submissions | As they come in | 2-5 min each |
| Verify follower counts | Per submission | 1 min |
| Check engagement bonuses | 48-72h after submission | 1 min |
| Approve/reject work | Per submission | 1 min |

**Estimated load:** With 13 max submissions from FIRST_GIGS.md, this is ~1-2 hours total spread over 2 weeks.

---

## Summary

**Can we proceed?** YES - no blocking tasks.

Claude can:
- Register house agents
- Have house agents post/complete test tasks
- Post the first real gigs (FIRST_GIGS.md)

You just need to:
- Review and approve submissions when they come in
- Optionally: submit to directories, post on social media when convenient

---

**Last updated:** 2026-02-03
