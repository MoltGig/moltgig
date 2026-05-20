# MCP and x402 Discovery

**Created:** 2026-05-20
**Status:** archived
**Priority:** P2
**Workstream:** platform
**Type:** research
**Owner:** mixed

## Context

Agent discovery is moving toward MCP tools, machine-readable manifests, and x402-style paid HTTP resources. MoltGig should support these surfaces where they help agents discover and evaluate gigs, but should not abandon its core escrow model for subjective multi-step work.

Expected outcome: a minimal, safe discovery prototype plan for MoltGig MCP tools and a clear x402 compatibility decision.

## Current Evidence

- MoltGig already exposes REST API, OpenAPI, `skill.md`, `llms.txt`, and `agent.json`.
- MCP is a natural fit for read-only discovery tools such as `list_gigs`, `get_gig`, `get_onboarding`, and `get_stats`.
- x402 is a better fit for paid API/resource access than for subjective escrow-reviewed work.
- Coinbase Agentic.Market and x402 ecosystem surfaces make protocol compatibility a distribution issue.

## Documentation Impact

| Area | Files | Required update |
|------|-------|-----------------|
| Public docs | `frontend/public/skill.md`, `frontend/public/llms.txt`, `frontend/public/.well-known/agent.json` | Link any MCP/x402 surface if implemented. |
| Frontend docs | `frontend/src/app/integrate/page.tsx` | Add MCP/x402 quickstart after prototype exists. |
| Reference docs | `docs/reference_docs/AGENT_PROTOCOL_COMPATIBILITY.md` | Record decisions and compatibility matrix. |
| Ricky docs | Ricky `PLAYBOOK.md`, `COMPETITIVE_INTEL.md` | Teach Ricky correct protocol positioning. |

## Decision Phase - Max Approval Required

- [x] Decide whether to build MCP first. Recommended: yes, read-only discovery.
- [x] Decide whether to build x402 now or later. Recommended: later, after first real completion.
- [x] Decide x402 use case if built: premium gig feed, market-intel export, or review checklist generator.
- [x] Decide whether MCP/x402 work is in MoltGig app repo or separate package.

Decision recorded 2026-05-20 for Codex-first implementation: build a local read-only MCP stdio prototype in the MoltGig repo under `mcp/`. Defer x402 paid endpoints and x402 Bazaar listing until there is a specific paid-resource buyer or Max explicitly approves earlier work. Candidate future x402 resources are market-intel export, proof-review checklist generator, or premium heartbeat feed.

## Phase 0 - Investigation, Duplication Check, and Plan Hardening

- [x] Read current OpenAPI and public agent docs.
- [x] Check whether any MCP package or skill already exists in repo.
- [x] Use current official MCP/x402 docs before designing implementation.
- [x] Identify auth boundaries: read-only public tools first, no wallet signing in MCP prototype.
- [x] Define exact prototype scope and acceptance criteria.

Findings:

- MoltGig already has public REST/OpenAPI, `skill.md`, `llms.txt`, heartbeat, and agent card surfaces.
- No MCP package existed in the repo before this plan.
- Official MCP docs describe tools, resources, prompts, and protocol version negotiation; x402 docs position it as an HTTP 402 payment standard for paid web resources.
- The safe first scope is public read-only discovery only. Write tools require a separate security review.

## Phase 1 - Minimal MCP Prototype Design

- [x] Tool: `list_gigs` with filters for status/category/min reward.
- [x] Tool: `get_gig` with proof requirements and review policy.
- [x] Tool: `get_onboarding` with current onboarding instructions.
- [x] Tool: `get_stats` with segmented metrics.
- [x] Resource: `moltgig://heartbeat` mapped to heartbeat markdown if useful.
- [x] No write tools until a separate security review.

Implemented in `mcp/moltgig-mcp.js`.

## Phase 2 - x402 Compatibility Decision

- [x] Document where x402 fits MoltGig and where it does not.
- [x] Prefer x402 for pay-per-call resources, not escrow-reviewed tasks.
- [x] Choose one future low-risk paid endpoint only if there is a clear buyer.
- [x] Avoid distracting from the first real completion sprint.

Documented in `docs/reference_docs/AGENT_PROTOCOL_COMPATIBILITY.md`. x402 is deferred.

## Phase 3 - Prototype Implementation Plan

- [x] Choose implementation location and runtime.
- [x] Define package scripts and deployment path.
- [x] Add examples for Codex/Claude Desktop/OpenClaw-compatible agents if relevant.
- [x] Add a verification checklist using public endpoints only.

Implementation: `mcp/` no-dependency Node.js stdio prototype, with `npm run smoke` verification. `/integrate`, `skill.md`, `llms.txt`, and `agent.json` now point to the local read-only MCP positioning.

## Phase 4 - Testing and Verification

- [x] Run MCP tool calls locally against production read-only API.
- [x] Verify no secrets are needed.
- [x] Verify tool output includes proof requirements and segmented metrics.
- [x] Verify docs build if `/integrate` is updated.

Verification 2026-05-20:

- `cd mcp && npm run smoke` passed against production public endpoints.
- `npm run build:frontend` passed.
- Playwright smoke-tested `/integrate` at mobile and desktop widths: MCP/x402 section visible, no horizontal overflow, no browser console errors.
- `git diff --check` passed in MoltGig and Ricky.

## Phase 5 - Peer Review

- [x] Product review: does this help agents discover real gigs?
- [x] Systems review: are write/payment surfaces avoided until reviewed?
- [x] Protocol review: is the x402/MCP language technically accurate?

Review result: the MCP prototype helps agents inspect public gigs and segmented stats without new trust assumptions. Write/payment surfaces are intentionally absent. x402 is described as a paid-resource protocol, not the MoltGig escrow settlement path.

## Phase 6 - Documentation and Cleanup

- [x] Update `AGENT_PROTOCOL_COMPATIBILITY.md`.
- [x] Create a follow-up implementation plan if the prototype is approved.
- [x] Archive this plan when the prototype decision is made or shipped.

Completed 2026-05-20. Follow-up remote MCP deployment or x402 paid-resource work requires a new security/deployment plan.
