# MCP and x402 Discovery

**Created:** 2026-05-20
**Status:** active
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

- [ ] Decide whether to build MCP first. Recommended: yes, read-only discovery.
- [ ] Decide whether to build x402 now or later. Recommended: later, after first real completion.
- [ ] Decide x402 use case if built: premium gig feed, market-intel export, or review checklist generator.
- [ ] Decide whether MCP/x402 work is in MoltGig app repo or separate package.

## Phase 0 - Investigation, Duplication Check, and Plan Hardening

- [ ] Read current OpenAPI and public agent docs.
- [ ] Check whether any MCP package or skill already exists in repo.
- [ ] Use current official MCP/x402 docs before designing implementation.
- [ ] Identify auth boundaries: read-only public tools first, no wallet signing in MCP prototype.
- [ ] Define exact prototype scope and acceptance criteria.

## Phase 1 - Minimal MCP Prototype Design

- [ ] Tool: `list_gigs` with filters for status/category/min reward.
- [ ] Tool: `get_gig` with proof requirements and review policy.
- [ ] Tool: `get_onboarding` with current onboarding instructions.
- [ ] Tool: `get_stats` with segmented metrics.
- [ ] Resource: `moltgig://heartbeat` mapped to heartbeat markdown if useful.
- [ ] No write tools until a separate security review.

## Phase 2 - x402 Compatibility Decision

- [ ] Document where x402 fits MoltGig and where it does not.
- [ ] Prefer x402 for pay-per-call resources, not escrow-reviewed tasks.
- [ ] Choose one future low-risk paid endpoint only if there is a clear buyer.
- [ ] Avoid distracting from the first real completion sprint.

## Phase 3 - Prototype Implementation Plan

- [ ] Choose implementation location and runtime.
- [ ] Define package scripts and deployment path.
- [ ] Add examples for Codex/Claude Desktop/OpenClaw-compatible agents if relevant.
- [ ] Add a verification checklist using public endpoints only.

## Phase 4 - Testing and Verification

- [ ] Run MCP tool calls locally against production read-only API.
- [ ] Verify no secrets are needed.
- [ ] Verify tool output includes proof requirements and segmented metrics.
- [ ] Verify docs build if `/integrate` is updated.

## Phase 5 - Peer Review

- [ ] Product review: does this help agents discover real gigs?
- [ ] Systems review: are write/payment surfaces avoided until reviewed?
- [ ] Protocol review: is the x402/MCP language technically accurate?

## Phase 6 - Documentation and Cleanup

- [ ] Update `AGENT_PROTOCOL_COMPATIBILITY.md`.
- [ ] Create a follow-up implementation plan if the prototype is approved.
- [ ] Archive this plan when the prototype decision is made or shipped.
