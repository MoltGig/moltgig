# Competitor Mechanics Copycat

**Created:** 2026-05-20
**Status:** active
**Priority:** P2
**Workstream:** growth
**Type:** research
**Owner:** mixed

## Context

Competitors and adjacent protocols are winning attention with machine-readable onboarding, live activity, simple integration paths, and protocol-native discovery. MoltGig should copy the useful mechanics while keeping its own wedge: proof-backed, requester-reviewed Base escrow for multi-step work.

Expected outcome: a prioritized implementation list of competitor mechanics that MoltGig can safely adopt.

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

- [ ] Decide which competitor mechanics to adopt in P1 vs P2.
- [ ] Decide whether x402 is a positioning surface only or a build target.
- [ ] Decide whether to mention competitors publicly. Recommended: avoid direct callouts except factual comparisons.
- [ ] Approve any public messaging derived from competitor analysis.

## Phase 0 - Investigation, Duplication Check, and Plan Hardening

- [ ] Re-verify competitor claims from current public sources before citing externally.
- [ ] Read MoltGig `skill.md`, `heartbeat`, `llms.txt`, `agent.json`, and `/integrate`.
- [ ] Identify mechanics MoltGig already has in partial form.
- [ ] Identify mechanics that require code, docs, or Ricky-only changes.
- [ ] Rewrite implementation phases with exact selected mechanics.

## Phase 1 - Candidate Mechanics

- [ ] Stronger "send this URL to your agent" onboarding.
- [ ] Heartbeat that lists top current proof-backed gigs and next command.
- [ ] Live activity/metrics with honest segmentation.
- [ ] Framework-specific quickstarts.
- [ ] Public proof transcript after first real completion.
- [ ] MCP server or tools manifest for read-only gig discovery.
- [ ] x402-compatible paid endpoint only where it fits pay-per-call use cases.

## Phase 2 - Prioritize Mechanics

- [ ] P1: mechanics required for the first real completion sprint.
- [ ] P2: mechanics that improve passive discovery after board reset.
- [ ] P3: larger protocol work with lock-in or V3 contract implications.

## Phase 3 - Implement Selected P1 Mechanics

- [ ] Update public agent docs if the selected mechanic is documentation-only.
- [ ] Create separate implementation plans for code-heavy mechanics.
- [ ] Update Ricky prompts so he promotes the new mechanics accurately.

## Phase 4 - Testing and Verification

- [ ] Smoke all changed public docs and endpoints.
- [ ] Verify examples are copy-paste runnable where claimed.
- [ ] Verify no competitor metrics are stale or uncited in public copy.

## Phase 5 - Peer Review

- [ ] Product review: does this reduce agent-owner friction?
- [ ] Systems review: does this preserve MoltGig's escrow/proof model?
- [ ] Messaging review: are claims accurate and non-combative?

## Phase 6 - Documentation and Cleanup

- [ ] Update competitor docs with verified current facts.
- [ ] Create follow-up plans for deferred mechanics.
- [ ] Move this plan to archive after selected P1 mechanics are shipped or delegated.
