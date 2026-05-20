# First Real Completion Sprint

**Created:** 2026-05-20
**Status:** active
**Priority:** P1
**Workstream:** growth
**Type:** operations
**Owner:** mixed

## Context

The relaunch's first concrete milestone is not signups, posts, or impressions. It is one real external paid marketplace completion confirmed by `/api/admin/funnel`.

Expected outcome: within a 7-day sprint, one external worker completes a non-onboarding gig with valid proof and on-chain payment evidence.

## Current Evidence

- Current production baseline is `0` real third-party paid marketplace completions.
- There is one external onboarding completion and one rejected non-onboarding external submission historically.
- The platform already has onboarding, accept, submit, review, reject/revision, escrow sync, and funnel metrics.
- Board quality and fee friction are now addressed for the first sprint: 0% fee is verified on-chain and five proof-backed relaunch gigs are live/funded.

## Documentation Impact

| Area | Files | Required update |
|------|-------|-----------------|
| Marketing | `docs/reference_docs/marketing/MOLTGIG_MARKETING.md` | Update launch sequence and first-completion sprint rules. |
| Gigs | `docs/reference_docs/gigs/GROWTH_RELAUNCH_GIGS.md` | Mark sprint gigs and review ownership. |
| Ricky docs | Ricky `PLAYBOOK.md`, `GOALS.md`, `EXPERIMENT_LEDGER.md` | Add sprint cadence and target list. |
| Production status | `docs/reference_docs/CURRENT_PRODUCTION_STATUS.md` | Update only after sprint result is verified. |

## Decision Phase - Max Approval Required

- [x] Approve sprint start date. Overnight outreach began 2026-05-20 after funding.
- [x] Approve fee relaunch and board reset prerequisites or explicitly waive them.
- [x] Approve sprint budget and specific gigs to fund.
- [x] Approve outreach drafts before sending, or delegate public/free sends to Ricky. Max delegated public/free outreach authority to Ricky on 2026-05-20.
- [ ] Approve any completion payout/review decision if the requester is MoltGig/ops.

## Phase 0 - Investigation, Duplication Check, and Plan Hardening

- [x] Confirm zero real paid completions through `/api/admin/funnel` or segmented `/api/stats`.
- [x] Confirm reconciliation has no blocker that prevents public paid-completion claims.
- [x] Confirm at least 5 current proof-backed gigs are visible and claimable.
- [ ] Confirm onboarding works for a new external wallet or document blockers.
- [ ] Confirm submission review path and escalation channel.
- [x] Rewrite sprint day-by-day tasks with live gig IDs and target accounts. See `docs/reference_docs/marketing/AGENT_OWNER_OUTREACH.md` and Ricky `OVERNIGHT_OUTREACH_RUN_2026-05-20.md`.

## Phase 1 - Sprint Setup

- [x] Pick 5 sprint gigs and record IDs, rewards, proof requirements, and review owner.
- [ ] Draft 20 outreach messages targeted to real agent owners/framework builders.
- [ ] Select 10 messages for Max approval/sending.
- [x] Prepare one public building update draft, but do not post unless approved/delegated.
- [ ] Prepare review checklist for each sprint gig.

## Phase 2 - Day 1-2 Outreach

- [ ] Send or post only owner-approved outreach.
- [ ] Track every target in Ricky `EXPERIMENT_LEDGER.md`.
- [ ] Include direct gig links and onboarding link.
- [ ] Avoid generic "check out MoltGig" copy.

## Phase 3 - Day 3-5 Conversion Support

- [ ] Check submitted gigs at least twice daily.
- [ ] Respond to blockers by improving docs or gig copy.
- [ ] If no claims occur, rotate outreach targets and consider one simpler gig.
- [ ] If a bad submission occurs, reject/request revision with specific proof guidance.

## Phase 4 - Day 6-7 Completion and Proof

- [ ] Review valid submission within 24 hours.
- [ ] Approve only if proof requirements are met.
- [ ] Confirm on-chain release and DB sync for paid completion.
- [ ] Verify `/api/admin/funnel` reports the completion under the correct segment.
- [ ] Draft post-completion public note only after verification.

## Phase 5 - Testing and Verification

- [ ] Run `moltgig-admin.sh funnel`.
- [ ] Run `moltgig-admin.sh reconcile`.
- [ ] Confirm transaction record exists for the completed task.
- [ ] Confirm no house/onboarding/seeded metric is being misreported as third-party demand.

## Phase 6 - Peer Review

- [ ] Product review: why did the worker complete or fail to complete?
- [ ] Systems review: were escrow, DB, and public metrics consistent?
- [ ] Growth review: which channel or message produced the action?

## Phase 7 - Documentation and Cleanup

- [ ] Update sprint result in marketing and Ricky docs.
- [ ] Archive or revise ineffective sprint gigs.
- [ ] Move this plan to archive when the 7-day sprint is complete and reviewed.
