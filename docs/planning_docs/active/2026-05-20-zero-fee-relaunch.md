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

- [x] Decide whether to set the V2 platform fee to `0`. Max approved 0% on 2026-05-20.
- [x] Decide fee return trigger: Max approved a first-100-gigs guarantee direction on 2026-05-20. Operational definition: keep platform fee at 0% until at least the first 100 newly posted relaunch gigs have been completed or the owner explicitly extends the guarantee.
- [ ] Decide next fee after trigger: recommended `1 percent`, not `3 percent`.
- [ ] Decide whether existing stale funded tasks should be cancelled/refunded/reposted so they get the new fee.
- [x] Decide whether to publish fee change immediately or only after board reset. Publish after verified fee write; verified on 2026-05-20.

## Codex-Prepared Owner Action Packet - 2026-05-20

Recommended decision:

- Set V2 platform fee to `0` for newly posted relaunch gigs.
- Keep it at `0` for at least the first 100 newly posted relaunch gigs.
- Reintroduce at `1 percent`, not `3 percent`, only after the trigger and a separate owner decision.
- Verified on 2026-05-20: `platformFee()` reads `0` on the production contract.
- Contract nuance: V2 does not enforce a per-gig promotional counter. This is an owner/operator guarantee backed by keeping the global `platformFee` at `0` until the guarantee is satisfied or explicitly extended.

Owner-wallet action, completed 2026-05-20:

```text
Contract: 0xf605936078F3d9670780a9582d53998a383f8020
Network: Base mainnet
Method: updatePlatformFee(uint256 newFee)
newFee: 0
Transaction: 0xef5ed0d0ed6d1a6a131b6ff51b2f502b83809d985004d5bdbd50d6713a03503c
Block: 46231729
```

Verification required before any public fee claim:

1. [x] Read `platformFee()` from the production contract and confirm it returns `0`.
2. [x] Record the transaction hash in `docs/reference_docs/CURRENT_PRODUCTION_STATUS.md`.
3. [ ] Confirm newly posted on-chain tasks calculate `feeAmount` as `0`; existing tasks keep their stored `feeAmount`.
4. [x] Update public copy from "check current fee terms" to "0 percent platform fee for new relaunch gigs" only after the read succeeds.

Pre-approved safe language before the write:

> MoltGig is considering a zero-fee relaunch for new gigs. Current fee terms are published in the app and contract; do not rely on the proposed fee until the owner transaction is executed and verified.

Pre-approved safe language after a verified write:

> MoltGig is running a 0% platform-fee relaunch for at least the first 100 newly posted relaunch gigs. Existing on-chain tasks may retain the fee calculated when they were created; check the task and contract state before claiming.

## Phase 0 - Investigation, Duplication Check, and Plan Hardening

- [ ] Read `contracts/MoltGigEscrowV2.sol` and confirm no hidden fee dependencies.
- [ ] Read `backend/src/services/contract.ts`, `backend/src/services/eventListener.ts`, and `backend/src/routes/admin.ts` for fee assumptions.
- [ ] Run `rg -n "3%|3 percent|platform fee|Platform fee|97%"` across active code/docs.
- [ ] Check current contract `platformFee()` through read-only call or BaseScan before writing.
- [ ] Check current production funnel and reconciliation before any public claim.
- [ ] Harden this plan with exact files to edit and exact verification commands.

## Phase 1 - Mainnet Fee Write

- [x] Use owner wallet to call `updatePlatformFee(0)` on the production contract.
- [x] Verify transaction mined on Base mainnet.
- [x] Verify `platformFee()` returns `0`.
- [x] Record tx hash in this plan or `CURRENT_PRODUCTION_STATUS.md`.

## Phase 2 - Product and Copy Updates

- [x] Update backend heartbeat and onboarding copy.
- [x] Update frontend fee copy and legal terms.
- [x] Update public agent docs and OpenAPI examples.
- [x] Update reference docs and marketing docs.
- [x] Update Ricky docs/scripts/prompts so Ricky does not say 3 percent.

## Phase 3 - Existing Task Policy

- [ ] List currently funded chain-backed tasks and their stored `feeAmount`.
- [ ] Decide which stale tasks remain legacy and which should be cancelled/reposted.
- [ ] Ensure relaunch gigs posted after this change use the new fee.

## Phase 4 - Testing and Verification

- [x] Run backend tests or targeted TypeScript/build checks for edited backend files.
- [x] Run frontend build if frontend copy/components changed.
- [ ] Smoke `GET /api/health`, `GET /api/stats`, `GET /api/heartbeat`, `/skill.md`, and `/llms.txt` after deployment.
- [ ] Use a minimum viable house-agent test only if a live escrow flow test is needed.

## Phase 5 - Peer Review

- [ ] Review public copy for overclaiming or inconsistent fee promises.
- [ ] Review contract state and docs from a payment-safety angle.
- [ ] Confirm sub-1 percent fee requests are documented as V3-only.

## Phase 6 - Documentation and Cleanup

- [ ] Update all Documentation Impact files.
- [ ] Move this plan to `archive/` once fee write, copy updates, and verification are complete.
