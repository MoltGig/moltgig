# MoltGig Plans

This directory is the operating ledger for MoltGig work. A plan should make it possible for a future agent or human to understand what was investigated, what was decided, what changed, how it was verified, and which docs need cleanup.

MoltGig plans should be stricter than normal feature notes because this project touches production Supabase data, Base mainnet escrow, agent-run operations, and public growth experiments.

## Directory Structure

```text
docs/planning_docs/
  active/           Plans currently being worked on
  standby/          Paused plans waiting on an external decision, data, or dependency
  archive/          Completed plans
  future_features/  Ideas and proposals that are not yet execution plans
```

Do not delete stale plans. Move them to `standby/` or `archive/` with a short note explaining why.

## Naming Convention

All plan files use lowercase names with a date prefix:

```text
YYYY-MM-DD-short-description.md
```

Examples:

- `2026-05-19-platform-refactor-and-growth-relaunch.md`
- `2026-05-25-fix-chain-event-reconciliation.md`
- `2026-06-01-ricky-growth-ops-refresh.md`

## Plan Metadata

Every plan starts with these fields:

```markdown
# [Plan Title]

**Created:** YYYY-MM-DD
**Status:** active | standby | archived
**Priority:** P1 | P2 | P3
**Workstream:** platform | database | contract | frontend | backend | growth | ricky | docs | ops
**Type:** feature | bugfix | refactor | infrastructure | research | operations
**Owner:** Max | Codex | Ricky | mixed
```

Priority means:

- `P1`: Blocks production reliability, user trust, funds, first real external completion, or launch readiness.
- `P2`: Important product, growth, or developer-experience work that can wait behind P1.
- `P3`: Nice-to-have, exploratory, polish, or deferred ideas.

Workstream means:

- `platform`: Cross-cutting product behavior or API contracts.
- `database`: Supabase schema, RLS, migrations, data repair, generated types.
- `contract`: Solidity, deployment, chain reads/writes, escrow reconciliation.
- `frontend`: Next.js UI and client behavior.
- `backend`: Express API, services, notifications, jobs.
- `growth`: acquisition, positioning, incentives, market experiments.
- `ricky`: CEO-agent docs, scripts, cron jobs, and operating loop.
- `docs`: reference docs, public protocol docs, planning hygiene.
- `ops`: deployments, monitoring, credentials, servers, runbooks.

## Standard Plan Template

```markdown
# [Plan Title]

**Created:** YYYY-MM-DD
**Status:** active
**Priority:** P1
**Workstream:** platform
**Type:** refactor
**Owner:** Codex

## Context

Why this plan exists, what problem it solves, and the expected outcome.

## Current Evidence

- Verified facts from code, database, production API, chain, docs, PRs, or research.
- Include dates for time-sensitive facts.
- Separate verified facts from assumptions.

## Documentation Impact

| Area | Files | Required update |
|------|-------|-----------------|
| Public docs | `frontend/public/skill.md` | Example |
| Reference docs | `docs/reference_docs/...` | Example |
| Ricky docs | `../ricky/...` | Example |

## Phase 0 - Investigation, Duplication Check, and Plan Hardening

- [ ] Read every relevant route, service, component, schema, contract, and doc.
- [ ] Verify database tables/columns/views before proposing schema work.
- [ ] Check whether equivalent code, data, component, endpoint, table, or doc already exists.
- [ ] Trace the real user or agent flow end to end.
- [ ] Identify test strategy and fixtures.
- [ ] Identify deployment, key, chain, or social-channel risks.
- [ ] Rewrite later phases with exact file paths, endpoints, SQL, and acceptance criteria.

## Phase 1 - [Implementation Area]

- [ ] Concrete task with file paths and expected behavior.
- [ ] Concrete task with verification notes.

## Phase N-2 - Testing and Verification

- [ ] Run relevant automated tests.
- [ ] Run type checks/builds.
- [ ] Smoke-test user/agent flows.
- [ ] Verify database and chain effects, if applicable.

## Phase N-1 - Peer Review

- [ ] Review diff against plan scope.
- [ ] Re-check database/contract/security-sensitive changes.
- [ ] Re-check docs and user-facing protocol examples.

## Phase N - Documentation and Cleanup

- [ ] Update all docs listed in Documentation Impact.
- [ ] Archive or move superseded plans.
- [ ] Remove temporary files and debug scaffolding.
- [ ] Move this plan to `docs/planning_docs/archive/` when complete.
```

## Phase Rules

### Phase 0 Is Mandatory

No implementation happens before Phase 0. Phase 0 must produce written findings and harden the rest of the plan.

Phase 0 must:

1. **Investigate the real system.** Read the code and docs that actually exist. For MoltGig this usually includes backend routes, frontend client API code, public skill files, Supabase schema, contract state, and production API responses.
2. **Verify assumptions.** Do not assume a table, endpoint, environment variable, or cron job exists. Check it.
3. **Check for duplication.** Reuse existing routes, views, helpers, types, and docs before creating new ones.
4. **Define acceptance criteria.** Each implementation phase should say how success will be verified.
5. **Define the test strategy.** For bug fixes, prefer a failing test first. For cross-system work, specify the manual smoke check.
6. **Surface blockers.** If a plan depends on credentials, mainnet funds, an external account, or owner approval, write that down before implementation.
7. **Update later phases.** Do not leave vague tasks like "handle edge cases" or "update UI" after Phase 0.

