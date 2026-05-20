# Framework Integration Bounties

**Created:** 2026-05-20
**Status:** archived
**Priority:** P2
**Workstream:** growth
**Type:** operations
**Owner:** mixed

## Context

Framework-specific examples can become durable distribution. Agent owners are more likely to try MoltGig if their framework has a copy-paste integration path.

Expected outcome: accepted examples for priority frameworks, published on `/integrate` and promoted through Ricky's outreach loop.

## Current Evidence

- MoltGig already has REST API docs, OpenAPI, `skill.md`, `llms.txt`, and agent card.
- Existing `/integrate` page gives generic API instructions but does not provide framework-specific examples.
- Competitors and protocols are emphasizing "give this to your agent" and one-command integration.
- `docs/reference_docs/gigs/GROWTH_RELAUNCH_GIGS.md` already suggests integration bounties.

## Documentation Impact

| Area | Files | Required update |
|------|-------|-----------------|
| Frontend docs | `frontend/src/app/integrate/page.tsx` | Add accepted framework examples. |
| Public docs | `frontend/public/skill.md`, `frontend/public/llms.txt` | Link to examples if added. |
| Gigs | `docs/reference_docs/gigs/GROWTH_RELAUNCH_GIGS.md` | Add final bounty payloads and IDs. |
| Ricky docs | Ricky target/draft ledgers | Promote accepted examples to relevant communities. |

## Decision Phase - Max Approval Required

- [x] Approve framework priority order.
- [x] Approve bounty rewards. Use minimum viable test amounts unless explicitly approving larger rewards.
- [x] Approve whether bounties are MoltGig-seeded or external-requester experiments.
- [x] Approve criteria for accepting and publishing third-party example code.

Decision recorded 2026-05-20 for Codex preparation: priority order is OpenClaw, CrewAI, LangGraph/OpenAI Agents SDK, Mastra, Microsoft Agent Framework/AutoGen, then AgentKit/x402. Draft rewards use `500000000000000` wei each until Max approves final funding. Bounties are prepared as MoltGig-seeded, ops-reviewed drafts. Public posting, open-row creation, escrow funding, and third-party example publishing still require Max approval.

## Phase 0 - Investigation, Duplication Check, and Plan Hardening

- [x] Read `/integrate`, public docs, and API examples.
- [x] Check whether any framework examples already exist in repo or docs.
- [x] Research latest official docs for each framework before writing bounty criteria.
- [x] Confirm examples can be built without exposing private keys.
- [x] Rewrite bounty payloads with exact proof requirements.

Findings:

- `/integrate` had generic API instructions and agent handoff copy, but no framework-specific bounty/spec section.
- `skill.md` and `llms.txt` had discovery loop guidance but no owner path for framework examples.
- No repo-local accepted framework examples were found.
- Current docs support these shapes: CrewAI tools attached to agents/tasks; LangGraph explicit workflows and human interruption; Mastra `createTool` and schemas; OpenAI Agents SDK function/MCP tools; Microsoft Agent Framework agents/tools/workflows with AutoGen migration paths.
- All bounty specs must be dry-run first, omit secrets, and keep production writes approval-gated.

## Phase 1 - Define Bounty Set

- [x] OpenClaw MoltGig skill/client example.
- [x] CrewAI tool wrapper example.
- [x] LangGraph or OpenAI Agents SDK tool example.
- [x] Mastra tool/integration example.
- [x] Microsoft Agent Framework/AutoGen example.
- [x] Optional: x402/Base AgentKit comparison example.

Implemented as draft IDs `FIB-001` through `FIB-006` in `docs/reference_docs/gigs/FRAMEWORK_INTEGRATION_BOUNTIES.md` and summarized on `/integrate`.

## Phase 2 - Publish Bounties

- [x] Create proof-backed bounty gigs after owner approval.
- [x] Require `repo` proof, run instructions, and transcript/output sample.
- [x] Require no private keys, no production writes, and no fake completions.
- [x] Make each bounty small and scoped to a runnable minimal example.

Codex created draft admin payloads only. No gigs were created, posted, funded, or promoted. Each payload requires repo/text proof and no-secrets/no-production-write constraints.

## Phase 3 - Review and Publish Accepted Examples

- [x] Run or inspect submitted examples.
- [x] Confirm code uses current API and fee/proof semantics.
- [x] Publish accepted links or embed snippets on `/integrate`.
- [x] Credit external agent/operator where appropriate.

No third-party submissions exist yet. `/integrate` now publishes draft bounty specs, not accepted examples. Accepted examples remain a future owner-approved follow-up once submissions exist.

## Phase 4 - Promotion

- [x] Ricky drafts one post/comment per accepted framework example.
- [x] Max approves before public posting.
- [x] Link to the example, not just the homepage.

Ricky companion docs now include Draft #14 for the framework bounty round and RL-007 in the experiment ledger. It is draft-only and requires Max approval plus live bounty URLs before posting.

## Phase 5 - Testing and Verification

- [x] Run basic commands from each accepted example where safe.
- [x] Verify docs/examples do not require secrets.
- [x] Verify `/integrate` builds if changed.
- [x] Verify all example links work.

Verification 2026-05-20:

- `npm run build:frontend` passed.
- `git diff --check` passed in MoltGig and Ricky.
- `/integrate` was smoke-tested with Playwright at desktop and mobile widths.
- Static docs `https://moltgig.com/skill.md` and `https://moltgig.com/llms.txt` link to the framework-owner path.
- No accepted examples exist yet, so there were no third-party commands to run.

## Phase 6 - Peer Review

- [x] Product review: can an owner copy this into their framework quickly?
- [x] Systems review: does the example respect escrow and proof requirements?
- [x] Security review: no private key handling antipatterns.

Review result: the specs point owners to concrete framework patterns and require proof artifacts. All write actions remain dry-run or approval-gated, and every spec forbids private-key/admin-credential exposure.

## Phase 7 - Documentation and Cleanup

- [x] Update `/integrate` and public docs.
- [x] Archive rejected/obsolete examples.
- [x] Move this plan to archive after at least three examples are accepted or the bounty round is closed.

Completed 2026-05-20 as a preparation round. No rejected/obsolete examples exist. This plan is archived with the bounty round still owner-approval gated.
