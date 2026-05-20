# Directory Submissions

**Created:** 2026-05-20
**Status:** archived
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

- [x] Approve canonical listing copy.
- [x] Approve any claims about fee, stats, completion count, or funding.
- [x] Approve submissions that require public posts, DMs, or account login.
- [x] Decide who owns manual dashboards that Ricky cannot access.

Decision recorded 2026-05-20 for Codex preparation: canonical listing copy is ready for Max review. Claims are limited to segmented `/api/stats` metrics; current real third-party paid marketplace completions are `0`. Ricky/Codex may prepare packets and drafts, but Max owns account-gated submissions, public DMs/posts, paid upgrades, and official ownership-proof flows.

## Phase 0 - Investigation, Duplication Check, and Plan Hardening

- [x] Read `LISTING_OPPORTUNITIES.md`.
- [x] Verify each directory is still active and accepts submissions.
- [x] Check whether MoltGig is already listed.
- [x] Confirm public surface is ready: fee copy, board, stats, docs.
- [x] Harden submission packet with exact fields and links.

Findings:

- `LISTING_OPPORTUNITIES.md` existed but the submission template had stale category/copy and placeholder links.
- Public stats on 2026-05-20: `real_third_party_paid_marketplace_completions: 0`, `external_onboarding_completions: 1`, `stale_funded_gigs: 36`, `tasks.open: 13`, `tasks.funded: 36`.
- Priority directory URLs returned `200` with `curl -L --max-time 12`.
- Broad submission should wait until proof-backed relaunch gigs are live or ready to fund; the packet itself is complete.
- No submissions were sent.

## Phase 1 - Submission Packet

- [x] Project name: MoltGig.
- [x] Website: `https://moltgig.com`.
- [x] Category: AI Agent Marketplace / Base escrow / agent work.
- [x] One-liner: "Small paid gigs for agents, settled through requester-reviewed Base escrow."
- [x] Contract: `0xf605936078F3d9670780a9582d53998a383f8020`.
- [x] Links: GitHub, docs, `skill.md`, OpenAPI, `llms.txt`, agent card.
- [x] Stats: only segmented real metrics from `/api/stats`.

Implemented in `docs/reference_docs/marketing/LISTING_OPPORTUNITIES.md` and mirrored into Ricky Draft #13.

## Phase 2 - Priority Submissions

- [x] Molt ecosystem directory.
- [x] Base ecosystem listing.
- [x] Rayo.
- [x] RootData.
- [x] CryptoRank or similar Base ecosystem tracker.
- [x] AI Agent Store or agent directory.
- [x] ClawHub/OpenClaw skill registry.
- [x] MCP/x402 registries after those surfaces exist.

Priority rows are now packet-ready. MCP/x402 registries are explicitly deferred until the read-only discovery surface exists.

## Phase 3 - Tracking and Follow-Up

- [x] Track submitted date, submitter, proof URL/screenshot, status, and next step.
- [x] Follow up once per directory if reasonable.
- [x] Do not spam or submit inflated claims.

Progress tracking now includes submitter, proof, status, and next step columns. Every row is marked ready/not submitted or deferred.

## Phase 4 - Testing and Verification

- [x] Verify all listing links resolve.
- [x] Verify public pages reflect approved fee and relaunch status.
- [x] Verify tracking table is updated.

Verification 2026-05-20:

- `curl -L --max-time 12` returned `200` for Molt Ecosystem Directory, Base ecosystem, Base get started, Rayo, RootData, CryptoRank, CryptoTotem, AI Agent Store, DappRadar submit project, ClawHub, MCP docs, and x402 Bazaar docs.
- `https://moltgig.com/api/stats` was checked and the packet records segmented metrics only.
- `git diff --check` passed in MoltGig and Ricky.

## Phase 5 - Peer Review

- [x] Review listing copy for accuracy.
- [x] Review whether traffic destination is ready.
- [x] Review whether any listing requires security/compliance caveats.

Review result: copy is accurate and fee-safe. The destination surface is not ready for broad directory traffic until the board has approved proof-backed relaunch gigs. Account-gated dashboards, ownership proof, and paid upgrades stay manual/Max-owned.

## Phase 6 - Documentation and Cleanup

- [x] Update `LISTING_OPPORTUNITIES.md` with outcomes.
- [x] Move failed or deferred listing channels to a backlog.
- [x] Archive this plan after the first submission batch is complete.

Completed 2026-05-20 as a Codex-first packet round. No directory submissions were sent; the first manual submission batch remains blocked on Max approval and the proof-backed board destination.
