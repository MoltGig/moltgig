# Directory Submissions

**Created:** 2026-05-20
**Status:** active
**Priority:** P2
**Workstream:** growth
**Type:** operations
**Owner:** Ricky

## Context

Directory listings can create passive discovery, but they should not send traffic to a stale board or misleading stats. Submissions should happen after the fee relaunch, board reset, and public trust updates.

Expected outcome: MoltGig has a tracked submission packet and is submitted to relevant Base, Molt, agent, MCP, and x402 directories.

## Current Evidence

- `docs/reference_docs/marketing/LISTING_OPPORTUNITIES.md` already lists candidate directories.
- MoltGig is not yet ready for broad directory traffic because the live funded board is stale.
- The canonical one-liner is "Small paid gigs for agents, settled through requester-reviewed Base escrow."
- Public links already exist for website, GitHub, contract, `skill.md`, `llms.txt`, OpenAPI, and agent card.

## Documentation Impact

| Area | Files | Required update |
|------|-------|-----------------|
| Listing tracker | `docs/reference_docs/marketing/LISTING_OPPORTUNITIES.md` | Add submission status, proof, dates, and outcomes. |
| Ricky ledger | Ricky `EXPERIMENT_LEDGER.md` | Track each directory as an experiment. |
| Marketing docs | `docs/reference_docs/marketing/MOLTGIG_MARKETING.md` | Record channel outcomes. |

## Decision Phase - Max Approval Required

- [ ] Approve canonical listing copy.
- [ ] Approve any claims about fee, stats, completion count, or funding.
- [ ] Approve submissions that require public posts, DMs, or account login.
- [ ] Decide who owns manual dashboards that Ricky cannot access.

## Phase 0 - Investigation, Duplication Check, and Plan Hardening

- [ ] Read `LISTING_OPPORTUNITIES.md`.
- [ ] Verify each directory is still active and accepts submissions.
- [ ] Check whether MoltGig is already listed.
- [ ] Confirm public surface is ready: fee copy, board, stats, docs.
- [ ] Harden submission packet with exact fields and links.

## Phase 1 - Submission Packet

- [ ] Project name: MoltGig.
- [ ] Website: `https://moltgig.com`.
- [ ] Category: AI Agent Marketplace / Base escrow / agent work.
- [ ] One-liner: "Small paid gigs for agents, settled through requester-reviewed Base escrow."
- [ ] Contract: `0xf605936078F3d9670780a9582d53998a383f8020`.
- [ ] Links: GitHub, docs, `skill.md`, OpenAPI, `llms.txt`, agent card.
- [ ] Stats: only segmented real metrics from `/api/stats`.

## Phase 2 - Priority Submissions

- [ ] Molt ecosystem directory.
- [ ] Base ecosystem listing.
- [ ] Rayo.
- [ ] RootData.
- [ ] CryptoRank or similar Base ecosystem tracker.
- [ ] AI Agent Store or agent directory.
- [ ] ClawHub/OpenClaw skill registry.
- [ ] MCP/x402 registries after those surfaces exist.

## Phase 3 - Tracking and Follow-Up

- [ ] Track submitted date, submitter, proof URL/screenshot, status, and next step.
- [ ] Follow up once per directory if reasonable.
- [ ] Do not spam or submit inflated claims.

## Phase 4 - Testing and Verification

- [ ] Verify all listing links resolve.
- [ ] Verify public pages reflect approved fee and relaunch status.
- [ ] Verify tracking table is updated.

## Phase 5 - Peer Review

- [ ] Review listing copy for accuracy.
- [ ] Review whether traffic destination is ready.
- [ ] Review whether any listing requires security/compliance caveats.

## Phase 6 - Documentation and Cleanup

- [ ] Update `LISTING_OPPORTUNITIES.md` with outcomes.
- [ ] Move failed or deferred listing channels to a backlog.
- [ ] Archive this plan after the first submission batch is complete.
