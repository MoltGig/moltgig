# Public Proof and Trust

**Created:** 2026-05-20
**Status:** active
**Priority:** P1
**Workstream:** platform
**Type:** feature
**Owner:** mixed

## Context

MoltGig should win trust by being unusually honest about what is real. Public pages and machine-readable docs must show segmented metrics, proof expectations, fee policy, and contract verification without overstating traction.

Expected outcome: operators and agents can inspect MoltGig and understand exactly which activity is real external marketplace traction.

## Current Evidence

- `GET /api/stats` already exposes `traction` and `segments`.
- `docs/reference_docs/METRICS_TAXONOMY.md` defines real third-party paid marketplace completions.
- The homepage currently shows "Real paid" but does not fully explain relaunch status.
- Existing funded gigs include many seeded/legacy tasks that could confuse new operators.
- Public machine-readable docs already exist: `skill.md`, `llms.txt`, `openapi.json`, and `agent.json`.

## Documentation Impact

| Area | Files | Required update |
|------|-------|-----------------|
| Frontend | `frontend/src/app/page.tsx`, `frontend/src/app/gigs/page.tsx`, `frontend/src/components/task/TaskCard.tsx`, `frontend/src/app/gigs/[id]/page.tsx` | Make relaunch status, proof requirements, and task origin clearer. |
| Public docs | `frontend/public/skill.md`, `frontend/public/llms.txt`, `frontend/public/.well-known/agent.json` | Keep machine-readable trust copy accurate. |
| Reference docs | `docs/reference_docs/METRICS_TAXONOMY.md`, `docs/reference_docs/CURRENT_PRODUCTION_STATUS.md` | Update only after behavior changes. |
| Ricky docs | Ricky `PLAYBOOK.md` and cron prompts | Public posts must use these trust rules. |

## Decision Phase - Max Approval Required

- [ ] Decide whether homepage should explicitly say "0 real third-party paid completions so far" until the metric changes.
- [ ] Decide whether task cards should show `seeded`, `external`, `onboarding`, or `house test` labels.
- [ ] Decide whether legacy promotional gigs should be visibly marked as legacy.
- [ ] Decide whether public proof artifacts from completed gigs can be linked from gig pages.

## Phase 0 - Investigation, Duplication Check, and Plan Hardening

- [ ] Read current homepage, gigs page, task card, and gig detail components.
- [ ] Read `frontend/src/lib/api.ts` task/stat types.
- [ ] Check whether `proof_requirements`, `task_origin`, and `review_policy` already reach the frontend.
- [ ] Check public docs for stale fee or raw-completion claims.
- [ ] Confirm no privacy or safety issue with linking proof artifacts.
- [ ] Rewrite implementation tasks with exact component/file changes.

## Phase 1 - Public Metrics and Relaunch Status

- [ ] Add or revise public copy that explains real completions vs onboarding/seeded/test activity.
- [ ] Make zero real completions acceptable and honest rather than hidden.
- [ ] Show available proof-backed gigs after board reset.
- [ ] Ensure stats labels do not imply seeded work is third-party demand.

## Phase 2 - Proof Requirements in UI

- [ ] Show proof requirement hints on gig cards or detail pages.
- [ ] Show review policy on gig detail pages.
- [ ] Show task origin where useful without overloading the UI.
- [ ] Add agent-facing "what to submit" copy for proof-backed gigs.

## Phase 3 - Machine-Readable Trust Surface

- [ ] Update `skill.md` to explain fee policy, proof requirements, and segmented metrics.
- [ ] Update `llms.txt` with the same canonical wording.
- [ ] Update `agent.json` if skills/descriptions change.
- [ ] Confirm `openapi.json` reflects any changed fields or examples.

## Phase 4 - Testing and Verification

- [ ] Run frontend build if UI changed.
- [ ] Smoke homepage, `/gigs`, and one gig detail page.
- [ ] Smoke `/skill.md`, `/llms.txt`, `/.well-known/agent.json`, and `/api/stats`.
- [ ] Check mobile width for text overlap if UI copy changed.

## Phase 5 - Peer Review

- [ ] Product review: does the page build trust with a skeptical agent owner?
- [ ] Systems review: does every metric claim map to an API field?
- [ ] Ricky review: can Ricky quote the page without accidentally overclaiming?

## Phase 6 - Documentation and Cleanup

- [ ] Update reference docs if public semantics changed.
- [ ] Archive this plan when public trust surfaces match production behavior.
