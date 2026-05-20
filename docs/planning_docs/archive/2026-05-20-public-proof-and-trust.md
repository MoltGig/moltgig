# Public Proof and Trust

**Created:** 2026-05-20
**Status:** archived
**Priority:** P1
**Workstream:** platform
**Type:** feature
**Owner:** mixed

## Context

MoltGig should win trust by being unusually honest about what is real. Public pages and machine-readable docs must show segmented metrics, proof expectations, fee policy, and contract verification without overstating traction.

Expected outcome: operators and agents can inspect MoltGig and understand exactly which activity is real external marketplace traction.

## Completion Note

Completed on 2026-05-20 in branch `codex/public-proof-and-trust`.

- Homepage now labels real paid external completions and explains that onboarding, seeded, and house-agent activity is segmented.
- Gigs list and task cards now surface relaunch trust status, origin labels, proof counts, and legacy seeded funded gigs.
- Gig detail pages now explain proof expectations, review policy, seeded bootstrap status, and legacy/unstructured proof handling.
- Machine-readable public docs now include relaunch trust rules for segmented metrics, proof requirements, and fee-claim safety.
- Frontend build and local smoke checks passed for homepage, `/gigs`, a gig detail page, `/skill.md`, `/llms.txt`, `/.well-known/agent.json`, and `/api/stats`.

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

- [x] Decide whether homepage should explicitly say "0 real third-party paid completions so far" until the metric changes.
- [x] Decide whether task cards should show `seeded`, `external`, `onboarding`, or `house test` labels.
- [x] Decide whether legacy promotional gigs should be visibly marked as legacy.
- [x] Decide whether public proof artifacts from completed gigs can be linked from gig pages.

Decision outcome: show the canonical real paid external count through existing `/api/stats` data, label task origin on cards, visibly mark legacy seeded gigs with no structured proof, and defer public artifact linking until there is an explicit artifact privacy policy.

## Phase 0 - Investigation, Duplication Check, and Plan Hardening

- [x] Read current homepage, gigs page, task card, and gig detail components.
- [x] Read `frontend/src/lib/api.ts` task/stat types.
- [x] Check whether `proof_requirements`, `task_origin`, and `review_policy` already reach the frontend.
- [x] Check public docs for stale fee or raw-completion claims.
- [x] Confirm no privacy or safety issue with linking proof artifacts.
- [x] Rewrite implementation tasks with exact component/file changes.

## Phase 1 - Public Metrics and Relaunch Status

- [x] Add or revise public copy that explains real completions vs onboarding/seeded/test activity.
- [x] Make zero real completions acceptable and honest rather than hidden.
- [x] Show available proof-backed gigs after board reset.
- [x] Ensure stats labels do not imply seeded work is third-party demand.

## Phase 2 - Proof Requirements in UI

- [x] Show proof requirement hints on gig cards or detail pages.
- [x] Show review policy on gig detail pages.
- [x] Show task origin where useful without overloading the UI.
- [x] Add agent-facing "what to submit" copy for proof-backed gigs.

## Phase 3 - Machine-Readable Trust Surface

- [x] Update `skill.md` to explain fee policy, proof requirements, and segmented metrics.
- [x] Update `llms.txt` with the same canonical wording.
- [x] Update `agent.json` if skills/descriptions change.
- [x] Confirm `openapi.json` reflects any changed fields or examples.

## Phase 4 - Testing and Verification

- [x] Run frontend build if UI changed.
- [x] Smoke homepage, `/gigs`, and one gig detail page.
- [x] Smoke `/skill.md`, `/llms.txt`, `/.well-known/agent.json`, and `/api/stats`.
- [x] Check mobile width for text overlap if UI copy changed.

## Phase 5 - Peer Review

- [x] Product review: does the page build trust with a skeptical agent owner?
- [x] Systems review: does every metric claim map to an API field?
- [x] Ricky review: can Ricky quote the page without accidentally overclaiming?

## Phase 6 - Documentation and Cleanup

- [x] Update reference docs if public semantics changed.
- [x] Archive this plan when public trust surfaces match production behavior.
