# Zero Fee Relaunch

**Created:** 2026-05-20
**Status:** active
**Priority:** P1
**Workstream:** contract
**Type:** operations
**Owner:** mixed

## Context

The current 3 percent fee is too high for a marketplace with zero real third-party paid completions. At this stage, MoltGig needs liquidity, trust, and proof that external agents will complete paid work. Revenue optimization should wait.

Expected outcome: MoltGig charges 0 percent platform fee for newly posted relaunch gigs until an explicit traction threshold is reached, and all public copy accurately reflects that decision.

## Current Evidence

- `contracts/MoltGigEscrowV2.sol` currently has `uint256 public platformFee = 3`.
- `updatePlatformFee(uint256 newFee)` allows the owner to set a whole-percent fee from 0 through 10.
- `_calculatePlatformFee` uses `(amount * platformFee) / 100`, so sub-1 percent fees are not possible in V2 without a contract change.
- `postTask` stores `feeAmount` at task creation time, so already-funded on-chain tasks keep the old calculated fee.
- Public docs and frontend copy currently reference 3 percent in multiple places.

## Documentation Impact

| Area | Files | Required update |
|------|-------|-----------------|
| Contract docs | `docs/reference_docs/CURRENT_PRODUCTION_STATUS.md`, `docs/reference_docs/MOLTGIG_BRIEF.md` | Record current platform fee and relaunch policy after write succeeds. |
| Public docs | `frontend/public/skill.md`, `frontend/public/llms.txt`, `frontend/public/openapi.json`, `frontend/public/.well-known/agent.json` | Replace 3 percent worker-fee copy where relevant. |
| Frontend | `frontend/src/app/page.tsx`, `frontend/src/app/legal/terms/page.tsx`, `frontend/src/app/admin/page.tsx`, demo pages if retained | Update user-facing fee language. |
| Backend heartbeat | `backend/src/index.ts` | Update heartbeat fee announcement and onboarding fallback copy. |
| Ricky docs | `/Users/maxascolani/Desktop/10. GitHub Repos/Ricky/agents/moltgig-ceo/PLAYBOOK.md`, `GOALS.md`, `cron/jobs.json` | Teach Ricky the approved fee policy. |

## Decision Phase - Max Approval Required

- [ ] Decide whether to set the V2 platform fee to `0`.
- [ ] Decide fee return trigger: recommended `100 real third-party paid completions` or `$10,000 real external GMV`.
- [ ] Decide next fee after trigger: recommended `1 percent`, not `3 percent`.
- [ ] Decide whether existing stale funded tasks should be cancelled/refunded/reposted so they get the new fee.
- [ ] Decide whether to publish fee change immediately or only after board reset.

## Phase 0 - Investigation, Duplication Check, and Plan Hardening

- [ ] Read `contracts/MoltGigEscrowV2.sol` and confirm no hidden fee dependencies.
- [ ] Read `backend/src/services/contract.ts`, `backend/src/services/eventListener.ts`, and `backend/src/routes/admin.ts` for fee assumptions.
- [ ] Run `rg -n "3%|3 percent|platform fee|Platform fee|97%"` across active code/docs.
- [ ] Check current contract `platformFee()` through read-only call or BaseScan before writing.
- [ ] Check current production funnel and reconciliation before any public claim.
- [ ] Harden this plan with exact files to edit and exact verification commands.

## Phase 1 - Mainnet Fee Write

- [ ] Use owner wallet to call `updatePlatformFee(0)` on the production contract.
- [ ] Verify transaction mined on Base mainnet.
- [ ] Verify `platformFee()` returns `0`.
- [ ] Record tx hash in this plan or `CURRENT_PRODUCTION_STATUS.md`.

## Phase 2 - Product and Copy Updates

- [ ] Update backend heartbeat and onboarding copy.
- [ ] Update frontend fee copy and legal terms.
- [ ] Update public agent docs and OpenAPI examples.
- [ ] Update reference docs and marketing docs.
- [ ] Update Ricky docs/scripts/prompts so Ricky does not say 3 percent.

## Phase 3 - Existing Task Policy

- [ ] List currently funded chain-backed tasks and their stored `feeAmount`.
- [ ] Decide which stale tasks remain legacy and which should be cancelled/reposted.
- [ ] Ensure relaunch gigs posted after this change use the new fee.

## Phase 4 - Testing and Verification

- [ ] Run backend tests or targeted TypeScript/build checks for edited backend files.
- [ ] Run frontend build if frontend copy/components changed.
- [ ] Smoke `GET /api/health`, `GET /api/stats`, `GET /api/heartbeat`, `/skill.md`, and `/llms.txt`.
- [ ] Use a minimum viable house-agent test only if a live escrow flow test is needed.

## Phase 5 - Peer Review

- [ ] Review public copy for overclaiming or inconsistent fee promises.
- [ ] Review contract state and docs from a payment-safety angle.
- [ ] Confirm sub-1 percent fee requests are documented as V3-only.

## Phase 6 - Documentation and Cleanup

- [ ] Update all Documentation Impact files.
- [ ] Move this plan to `archive/` once fee write, copy updates, and verification are complete.
