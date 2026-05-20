# Competitor Mechanics Copycat

**Created:** 2026-05-20
**Status:** archived
**Priority:** P2
**Workstream:** growth
**Type:** research
**Owner:** mixed

## Context

Competitors and adjacent protocols are winning attention with machine-readable onboarding, live activity, simple integration paths, and protocol-native discovery. MoltGig should copy the useful mechanics while keeping its own wedge: proof-backed, requester-reviewed Base escrow for multi-step work.

Expected outcome: a prioritized implementation list of competitor mechanics that MoltGig can safely adopt.

## Completion Note

Completed on 2026-05-20 in branch `codex/competitor-mechanics-copycat`, with Ricky companion PR `https://github.com/max-ascolani/ricky/pull/18`.

- Re-verified current public mechanics from Openwork, Agentic Market/x402 Bazaar, MCP docs, Virtuals ACP, AgentWork, and PinchWork.
- Updated `COMPETITORSv3.md` with source-linked verified mechanics, a P1/P2/P3 adoption list, and safer non-combative comparison rules.
- Updated marketing docs with the adopted competitor mechanics and public messaging guardrails.
- Implemented selected P1 mechanics: agent handoff prompt in `/integrate`, `skill.md`, and `llms.txt`; explicit discovery loop; fee-safe heartbeat/onboarding copy.
- Updated Ricky competitive intel so weekly scans produce actionable mechanics instead of passive monitoring.
- Verification: `npm run build:backend`, `npm run build:frontend`, `git diff --check`, Playwright smoke for `/integrate` desktop/mobile, and local static checks for `/skill.md` and `/llms.txt`.

## Current Evidence

- OpenWork-style `skill.md` and heartbeat loops are useful and MoltGig already has initial versions.
- Coinbase Agentic.Market-style discovery uses x402 service discovery, live pricing/activity, integration guides, and programmatic access.
- MCP-style discovery organizes tools/resources/prompts for agents.
- MoltGig's current public discovery files need to be stronger and tied to live proof-backed gigs.

## Documentation Impact

| Area | Files | Required update |
|------|-------|-----------------|
| Competitor docs | `docs/reference_docs/rivals/COMPETITORSv3.md` | Refresh stale February claims after verification. |
| Marketing docs | `docs/reference_docs/marketing/MOLTGIG_MARKETING.md` | Add adopted mechanics and messaging. |
| Product docs | `frontend/public/skill.md`, `frontend/public/llms.txt`, `/integrate` | Implement selected discovery/onboarding improvements. |
| Ricky docs | Ricky `COMPETITIVE_INTEL.md` | Weekly scans should produce actionable mechanics, not passive notes. |

## Decision Phase - Max Approval Required

- [x] Decide which competitor mechanics to adopt in P1 vs P2.
- [x] Decide whether x402 is a positioning surface only or a build target.
- [x] Decide whether to mention competitors publicly. Recommended: avoid direct callouts except factual comparisons.
- [x] Approve any public messaging derived from competitor analysis.

Decision outcome: P1 adopts documentation/onboarding/discovery mechanics only. x402 stays a positioning and later paid-resource target, not a first-completion build target. Public copy should not name competitors unless Max approves the exact comparison.

## Phase 0 - Investigation, Duplication Check, and Plan Hardening

- [x] Re-verify competitor claims from current public sources before citing externally.
- [x] Read MoltGig `skill.md`, `heartbeat`, `llms.txt`, `agent.json`, and `/integrate`.
- [x] Identify mechanics MoltGig already has in partial form.
- [x] Identify mechanics that require code, docs, or Ricky-only changes.
- [x] Rewrite implementation phases with exact selected mechanics.

## Phase 1 - Candidate Mechanics

- [x] Stronger "send this URL to your agent" onboarding.
- [x] Heartbeat that lists top current proof-backed gigs and next command.
- [x] Live activity/metrics with honest segmentation.
- [x] Framework-specific quickstarts.
- [x] Public proof transcript after first real completion.
- [x] MCP server or tools manifest for read-only gig discovery.
- [x] x402-compatible paid endpoint only where it fits pay-per-call use cases.

## Phase 2 - Prioritize Mechanics

- [x] P1: mechanics required for the first real completion sprint.
- [x] P2: mechanics that improve passive discovery after board reset.
- [x] P3: larger protocol work with lock-in or V3 contract implications.

## Phase 3 - Implement Selected P1 Mechanics

- [x] Update public agent docs if the selected mechanic is documentation-only.
- [x] Create separate implementation plans for code-heavy mechanics.
- [x] Update Ricky prompts so he promotes the new mechanics accurately.

## Phase 4 - Testing and Verification

- [x] Smoke all changed public docs and endpoints.
- [x] Verify examples are copy-paste runnable where claimed.
- [x] Verify no competitor metrics are stale or uncited in public copy.

## Phase 5 - Peer Review

- [x] Product review: does this reduce agent-owner friction?
- [x] Systems review: does this preserve MoltGig's escrow/proof model?
- [x] Messaging review: are claims accurate and non-combative?

## Phase 6 - Documentation and Cleanup

- [x] Update competitor docs with verified current facts.
- [x] Create follow-up plans for deferred mechanics.
- [x] Move this plan to archive after selected P1 mechanics are shipped or delegated.
