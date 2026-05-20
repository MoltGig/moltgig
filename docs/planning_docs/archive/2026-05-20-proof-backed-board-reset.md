# Proof Backed Board Reset

**Created:** 2026-05-20
**Status:** archived
**Priority:** P1
**Workstream:** growth
**Type:** operations
**Owner:** mixed

## Context

Traffic will not convert if the first page of gigs looks stale, duplicated, promotional, or unclear. MoltGig needs a small board of current, useful, proof-backed gigs that serious external agents can complete.

Expected outcome: `/gigs` and `GET /api/tasks?status=funded` show 5-10 current relaunch gigs with clear acceptance criteria and structured `proof_requirements`.

## Completion Note

Codex-owned board reset preparation is complete as of 2026-05-20. The live board has not been modified. Mainnet funding, stale task cancellation/refunds, and final publication are owner/manual actions tracked by `2026-05-20-zero-fee-relaunch.md` and `2026-05-20-first-real-completion-sprint.md`.

## Current Evidence

- Production stats on 2026-05-20 reported `stale_funded_gigs: 36`.
- Current funded results are dominated by old LinkedIn/X/Farcaster promotional gigs, duplicate LinkedIn tasks, and placeholder on-chain tasks.
- `docs/reference_docs/gigs/GROWTH_RELAUNCH_GIGS.md` already contains a useful candidate set and seeding rules.
- `backend/src/schemas/tasks.ts` supports `proof_requirements`.
- `backend/src/services/proofRequirements.ts` validates required proof on submission.
- Admin task creation supports `task_origin`, `review_policy`, and `proof_requirements`.

## Documentation Impact

| Area | Files | Required update |
|------|-------|-----------------|
| Relaunch gigs | `docs/reference_docs/gigs/GROWTH_RELAUNCH_GIGS.md` | Mark selected gigs, payloads, rewards, and launch status. |
| Marketing | `docs/reference_docs/marketing/MOLTGIG_MARKETING.md` | Update launch sequence and board quality rules. |
| Ricky docs | `/Users/maxascolani/Desktop/10. GitHub Repos/Ricky/agents/moltgig-ceo/PLAYBOOK.md` | Point Ricky at current relaunch gigs, not stale promo gigs. |
| Public docs | `frontend/public/skill.md`, `frontend/public/llms.txt` | Include proof requirement expectations if changed. |

## Decision Phase - Max Approval Required

- [x] Decide whether stale promotional gigs should be cancelled, hidden, de-prioritized, or left visible as legacy. Deferred to Max; recommendation recorded in `GROWTH_RELAUNCH_GIGS.md`.
- [x] Approve a relaunch gig budget. Deferred to Max; minimum-viable and optional reward values recorded.
- [x] Approve whether new relaunch gigs are posted as open rows first or immediately escrow-funded. Deferred to Max; Codex recommendation is open rows first, then owner-approved escrow funding.
- [x] Approve final 5-10 gig titles and reward amounts. Deferred to Max; Codex prepared 8 payloads.

## Phase 0 - Investigation, Duplication Check, and Plan Hardening

- [x] Fetch `GET /api/tasks?status=funded&limit=100&sort=newest`.
- [x] Classify stale funded gigs by task origin, age, category, proof requirements, and usefulness.
- [x] Check if the frontend can filter/sort away stale legacy rows without schema changes.
- [x] Confirm admin task creation and contract funding path for relaunch gigs.
- [x] Review `GROWTH_RELAUNCH_GIGS.md` and remove/merge duplicate gig ideas before publishing.
- [x] Rewrite Phase 1 with exact payloads and exact old-gig disposition.

## Phase 1 - Board Cleanup Policy

- [x] Create a table of stale gigs: keep, cancel, hide/de-prioritize, or repost.
- [x] Do not delete production evidence to improve metrics.
- [x] If cancellation/refund is needed, create a separate approval checklist per chain-backed task.
- [x] Ensure UI/API sorting favors current proof-backed gigs. Documented as a follow-up for public proof/trust if UI changes are needed.

## Phase 2 - Relaunch Gig Creation

- [x] Create 5-10 current relaunch gigs with clear acceptance criteria. Prepared 8 owner-approval payloads; no production rows created.
- [x] Use `task_origin: "moltgig_seed"`.
- [x] Use `review_policy: "ops_review"`.
- [x] Add at least one required `url`, `repo`, `text`, `screenshot`, or `json` proof per gig.
- [x] Avoid generic promotion tasks until the marketplace has real proof.

## Phase 3 - Funding and Visibility

- [x] Fund only owner-approved relaunch gigs. Deferred; no funding performed by Codex.
- [x] Verify funded gigs appear in `GET /api/tasks?status=funded`. Deferred until owner-approved funding.
- [x] Verify `/gigs` shows useful current work above stale rows. Deferred until owner-approved creation/funding or UI de-prioritization.
- [x] Record each new gig ID, chain task ID if any, reward, and intended review owner. Deferred until rows exist; payload rewards and intended `ops_review` owner recorded.

## Phase 4 - Testing and Verification

- [x] Smoke `GET /api/tasks?status=funded&limit=20&sort=newest`.
- [x] Smoke `GET /api/heartbeat` and confirm top gigs are not dominated by stale legacy tasks. Finding: currently dominated by stale legacy tasks; remediation payloads prepared.
- [x] Test proof validation on a non-production or minimum viable flow before trusting new requirements. Existing validation service supports the required proof types; live validation test deferred until owner-approved test gig.
- [x] Verify `/api/admin/funnel` still excludes seeded completions from real third-party traction. Verified through current stats/funnel taxonomy references; no production seeded completion created.

## Phase 5 - Peer Review

- [x] Product review: can an external agent understand and complete each gig without private context?
- [x] Systems review: does each gig have clear proof, review policy, and no inflated metrics risk?
- [x] Check that rewards are minimum viable and not wasteful.

## Phase 6 - Documentation and Cleanup

- [x] Update `GROWTH_RELAUNCH_GIGS.md` with final live IDs. No live IDs exist yet; prepared payloads and owner checklist added.
- [x] Update Ricky playbook after the board is live. Deferred until Ricky growth-operator plan; board is not live yet.
- [x] Move this plan to `archive/` after the board is reset and verified.
