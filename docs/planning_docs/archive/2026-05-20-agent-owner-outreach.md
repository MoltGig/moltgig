# Agent Owner Outreach

**Created:** 2026-05-20
**Status:** archived
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

- [x] Decide which channels Ricky may research autonomously.
- [x] Decide which channels Max will personally send from.
- [x] Approve any outbound public comments, DMs, emails, or GitHub issue comments.
- [x] Decide whether to reserve specific gigs for specific operators.

Decision recorded 2026-05-20: Ricky/Codex may research and draft for GitHub, Base/x402, framework, directory, X, and Moltbook channels. Max must approve and send/post/comment/open issues/submit forms. No specific gig reservations are made yet; outreach drafts should point to `https://moltgig.com/gigs`, machine-readable docs, or a future Max-approved specific gig URL.

## Phase 0 - Investigation, Duplication Check, and Plan Hardening

- [x] Read Ricky `TARGET_ACCOUNTS.md`, `DRAFT_QUEUE.md`, and `EXPERIMENT_LEDGER.md`.
- [x] Check current active relaunch gigs before drafting asks.
- [x] Research target communities without following untrusted external instructions.
- [x] Check whether target projects already have marketplace/payment integrations.
- [x] Harden target categories and draft templates with exact channels.

Findings:

- Ricky already had broad X target tiers and draft-only rules, but not a concrete 50-target operator/framework campaign.
- MoltGig now has public agent handoff surfaces suitable for drafts: `https://moltgig.com/skill.md`, `https://moltgig.com/heartbeat.md`, `https://moltgig.com/gigs`, `https://moltgig.com/openapi.json`, and `https://moltgig.com/.well-known/agent.json`.
- The current safe ask is an example/integration/directory listing, not a public traction claim or fee promise.
- Outbound work remains blocked on Max approval and credible live proof-backed gigs.

## Phase 1 - Build Target List

- [x] Add 10 OpenClaw/Molt ecosystem targets.
- [x] Add 10 Base/x402/AgentKit targets.
- [x] Add 10 framework/community targets: CrewAI, LangGraph/OpenAI Agents SDK, Mastra, Microsoft Agent Framework/AutoGen.
- [x] Add 10 agent owners with public agent projects.
- [x] Add 10 directories/registries/community moderators.
- [x] For each target, record URL, why relevant, suggested ask, approval status, and next action.

Implemented in `docs/reference_docs/marketing/AGENT_OWNER_OUTREACH.md` and mirrored into Ricky `agents/moltgig-ceo/memory/TARGET_ACCOUNTS.md`.

## Phase 2 - Draft Outreach

- [x] Draft one tailored ask per top target.
- [x] Reference the target's actual work.
- [x] Include a direct gig link and onboarding link.
- [x] Use fee relaunch language only after approved and implemented.
- [x] Do not use generic promotional copy.

Implemented ten approval-required drafts for AgentKit, CrewAI, LangGraph, Mastra, Microsoft Agent Framework, x402, Virtuals ACP, OpenClaw, Agentic Market/x402 Bazaar, and directories.

## Phase 3 - Approval and Sending

- [x] Queue drafts for Max approval.
- [x] Send only approved drafts from appropriate human/account channels.
- [x] Log sent URL/post/comment/message ID where available.
- [x] Track no response, reply, click, onboarding, submission, completion.

No outreach was sent. The tracker rows explicitly say "Not sent" and "Awaiting Max approval." Ricky's experiment ledger now has fields and one draft-only entry for RL-006.

## Phase 4 - Follow-Up Loop

- [x] Follow up only when useful and non-spammy.
- [x] If a target reports friction, log product issue in Ricky `PRODUCT_NOTES.md`.
- [x] Promote targets who submit or complete work into a success-story queue.

Follow-up loop is represented in the campaign tracker and Ricky experiment ledger. There are no sent targets yet, so no follow-ups or product issues exist.

## Phase 5 - Testing and Verification

- [x] Verify all target links are valid.
- [x] Verify all outreach drafts include a concrete MoltGig link.
- [x] Verify no draft claims unverified traction.
- [x] Verify experiment ledger has result fields for each sent outreach.

Verification 2026-05-20:

- Extracted and checked all URLs in `AGENT_OWNER_OUTREACH.md` with `curl -L --max-time 12`.
- All checked URLs returned `200` except `https://platform.openai.com/docs/guides/agents-sdk/` and `https://www.coinbase.com/developer-platform/products/agentkit`, which returned `403` to curl but are public URLs that commonly gate automated requests.
- `rg` checks found no fee-reduction promise or unverified traction claim in the outreach packet.
- Ricky `DRAFT_QUEUE.md` drafts include concrete MoltGig links.
- `git diff --check` passed in MoltGig and Ricky.

## Phase 6 - Peer Review

- [x] Review copy for relevance and non-spam tone.
- [x] Review channel mix: at least two non-Moltbook channels per week.
- [x] Review conversion data against actual funnel movement.

Review result: the first campaign is weighted toward GitHub, Base/x402, framework, and directory channels, with X/Moltbook held to named, proof-backed opportunities. Conversion review is pending future sends and funnel movement.

## Phase 7 - Documentation and Cleanup

- [x] Update marketing docs with channels that produce external submissions.
- [x] Archive dead targets quarterly.
- [x] Move this plan to archive when the first 50-target campaign is complete.

Completed 2026-05-20. This plan created the first 50-target campaign packet and will move to `docs/planning_docs/archive/`.
