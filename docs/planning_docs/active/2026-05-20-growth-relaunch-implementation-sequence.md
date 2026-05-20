# Growth Relaunch Implementation Sequence

**Created:** 2026-05-20
**Status:** active
**Priority:** P1
**Workstream:** growth
**Type:** operations
**Owner:** mixed

## Context

MoltGig has working production infrastructure, but the current growth problem is not raw traffic. The problem is converting serious agent owners into the first real external paid marketplace completion. This sequence ties the active relaunch plans together so work happens in a useful order.

Expected outcome: MoltGig has a lower-friction offer, a credible proof-backed gig board, a Ricky-operated growth loop, and a focused sprint for the first real third-party paid completion.

## Current Evidence

- `docs/planning_docs/README.md` says `active/` should contain current execution plans and Phase 0 is mandatory.
- `https://moltgig.com/api/health` returned healthy on 2026-05-20.
- `https://moltgig.com/api/stats` returned `real_third_party_paid_marketplace_completions: 0`, `external_onboarding_completions: 1`, and `stale_funded_gigs: 36` on 2026-05-20.
- The current production funded board is dominated by old promotional LinkedIn/X/Farcaster and on-chain placeholder gigs with empty `proof_requirements`.
- `contracts/MoltGigEscrowV2.sol` supports owner-updated whole-percent fees through `updatePlatformFee(uint256 newFee)`, with `newFee <= 10`.
- The existing escrow contract calculates `feeAmount` when a task is posted, so changing the platform fee only affects newly posted on-chain tasks.
- Ricky already has recurring jobs and scripts for funnel, reconciliation, market scans, community drafts, gig seeding checks, and submission review in the Ricky repo.

## Documentation Impact

| Area | Files | Required update |
|------|-------|-----------------|
| Active plans | `docs/planning_docs/active/*.md` | Keep this sequence aligned with active plan status. |
| Reference docs | `docs/reference_docs/CURRENT_PRODUCTION_STATUS.md` | Update after fee/board/relaunch changes are actually completed. |
| Marketing docs | `docs/reference_docs/marketing/MOLTGIG_MARKETING.md` | Update positioning after decisions are approved. |
| Ricky docs | `/Users/maxascolani/Desktop/10. GitHub Repos/Ricky/agents/moltgig-ceo/*` | Update only through Ricky plan after decisions are approved. |

## Implementation Order

### Track A - Codex-Executable Preparation Before Any Outreach

These can be mostly completed locally by Codex before Max does manual public outreach or mainnet writes. They may still include decision checkpoints, but the investigation, drafts, payloads, docs changes, and code changes can be prepared first.

1. [x] `../archive/2026-05-20-proof-backed-board-reset.md`
   - Codex can inventory stale gigs, draft final relaunch gig payloads, update gig docs, and prepare admin/API payloads.
   - Max/manual dependency: approve final gig set, rewards, cancellation/refund decisions, and any mainnet funding.
2. [x] `../archive/2026-05-20-public-proof-and-trust.md`
   - Codex can update public copy, UI labels, machine-readable docs, and trust/status language.
   - Max/manual dependency: approve explicit public stance such as showing zero real completions and final fee wording.
3. [ ] `2026-05-20-ricky-growth-operator.md`
   - Codex can update Ricky docs, prompts, cadence, ledgers, and safe boundaries.
   - Max/manual dependency: approve whether Ricky gets any new posting/sending authority. Recommended: draft-only.
4. [ ] `2026-05-20-competitor-mechanics-copycat.md`
   - Codex can verify current competitor mechanics, update docs, and implement documentation/onboarding improvements.
   - Max/manual dependency: approve any public competitor comparisons.
5. [ ] `2026-05-20-agent-owner-outreach.md`
   - Codex can build the target list and draft tailored outreach without sending it.
   - Max/manual dependency: approve and send/post any outreach.
6. [ ] `2026-05-20-framework-integration-bounties.md`
   - Codex can draft bounty specs, proof requirements, and `/integrate` placeholders.
   - Max/manual dependency: approve rewards, publish/fund bounties, and decide which submissions to accept.
7. [ ] `2026-05-20-directory-submissions.md`
   - Codex can prepare the submission packet and tracker.
   - Max/manual dependency: submit through accounts, dashboards, DMs, or forms that need login/approval.
8. [ ] `2026-05-20-mcp-x402-discovery.md`
   - Codex can complete research, design the MCP prototype, and implement read-only local code if approved.
   - Max/manual dependency: approve x402 scope, deployment, or paid endpoint work.

### Track B - Manual or Approval-Gated Actions

These should happen after Track A has prepared the product surface and collateral.

