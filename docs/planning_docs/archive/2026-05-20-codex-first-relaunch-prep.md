# Codex-First Relaunch Prep

**Created:** 2026-05-20
**Status:** archived
**Priority:** P1
**Workstream:** growth
**Type:** operations
**Owner:** Codex

## Context

Max asked Codex to complete the remaining work that can be done without owner wallet actions, public outreach, account-gated submissions, or funding decisions. This plan turns the relaunch collateral into an approval-ready packet and tightens the product discovery surface before any manual outreach starts.

Expected outcome: Max receives a clear approval packet for fee policy, relaunch gigs, first outreach targets, directory submissions, and Ricky's next operating week. MoltGig's default gig browsing no longer foregrounds stale funded rows over newer proof-backed relaunch work.

## Current Evidence

- `docs/planning_docs/README.md` requires Phase 0, decision checkpoints for public outreach/mainnet writes, testing, peer review, and documentation cleanup.
- `docs/planning_docs/active/2026-05-20-growth-relaunch-implementation-sequence.md` lists Track A as complete and leaves fee changes, gig funding, public outreach, and directory submissions as approval-gated.
- `docs/reference_docs/gigs/GROWTH_RELAUNCH_GIGS.md` has eight draft relaunch gig payloads and notes 36 stale funded gigs.
- `docs/reference_docs/marketing/AGENT_OWNER_OUTREACH.md` has a 50-target packet and top 10 draft queue, all draft-only.
- `docs/reference_docs/marketing/LISTING_OPPORTUNITIES.md` has a canonical directory submission packet, but owner/account-gated submissions remain unsent.
- `docs/planning_docs/active/2026-05-20-zero-fee-relaunch.md` records that contract fee writes need Max's owner-wallet action.
- The public `/gigs` page previously defaulted to `status=funded` sorted by `reward_high`, which can foreground stale funded promotional tasks.

## Documentation Impact

| Area | Files | Required update |
|------|-------|-----------------|
| Planning | `docs/planning_docs/active/2026-05-20-growth-relaunch-implementation-sequence.md`, this plan | Record Codex-prep completion and remaining Max gates. |
| Relaunch gigs | `docs/reference_docs/gigs/GROWTH_RELAUNCH_GIGS.md` | Add final approval packet and immediate first five gig recommendation. |
| Marketing/outreach | `docs/reference_docs/marketing/AGENT_OWNER_OUTREACH.md`, `docs/reference_docs/marketing/LISTING_OPPORTUNITIES.md` | Add first five outreach order and field-ready listing answers. |
| Fee policy | `docs/planning_docs/active/2026-05-20-zero-fee-relaunch.md` | Add owner action script/checklist and publish/no-publish rules. |
| Protocol docs | `docs/reference_docs/AGENT_PROTOCOL_COMPATIBILITY.md`, `mcp/README.md` | Add MCP setup/examples and safe prompt. |
| Ricky docs | `/Users/maxascolani/Desktop/10. GitHub Repos/Ricky/agents/moltgig-ceo/*` | Add seven-day draft-only operating plan and ledgers. |

## Phase 0 - Investigation, Duplication Check, and Plan Hardening

- [x] Read planning README and the master growth relaunch implementation sequence.
- [x] Read existing relaunch gigs, outreach, directory, framework bounty, MCP/x402, and zero-fee docs.
- [x] Read `/gigs`, task filters, task API schema/route, homepage feed, and MCP prototype.
- [x] Confirm this work does not require Supabase schema changes, contract writes, admin writes, or wallet signing.
- [x] Identify exact owner-gated actions: fee write, gig creation/funding, outreach sends, directory submissions, and Ricky authority expansion.
- [x] Acceptance criteria: Codex-owned docs/code are updated, tests/builds pass, and final answer names only remaining Max actions.

## Phase 1 - Product Discovery Prep

- [x] Add an `availability=available` task-listing filter that returns open and funded gigs without changing existing `status` filtering.
- [x] Change `/gigs` default filter to available + newest instead of funded + highest reward.
- [x] Change homepage recent gigs feed to available + newest.
- [x] Change the read-only MCP `list_gigs` default to available + newest.

## Phase 2 - Approval Packet Prep

- [x] Add final recommended first gig batch and owner checklist to relaunch gig docs.
- [x] Add first five outreach targets, channel, exact send condition, and draft locations to outreach docs.
- [x] Add field-ready directory listing answers and submission order to listing docs.
- [x] Add fee-write owner action checklist and no-claim rules to the zero-fee plan.
- [x] Add MCP client config and safe first prompt to protocol docs.
- [x] Add Ricky seven-day operating plan and experiment ledger updates.

## Phase 3 - Testing and Verification

- [x] Run backend tests/type checks for task route/schema changes.
- [x] Run frontend build/type checks for filter/homepage changes.
- [x] Run MCP smoke test.
- [x] Review diffs for accidental secrets, outreach sends, admin writes, or wallet actions.

## Phase 4 - Peer Review

- [x] Product review: default discovery should help agents find current proof-backed work.
- [x] Systems review: no data mutation, no mainnet writes, no public sends, and existing exact status filters still work.
- [x] Growth review: Max can make the next decisions without reading scattered docs.

## Phase 5 - Documentation and Cleanup

- [x] Update all Documentation Impact files.
- [x] Update the master implementation sequence with Codex-first prep status.
- [x] Move this plan to `docs/planning_docs/archive/` when complete.
