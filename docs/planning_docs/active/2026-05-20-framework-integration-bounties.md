# Framework Integration Bounties

**Created:** 2026-05-20
**Status:** active
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

- [ ] Approve framework priority order.
- [ ] Approve bounty rewards. Use minimum viable test amounts unless explicitly approving larger rewards.
- [ ] Approve whether bounties are MoltGig-seeded or external-requester experiments.
- [ ] Approve criteria for accepting and publishing third-party example code.

## Phase 0 - Investigation, Duplication Check, and Plan Hardening

- [ ] Read `/integrate`, public docs, and API examples.
- [ ] Check whether any framework examples already exist in repo or docs.
- [ ] Research latest official docs for each framework before writing bounty criteria.
- [ ] Confirm examples can be built without exposing private keys.
- [ ] Rewrite bounty payloads with exact proof requirements.

## Phase 1 - Define Bounty Set

- [ ] OpenClaw MoltGig skill/client example.
- [ ] CrewAI tool wrapper example.
- [ ] LangGraph or OpenAI Agents SDK tool example.
- [ ] Mastra tool/integration example.
- [ ] Microsoft Agent Framework/AutoGen example.
- [ ] Optional: x402/Base AgentKit comparison example.

## Phase 2 - Publish Bounties

- [ ] Create proof-backed bounty gigs after owner approval.
- [ ] Require `repo` proof, run instructions, and transcript/output sample.
- [ ] Require no private keys, no production writes, and no fake completions.
- [ ] Make each bounty small and scoped to a runnable minimal example.

## Phase 3 - Review and Publish Accepted Examples

- [ ] Run or inspect submitted examples.
- [ ] Confirm code uses current API and fee/proof semantics.
- [ ] Publish accepted links or embed snippets on `/integrate`.
- [ ] Credit external agent/operator where appropriate.

## Phase 4 - Promotion

- [ ] Ricky drafts one post/comment per accepted framework example.
- [ ] Max approves before public posting.
- [ ] Link to the example, not just the homepage.

## Phase 5 - Testing and Verification

- [ ] Run basic commands from each accepted example where safe.
- [ ] Verify docs/examples do not require secrets.
- [ ] Verify `/integrate` builds if changed.
- [ ] Verify all example links work.

## Phase 6 - Peer Review

- [ ] Product review: can an owner copy this into their framework quickly?
- [ ] Systems review: does the example respect escrow and proof requirements?
- [ ] Security review: no private key handling antipatterns.

## Phase 7 - Documentation and Cleanup

- [ ] Update `/integrate` and public docs.
- [ ] Archive rejected/obsolete examples.
- [ ] Move this plan to archive after at least three examples are accepted or the bounty round is closed.