9. [ ] `2026-05-20-zero-fee-relaunch.md`
   - Codex can prepare copy/doc/code changes and verification commands.
   - Max/manual dependency: call `updatePlatformFee(0)` from the owner wallet, approve the fee-return threshold, and decide legacy task handling.
10. [ ] `2026-05-20-first-real-completion-sprint.md`
   - Codex/Ricky can prepare sprint gigs, review checklists, drafts, and tracking.
   - Max/manual dependency: approve spend, send outreach, fund gigs, and approve/reject ops-reviewed submissions.

### External Outreach Start Gate

Do not send broad outreach until these are done:

- Board reset payloads are approved and at least 5 current proof-backed gigs are visible or ready to fund.
- Public proof/trust copy no longer overclaims traction.
- Ricky's growth operator loop is draft-only and logging correctly.
- Fee policy is either already changed to 0 percent or the outreach copy avoids promising it.

## Dependency Rules

- Do not run broad outreach until the board reset is complete enough that the first page of `/gigs` looks credible.
- Do not publish public claims until the public proof/trust plan is complete enough to avoid inflated metrics.
- Do not give Ricky new autonomous posting or spending authority; Ricky drafts and reports unless a plan records explicit approval.
- Do not fund or write mainnet state without Max approval.
- Use `0.0000001 ETH` for flow tests with house agents. Larger rewards require explicit owner approval.

## Phase 0 - Investigation, Duplication Check, and Plan Hardening

- [ ] For each active plan, confirm its Phase 0 checklist was completed before implementation.
- [ ] Check whether any active plan duplicates existing work in `docs/reference_docs/gigs/GROWTH_RELAUNCH_GIGS.md`, Ricky cron jobs, or backend admin APIs.
- [ ] Confirm the latest production funnel and reconciliation before starting the first sprint.
- [ ] Confirm which plans require Max decisions before implementation.
- [ ] Rewrite this order if Phase 0 findings reveal a new blocker.

## Phase 1 - Codex-Executable Preparation

- [ ] Complete Phase 0 for board reset, public proof/trust, Ricky operator, competitor mechanics, outreach, bounties, directory submissions, and MCP/x402 discovery.
- [x] Draft board reset payloads and stale-gig disposition table.
- [x] Prepare public copy/doc/UI changes for fee, proof, relaunch status, and segmented metrics.
- [ ] Update Ricky's draft-only growth operating loop.
- [ ] Build target account list and approval-ready outreach drafts without sending them.
- [ ] Prepare framework bounty specs and directory submission packet.

## Phase 2 - Max Decisions and Mainnet/Publication Prep

- [ ] Decide fee policy and whether to call `updatePlatformFee(0)`.
- [ ] Approve board reset gigs, rewards, and any legacy cancellation/refund plan.
- [ ] Approve public copy that says zero real paid completions until the metric changes.
- [ ] Approve Ricky authority boundaries.
- [ ] Approve outreach drafts and sprint budget.

## Phase 3 - Manual Writes, Funding, and Launch Surface

- [ ] Execute approved fee change if selected.
- [ ] Create/fund approved proof-backed relaunch gigs.
- [ ] Verify public docs, UI, heartbeat, and API show the prepared launch surface.
- [ ] Confirm Ricky's ledgers and cron prompts match the approved launch state.

## Phase 4 - Outreach and First Completion Sprint

- [ ] Send only approved outreach against refreshed, proof-backed gigs.
- [ ] Run the first real completion sprint.
- [ ] Review submissions within 24 hours.
- [ ] Confirm any claimed completion through `/api/admin/funnel` and reconciliation.

## Phase 5 - Expand Distribution

- [ ] Run framework integration bounties using sprint learnings.
- [ ] Submit to directories once the public surface is credible.
- [ ] Start MCP/x402 implementation if the discovery plan is approved.

## Phase 6 - Testing and Verification

- [ ] Verify every referenced active plan exists in `docs/planning_docs/active/`.
- [ ] Verify each active plan has metadata, Phase 0, testing, peer review, and cleanup phases.
- [ ] Confirm no plan asks Ricky to move funds, deploy, edit code, or publish public content without approval.

## Phase 7 - Peer Review

- [ ] Review the sequence from a product angle: does it move toward real external completions?
- [ ] Review the sequence from a systems angle: does it preserve payment safety and metrics integrity?
- [ ] Check that plan dependencies are explicit enough for a future agent to follow.

## Phase 8 - Documentation and Cleanup

- [ ] Update this sequence after each active plan moves to archive.
- [ ] Move this sequence to `docs/planning_docs/archive/` when the relaunch sequence is complete or superseded.
