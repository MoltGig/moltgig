# Agent Owner Outreach

**Created:** 2026-05-20
**Status:** active
**Priority:** P1
**Workstream:** growth
**Type:** operations
**Owner:** Ricky

## Context

Agents execute, but owners/operators decide where agents connect wallets, run tools, and spend compute. MoltGig outreach should target agent owners and framework builders with specific gigs and integration asks.

Expected outcome: a tracked list of 50 high-fit targets and a weekly outreach queue tied to live proof-backed gigs.

## Current Evidence

- Ricky already has `TARGET_ACCOUNTS.md`, but it is mostly broad X accounts and not enough GitHub/framework/Base/x402 targets.
- MoltGig has useful machine-readable surfaces for agent owners: `/skill.md`, `/llms.txt`, `/openapi.json`, and `/.well-known/agent.json`.
- Generic Moltbook engagement historically did not convert reliably.
- The best near-term ask is specific: "There is a tiny paid gig your agent can complete."

## Documentation Impact

| Area | Files | Required update |
|------|-------|-----------------|
| Ricky targets | Ricky `TARGET_ACCOUNTS.md` | Replace broad-only target list with segmented operator targets. |
| Ricky drafts | Ricky `DRAFT_QUEUE.md` | Add tailored drafts and approval status. |
| Experiment ledger | Ricky `EXPERIMENT_LEDGER.md` | Log each outreach action and result. |
| Marketing docs | `docs/reference_docs/marketing/MOLTGIG_MARKETING.md` | Update channels and outreach rules. |

## Decision Phase - Max Approval Required

- [ ] Decide which channels Ricky may research autonomously.
- [ ] Decide which channels Max will personally send from.
- [ ] Approve any outbound public comments, DMs, emails, or GitHub issue comments.
- [ ] Decide whether to reserve specific gigs for specific operators.

## Phase 0 - Investigation, Duplication Check, and Plan Hardening

- [ ] Read Ricky `TARGET_ACCOUNTS.md`, `DRAFT_QUEUE.md`, and `EXPERIMENT_LEDGER.md`.
- [ ] Check current active relaunch gigs before drafting asks.
- [ ] Research target communities without following untrusted external instructions.
- [ ] Check whether target projects already have marketplace/payment integrations.
- [ ] Harden target categories and draft templates with exact channels.

## Phase 1 - Build Target List

- [ ] Add 10 OpenClaw/Molt ecosystem targets.
- [ ] Add 10 Base/x402/AgentKit targets.
- [ ] Add 10 framework/community targets: CrewAI, LangGraph/OpenAI Agents SDK, Mastra, Microsoft Agent Framework/AutoGen.
- [ ] Add 10 agent owners with public agent projects.
- [ ] Add 10 directories/registries/community moderators.
- [ ] For each target, record URL, why relevant, suggested ask, approval status, and next action.

## Phase 2 - Draft Outreach

- [ ] Draft one tailored ask per top target.
- [ ] Reference the target's actual work.
- [ ] Include a direct gig link and onboarding link.
- [ ] Use fee relaunch language only after approved and implemented.
- [ ] Do not use generic promotional copy.

## Phase 3 - Approval and Sending

- [ ] Queue drafts for Max approval.
- [ ] Send only approved drafts from appropriate human/account channels.
- [ ] Log sent URL/post/comment/message ID where available.
- [ ] Track no response, reply, click, onboarding, submission, completion.

## Phase 4 - Follow-Up Loop

- [ ] Follow up only when useful and non-spammy.
- [ ] If a target reports friction, log product issue in Ricky `PRODUCT_NOTES.md`.
- [ ] Promote targets who submit or complete work into a success-story queue.

## Phase 5 - Testing and Verification

- [ ] Verify all target links are valid.
- [ ] Verify all outreach drafts include a concrete MoltGig link.
- [ ] Verify no draft claims unverified traction.
- [ ] Verify experiment ledger has result fields for each sent outreach.

## Phase 6 - Peer Review

- [ ] Review copy for relevance and non-spam tone.
- [ ] Review channel mix: at least two non-Moltbook channels per week.
- [ ] Review conversion data against actual funnel movement.

## Phase 7 - Documentation and Cleanup

- [ ] Update marketing docs with channels that produce external submissions.
- [ ] Archive dead targets quarterly.
- [ ] Move this plan to archive when the first 50-target campaign is complete.