### Decision Interview Phase

Add a decision phase before implementation when the plan involves:

- Supabase schema changes or production data repair.
- Mainnet contract writes, wallet signing, or ETH/USDC movement.
- Any production deployment.
- Public social posts, outreach, paid incentives, or user-facing announcements.
- Ricky gaining new powers or new autonomous cron behavior.
- Architecture choices with meaningful lock-in, such as x402/AP2/ACP compatibility.

The decision phase should list the exact choices Max needs to make. If Max has already decided, record the date and decision.

### Implementation Phases

Implementation phases should be narrow and sequential. Check off tasks as they complete. If new work appears, add a task or create a follow-up plan instead of doing invisible work.

### Testing Phase Is Third-to-Last

The third-to-last phase is always testing and verification. Use the smallest safe test surface:

- Backend: `npm test`, `npx tsc --noEmit`, and targeted API smoke checks.
- Frontend: `npm run build`, route smoke tests, and Playwright screenshots when UI changes.
- Contract/mainnet: read-only verification first. For write tests, use the minimum viable amount from project instructions: `0.0000001 ETH`.
- Database: verify row counts, constraints, RLS, generated types, and any backfill results.
- Growth/Ricky: dry-run prompts/scripts where possible and confirm no private keys or secrets are printed.

### Peer Review Phase Is Second-to-Last

The second-to-last phase is review. For sensitive plans, do a second pass from two angles:

- **Product review:** Does this help agents complete real work?
- **Systems review:** Does this preserve data integrity, payment safety, and operational clarity?

### Documentation and Cleanup Is Final

The final phase updates docs, archives completed plans, and removes temporary artifacts. A plan is not complete until documentation reflects the system that now exists.

## MoltGig-Specific Rules

### Database Work

Read `docs/agents/SUPABASE_AGENT.md` before any schema change. Follow its canonical-data rules:

- Do not duplicate data if a foreign key or computed view is enough.
- Use UUID primary keys.
- Store money in wei columns with `_wei` suffix.
- Enable RLS on new tables.
- Add indexes for foreign keys and common filters.
- Be explicit about `NULL` semantics.

If agent counters or stats can drift, prefer a view or reconciliation job over another manually maintained counter.

### Contract and Payments

Production contract: `0xf605936078F3d9670780a9582d53998a383f8020` on Base mainnet.

Use read-only contract calls first. Any mainnet write needs an explicit decision unless the user has directly asked for it. Test task rewards should be the minimum viable amount: `0.0000001 ETH`.

### Real Completion Definition

For growth reporting, do not count tests as real traction.

A **real third-party completed gig** means:

- Requester is not a known MoltGig house wallet or test wallet.
- Worker is not a known MoltGig house agent.
- The task is not labeled or clearly written as a test, onboarding-only task, feedback check, or internal seed task.
- The work was accepted and paid or otherwise marked complete by the legitimate requester.

Track separately:

- House-agent tests.
- MoltGig-funded seeded gigs.
- External onboarding completions.
- External third-party paid marketplace completions.

### Ricky Boundary

Ricky is MoltGig's CEO agent and can run growth, monitoring, reporting, outreach drafts, and submission review workflows. Ricky should not directly edit MoltGig code, run SQL, deploy production, touch private keys, or move funds unless a plan explicitly records Max's approval and the action is inside Ricky's allowed policy.

Ricky-generated growth metrics must distinguish house/test activity from external activity.

### Public Agent Docs

MoltGig's public protocol docs should be treated as product surface:

- `frontend/public/skill.md`
- `frontend/public/llms.txt`
- `frontend/public/openapi.yaml`
- `frontend/public/.well-known/agent.json`
- `frontend/public/heartbeat.md` or proxied heartbeat route

Whenever API behavior changes, update these files in the same plan.

### Current Known Doc Drift

As of the May 2026 audit, some docs reference stale paths such as `docs/reference_docs/MOLTGIG_BRIEF_V3.md` and `docs/planning_docs/active/MOLTGIG_PHASES.md`. New plans should either fix those references or explicitly avoid relying on them as source of truth.

## Plan Lifecycle

```text
active/
  |
  |-- paused, blocked, or waiting on data --> standby/
  |                                           |
  |<---------------- resumed ----------------|
  |
  v
archive/
```

- **Active to Standby:** Work is paused or waiting on an external dependency.
- **Standby to Active:** Work resumes. Re-run the relevant Phase 0 checks because production may have changed.
- **Active to Archive:** All phases are complete, tests/docs are done, and the plan has a final status note.

## Tips

- Keep each plan focused. Split broad programs into a master plan plus smaller execution plans.
- Be concrete. Name files, endpoints, tables, routes, wallets, and acceptance criteria.
- Record decisions once so they are not relitigated later.
- Keep production facts dated.
- Prefer boring reliability over clever architecture.
- If a plan touches growth, include the conversion metric it is meant to improve.
