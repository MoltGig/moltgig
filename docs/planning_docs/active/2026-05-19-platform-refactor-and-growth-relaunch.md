# MoltGig Platform Refactor and Growth Relaunch

**Created:** 2026-05-19
**Status:** active
**Priority:** P1
**Workstream:** platform
**Type:** refactor | research | operations
**Owner:** mixed

## Context

MoltGig has been mostly untouched for roughly three months. In that time, production agent infrastructure moved forward: agent SDKs became more capable, x402/AP2-style payment protocols gained traction, other agent-work marketplaces appeared, and Ricky's MoltGig CEO loop stalled behind channel and tooling issues.

This plan is the reset point. It records the May 2026 audit, proposes a codebase/database refactor, defines a growth relaunch, and sets the path for using Ricky as an operating agent without letting him touch MoltGig code, schema, deployments, private keys, or funds outside explicit approval.

## Desired Outcome

MoltGig should become a small, reliable, agent-native work exchange where:

- Agents can discover work through public machine-readable docs, heartbeat, API, and later x402/MCP-compatible surfaces.
- Every gig has clear proof requirements and review rules.
- Public metrics distinguish tests, house-agent activity, onboarding, MoltGig-seeded work, and real external marketplace activity.
- The backend and database are simple enough to trust and evolve.
- Ricky can run growth, reporting, submission monitoring, and outreach experiments with accurate metrics.
- The next public relaunch optimizes for the first real third-party paid gig completion, not vanity registration counts.

## Current Evidence

### GitHub and Local Repository

- Local branch: `main`, behind `origin/main` by one Replit deployment checkpoint commit.
- No open GitHub PRs as of 2026-05-19.
- Latest merged PR: [#8](https://github.com/MoltGig/moltgig/pull/8), merged 2026-02-21, adding fee reduction to 3%, heartbeat/onboarding endpoints, and the growth playbook.
- Latest meaningful local commits:
  - `3e1a579` - shared Supabase client in notification service to prevent startup crash.
  - `7654c87` - submission review pipeline docs updated.
  - `6172d15` - reject/revision endpoint and notification wiring.
  - `b1b830e` - onboarding gate and always-available onboarding gig.

### Production API, Database, and Contract

Production API was live and healthy during the audit.

Database counts observed:

| Table | Count |
|-------|------:|
| `agents` | 6 |
| `tasks` | 51 |
| `submissions` | 2 |
| `transactions` | 48 |
| `task_feedback` | 2 |
| `task_messages` | 0 |
| `notifications` | 0 |
| `webhooks` | 0 |
| `costs` | 0 |

Task statuses observed:

| Status | Count |
|--------|------:|
| `funded` | 36 |
| `open` | 13 |
| `completed` | 2 |

Contract state observed on Base mainnet for `0xf605936078F3d9670780a9582d53998a383f8020`:

| Field | Value |
|-------|-------|
| `platformFee` | 3 |
| `disputeFee` | 5 |
| `owner` | `0xA5BfB6C6E3085e7fd4b7328b52eDda30Ef683D68` |
| `taskCounter` | 43 |
| `completedTasks` | 3 |

### Third-Party Completion Check

Triple-check result: **zero real third-party paid marketplace gigs have completed**.

Evidence used:

- Queried production `tasks`, `submissions`, `transactions`, and public task API.
- Checked public API completed tasks.
- Iterated on-chain tasks from the Base mainnet contract.
- Compared requester/worker wallets against known house wallets and task copy.
- Checked Ricky's submission review context.

Observed completed activity:

| Type | Count | Notes |
|------|------:|-------|
| House-agent paid on-chain test completions | 3 | GigBot to DataMolt test/feedback tasks. |
| External onboarding completion | 1 | `Chain Worker Fleet` completed onboarding only, no paid marketplace work. |
| External rejected submission | 1 | Same external worker submitted poor LinkedIn promo work; rejected and gig reopened. |
| Real third-party paid marketplace completions | 0 | None found. |

Do not report "completed gigs" publicly without segmenting these categories.

### Codebase Findings

Backend:

- `backend/src/routes/tasks.ts` is too large and mixes listing, detail, creation, acceptance, submission, completion, rejection, funding, feedback, and messages.
- `backend/src/routes/admin.ts` also mixes unrelated admin metrics and has confusing route ordering.
- Some routes instantiate Supabase clients directly instead of consistently using the shared config.
- Validation schemas are embedded in route files; tests duplicate schemas instead of importing them.
- Contract/event sync listens for live events but lacks a robust backfill/checkpoint reconciliation path.
- `TaskClaimed` is recorded as `tx_type: 'fund'` with null amount, which weakens transaction semantics.
- Notifications and webhooks exist but production has zero notification/webhook rows, so the feature is not yet operationally meaningful.

Frontend:

- `frontend/src/lib/api.ts` does not cover the full backend surface: reject/revision, heartbeat/onboarding, messages, notifications, and admin review flows are missing or partial.
- `/gigs` appears to be the current product route, while `/tasks` also exists locally and tests still reference older task paths.
- Public metrics and UI copy risk overstating traction because test, house, and onboarding activity are not clearly separated.
- Known-wallet labeling needs a refresh; house wallet metadata should come from one canonical source.

Tests:

- Backend API tests use a mocked mini Express app rather than the real app/router.
- Validation tests copy schemas instead of importing shared schemas.
- E2E tests target old routes and should be updated around the real `/gigs` flow.

Docs:

- `docs/reference_docs/MOLTGIG_BRIEF.md` appears to be the real brief, but multiple docs reference `MOLTGIG_BRIEF_V3.md`.
- Planning docs have stale active items and at least one duplicate archived/active agent growth plan.
- Some active Ricky-related docs reference `docs/plans/...`, while this repo uses `docs/planning_docs/...`.

### Ricky Findings

Ricky's private repo was inspected from a fresh clone of `max-ascolani/ricky` to avoid disturbing the local checkout. The latest observed commit was `9dfbc3d` on 2026-05-18.

Useful existing assets:

- `agents/moltgig-ceo/SOUL.md` has a sensible permissions boundary: Ricky can monitor, report, draft, and operate growth workflows, but must not touch code, SQL, deploys, private keys, or funds.
- `cron/jobs.json` contains recurring reporting, outreach, review, competitor scan, and gig-seeding jobs.
- `skills/moltgig/scripts/` includes public API, admin metrics, and submission review scripts.
- Ricky has memory files that correctly identified the Moltbook blocker and the lack of conversions.

Problems:

- Ricky's goals/playbook are stale and heavily Moltbook-centric.
- Some admin CLI expectations appear to drift from backend response shapes, especially timeseries and P&L fields.
- Growth jobs can keep running even when the only channel is blocked, producing activity without distribution.
- Current metrics can let house-agent or onboarding activity masquerade as traction.

## Market Research Summary

The market moved toward protocols, payments, and verifiable workflows rather than generic "agent directory" pages.

Key references:

- [Cloudflare x402 docs](https://developers.cloudflare.com/agents/agentic-payments/x402/) describe HTTP 402 payment flows where clients, including AI agents, pay programmatically without accounts, sessions, or API keys. The docs list Base support and SDK support for charging HTTP resources or MCP tools.
- [Cloudflare Agentic Payments](https://developers.cloudflare.com/agents/agentic-payments/) frames x402 and MPP around agent discovery, payment challenges, and programmatic retry flows.
- [Coinbase x402 docs](https://docs.cdp.coinbase.com/x402/docs/facilitator) position x402 as instant automatic stablecoin payments over HTTP for APIs and AI agents.
- [Coinbase AgentKit](https://docs.cdp.coinbase.com/agent-kit) provides wallet management and on-chain actions for autonomous agents.
- [Google AP2](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol?e=48754805) focuses on authorization, authenticity, and accountability for agent-led payments.
- [AWS Marketplace AI Agents and Tools](https://aws.amazon.com/about-aws/whats-new/2025/07/ai-agents-tools-aws-marketplace) shows enterprise marketplaces are organizing around AI agents, MCP/A2A support, semantic discovery, and deployment paths.
- [Virtuals ACP](https://whitepaper.virtuals.io/about-virtuals/agent-commerce-protocol/acp-current-status) shows an on-chain agent commerce protocol with agent onboarding, service offerings, SDKs, and graduated agents.
- [Virtuals ACP technical deep dive](https://whitepaper.virtuals.io/about-virtuals/agent-commerce-protocol/technical-deep-dive) emphasizes negotiation, escrow, evaluation, and reputation.
- [OpenAI Agents SDK](https://platform.openai.com/docs/guides/agents-sdk/) emphasizes tools, handoffs, streaming, and full traces; current agent tooling makes long-running supervised workflows more realistic than in early 2026.
- Live adjacent marketplaces inspected: [Openwork skill](https://openwork.bot/skill.md), [Openwork heartbeat](https://openwork.bot/heartbeat.md), [AgentWork skill](https://agentwork.app/skill.md), and [AgentJob skill](https://agent-job.ai/skill.md).

Learnings:

- Agent payments are becoming HTTP-native and stablecoin-native. MoltGig's Base escrow is directionally right, but custom-only escrow is no longer enough.
- Discovery is moving through machine-readable docs, skills, heartbeats, MCP tools, and marketplace catalogs.
- Strong marketplaces define an operating loop for agents, not just a REST API. Openwork's skill/heartbeat pattern is explicit about "find work, owner decides, report outcomes."
- AgentJob's long-poll MCP pattern is useful: agents stay online and receive small paid tasks quickly.
- Virtuals ACP highlights evaluation as a first-class role. MoltGig currently lacks evaluator/reviewer incentives beyond requester approval.
- Enterprise agent marketplaces are emphasizing deployment trust, credentials, compliance, and protocol flags. MoltGig should not chase enterprise immediately, but the trust surface matters.

## MoltGig Critique

What MoltGig is doing well:

- Clear founding wedge: agent-to-agent gigs with Base escrow.
- Public machine-readable docs already exist (`skill.md`, `llms.txt`, OpenAPI, agent card).
- Onboarding gate and heartbeat are the right kind of agent-native product surface.
- Submission reject/revision flow exists after the February work.
- Ricky has a strong policy boundary and can be a real operator if his inputs and metrics are fixed.

What is holding MoltGig back:

- No real third-party paid completion yet. This is the core problem.
- Too many seeded promo gigs look generic, duplicated, or hard to verify.
- Metrics are polluted by tests and onboarding, so the platform can look healthier than it is.
- The product asks agents to do work before making proof requirements and review outcomes obvious enough.
- Backend route/service structure makes it hard to safely evolve lifecycle logic.
- Contract sync is not yet a robust source-of-truth reconciliation system.
- Ricky was pointed mostly at Moltbook and got stuck when that channel failed.
- Docs drift creates trust problems for agent readers and future operators.

Low-hanging fruit:

- Segment public metrics immediately: house tests, onboarding, MoltGig-funded seeded gigs, external third-party completions.
- Add proof requirements to active gigs and make low-quality submissions rejectable before review.
- Replace the current seeded gig board with 5-10 precise, verifiable gigs.
- Fix route/test drift around `/gigs` vs `/tasks`.
- Fix stale doc paths and archive duplicate/stale active plans.
- Update Ricky's scripts to match live API response shapes.
- Give Ricky a weekly "real completion funnel" report and stop treating registrations as the primary KPI.
- Add a public "agent quickstart" that gets a new agent to one real, low-risk paid gig in under 10 minutes.

## Refactor Categories

### 1. Planning and Docs

Goal: make docs reliable enough for agents and humans to use as source of truth.

Work:

- Fix references to nonexistent `MOLTGIG_BRIEF_V3.md`.
- Decide whether `docs/reference_docs/MOLTGIG_BRIEF.md` should be renamed to V3 or references corrected.
- Archive stale duplicate plans.
- Update public protocol docs when API changes.
- Add a "metrics taxonomy" doc that defines house/test/onboarding/external categories.

### 2. Database and Metrics Integrity

Goal: make production stats defensible.

Proposed database changes, pending Supabase-agent review:

- Add canonical agent classification fields to `agents`, such as `agent_kind` or `is_house_agent`, if not already represented elsewhere.
- Add canonical task classification to `tasks`, such as `task_origin` with values like `external`, `moltgig_seed`, `onboarding`, `house_test`, and `demo`.
- Add `review_policy` to `tasks` if review behavior cannot be derived safely from requester/task origin.
- Add `deliverable_requirements` or `proof_requirements` JSONB to `tasks` for machine-checkable proof expectations.
- Replace drift-prone agent counters in user-facing metrics with computed views or reconciliation jobs.
- Add a chain event ingestion table only if Phase 0 confirms it is needed for idempotent contract sync. If added, use unique `(chain_id, contract_address, tx_hash, log_index)` and treat it as immutable event proof, not a second task-history table.
- Add a chain sync state/checkpoint table if the event listener remains stateful.

Data repair:

- Reconcile `agents.tasks_posted`, `tasks_completed`, and related counters against actual tasks.
- Label current test/onboarding/seed tasks.
- Preserve historical rows; do not delete production evidence.

### 3. Backend Architecture

Goal: make task lifecycle changes safe.

Split responsibilities:

- `taskListRoutes` for browse/search/filter.
- `taskDetailRoutes` for single-task reads.
- `taskLifecycleService` for create, accept, submit, complete, reject, revision, cancel, dispute.
- `taskFundingService` for on-chain funding and sync.
- `submissionReviewService` for review policy and proof validation.
- `notificationService` for durable events and delivery.
- `adminMetricsService` for P&L, timeseries, and funnel metrics.

Other backend work:

- Move Zod schemas into shared modules and import them from routes, tests, and possibly frontend type generation.
- Standardize API error shape and hints for agents.
- Unify `fund` behavior between task and contract routes.
- Add idempotency protection for submit/complete/reject/fund flows.
- Use shared Supabase client/config consistently.
- Add pagination and count semantics that agent clients can rely on.

### 4. Contract Sync and Payments

Goal: contract state and database state should reconcile after downtime.

Work:

- Add a read-only reconciliation script for contract task IDs, status, requester, worker, reward, and resolution.
- Add block checkpoint/backfill if event listener remains the production sync path.
- Fix transaction semantics so `TaskClaimed` is not recorded as a funding transaction.
- Consider USDC/x402 compatibility as a parallel path for small agent jobs while keeping escrow for larger gigs.
- Keep mainnet write tests at `0.0000001 ETH`.

### 5. Frontend Product Flow

Goal: help an agent or owner find one appropriate gig, understand proof requirements, submit work, and see review outcome.

Work:

- Consolidate `/gigs` and `/tasks` behavior. Prefer `/gigs` as product language and redirect old `/tasks` paths if needed.
- Show proof requirements, review policy, requester type, and whether a gig is external or MoltGig-seeded.
- Add a "first real gig" path after onboarding.
- Add submission status and feedback visibility.
- Add external-completion metrics separate from total completions.
- Reduce duplicate/stale seeded gig clutter.

### 6. Public Agent Protocol Surface

Goal: make MoltGig easy for agents to use without a human reading the website.

Work:

- Refresh `skill.md`, `llms.txt`, OpenAPI, agent card, and heartbeat.
- Add exact examples for onboarding, accepting, submitting with proof, checking feedback, and finding high-fit gigs.
- Add clear security guidance around wallet signatures and domains.
- Add "do not count tests as traction" semantics to public stats if public metrics are exposed.
- Evaluate a simple MCP wrapper and x402-compatible discovery/payment layer.

### 7. Ricky Operating System

Goal: Ricky should run MoltGig growth and reporting from accurate data, not stale channel assumptions.

Work in Ricky repo:

- Update `GOALS.md` and `PLAYBOOK.md` from May 2026 audit.
- Fix `moltgig-admin.sh` response-shape drift for timeseries/P&L.
- Add a `real-completions` or `funnel` command that explicitly reports:
  - registered agents,
  - onboarded external agents,
  - external submissions,
  - accepted external submissions,
  - third-party paid completions,
  - stale funded gigs,
  - new heartbeat/API activity.
- Change cron jobs so Moltbook failure routes work into alternatives: target research, draft outreach, GitHub/ClawHub/listing updates, and owner approval queues.
- Add a "no house completions in growth metrics" rule to Ricky's SOUL/PLAYBOOK.
- Give Ricky an experiment ledger: hypothesis, channel, target cohort, offer, success metric, start/end date, result.

### 8. Growth and Incentives

Goal: create the first real paid external completion, then repeat it.

Target audiences:

- OpenClaw and Moltbook/ClawHub agents once channel access works.
- Coinbase CDP, AgentKit, x402, and Base builders.
- Virtuals/ACP and other on-chain agent-commerce builders.
- MCP tool builders and agent framework communities.
- Builders of agents that can do narrow verifiable work: research, data extraction, API monitoring, QA, docs, screenshots, lead enrichment.

Incentives:

- First real external paid completion bounty.
- First valid non-onboarding submission bonus.
- Reviewer/evaluator micro-bounties for validating deliverables.
- Integration bounties for MCP, AgentKit, x402, and OpenClaw examples.
- Referral bonus payable only after the referred agent completes a valid non-test gig.
- Streak rewards only for accepted external work, not house tests.

Seed gig principles:

- Small enough for low risk.
- Useful to MoltGig or Ricky.
- Deliverable can be verified in minutes.
- Requires concrete proof: URL, repo branch, screenshot, JSON output, diff, or reproducible command.
- Has acceptance/rejection criteria in the description.
- Avoid generic "promote us" tasks unless a verifiable channel and proof format are required.

## Execution Plan

## Implementation Log

### 2026-05-19 - Branch `codex/platform-refactor-growth-relaunch`

Completed first safe implementation slice without production schema writes or mainnet writes:

- Added derived task/agent classification for `house_test`, `onboarding`, `moltgig_seed`, `external`, and `unknown`.
- Added public `/api/stats` `traction` and `segments` fields so raw completed task count is no longer the only visible metric.
- Added admin `/api/admin/funnel` for Ricky/Max reporting.
- Added read-only admin `/api/admin/reconcile/contract` for DB vs Base contract diagnostics.
- Moved task validation schemas into `backend/src/schemas/tasks.ts` and updated tests to import shared schemas.
- Updated frontend API client coverage for heartbeat, onboarding, reject/revision, task messages, and segmented stats.
- Fixed CodeClaw known-wallet display address.
- Added `METRICS_TAXONOMY.md` and `CURRENT_PRODUCTION_STATUS.md`.
- Refreshed tracked stale docs and public agent docs around segmented traction and reject/revision.

Verification:

- `cd backend && npm test -- --runInBand` passed: 44 tests.
- `cd backend && npx tsc --noEmit` passed.
- `cd frontend && npm run build` passed, with existing multiple-lockfile warning.
- `node -e "JSON.parse(...frontend/public/openapi.json...)"` passed.
- `git diff --check` passed.

Known carry-forward:

- Existing dirty/untracked files remain in the worktree and were not reverted.
- No production data repair, Ricky repo edit, or mainnet write has been performed.
- `/tasks` route cleanup is resolved as redirect-only compatibility. The API remains `/api/tasks`.
- Active plan archiving/cleanup needs a deliberate pass because some stale plans are currently untracked.

Next recommended implementation order:

1. Update Ricky repo scripts/prompts to consume `/api/admin/funnel` and `/api/admin/reconcile/contract`.
2. Replace stale seeded gigs with 5-10 precise, verifiable gigs after Max approves seeded-gig handling and incentive budget.
3. Add proof requirements to the refreshed seeded gigs; the schema/application support now exists, but existing production gigs have no structured proof yet.
4. Decide whether x402/USDC compatibility is P1 or P2 for relaunch.

### 2026-05-19 - UI/admin traction surfacing

Completed second no-migration slice:

- Updated homepage stats to show available gigs, real paid third-party completions, and external onboarding instead of raw completed task count.
- Updated reusable `StatsBar` to report real paid completions and external onboarding separately.
- Added an admin dashboard "Real Traction Funnel" panel backed by `/api/admin/funnel`.
- Admin funnel panel shows real paid completions, real external completions, external onboarding, external submissions, accepted external submissions, stale funded gigs, task origin breakdown, and agent counter drift.

Carry-forward:

- Admin dashboard still uses the existing Supabase-session `Authorization` header pattern, while backend admin auth also supports API-key auth. A separate auth-alignment pass may be needed if production admin endpoints are not reachable from the dashboard.
- Browser smoke tested homepage at `http://localhost:5001/`; layout rendered cleanly and new stats labels were visible.
- Attempted local backend dev server on alternate port for end-to-end local API smoke, but it did not become reachable quickly; stopped it and kept verification to build/tests plus browser-rendered production-proxy data.

Verification:

- `cd backend && npm test -- --runInBand` passed: 44 tests.
- `cd backend && npx tsc --noEmit` passed.
- `cd frontend && npm run build` passed, with existing multiple-lockfile warning.
- `git diff --check` passed.

### 2026-05-19 - Supabase classification/proof foundation

Completed the approved minimal production schema change:

- Fetched remote Supabase migration history into `supabase/migrations/` so new schema work sits on top of the real production migration chain.
- Added migration `20260519190000_add_task_classification_and_proof_requirements.sql`.
- Added task-owned columns:
  - `task_origin` for `unknown`, `house_test`, `onboarding`, `moltgig_seed`, `external`, and `demo`.
  - `review_policy` for `requester_review`, `ops_review`, `auto_onboarding`, and `admin_review`.
  - `proof_requirements` as JSONB array for machine-readable deliverable expectations.
- Added indexes for `task_origin` and `review_policy`.
- Backfilled existing production tasks from canonical requester/worker wallet identity, task group/tags, and task copy.
- Recreated `public.task_listings` with `security_invoker = true` and the new task fields.
- Regenerated `types/supabase.ts` from the linked production schema.

Verification:

- `supabase db push --dry-run --linked` showed only the new migration.
- `supabase db push --linked --yes` applied the migration successfully.
- `supabase migration list` shows local and remote migration history aligned through `20260519190000`.
- `supabase gen types typescript --linked --schema public` confirmed `task_origin`, `review_policy`, and `proof_requirements` are present on `tasks` and `task_listings`.

Carry-forward:

- Initial `supabase db lint --linked` hit a Supabase pooler authentication circuit breaker after concurrent CLI connections. Retried serially after cooldown and lint passed with no schema errors.
- Live `task_listings` backfill check returned 51 rows: 44 `moltgig_seed`, 5 `house_test`, and 2 `onboarding`. Existing tasks have zero structured proof requirements and need a seeded-gig refresh pass.

### 2026-05-19 - Proof requirements app integration

Completed schema-backed application wiring:

- Added shared Zod schemas for `task_origin`, `review_policy`, `proof_requirements`, admin task creation, and submission payloads.
- Added `proofRequirements` service for origin inference, default review-policy selection, and submission proof validation.
- Updated public task creation to persist inferred `task_origin`, default `review_policy`, and requester-supplied `proof_requirements`.
- Updated admin task creation to accept explicit origin/review/proof values while still defaulting conservatively.
- Updated submit flow to return `400` with `missing_requirements` when required proof is absent.
- Updated onboarding-copy task creation to preserve onboarding classification and proof fields.
- Updated frontend task types, gig cards, gig detail pages, and create-task API example for origin/review/proof fields.
- Updated public OpenAPI, `llms.txt`, `skill.md`, agent card, and the root skill file around proof requirements.

Verification:

- `cd backend && npm test -- --runInBand` passed: 51 tests.
- `cd backend && npx tsc --noEmit` passed.
- `cd frontend && npm run build` passed, with existing multiple-lockfile warning.
- `node -e "JSON.parse(...frontend/public/openapi.json...)"` passed.
- `node -e "JSON.parse(...frontend/public/.well-known/agent.json...)"` passed.
- `supabase db lint --linked` passed with no schema errors.
- Browser smoke at `http://localhost:5001/gigs` confirmed the gig detail origin/review/proof panel renders against production-proxy data.

### 2026-05-19 - `/tasks` to `/gigs` route compatibility

Completed frontend route drift cleanup:

- Converted `/tasks` to redirect to `/gigs`.
- Converted `/tasks/create` to redirect to `/gigs/create`.
- Converted `/tasks/:id` to redirect to `/gigs/:id`.
- Kept API paths as `/api/tasks` because agent/public API docs already use that surface.

Verification:

- `cd frontend && npm run build` passed, with existing multiple-lockfile warning.
- Browser smoke confirmed `/tasks` redirects to `/gigs`.

### 2026-05-19 - Active plan hygiene

Completed planning-doc cleanup:

- Removed duplicate active `2026-02-02-agent-growth-plan.md`; the same file already exists in `docs/planning_docs/archive/`.
- Moved superseded `2026-02-20-openwork-growth-playbook.md` to `docs/planning_docs/archive/`.
- Moved superseded `2026-02-25-ricky-submission-review.md` to `docs/planning_docs/archive/`.
- Moved superseded `2026-02-25-submission-review-pipeline.md` to `docs/planning_docs/archive/`.
- Confirmed `docs/planning_docs/active/` now contains only this relaunch plan.

### 2026-05-19 - Agent protocol and relaunch-gig docs

Completed protocol/growth documentation slice:

- Updated `/api/heartbeat` to include `moltgig-heartbeat/2026-05`, top current gigs, task origin, review policy, proof hints, segmented traction, and next actions.
- Updated public `llms.txt`, `skill.md`, and the root skill file to describe the heartbeat semantics.
- Added `docs/reference_docs/AGENT_PROTOCOL_COMPATIBILITY.md` with MCP, x402, AP2, and Virtuals ACP scope decisions.
- Added `docs/reference_docs/gigs/GROWTH_RELAUNCH_GIGS.md` with eight proof-backed relaunch gig templates, budget guidance, and production funding rules.
- Marked old `FIRST_GIGS.md` social-promotion bounty doc as superseded for the May 2026 relaunch.

### 2026-05-19 - Contract sync semantics

Completed contract sync cleanup:

- Fixed event listener semantics so `TaskClaimed` updates lifecycle state but does not insert a fake `fund` transaction.
- Added `docs/reference_docs/CONTRACT_RECONCILIATION_RUNBOOK.md`.
- Decision: defer chain event ingestion/checkpoint tables until reconciliation shows drift that cannot be handled with the read-only report and manual repair.

### 2026-05-19 - Lifecycle route coverage

Completed focused backend lifecycle hardening:

- Added optimistic status checks to submit, complete, reject, and revision state updates.
- Added route-handler tests for `accept`, `submit`, proof validation failure, `reject`, `revision_requested`, and `complete` using the real `tasksRouter` with mocked auth/Supabase.
- Confirmed reject reopens a task for another worker.
- Confirmed revision keeps the same worker assigned.
- Confirmed completion approves the pending submission and increments worker completion count.

Verification:

- `cd backend && npm test -- --runInBand` passed: 57 tests.
- `cd backend && npx tsc --noEmit` passed.

### 2026-05-19 - Ricky growth operating system refresh

Completed Ricky/OpenClaw repo update on branch `codex/moltgig-growth-relaunch`:

- Updated Ricky `GOALS.md` so the May/June relaunch primary KPI is real paid third-party marketplace completions from `/api/admin/funnel`.
- Updated Ricky `PLAYBOOK.md` with the new default ops loop: health, funnel, contract reconciliation, submitted queue, then one bottleneck-driven growth action.
- Updated Ricky `SOUL.md` and `TOOLS_INVENTORY.md` so house tests, onboarding, seeded work, and Ricky-operated activity cannot be counted as traction.
- Added `moltgig-admin.sh funnel`, `moltgig-admin.sh reconcile`, and `moltgig-admin.sh submitted`.
- Added `agents/moltgig-ceo/memory/EXPERIMENT_LEDGER.md` with the relaunch experiment backlog and weekly entry template.
- Rewrote cron prompts so blocked Moltbook/public-channel execution turns into useful target research, outreach drafts, directory/listing work, or protocol integration research instead of fake activity.
- Updated submission review cron instructions to check `proof_requirements` and preserve Max approval boundaries.

Verification:

- `jq empty cron/jobs.json` passed.
- `bash -n skills/moltgig/scripts/moltgig-admin.sh` passed.
- Ricky touched-file whitespace check passed.
- `MOLTGIG_ADMIN_KEY=dummy skills/moltgig/scripts/moltgig-admin.sh` printed help and the new commands without printing secrets.

Carry-forward:

- Ricky repo still has pre-existing untracked `AGENTS.md`; it was not touched.
- Git diff commands in the Ricky repo hung during diff rendering, so verification used file-specific syntax/JSON checks and `git status` instead.
- Publishing public posts, creating funded gigs, spending ETH, or making wallet actions remains owner-approved.

### 2026-05-19 - Gig-board onboarding path

Completed frontend nudge toward real paid work:

- Defaulted `/gigs` to show funded gigs first.
- Updated the `/gigs` header copy to point onboarded agents toward funded gigs with proof requirements.
- Confirmed gig detail pages already show submission status, reviewer feedback, proof requirements, review policy, and task origin.

Verification:

- `cd frontend && npm run build` passed after this change.
- Browser smoke at `http://localhost:5001/gigs` confirmed heading renders, status filter defaults to `funded`, onboarding/proof copy is visible, and `/tasks` redirects to `/gigs`.

### 2026-05-19 - Final verification pass before peer review

Verification completed:

- `cd backend && npm test -- --runInBand` passed: 57 tests.
- `cd backend && npx tsc --noEmit` passed.
- `cd frontend && npm run build` passed, with existing multiple-lockfile warning from `frontend/yarn.lock`.
- `node -e "JSON.parse(...openapi...); JSON.parse(...agent.json...)"` passed.
- `supabase db lint --linked` passed with no schema errors.
- `supabase migration list` shows local/remote migrations aligned through `20260519190000`.
- `git diff --check` passed in the MoltGig repo.
- Ricky verification passed: `jq empty cron/jobs.json`, `bash -n skills/moltgig/scripts/moltgig-admin.sh`, touched-file whitespace check, and dummy-key admin help dry-run.
- Browser smoke passed for `/gigs` and `/tasks` redirect on local production build.
- Production-safe public endpoints checked: `/api/health`, `/api/stats`, `/api/heartbeat`, and `/api/tasks?status=funded&limit=2&sort=newest`.
- Read-only Base reconciliation using `https://mainnet.base.org` found contract `taskCounter=43`, DB rows with chain IDs `36`, `0` DB/chain field mismatches for matched rows, `0` DB chain IDs missing on-chain, and `7` historical chain tasks missing from DB.

Verification caveats and carry-forward:

- Live production API is still running the older deployed backend: `/api/stats` returned `traction: null`, `/api/heartbeat` returned the old heartbeat format, while `/api/tasks` already exposes new DB fields through `task_listings`. Deploying this branch is required before the new public/admin metrics and heartbeat are live.
- The 7 contract tasks missing from DB are historical chain IDs `1-7`; sampled chain metadata shows early treasury/house test/cancel-test tasks, not real third-party paid completions. They are now documented as reconciliation drift, not repaired in this branch.
- The local TypeScript reconciliation service was slow through the configured Alchemy-backed provider; the successful verification used Base public RPC with batching disabled. Consider adding provider timeout/batch controls if this endpoint is slow in production.
- No mainnet writes, production row deletions, public posts, or funded relaunch gig spends were performed.

### 2026-05-19 - Peer-review gate fixes before final review loop

Codex CLI Round 1 and Claude Code CLI Round 1 both found HIGH/MEDIUM issues. Fixed before rerunning the full review loop:

- Removed `updated_at` from `/api/admin/funnel` task_listings select because the recreated view does not expose it.
- Added Supabase-session admin auth support for explicitly allowlisted `ADMIN_EMAILS`, while preserving `x-admin-api-key` for Ricky/ops scripts.
- Changed paid marketplace metrics so `is_paid_on_chain` requires a confirmed `complete` or `dispute_resolve` transaction, not just `chain_task_id`.
- Verified `/api/tasks/:id/fund` and contract `/fund` paths against the mined `TaskPosted` receipt, poster, amount, contract address, and optional expected chain task ID before marking tasks funded.
- Changed onboarding auto-clones from `funded` to `open`, and blocked public clients from creating `task_group=onboarding`.
- Added Ricky operator wallet to platform classification.
- Removed stale demo traction/fee claims.
- Blocked DB-only full rejection for escrow-backed tasks so an on-chain worker claim cannot be reopened to another DB worker.
- Blocked admin dispute resolution for chain-backed tasks until escrow resolution happens on-chain; off-chain dispute resolution now closes to `completed` or `cancelled`, not an unmapped `resolved` status.
- Prevented chain completions from double-incrementing worker stats in `/api/tasks/:id/complete`; the event listener owns escrow payment transactions and counter updates.
- Made the event listener match a single pending open DB task by requester/reward when `TaskPosted` arrives before the API fund callback, reducing duplicate on-chain task rows.
- Tightened classification so broad copy like "test the integration" does not demote external gigs unless the wallet/task metadata is house/platform/test-coded.
- Fixed Ricky `moltgig-admin.sh timeseries` and `pnl` parsers to match current backend response shapes.
- Updated OpenAPI, skill docs, metrics taxonomy, and the contract reconciliation runbook with the new funding, completion, onboarding, and dispute semantics.

Verification after fixes:

- `cd backend && npm test -- --runInBand` passed: 63 tests.
- `cd backend && npx tsc --noEmit` passed.
- `cd frontend && npm run build` passed, with the existing multiple-lockfile warning from `frontend/yarn.lock`.
- `node -e "JSON.parse(...openapi...); JSON.parse(...agent.json...)"` passed.
- `supabase db lint --linked` passed with no schema errors.
- `git diff --check` passed in the MoltGig repo.
- Ricky verification passed: `bash -n skills/moltgig/scripts/moltgig-admin.sh` and `jq empty cron/jobs.json`.
- Browser smoke on `next start` passed: `/gigs` renders, status filter defaults to `funded`, proof copy is visible, and `/tasks` redirects to `/gigs`.

Carry-forward:

- The frontend build/start warning about multiple lockfiles remains because `frontend/yarn.lock` is present alongside the root lockfile; no lockfile was removed in this branch.
- The only remaining stale demo-copy search hit is a CSS `95%` keyframe in `frontend/src/app/demo/neo/page.tsx`, not public traction copy.

### 2026-05-19 - Peer-review gate fixes, second blocker pass

Codex CLI Round 3 found additional HIGH/MEDIUM issues after the first fix pass. Fixed before rerunning both reviewers:

- Fixed open onboarding acceptance after onboarding clones moved from `funded` to `open`.
- Added escrow-state guards for chain-backed `accept`, `submit`, and `dispute` API calls. The matching contract action must now be mined first: `claimTask`, `submitWork`, or `raiseDispute`.
- Added Supabase migration `20260519193000_enforce_unique_task_chain_id.sql`, a partial unique index on non-null `tasks.chain_task_id`, and applied it to the linked production database.
- Kept application idempotency checks for existing `chain_task_id` and `tx_hash`, and added route coverage for duplicate chain funding.
- Fixed Ricky `costs` total parsing and `add-cost` success parsing for current admin API responses.
- Fixed admin cost delete UI to call `DELETE /api/admin/costs/:id`.
- Added `Authorization` and `x-admin-api-key` to backend CORS allowed headers for direct admin/API use.
- Updated public docs/OpenAPI/root skill/runbook to describe contract-first lifecycle syncing and `ADMIN_EMAILS` allowlisting for Supabase-session admin auth.

Verification after second blocker pass:

- `cd backend && npm test -- --runInBand` passed: 67 tests.
- `cd backend && npx tsc --noEmit` passed.
- `cd frontend && npm run build` passed, with the existing multiple-lockfile warning.
- `node -e "JSON.parse(...openapi...); JSON.parse(...agent.json...)"` passed.
- `supabase db push --dry-run --linked` showed only `20260519193000_enforce_unique_task_chain_id.sql`.
- `supabase db push --linked --yes` applied `20260519193000_enforce_unique_task_chain_id.sql` successfully.
- `supabase db lint --linked` passed with no schema errors.
- `supabase migration list` shows local/remote migrations aligned through `20260519193000`.
- Ricky verification passed: `bash -n skills/moltgig/scripts/moltgig-admin.sh` and `jq empty cron/jobs.json`.
- `git diff --check` passed.
- Demo stale traction-copy search returned no matches.

### 2026-05-19 - Peer-review gate fixes, third blocker pass

Claude Code CLI Round 4 passed with no HIGH/MEDIUM findings. Codex CLI Round 4 still found HIGH/MEDIUM issues, so another fix pass was required:

- Locked down public Supabase writes for core marketplace tables. Migration `20260519194500_restrict_public_core_writes.sql` drops permissive write policies on `agents`, `tasks`, `submissions`, and `transactions`, then recreates write policies for `service_role` only.
- Applied `20260519194500_restrict_public_core_writes.sql` to the linked production database.
- Changed backend Supabase config and notification test script to require `SUPABASE_SERVICE_KEY` for write-capable backend operations.
- Removed hardcoded Moltbook bearer token from tracked archive scripts; archived Moltbook verification now reads `MOLTBOOK_API_KEY` and skips safely if it is absent. The exposed token must be treated as compromised and rotated outside this branch.
- Made funding callbacks idempotent when the same task's `fund` transaction was already recorded by the event listener.
- Changed admin stats/timeseries/P&L revenue calculations to use confirmed `complete`/`dispute_resolve` transactions instead of raw DB `completed` rows.
- Documented backend `SUPABASE_SERVICE_KEY` requirement and `ADMIN_EMAILS` admin-dashboard allowlist in `README.md` / public docs.

Verification after third blocker pass:

- `cd backend && npm test -- --runInBand` passed: 68 tests.
- `cd backend && npx tsc --noEmit` passed.
- `cd frontend && npm run build` passed, with the existing multiple-lockfile warning.
- `node -e "JSON.parse(...openapi...); JSON.parse(...agent.json...)"` passed.
- `supabase db push --dry-run --linked` showed only `20260519194500_restrict_public_core_writes.sql`.
- `supabase db push --linked --yes` applied `20260519194500_restrict_public_core_writes.sql` successfully.
- `supabase db lint --linked` passed with no schema errors.
- `supabase migration list` shows local/remote migrations aligned through `20260519194500`.
- `bash -n archive/contracts/test/verification_suite.sh` and `bash -n archive/contracts/test/daily_verification.sh` passed.
- `rg -n "moltbook_sk_[A-Za-z0-9_]+" -S .` returned no matches.
- `git diff --check` passed.

### 2026-05-19 - Peer-review gate fixes, fourth blocker pass

Codex CLI Round 5 started before the final fixes landed, so it is treated as a stale blocker-finding pass rather than a clean final gate. Remaining HIGH/MEDIUM items were fixed before starting a fresh reviewer round:

- Prevented the contract event listener from creating a generic duplicate funded DB row when a `TaskPosted` event is ambiguous across multiple open same-requester/same-reward tasks. It now waits for the verified API funding callback in that case.
- Locked down auxiliary backend-managed Supabase tables. Migration `20260519200000_restrict_public_auxiliary_writes.sql` restricts direct anon/auth writes for notifications, webhooks, task feedback inserts, and task messages to `service_role` paths.
- Applied `20260519200000_restrict_public_auxiliary_writes.sql` to the linked production database.
- Removed stale public auto-release claims from heartbeat copy, integration docs, skill docs, Ricky Moltbook prompt text, and current reference docs. Current public semantics are requester approval or dispute resolution.
- Fixed Ricky `moltgig-review.sh` so ops-review submissions include Operations wallet tasks, `task_origin=moltgig_seed`, and `review_policy=ops_review`, not requester wallet alone.
- Updated the admin revenue chart to use the current 3% fee instead of a hardcoded 5%.
- Made event-listener `TaskCompleted` worker counter updates depend on insertion of a new completion transaction, avoiding duplicate-event counter inflation.
- Added a gitignore guard for the untracked local `moltbook-mcp/.ai-saas-consortium-key` file without reading or modifying that file.
- Updated remaining current docs/demo fee snippets from 95/5 or MoltGig 5% references to current 97/3 or 3% semantics where applicable.

Verification after fourth blocker pass:

- `cd backend && npm test -- --runInBand` passed: 68 tests.
- `cd backend && npx tsc --noEmit` passed.
- `cd frontend && npm run build` passed, with the existing multiple-lockfile warning.
- `node -e "JSON.parse(...openapi...); JSON.parse(...agent.json...)"` passed.
- `supabase db push --dry-run --linked` showed only `20260519200000_restrict_public_auxiliary_writes.sql`.
- `supabase db push --linked --yes` applied `20260519200000_restrict_public_auxiliary_writes.sql` successfully.
- `supabase db lint --linked` passed with no schema errors.
- `supabase migration list --linked` shows local/remote migrations aligned through `20260519200000`; the first migration-list attempt hit transient pooler auth retries and was killed before a clean retry succeeded.
- Ricky verification passed: `bash -n skills/moltgig/scripts/moltgig-review.sh`, `bash -n skills/moltgig/scripts/moltgig-admin.sh`, and `jq empty cron/jobs.json`.
- Browser smoke on `next start -p 5001` passed: `/gigs` renders, funded/proof content is present, and `/tasks` redirects to `/gigs`.
- `git diff --check` passed.
- `rg -n "moltbook_sk_[A-Za-z0-9_]+" -S .` returned no matches.

Carry-forward:

- The frontend build/start warning about multiple lockfiles remains because `frontend/yarn.lock` is present alongside the root lockfile; no lockfile was removed in this branch.
- Mainnet relaunch funding, public outreach, and Ricky daily launch-week monitoring remain gated on deploy plus owner approval.

### 2026-05-19 - Peer-review gate fixes, fifth blocker pass

Codex CLI Round 6 completed and found HIGH/MEDIUM blockers. Claude Code CLI Round 6 hung without producing output and was killed; a fresh two-reviewer round is required after these fixes.

Round 6 Codex findings fixed:

- HIGH: contract-first lifecycle API sync was not idempotent when the event listener updated DB state before the caller retried the API sync endpoint. Fixed `accept`, `complete`, and `dispute` so already-synced matching contract state returns success instead of rejecting on the current DB status.
- MEDIUM: funnel metrics ignored persisted `task_origin`. Added `task_origin` to stats/admin funnel selects and made non-external persisted origins authoritative demotions in classification.
- MEDIUM: admin-created tasks could be marked `funded` without escrow evidence. Restricted admin seeded task creation to `open`; funding still requires the verified public funding callback or contract event path.
- MEDIUM: Ricky still had auto-release prompt text. Removed current and tracked backup/memory references that could feed Ricky stale public claims.
- LOW fixed opportunistically: `/gigs` search now sends backend-supported `q` instead of unused `search`.
- LOW fixed opportunistically: Ricky review detail now uses the same ops-review definition as `check`: Operations requester, `task_origin=moltgig_seed`, or `review_policy=ops_review`.

Verification after fifth blocker pass:

- `cd backend && npm test -- --runInBand` passed: 73 tests.
- `cd backend && npx tsc --noEmit` passed.
- `cd frontend && npx tsc --noEmit` passed.
- `cd frontend && npm run build` passed, with the existing multiple-lockfile warning.
- `node -e "JSON.parse(...openapi...); JSON.parse(...agent.json...)"` passed.
- Ricky verification passed: `jq empty cron/jobs.json cron/jobs.json.bak`, `bash -n skills/moltgig/scripts/moltgig-admin.sh`, and `bash -n skills/moltgig/scripts/moltgig-review.sh`.
- MoltGig `git diff --check` passed.
- Ricky full `git diff --check` still hangs in this worktree; file-specific trailing-whitespace check over touched Ricky files passed after cleaning a pre-existing weekly-review memory file.
- Stale secret/auto-release search passed: no Moltbook secret prefix or stale auto-release phrasing matches in current MoltGig/Ricky review surfaces.
- Browser smoke on `next start -p 5001` passed for `/gigs` funded/proof content and `/tasks` redirect to `/gigs`.

Carry-forward:

- Because Codex Round 6 had HIGH/MEDIUM findings, another full Claude Code CLI + Codex CLI review round is mandatory after this pass.

### 2026-05-19 - Peer-review gate fixes, sixth blocker pass

Codex CLI Round 7 completed with no HIGH findings and one MEDIUM. Claude Code CLI Round 7 again hung without producing output and was killed; a fresh two-reviewer round is required after these fixes.

Round 7 Codex findings fixed:

- MEDIUM: `/api/heartbeat` funnel metrics omitted persisted `task_origin`. Added `task_origin` to the heartbeat `task_listings` select before calling `buildFunnelMetrics`.
- LOW fixed opportunistically: refreshed MoltGig-side `docs/agents/RICKY_MOLTBOOK_PROMPT.md` so it points Ricky at admin funnel/reconcile reporting, uses `real_third_party_paid_marketplace_completions`, and keeps Moltbook/public posting approval-gated.

Verification after sixth blocker pass:

- `cd backend && npm test -- --runInBand` passed: 73 tests.
- `cd backend && npx tsc --noEmit` passed.
- MoltGig `git diff --check` passed.

Carry-forward:

- Because Codex Round 7 had a MEDIUM finding, another full Claude Code CLI + Codex CLI review round is mandatory after this pass.

### 2026-05-19 - Peer-review gate fixes, seventh blocker pass

Claude Code CLI Round 8 completed with no HIGH findings and two MEDIUM findings. Codex CLI Round 8 completed with one HIGH and one MEDIUM finding. Another two-reviewer round is mandatory after these fixes.

Round 8 findings fixed:

- HIGH: Ricky's active Moltbook playbook and mirrored MoltGig docs still claimed stale automatic release behavior and raw completion marketing. Updated Ricky active/current docs to describe requester approval or dispute resolution, approval-gated posting, 3% fee/Base mainnet semantics, and segmented traction only.
- MEDIUM: public `/api/stats` still exposed raw `tasks.completed`, heartbeat still had raw completion copy, and admin stats did not make origin-safe segments obvious. Replaced public stats with `tasks.completed_all_origins` plus the canonical `traction.real_third_party_paid_marketplace_completions`, removed heartbeat raw completion copy, and added origin segments/definitions to admin stats.
- LOW/INFO fixed opportunistically: refreshed Ricky's stale onboarding/brief/competitor docs for current Base mainnet, 3% fee, and explicit escrow release semantics.

Verification after seventh blocker pass:

- `cd backend && npm test -- --runInBand` passed: 73 tests.
- `cd backend && npx tsc --noEmit` passed.
- `cd frontend && npx tsc --noEmit` passed.
- `cd frontend && npm run build` passed, with the existing multiple-lockfile warning.
- `node -e "JSON.parse(...openapi...); JSON.parse(...agent.json...)"` passed.
- MoltGig `git diff --check` passed.
- Ricky verification passed: `bash -n skills/moltgig/scripts/moltgig-admin.sh`, `bash -n skills/moltgig/scripts/moltgig-review.sh`, `jq empty cron/jobs.json cron/jobs.json.bak`, and file-specific trailing-whitespace checks over touched Ricky files.
- Targeted stale-claim search passed for current MoltGig/Ricky review surfaces: no raw `tasks.completed`, raw "gigs completed"/"ETH paid out" template, or current auto-release claims remain outside historical run logs.
- Browser smoke on `next start -p 5001` passed for `/gigs`, `/tasks` redirecting to `/gigs`, and `/integrate` loading.
- Production-safe read-only endpoint checks passed for availability, but showed the live deployment is still the older backend/frontend: production `/api/stats` still returns raw `tasks.completed`, production `/api/heartbeat` still has old completion and auto-release copy, and production `/api/tasks` already exposes the new DB fields. Deploying this branch remains required before live public metrics/copy are fixed.

Carry-forward:

- Because Round 8 had HIGH/MEDIUM findings, another full Claude Code CLI + Codex CLI review round is mandatory after this pass.
- Production deployment is not included in this local branch implementation pass; do not run public relaunch/outreach until the branch is deployed and the production-safe checks show the new heartbeat/stats copy.

### 2026-05-19 - Peer-review gate fixes, eighth blocker pass

Claude Code CLI Round 9 completed with no HIGH findings and four MEDIUM findings. Codex CLI Round 9 completed with no HIGH findings and three MEDIUM findings; two of Codex's doc findings overlapped with the Claude fixes that landed while Codex was still reviewing. Another two-reviewer round is mandatory after these fixes.

Round 9 findings fixed:

- MEDIUM: legacy A2A OpenAPI source copy still promised 72-hour auto-approval. Updated `a2a_files/openapi.json` to require requester approval, revision, or dispute resolution.
- MEDIUM: current platform mechanics specs still used "Auto-Timeout" and 72-hour requester-review framing. Updated the release/dispute sections to explicit requester approval or dispute resolution semantics.
- MEDIUM: Ricky first-session checklists could be read as public posting/profile updates without approval. Changed both MoltGig and Ricky copies to draft-only actions unless Max explicitly approves the run.
- MEDIUM: Ricky seed-gig plan said "Posted by Max", which could make seeded work classify as external if funded from a non-platform wallet. Updated the plan to require the Operations wallet and `task_origin: "moltgig_seed"` / `review_policy: "ops_review"`.
- MEDIUM: payout revenue used estimated 3% values rather than the actual fee emitted by contract events. Added `transactions.fee_wei`, updated the event listener to preserve chain-emitted fees for `TaskCompleted` and `DisputeResolved`, and changed admin stats/P&L to use `fee_wei` with an explicit legacy fallback.
- MEDIUM: `/api/contract/sync/:taskId` could sync contract state `Completed` to DB `submitted` without a submission row. It now creates a pending submission from the on-chain deliverable when syncing a submitted chain state.
- LOW fixed opportunistically: agent-facing `skills/moltgig/scripts/moltgig.sh stats` now reads `completed_all_origins` and prints the canonical real third-party paid completion metric.
- INFO fixed opportunistically: submission notification copy no longer creates a 72-hour review deadline.

Verification after eighth blocker pass:

- `cd backend && npm test -- --runInBand` passed: 73 tests.
- `cd backend && npx tsc --noEmit` passed.
- `cd frontend && npx tsc --noEmit` passed.
- `cd frontend && npm run build` passed, with the existing multiple-lockfile warning.
- `node -e "JSON.parse(...openapi...); JSON.parse(...agent.json...); JSON.parse(...a2a openapi...)"` passed.
- `supabase db push --dry-run --linked` showed only `20260519201500_add_transaction_fee_wei.sql`.
- `supabase db push --linked --yes` applied `20260519201500_add_transaction_fee_wei.sql` successfully.
- `supabase db lint --linked` passed with no schema errors.
- `supabase migration list --linked` hit transient/credential pooler auth failures after the successful push/lint; retry before final deployment if migration history display is needed.
- MoltGig `bash -n skills/moltgig/scripts/moltgig.sh` and `git diff --check` passed.
- Ricky verification passed: `bash -n skills/moltgig/scripts/moltgig-admin.sh`, `bash -n skills/moltgig/scripts/moltgig-review.sh`, `jq empty cron/jobs.json cron/jobs.json.bak`, and file-specific trailing-whitespace checks over touched Ricky files.
- Targeted stale-claim search passed for current MoltGig/Ricky review surfaces; remaining "Completed (all origins)" copy is explicitly labeled all-origins, not traction.

Carry-forward:

- Because Round 9 had MEDIUM findings, another full Claude Code CLI + Codex CLI review round is mandatory after this pass.
- Production is still running the older deployment until this branch is deployed; live production checks should be repeated after deployment before public relaunch.

### 2026-05-19 - Peer-review gate fixes, ninth blocker pass

Claude Code CLI Round 10 completed with no HIGH/MEDIUM findings and two LOW findings. Codex CLI Round 10 completed with no HIGH findings and two MEDIUM findings plus LOW follow-ups. Another two-reviewer round is mandatory after these fixes.

Round 10 findings fixed:

- MEDIUM: current public onboarding surfaces still used automatic-approval language. Updated the root skill file, `frontend/public/skill.md`, `backend/src/index.ts`, and `backend/src/routes/tasks.ts` to describe onboarding as marked complete without implying paid marketplace automatic approval.
- MEDIUM: `/api/admin/timeseries` still estimated revenue with a hardcoded 3% fallback for all completion events. It now selects `fee_wei` and uses the chain-emitted fee when available, with the same explicit legacy fallback helper used by the admin P&L.
- LOW fixed opportunistically: Ricky first-session/profile wording now presents Moltbook profile updates as approval-gated proposals, not direct public execution.
- LOW fixed opportunistically: Ricky stale draft/marketing/current docs no longer promise automatic payment release or "auto-approval" as a marketing perk.
- LOW fixed opportunistically: Ricky operational examples now use segmented traction wording and onboarding-only completion semantics.

Verification after ninth blocker pass:

- `cd backend && npx tsc --noEmit` passed.
- `cd backend && npm test -- --runInBand` passed: 73 tests.
- `cd frontend && npx tsc --noEmit` passed.
- `cd frontend && npm run build` passed, with the existing multiple-lockfile warning.
- `node -e "JSON.parse(...openapi...); JSON.parse(...agent.json...); JSON.parse(...a2a openapi...)"` passed.
- MoltGig `git diff --check` and `bash -n skills/moltgig/scripts/moltgig.sh` passed.
- Ricky verification passed: `jq empty cron/jobs.json cron/jobs.json.bak`, `bash -n skills/moltgig/scripts/moltgig-admin.sh`, `bash -n skills/moltgig/scripts/moltgig-review.sh`, and current-file trailing-whitespace checks excluding archived memory files. Ricky's full `git diff --check` still hangs in this worktree.
- Targeted stale-copy searches passed for current MoltGig and Ricky review surfaces: no public/current automatic-approval/release wording, raw `[Z] gigs completed`, or raw `ETH paid out` launch copy remains in the checked surfaces.

Carry-forward:

- Because Round 10 had MEDIUM findings, another full Claude Code CLI + Codex CLI review round is mandatory after this pass.
- Claude Round 10's remaining LOW issue about stale duplicate `backend-modules/` remains a documented follow-up unless a later reviewer raises it above LOW; it is not imported by the active backend.
- Production is still running the older deployment until this branch is deployed; live production checks should be repeated after deployment before public relaunch.

### 2026-05-19 - Peer-review gate fixes, tenth blocker pass

Claude Code CLI Round 11 completed with one MEDIUM finding in active brand/agent-facing docs. Codex CLI Round 11 completed with two MEDIUM findings and two LOW findings. Another two-reviewer round is mandatory after these fixes.

Round 11 findings fixed:

- MEDIUM: active MoltGig/Ricky brand docs still taught raw `Gigs completed` and `Total GMV` traction templates. Replaced them with segmented `real third-party paid completions`, external submissions, funded gigs, and review SLA examples.
- MEDIUM: public homepage/demo routes still implied automatic payment release or "no approval queues." Updated the homepage command mock and `/demo/signal` / `/demo/neo` copy to include requester review before escrow release.
- MEDIUM: the first classification migration used broad copy hints that could mark an external requester gig as `house_test` or `onboarding`. Updated the source migration to scope copy hints to known platform/house wallets, added Ricky's operator wallet to platform wallets, and added `20260519203000_repair_task_origin_external_copy_guard.sql` to repair any already-applied external-copy misclassifications.
- LOW fixed opportunistically: `RevenueChart` now uses `data.revenue[].revenue_wei` from `/api/admin/timeseries` instead of a frontend 3% estimate.
- LOW fixed opportunistically: stale Ricky Moltbook prompt cadence now describes approval-gated draft targets, and `workspace/DRAFT_QUEUE.md` has been cleared of the old ready-to-post emoji/hashtag draft.
- LOW/INFO fixed opportunistically: public/current autonomy positioning was softened where it conflicted with requester review, dispute handling, or Max approval gates.

Verification after tenth blocker pass:

- `cd backend && npx tsc --noEmit && npm test -- --runInBand` passed: 73 tests.
- `cd frontend && npx tsc --noEmit && npm run build` passed, with the existing multiple-lockfile warning.
- `node -e "JSON.parse(...openapi...); JSON.parse(...agent.json...); JSON.parse(...a2a openapi...)"` passed.
- MoltGig `git diff --check` and `bash -n skills/moltgig/scripts/moltgig.sh` passed.
- Ricky verification passed: `jq empty cron/jobs.json cron/jobs.json.bak`, `bash -n skills/moltgig/scripts/moltgig-admin.sh`, `bash -n skills/moltgig/scripts/moltgig-review.sh`, and current-file trailing-whitespace checks excluding archived memory files.
- Targeted stale-copy searches passed for current MoltGig and Ricky review surfaces: no stale no-approval, automatic-payment, raw completion/GMV, or overbroad fully-autonomous launch copy remains in the checked surfaces.
- `supabase db push --dry-run --linked` showed only `20260519203000_repair_task_origin_external_copy_guard.sql`.
- `supabase db push --linked --yes` applied `20260519203000_repair_task_origin_external_copy_guard.sql` successfully.
- `supabase db lint --linked` passed with no schema errors.

Carry-forward:

- Because Round 11 had MEDIUM findings, another full Claude Code CLI + Codex CLI review round is mandatory after this pass.
- Production is still running the older app deployment until this branch is deployed, although the linked Supabase schema/data repair migrations have now been applied. Live production endpoint checks should be repeated after deployment before public relaunch.

### 2026-05-19 - Peer-review gate fixes, eleventh blocker pass

Claude Code CLI Round 12 completed with `VERDICT: NO HIGH/MEDIUM FINDINGS` and LOW/INFO follow-ups. Codex CLI Round 12 found four HIGH findings and one MEDIUM finding. Another two-reviewer round is mandatory after these fixes.

Round 12 findings fixed:

- HIGH: remaining public demo variants still implied automatic payment release or no approval queue. Updated `/demo/aurora`, `/demo/orbit`, and `/demo/carbon-f` to describe requester approval or dispute resolution before release.
- HIGH: public demo variants still used fabricated/raw traction metrics. Updated `/demo/aurora` and `/demo/prism` to use segmented relaunch metrics: real paid completions, external submissions, funded gigs, and review SLA target.
- HIGH: active metrics docs still taught raw GMV/completions as traction. Updated `docs/reference_docs/MOLTGIG_BRIEF.md` and `docs/reference_docs/marketing/MOLTGIG_MARKETING.md` to make real third-party paid completions the north-star metric and external submissions/review SLA the supporting KPIs.
- HIGH: nested `moltbook-mcp/agentid.json` contained a tracked inline private key. Replaced it with environment-variable indirection, added the file to the nested `.gitignore`, and documented that any previously exposed key must be treated as compromised and rotated.
- MEDIUM: `/demo/carbon-d` parsed the new `/api/stats` response as a primitive task count. Updated the response typing and mapping to read `tasks.total` and `traction.real_third_party_paid_marketplace_completions`.
- LOW fixed opportunistically: MoltGig-side `docs/agents/RICKY_MOLTBOOK_PROMPT.md` now matches the approval-gated Ricky prompt wording and treats profile updates as proposals after Max approval.

Verification after eleventh blocker pass:

- `cd backend && npx tsc --noEmit && npm test -- --runInBand` passed: 73 tests.
- `cd frontend && npx tsc --noEmit && npm run build` passed, with the existing multiple-lockfile warning.
- `node -e "JSON.parse(...openapi...); JSON.parse(...agent.json...); JSON.parse(...a2a openapi...)"` passed.
- MoltGig `git diff --check` and `bash -n skills/moltgig/scripts/moltgig.sh` passed.
- Ricky verification passed: `jq empty cron/jobs.json cron/jobs.json.bak`, `bash -n skills/moltgig/scripts/moltgig-admin.sh`, `bash -n skills/moltgig/scripts/moltgig-review.sh`, and current-file trailing-whitespace checks excluding archived memory files.
- Targeted stale-copy/secret searches passed for current MoltGig review surfaces: no stale automatic-release/no-approval copy, raw completion/GMV traction copy, or inline private-key JSON remains in the checked files.
- `git -C moltbook-mcp status` still hangs in this environment; file-level checks verified `moltbook-mcp/agentid.json` no longer contains an inline `private_key` field. Any real key previously stored there should be rotated outside this branch.

Carry-forward:

- Because Round 12 had HIGH/MEDIUM findings, another full Claude Code CLI + Codex CLI review round is mandatory after this pass.
- The nested `moltbook-mcp` credential should be rotated operationally; the branch can only remove the inline secret from the working tree/source.
- Production is still running the older app deployment until this branch is deployed. Live production endpoint checks should be repeated after deployment before public relaunch.

### 2026-05-19 - Peer-review gate fixes, twelfth blocker pass

Claude Code CLI Round 13 reported two MEDIUM findings. Codex CLI Round 13 reported four MEDIUM findings. Another two-reviewer round is mandatory after these fixes.

Round 13 findings fixed:

- MEDIUM: Ricky mirrored MoltGig docs still taught raw completion/GMV traction. Updated Ricky `docs/moltgig_docs/MOLTGIG_MARKETING.md`, `MOLTGIG_BRIEF.md`, `PLATFORM_MECHANICS.md`, and `MOLTGIG_ECONOMICS.md` to use real third-party paid completions, external submissions, review SLA, and confirmed `fee_wei`.
- MEDIUM: remaining public demo variants still implied automatic or instant payment. Updated `/demo/carbon`, `/demo/carbon-a`, `/demo/carbon-c`, `/demo/carbon-d`, `/demo/carbon-g`, `/demo/signal`, `/demo/aurora`, and `/demo/prism` to describe requester review, dispute resolution, or submitted work before payment release.
- MEDIUM: demo variants still used ambiguous raw activity counters. Updated `/demo/neo`, `/demo/orbit`, `/demo/carbon-f`, and `/demo/carbon-g` to avoid raw completions/volume and to use segmented relaunch metrics or non-numeric copy.
- MEDIUM: `/demo/carbon-g` parsed the new `/api/stats` response as primitive task counts. It now reads `tasks.total` and `traction.real_third_party_paid_marketplace_completions`, matching `/demo/carbon-d`.
- LOW fixed opportunistically: Ricky `PLAYBOOK.md` historical section is explicitly marked "Do Not Execute"; old completion lookup and public comment instructions were replaced with approval-gated draft/queue language.
- INFO fixed opportunistically: nested `moltbook-mcp/.gitignore` now ignores `.ai-saas-consortium-key`.
- LOW fixed opportunistically: MoltGig `PLATFORM_MECHANICS.md` now describes segmented public metrics and implemented requester review behavior.
- LOW fixed opportunistically: Ricky's stale active `2026-02-25-submission-review-pipeline.md` was moved from `docs/plans/active/` to `docs/plans/archive/`.

Verification after twelfth blocker pass:

- `cd backend && npx tsc --noEmit && npm test -- --runInBand` passed: 73 tests.
- `cd frontend && npx tsc --noEmit && npm run build` passed, with the existing multiple-lockfile warning.
- `node -e "JSON.parse(...openapi...); JSON.parse(...agent.json...); JSON.parse(...a2a openapi...)"` passed.
- MoltGig `git diff --check` and `bash -n skills/moltgig/scripts/moltgig.sh` passed.
- Ricky verification passed: `jq empty cron/jobs.json cron/jobs.json.bak`, `bash -n skills/moltgig/scripts/moltgig-admin.sh`, `bash -n skills/moltgig/scripts/moltgig-review.sh`, and current-file trailing-whitespace checks excluding archived memory files.
- Targeted stale-copy/metric/secret searches passed for current MoltGig and Ricky review surfaces: no automatic-release/no-approval phrases, raw completion/GMV traction phrases, or inline private-key JSON remains in the checked current/demo files.

Carry-forward:

- Because Round 13 had MEDIUM findings, another full Claude Code CLI + Codex CLI review round is mandatory after this pass.
- The nested `moltbook-mcp` credential should be rotated operationally; the branch removed the inline secret and added ignore coverage, but cannot rotate any external credential.
- Production is still running the older app deployment until this branch is deployed. Live production endpoint checks should be repeated after deployment before public relaunch.

### 2026-05-19 - Peer-review gate fixes, thirteenth blocker pass

Claude Code CLI Round 14 reported three MEDIUM findings. Codex CLI Round 14 reported four MEDIUM findings. Another two-reviewer round is mandatory after these fixes.

Round 14 findings fixed:

- MEDIUM: public demo and legal copy still implied instant or automatic payment. Updated `/demo/prism`, `/demo/void`, `/demo/aurora`, `/demo/signal`, and `/legal/terms` to describe requester approval, dispute resolution, and escrow-backed review instead of instant/automatic release.
- MEDIUM: `/demo/carbon-g` and `/demo/carbon-d` could fall back from segmented real paid completions to raw legacy completion counters. Removed the raw fallback so the "Real Paid Completions" value is only `traction.real_third_party_paid_marketplace_completions` or zero.
- MEDIUM: public demo pages still showed stale claim-route examples. Updated demo API examples to the stable backend accept route.
- MEDIUM: public demo pages still animated hardcoded relaunch volume metrics. Updated `/demo/aurora`, `/demo/prism`, `/demo/orbit`, and `/demo/neo` to fetch current `/api/stats` and display segmented `external_submissions`, `tasks.funded`, and real third-party paid completions.
- MEDIUM: Ricky `cron/jobs.json.bak` and stale active plans still read as live autonomous public-posting guidance. Synced `cron/jobs.json.bak` to the guarded current cron config, moved `docs/plans/active/2026-02-20-moltgig-growth-plan.md` to archive, removed the duplicate active `ricky-automation-investigation.md`, and removed the completed duplicate `fix-bot-memory-issue.md` from active.
- MEDIUM: Ricky's mirrored glossary still said the platform fee was 5%. Updated `Ricky/docs/moltgig_docs/GLOSSARY.md` to 3%.
- LOW fixed opportunistically: `/demo/carbon-e` now shows the correct `97/3` split, Prism no longer implies programmatic quality auto-verification, Ricky `PLAYBOOK.md` footer date/version matches the May 2026 rewrite, and `supabase/.temp/` is ignored.

Verification after thirteenth blocker pass:

- `cd backend && npx tsc --noEmit && npm test -- --runInBand` passed: 73 tests.
- `cd frontend && npx tsc --noEmit && npm run build` passed, with the existing multiple-lockfile warning.
- `node -e "JSON.parse(...openapi...); JSON.parse(...agent.json...); JSON.parse(...a2a openapi...)"`, MoltGig `git diff --check`, and `bash -n skills/moltgig/scripts/moltgig.sh` passed.
- Ricky `jq empty cron/jobs.json cron/jobs.json.bak`, `bash -n skills/moltgig/scripts/moltgig-admin.sh`, and `bash -n skills/moltgig/scripts/moltgig-review.sh` passed.
- Targeted MoltGig stale-copy search passed for the Round 14 blockers: no hardcoded demo metrics, stale claim-route examples, instant/automatic payment phrases checked by the review, old split, or programmatic-quality-verification phrase remain in current demo/legal files.
- Targeted Ricky stale-instruction search passed for current cron/back-up/active-plan surfaces: no old fee phrasing, raw completed-gig metrics, stale completed-task query, old cron-add instruction, comment-spam instruction, or direct gig-announcement posting instruction remain in the checked current files. Historical `cron/runs/` logs still contain old run summaries; they are evidence logs, not operating prompts.

Carry-forward:

- Because Round 14 had MEDIUM findings, another full Claude Code CLI + Codex CLI review round is mandatory after this pass.
- Round 15 is now ready to run.
- The nested `moltbook-mcp` credential should be rotated operationally; this branch only removes the inline secret from source.

### 2026-05-19 - Peer-review gate fixes, fourteenth blocker pass

Codex CLI Round 15 reported four MEDIUM findings. The first three were branch-owned and fixed. The fourth was live production still serving the old deployment; this was initially misattributed to a Hetzner SSH blocker, but Max clarified on 2026-05-19 that MoltGig is hosted on Replit and deploys are performed manually by Max.

Round 15 findings fixed:

- MEDIUM: `/integrate` documented the wrong wallet signature message. Updated `frontend/src/app/integrate/page.tsx` so the message format and ethers example use exactly `MoltGig Auth: {timestamp}`, matching the public auth docs.
- MEDIUM: Ricky's approval flow implied that `moltgig-review.sh approve <task_id>` alone could complete an escrow-backed gig. Updated `skills/moltgig/scripts/moltgig-review.sh` to detect `chain_task_id` and refuse direct approval unless the caller uses `--record` after on-chain `MoltGigEscrow.approveWork(chain_task_id)` has mined. Updated Ricky cron prompts, `SOUL.md`, and `TOOLS_INVENTORY.md` with the same on-chain-first approval rule.
- MEDIUM: stale launch copy still said instant settlement, stale claim-route examples, or automatic no-human payment. Updated the homepage settlement copy, `/demo/carbon-f`, top-level `legal/TERMS_OF_SERVICE.md`, MoltGig competitor reference copy, and Ricky mirrored competitor copy.
- LOW fixed opportunistically: Ricky's public `moltgig.sh stats` command now prints completed-all-origins separately from real third-party paid completions, and the duplicate completed `security-audit-and-hardening.md` plan was removed from Ricky `docs/plans/active/`.

Verification after fourteenth blocker pass:

- `cd backend && npx tsc --noEmit && npm test -- --runInBand` passed: 73 tests.
- `cd frontend && npx tsc --noEmit && npm run build` passed, with the existing multiple-lockfile warning.
- `node -e "JSON.parse(...openapi...); JSON.parse(...agent.json...); JSON.parse(...a2a openapi...)"`, MoltGig `git diff --check`, and `bash -n skills/moltgig/scripts/moltgig.sh` passed.
- Ricky `jq empty cron/jobs.json cron/jobs.json.bak`, `bash -n skills/moltgig/scripts/moltgig-admin.sh`, `bash -n skills/moltgig/scripts/moltgig-review.sh`, and `bash -n skills/moltgig/scripts/moltgig.sh` passed.
- Targeted stale-copy searches passed for current non-archive MoltGig public surfaces: no legacy auth heading, stale claim-route example, instant-settlement copy, automatic-payment copy, no-human payment copy, old legal fee wording, or stale automatic-release wording.
- Targeted Ricky stale-instruction searches passed for current cron/active/docs/skill surfaces, aside from intentional command references now paired with the on-chain-first `approveWork` rule.

Deployment blocker:

- `ssh -o BatchMode=yes -o ConnectTimeout=10 openclaw@46.225.50.229 ...` failed with `REMOTE HOST IDENTIFICATION HAS CHANGED`, fingerprint `SHA256:MEaxygMcjS+Bn8GSCSilWUQ8tH/TkNabMb5oiKS2CH0`, offending known host line 12. This is not the MoltGig Replit deployment path.
- Do not bypass the Hetzner host-key warning for unrelated server work. MoltGig production deployment is a manual Replit action by Max, and live production will continue to show old `/api/stats` and `/api/heartbeat` semantics until Max deploys this branch on Replit.

Carry-forward:

- Because Round 15 had MEDIUM branch findings, another full Claude Code CLI + Codex CLI review round is mandatory after these fixes.
- The next review round should treat the old deployment as an external Replit manual-deploy blocker, not as a source-code correctness finding.

### 2026-05-19 - Peer-review gate fixes, fifteenth blocker pass

Codex CLI Round 16 reported one MEDIUM finding. Claude CLI Round 16 hung before producing output and was killed; the next Claude run will use a narrower prompt because broad Claude reviews are hanging in this environment.

Round 16 finding fixed:

- MEDIUM: current public frontend links still pointed at the legacy skill URL, while the served Next public asset is `/skill.md`, and the root skill file had fake-looking example stats. Updated current frontend/demo/docs links to `https://moltgig.com/skill.md`, added a permanent legacy skill redirect to `/skill.md`, and replaced fake numeric `/api/stats` examples in the root skill file with clearly labeled response-shape placeholders.

Verification after fifteenth blocker pass:

- Targeted current-surface search passed: no legacy skill URL, fake `agents: 42`, fake `total: 100`, fake `completed_all_origins: 80`, or hardcoded zero `real_third_party_paid_marketplace_completions` example remain in the checked current frontend/docs/root skill surfaces.

Carry-forward:

- Because Round 16 had a MEDIUM finding, another full Codex CLI review and a focused Claude Code CLI review are mandatory after verification.
- If Claude Code broad prompts keep hanging, use a focused read-only prompt with explicit surfaces and record the limitation in this plan.

### 2026-05-19 - Peer-review gate fixes, sixteenth blocker pass

Codex CLI Round 17 reported three MEDIUM findings. Claude CLI Round 17 hung before producing output and was killed; broad and focused Claude prompts both hang when asked to perform multi-surface reviews in this environment, so the next Claude run will use a minimal file-targeted prompt.

Round 17 findings fixed:

- MEDIUM: `a2a_files/agent.json` still pointed `endpoints.skill` at the legacy skill URL. Updated it to `https://moltgig.com/skill.md`.
- MEDIUM: Ricky active `RICKY_MOLTBOOK_PROMPT.md` still pointed at the legacy skill URL. Updated it to `https://moltgig.com/skill.md`.
- MEDIUM: `/integrate` visible auth placeholder used the legacy unix placeholder instead of the exact documented shape. Updated it to `MoltGig Auth: {timestamp}` and also aligned Ricky's skill docs/script help text.

Verification after sixteenth blocker pass:

- Targeted searches passed for current MoltGig/Ricky surfaces: no legacy skill URL, no legacy unix auth placeholder, and no fake `agents: 42`, `total: 100`, or `completed_all_origins: 80` stats examples remain in checked current files.

Carry-forward:

- Because Round 17 had MEDIUM findings, another Codex CLI review and a minimal Claude Code CLI review are mandatory after verification.

### 2026-05-19 - Peer-review gate fixes, seventeenth blocker pass

Codex CLI Round 18 reported one scope-dependent HIGH secret risk, three MEDIUM findings, and confirmed production was still on the old deployment; the deployment blocker was later corrected to Max's manual Replit deploy path rather than Hetzner SSH. Claude Code CLI Round 18, using the evidence-file workaround, reported one MEDIUM docs-link finding and no HIGH findings. Another two-reviewer round is mandatory after these fixes.

Round 18 findings fixed:

- HIGH, scope-dependent: nested `moltbook-mcp/account-registry.json` contained a literal Moltbook API key value. Redacted the local value without printing it and marked the credential for operational rotation.
- MEDIUM: served `frontend/public/.well-known/agent.json` lacked `endpoints.skill`. Added `https://moltgig.com/skill.md`.
- MEDIUM: public/agent-facing docs still used the legacy unix auth placeholder. Updated `frontend/public/skill.md`, `frontend/public/llms.txt`, `a2a_files/llms.txt`, MoltGig skill docs/scripts, and Ricky skill docs/scripts to use `MoltGig Auth: {timestamp}`.
- MEDIUM: legacy A2A OpenAPI source copy still said API completion triggers payment release. Updated it to say escrow-backed completions require mined `approveWork` before the API record succeeds.
- MEDIUM: Ricky beta onboarding docs still linked the legacy skill path. Updated both references to `/skill.md`.
- LOW fixed opportunistically: Playwright e2e now checks `/skill.md` directly.

Verification after seventeenth blocker pass:

- JSON validation passed for served/A2A OpenAPI and agent cards.
- Targeted stale-link/auth/release searches passed across current MoltGig and Ricky public/review surfaces.

Carry-forward:

- Because Round 18 had HIGH/MEDIUM findings, another full Codex CLI review and Claude Code CLI review are mandatory.
- Claude Code broad prompts continue to hang in this environment; the working fallback is a narrow review against a generated evidence file.

### 2026-05-19 - Peer-review gate fixes, eighteenth blocker pass

Codex CLI Round 19 reported two MEDIUM findings and one LOW finding. Claude Code CLI Round 19 hung against stale evidence and was killed; the next Claude run will use a smaller updated evidence file with a timeout. Another two-reviewer round is mandatory after these fixes.

Round 19 findings fixed:

- MEDIUM: Ricky still had an executable ETH transfer path in `skills/moltgig/scripts/eth-transfer.sh`. Replaced it with a non-executable policy blocker that exits and states Ricky may not send ETH, sign wallet transactions, or top up agents.
- MEDIUM: contract reconciliation could report chain-resolved tasks as in sync while metrics undercounted missing payout transaction rows. `buildContractReconciliation` now accepts transactions and flags completed chain tasks without confirmed `complete` or `dispute_resolve` transaction evidence. `/api/admin/reconcile/contract` now loads transactions and passes them into the report.
- LOW: A2A/static skill docs still linked the production contract to Sepolia Basescan. Updated A2A agent/llms and MoltGig skill docs to Base mainnet.
- LOW fixed opportunistically: Ricky wallet security report now says the ETH transfer tool is disabled and funding must use owner-controlled wallet tooling.
- Added `backend/tests/contractReconciliation.test.ts` covering missing and present payment-transaction evidence.

Verification after eighteenth blocker pass:

- `cd backend && npx tsc --noEmit && npm test -- --runInBand` passed: 75 tests.
- `cd frontend && npx tsc --noEmit && npm run build` passed, with the existing multiple-lockfile warning.
- `node -e "JSON.parse(...openapi/agent files...)"`, MoltGig `git diff --check`, and MoltGig `bash -n skills/moltgig/scripts/moltgig.sh` passed.
- Ricky `jq empty cron/jobs.json cron/jobs.json.bak`, `bash -n skills/moltgig/scripts/moltgig-admin.sh`, `bash -n skills/moltgig/scripts/moltgig-review.sh`, `bash -n skills/moltgig/scripts/moltgig.sh`, and `bash -n skills/moltgig/scripts/eth-transfer.sh` passed.
- Targeted stale-risk search passed for current MoltGig/Ricky surfaces: no Ricky private-key send path, Sepolia contract links, legacy auth placeholder, stale A2A payment-release copy, old fee phrasing, stale claim-route examples, automatic-payment copy, or inline private-key JSON remains in checked current files.

Carry-forward:

- Because Round 19 had MEDIUM findings, run Round 20 with both Claude Code CLI and Codex CLI.
- If Round 20 has no HIGH/MEDIUM findings, update Phase 11/12 status and record the final external deployment blocker.

### 2026-05-19 - Peer-review gate fixes, nineteenth blocker pass

Claude Code CLI Round 20 reported no HIGH/MEDIUM findings and two LOW follow-ups. Codex CLI Round 20 reported one MEDIUM finding and two LOW findings. Another two-reviewer round is mandatory after these fixes.

Round 20 findings fixed:

- MEDIUM: A2A/static release artifacts still labeled the production contract as the old testnet. Updated `a2a_files/llms.txt` and `docs/reference_docs/marketing/LISTING_OPPORTUNITIES.md` to Base mainnet.
- LOW: Ricky wallet security report still read as if the disabled transfer script were current. Added a current-status note and changed the transfer capability section to say the current tool is disabled/non-executable and wallet actions require owner-controlled tooling.
- LOW fixed opportunistically: refreshed public/current no-human launch copy in MoltGig and Ricky docs to describe requester-reviewed escrow instead.

Verification after nineteenth blocker pass:

- Targeted stale-risk search passed for current MoltGig/Ricky surfaces, excluding historical archives/logs/memory: no old testnet labels, no no-human launch copy, no Ricky private-key send path, no old explorer links, no legacy auth placeholder, no stale A2A payment-release copy, no old fee phrasing, no stale claim-route examples, no automatic-payment copy, and no inline private-key JSON remains in checked files.

Carry-forward:

- Because Round 20 had a MEDIUM finding, run Round 21 with both Claude Code CLI and Codex CLI.
- Codex Round 20 LOW on Ricky API signing is documented as residual: Ricky still signs API auth for approved admin/review scripts, but the ETH transfer path is disabled and no chain fund-release path is available to Ricky.

### 2026-05-19 - Peer-review gate fixes, twentieth blocker pass

Claude Code CLI Round 21 reported no HIGH/MEDIUM findings and two LOW follow-ups. Codex CLI Round 21 reported one MEDIUM finding and two LOW findings. Another two-reviewer round is mandatory after these fixes.

Round 21 findings fixed:

- MEDIUM: current public/launch-facing copy still used no-human positioning. Updated top-level README/agent docs, Aurora and Carbon demo hero copy, and Ricky listing docs to describe requester-reviewed escrow instead.
- LOW: top-level/internal docs still showed testnet deploy commands without enough context. Reframed them as testnet-only examples and called out the verified Base mainnet production contract.
- LOW: checked-in contract source defaulted `platformFee` to 5 while live mainnet and docs use 3. Updated `contracts/MoltGigEscrowV2.sol` default to `3`.
- LOW fixed opportunistically: `LISTING_OPPORTUNITIES.md` no longer has a `[TBD]` website placeholder.

Verification after twentieth blocker pass:

- `cd backend && npx tsc --noEmit && npm test -- --runInBand` passed: 75 tests.
- `cd frontend && npx tsc --noEmit && npm run build` passed, with the existing multiple-lockfile warning.
- JSON validation, MoltGig `git diff --check`, MoltGig script syntax, Ricky cron JSON, and Ricky script syntax checks passed.
- Targeted stale-risk search passed for current MoltGig/Ricky surfaces, excluding historical archives/logs/memory: no no-human launch copy, old testnet labels, old explorer links, old contract fee default, old fee-on-completion wording, legacy auth placeholder, stale payment-release copy, stale claim-route examples, automatic-payment copy, or inline private-key JSON remains in checked files.

Carry-forward:

- Because Round 21 had a MEDIUM finding, run Round 22 with both Claude Code CLI and Codex CLI.

### 2026-05-19 - Peer-review gate fixes, twenty-first blocker pass

Codex CLI Round 22 reported one operational HIGH, one MEDIUM, and two LOW findings. Claude Code CLI Round 22 was still running when Codex completed; the next round must include both reviewers after these fixes.

Round 22 findings fixed:

- HIGH, operational/local: ignored repo-root `.env` contained live-looking secrets. Redacted sensitive local values without printing them. Any real values that were present must be rotated out-of-band before relaunch.
- MEDIUM: Ricky/Moltbook prompt drafts still contained no-human positioning and one Ricky copy still used public `/api/stats` instead of admin funnel/reconcile as its source of truth. Updated MoltGig and Ricky prompt copies to API-first requester-reviewed escrow language and admin operating endpoints.
- LOW: `AGENTS.md` still referenced nonexistent/stale brief/phase docs. Updated it to the current brief and active relaunch plan.
- LOW: README still said minimum gig value was `0.001 ETH`; updated it to the contract behavior and project testing rule: any positive ETH, use minimum viable test amounts.
- LOW fixed opportunistically: removed remaining no-human launch copy from a demo variant and refreshed Ricky mirrored docs that referenced stale brief/phase filenames.

Verification after twenty-first blocker pass:

- Targeted stale-risk and redaction checks passed for current MoltGig/Ricky surfaces: no no-human launch copy, stale Ricky prompt wording, stale brief/phase paths in active docs checked, old testnet labels, old explorer links, old contract fee default, old fee-on-completion wording, legacy auth placeholder, stale payment-release copy, stale claim-route examples, automatic-payment copy, inline private-key JSON, or unredacted sensitive repo-root `.env` values remain in the checked files.

Carry-forward:

- Because Round 22 had HIGH/MEDIUM findings, run Round 23 with both Claude Code CLI and Codex CLI.
- Secret rotation remains an operational requirement because local `.env` values were exposed to review sessions before redaction.

### 2026-05-19 - Peer-review gate fixes, twenty-second blocker pass

Claude Code CLI Round 23 reported no HIGH/MEDIUM findings and three LOW follow-ups. Codex CLI Round 23 reported two MEDIUM findings and two LOW findings. Another two-reviewer round is mandatory after these fixes.

Round 23 findings fixed:

- MEDIUM: additional secret-shaped values remained in ignored `.env`. Redacted Telegram/API-token shaped values and verified no secret-shaped values remain except public wallet addresses/project URLs.
- MEDIUM: no-human/autonomy positioning remained in demo variants and Ricky active prompt material. Updated Orbit/Grid demo copy, Ricky SOUL/PLAYBOOK/GOALS/IDENTITY, active improvement plan language, and current competitor docs to requester-reviewed/API-first framing.
- LOW: active Ricky improvements plan still contained future automatic approval/seeding ideas. Marked it superseded by May 2026 relaunch hardening and replaced those ideas with approval-gated recommendations.
- LOW: `docs/README.md` and the create-gig example had stale metadata/deadline examples. Updated current active plan metadata and moved the API example deadline forward.

Verification after twenty-second blocker pass:

- Targeted env redaction check passed: no unredacted secret-shaped local `.env` values remain, except non-secret public wallet addresses/project URLs.
- Targeted stale-risk search passed across current MoltGig/Ricky surfaces, excluding historical archives/logs/memory: no no-human launch copy, stale no-pilot/autonomy claims, automatic approval/seeding prompts, old testnet labels, old explorer links, old contract fee default, old fee-on-completion wording, legacy auth placeholder, stale payment-release copy, stale claim-route examples, automatic-payment copy, or inline private-key JSON remains in checked files.

Carry-forward:

- Because Round 23 had MEDIUM findings, run Round 24 with both Claude Code CLI and Codex CLI.
- Secret rotation remains required operationally; local redaction only prevents further workspace exposure.

### 2026-05-19 - Peer-review gate fixes, twenty-third blocker pass

Claude Code CLI Round 24 reported no HIGH/MEDIUM source-code findings and LOW/operational follow-ups. Codex CLI Round 24 reported one HIGH and two MEDIUM findings. Another two-reviewer round is mandatory after these fixes.

Round 24 findings fixed:

- HIGH, operational/local: `frontend/.env.local` contained a concrete admin key. Redacted secret-shaped values there and verified both repo-root `.env` and frontend `.env.local` now contain only placeholders for secret-shaped fields.
- MEDIUM: agent-facing lifecycle docs still implied API-only accept/submit for escrow-backed gigs. Updated `/integrate`, gig detail copy, A2A OpenAPI/llms, and public skill docs to instruct contract-first `claimTask`/`submitWork`, then API record/sync.
- MEDIUM: Ricky competitive memory still used raw completions, timed settlement, and stale autonomy comparisons. Updated all current memory occurrences to verified external paid completion framing, requester approval/dispute settlement, and API-first onboarding.

Verification after twenty-third blocker pass:

- Env redaction checks passed for `.env` and `frontend/.env.local`.
- JSON validation passed for served/A2A OpenAPI and agent cards.
- Targeted stale lifecycle/settlement/autonomy search passed for current public docs, A2A docs, integrate/gig detail views, and Ricky competitive memory.
- `cd backend && npx tsc --noEmit && npm test -- --runInBand` passed: 75 tests.
- `cd frontend && npx tsc --noEmit && npm run build` passed after correcting JSX text in the gig detail contract-first hint, with the existing multiple-lockfile warning.
- MoltGig `git diff --check`, MoltGig script syntax, Ricky cron JSON, and Ricky script syntax checks passed.

Carry-forward:

- Because Round 24 had HIGH/MEDIUM findings, run Round 25 with both Claude Code CLI and Codex CLI.
- Secret rotation remains required operationally; local redaction only prevents further workspace exposure.

### 2026-05-19 - Peer-review gate fixes, twenty-fourth blocker pass

Codex CLI Round 25 reported three MEDIUM findings. Claude Code CLI Round 25 was killed because it was still reviewing stale Round 25 evidence after Codex identified blockers. Another two-reviewer round is mandatory after these fixes.

Round 25 findings fixed:

- MEDIUM: Ricky competitive memory still contained repeated raw completion and timed-settlement comparison rows. Rewrote all current `COMPETITIVE_INTEL.md` comparison rows to use verified external paid completion framing, requester approval/dispute resolution, and API-first onboarding.
- MEDIUM: heartbeat, onboarding guide, and root skill decision tree still implied API-only accept/submit for escrow-backed gigs. Updated them to contract-first `claimTask`/`submitWork`, then API record/sync.
- MEDIUM: requester-won disputes could be recorded as `dispute_resolve` paid-completion evidence. `handleDisputeResolved` now checks the winner wallet: worker wins record `dispute_resolve` and complete the task; requester/other wins record `refund` and do not count as paid completions. Added a funnel regression test proving requester-won refunds are not paid completions.

Verification after twenty-fourth blocker pass:

- `cd backend && npx tsc --noEmit && npm test -- --runInBand` passed: 76 tests.
- `cd frontend && npx tsc --noEmit && npm run build` passed, with the existing multiple-lockfile warning.
- JSON validation, MoltGig `git diff --check`, and MoltGig/Ricky script syntax checks passed.
- Env redaction checks passed for `.env` and `frontend/.env.local`.
- Targeted stale lifecycle/settlement/autonomy search passed for current public docs, A2A docs, heartbeat, onboarding, integrate/gig detail views, and Ricky competitive memory.

Carry-forward:

- Because Round 25 had MEDIUM findings, run Round 26 with both Claude Code CLI and Codex CLI.
- Secret rotation remains required operationally; local redaction only prevents further workspace exposure.

### 2026-05-19 - Peer-review gate fixes, twenty-fifth blocker pass

Claude Code CLI Round 26 did not run because the Claude CLI returned `You've hit your org's monthly usage limit`. Codex CLI Round 26 reported two MEDIUM findings and two LOW findings. Another two-reviewer round is mandatory after these fixes, but Claude availability is now an external blocker if the usage limit persists.

Round 26 findings fixed:

- MEDIUM: public demo routes still contained stale no-human/instant-settlement copy. Updated `void`, `prism`, `meridian`, and `phantom` demos to describe contract-backed escrow that settles after requester approval or dispute resolution.
- MEDIUM: the reviewer could not verify Ricky release artifacts because the MoltGig repo only contains the app-side skill script. Added explicit source-location guidance to `docs/agents/RICKY_MOLTBOOK_PROMPT.md`: Ricky operating scripts live in `/Users/maxascolani/Desktop/10. GitHub Repos/Ricky/skills/moltgig/scripts/`, while runtime install paths mirror them under `~/.openclaw/skills/moltgig/scripts/`.
- LOW: reference competitor docs still used raw/stale competitive framing. Updated current reference docs to label February 2026 competitor numbers as historical snapshots, remove pure-autonomy framing, and emphasize API-first requester-reviewed escrow.
- LOW: `skills/moltgig/README.md` still had older API-only and raw-completion examples. Updated it to separate public real third-party paid completions from seeded/test activity and to describe contract-first accept/submit/complete semantics.
- Follow-on route hygiene: changed demo UI navigation from `/tasks` to `/gigs`; API examples remain `/api/tasks` because that API path is intentionally stable.

Verification after twenty-fifth blocker pass:

- `cd backend && npx tsc --noEmit && npm test -- --runInBand` passed: 76 tests.
- `cd frontend && npx tsc --noEmit && npm run build` passed, with the existing multiple-lockfile warning.
- JSON validation passed for `frontend/public/openapi.json`, `frontend/public/.well-known/agent.json`, `a2a_files/openapi.json`, and `a2a_files/agent.json`.
- MoltGig `git diff --check` and `bash -n skills/moltgig/scripts/moltgig.sh` passed.
- Ricky `jq empty cron/jobs.json cron/jobs.json.bak` and bash syntax checks passed for `moltgig-admin.sh`, `moltgig-review.sh`, `moltgig.sh`, and disabled `eth-transfer.sh`.
- Targeted stale-copy and route search passed for current review surfaces: no current no-human/instant-payment/auto-release claims in demo, reference, agent, skill, A2A, backend, README, or root skill surfaces; no demo UI links still target `/tasks`.

Carry-forward:

- Because Round 26 had MEDIUM findings, run Round 27 with both Claude Code CLI and Codex CLI.
- If Claude CLI still returns the org monthly usage limit, record it as an external review-gate blocker; do not treat it as a source finding.
- Secret rotation remains required operationally; local redaction only prevents further workspace exposure.

### 2026-05-19 - Peer-review gate status, Round 27 and Round 28

Round 27:

- Claude Code CLI returned `You've hit your org's monthly usage limit`; no Claude review output was available.
- Codex CLI Round 27 reported **no HIGH or MEDIUM source findings**. LOW findings were:
  - Chain-backed API completion can mark DB completion before a missed `TaskCompleted` listener row records the `complete` transaction. This undercounts real paid completions rather than inflating them; reconciliation is the intended detection/repair path.
  - Platform mechanics docs had legacy `acceptTask()`/open-gig wording.
  - Ricky historical post/memory context still contained old settlement wording.
  - `moltbook-mcp/` remained an untracked local operational directory.

Round 27/28 LOW fixes:

- Added `moltbook-mcp/` to `.gitignore` so local operational state is ignored as a directory, not only file-by-file.
- Updated MoltGig and Ricky platform mechanics docs to say agents claim funded gigs, and chain-backed gigs require on-chain `claimTask(chain_task_id)` before API sync.
- Updated Ricky `PLAYBOOK.md` so `POST_HISTORY.md` is only for duplicate-topic avoidance and never the source of current settlement, fee, completion, or traction claims.
- Mechanically removed stale `72-hour`/`72h`/`auto-release` settlement phrases from Ricky workspace memory and Ricky CEO memory files.

Round 28:

- Claude Code CLI again returned `You've hit your org's monthly usage limit`; this remains an external review-tool blocker.
- Codex CLI Round 28 was a narrow read-only follow-up and again reported **no HIGH or MEDIUM findings**. It found one LOW stale-memory issue in dated Ricky logs; that LOW was mechanically cleaned after the review.

Verification after Round 27/28 follow-up:

- Ricky stale-memory search passed for `72-hour`, `72h`, and `auto-release` settlement phrases across `workspace/memory` and `agents/moltgig-ceo/memory` after the Round 28 LOW cleanup. A separate `72 hours` reference remains only for dispute admin decision timing in platform mechanics, not settlement auto-release.
- MoltGig targeted `git diff --check` passed for `.gitignore`, platform mechanics, and this active plan.
- Ricky cron JSON and script syntax checks passed again.
- JSON validation passed again for public and A2A OpenAPI/agent card files.
- Targeted stale public-copy and route search passed: no no-human/instant-payment/auto-release/demo `/tasks` UI links or legacy `acceptTask()`/open-gig claim wording in current checked surfaces.
- The remaining transaction LOW is intentionally documented as an undercount/reconciliation follow-up, not a launch blocker, because synthesizing payment transactions without event transaction data would risk worse evidence quality.

Carry-forward:

- Codex CLI has no HIGH/MEDIUM source findings as of Round 28.
- Claude Code CLI cannot currently complete due the org monthly usage limit. This is the only unresolved review-gate requirement from the user prompt.
- Production deployment remains blocked until Max manually deploys MoltGig on Replit. The Hetzner SSH host-key warning is unrelated to MoltGig deploy.
- Secret rotation remains required operationally; local redaction only prevents further workspace exposure.

### 2026-05-19 - Blocker follow-up: transaction undercount repair path

Max asked to deal with the residual transaction undercount LOW.

Implementation:

- Added `contractService.findPaymentEventForTask(chainTaskId, workerWallet)` to find concrete `TaskCompleted` or `DisputeResolved` logs for a chain task.
- Added `contractService.recordBackfilledPaymentEvent(taskId, event)` to insert an idempotent confirmed transaction row by `tx_hash`.
- Added admin endpoint `POST /api/admin/reconcile/contract/backfill-transactions`.
  - Defaults to dry-run unless request body has `{ "dry_run": false }`.
  - Only considers reconciliation mismatches with `field = payment_transaction`.
  - Only writes rows backed by actual escrow event logs.
  - Worker-won dispute events become `dispute_resolve`; non-worker dispute winners become `refund` so public paid-completion metrics are not inflated.
- Updated `docs/reference_docs/CONTRACT_RECONCILIATION_RUNBOOK.md` with dry-run/write commands and verification steps.
- Updated Ricky `moltgig-admin.sh` with `backfill-payments` and `backfill-payments --write`.

Verification:

- `cd backend && npx tsc --noEmit && npm test -- --runInBand` passed: 76 tests.
- Ricky `bash -n skills/moltgig/scripts/moltgig-admin.sh` and `jq empty cron/jobs.json cron/jobs.json.bak` passed.
- Targeted `git diff --check` passed for the touched MoltGig files.

Focused review/fix follow-up:

- Claude CLI is available again. It reviewed the blocker-5 fix and reported no HIGH/MEDIUM after confirming chunked scans, duplicate handling, chain-derived `to_address`, and runbook env guidance. Remaining items were LOW operational hardening.
- Codex CLI found one MEDIUM: worker-won dispute backfills could be misclassified as `refund` if DB `worker_wallet` was stale. Fixed by deriving the dispute worker from `getTask(chainTaskId).worker` and using DB wallet only as fallback.
- Added regression coverage in `backend/tests/contractPaymentBackfill.test.ts` for worker-won dispute classification when the DB worker is missing, plus early chunk-scan exit.
- Tightened env parsing for `ESCROW_CONTRACT_DEPLOY_BLOCK`/`CONTRACT_DEPLOY_BLOCK` and `ESCROW_EVENT_BACKFILL_CHUNK_SIZE`.
- Changed event log lookup to stop at the first latest matching chunk instead of scanning all the way to the deploy block when a match is found.
- Added `MOLTGIG_BACKFILL_APPROVED=yes` as a Ricky CLI guard for `backfill-payments --write`.

Verification after focused follow-up:

- `cd backend && npx tsc --noEmit && npm test -- --runInBand` passed: 78 tests.
- Ricky `bash -n skills/moltgig/scripts/moltgig-admin.sh` and `jq empty cron/jobs.json cron/jobs.json.bak` passed.
- Targeted `git diff --check` passed for the touched MoltGig files.
- Final focused Claude review reported no HIGH/MEDIUM for blocker 5; remaining LOW suggestions were extra tests for invalid env and duplicate idempotency.
- Final focused Codex review reported no HIGH/MEDIUM/LOW findings in the blocker-5 payment-backfill scope.

Deployment clarification:

- Max clarified on 2026-05-19 that MoltGig is hosted on Replit and must be deployed manually by Max.
- Do not treat the Hetzner/OpenClaw SSH host-key issue as a MoltGig deployment blocker.
- After Max deploys Replit, run production-safe checks for `/api/health`, `/api/stats`, `/api/heartbeat`, `/api/tasks?status=funded`, `/api/admin/funnel`, `/api/admin/reconcile/contract`, and a dry-run `POST /api/admin/reconcile/contract/backfill-transactions`.

Carry-forward:

- Use dry-run first in production after deploy:
  `POST /api/admin/reconcile/contract/backfill-transactions` with `{ "dry_run": true }`.
- Only run with `{ "dry_run": false }` after reviewing the exact repairable rows.

## Phase 0 - Investigation, Duplication Check, and Plan Hardening

Status: Mostly complete for the May 2026 audit. Re-run targeted checks immediately before implementation because production can change.

- [x] Inspect local repo status, recent commits, and GitHub PR history.
- [x] Inspect current planning README and Nox reference planning README.
- [x] Inspect active/archived planning docs for stale or duplicate work.
- [x] Audit backend route structure, services, notifications, auth, and event listener.
- [x] Audit frontend API client, product routes, and test drift.
- [x] Query production API and production database counts.
- [x] Read contract state from Base mainnet.
- [x] Triple-check completed gigs from DB, public API, submissions, transactions, and contract.
- [x] Inspect Ricky repo from a fresh clone and identify stale goals/scripts/cron loops.
- [x] Research current agent-commerce, agent-payment, and marketplace patterns.
- [x] Before any schema work, read `docs/agents/SUPABASE_AGENT.md` and query live schema definitions.
- [x] Before any code work, re-check worktree for user changes and current branch state.
- [x] Before any Ricky work, re-check latest Ricky repo and decide whether changes happen there or in MoltGig docs only.

Exit criteria:

- The implementation phases below are updated with exact file paths and SQL before edits begin.
- Max has made the decisions in Phase 1.

## Phase 1 - Decision Interview

Needed before implementation:

- [x] Decide whether MoltGig's next positioning is "agent-to-agent escrow marketplace" or "Base-native agent work exchange with protocol-compatible payments." Decision: Base-native agent work exchange with escrow first and protocol-compatible payment/discovery surfaces as follow-on work.
- [x] Decide whether x402/USDC support is P1 for relaunch or P2 after core cleanup. Decision: P2 for implementation; document compatibility now, do not block relaunch on x402.
- [x] Decide whether to support Virtuals ACP or only document compatibility research for now. Decision: research/compatibility notes only for this relaunch.
- [x] Approve or reject adding task/agent classification fields for metrics integrity. Decision: approved task-level classification; keep agent classification derived from canonical wallet identity for now.
- [x] Approve a seeded-gig cleanup strategy: hide, label, cancel, or leave existing funded gigs visible. Decision: preserve existing production evidence, label/classify it, and create a new proof-backed relaunch set; do not delete historical rows.
- [x] Approve an incentive budget for first real external completion and integration bounties. Decision: document proposed budgets and terms; actual funded/mainnet payouts remain owner-approved before spend.
- [x] Decide Ricky's near-term channel mix if Moltbook remains blocked. Decision: shift Ricky to reporting, target research, outreach drafts, listing updates, GitHub/ClawHub/OpenClaw actions, and owner approval queues instead of pretending Moltbook execution happened.
- [x] Decide whether Ricky can draft public outreach automatically but wait for Max approval before posting. Decision: Ricky may draft outreach and channel plans automatically, but public posts, paid actions, and wallet/fund actions require approval unless an existing cron/script explicitly authorizes them.

Exit criteria:

- Decisions are written in this plan with dates.
- Any production data or schema change has explicit approval.

## Phase 2 - Docs and Source-of-Truth Cleanup

- [x] Fix tracked stale references to `MOLTGIG_BRIEF_V3.md` or rename the brief intentionally.
- [x] Archive duplicate `2026-02-02-agent-growth-plan.md` from `active/` if it is superseded.
- [x] Move stale Ricky submission plan from active to archive or standby after verifying current state.
- [x] Update the active Openwork growth playbook with May 2026 reality or mark it superseded by this plan.
- [x] Create or update a reference doc for "MoltGig metrics taxonomy."
- [x] Create a concise "current production status" reference doc with contract, wallets, API, and known caveats.

Acceptance criteria:

- `docs/planning_docs/active/` contains only genuinely active work.
- New agents do not see conflicting source-of-truth docs.

## Phase 3 - Database Metrics and Classification Foundation

- [x] Query live Supabase schema and RLS policies.
- [x] Design minimal schema additions using `docs/agents/SUPABASE_AGENT.md` rules.
- [x] Add task/agent origin classification only if it cannot be safely derived. Implemented as derived code classification first; no production schema migration.
- [x] Add proof requirements to tasks if approved.
- [x] Add or update computed views for public/admin metrics. Implemented as derived `/api/stats` segments and `/api/admin/funnel`; no DB view yet.
- [x] Backfill labels for existing house tests, onboarding, MoltGig-seeded tasks, and external activity.
- [x] Reconcile drifted agent counters or replace user-facing reads with computed stats. Added counter-drift reporting in `/api/admin/funnel`; no production data repair yet.
- [x] Regenerate `types/supabase.ts`.

Acceptance criteria:

- A single query can answer "how many real third-party paid gigs completed?"
- Public stats cannot accidentally count house tests as traction.
- Existing production evidence is preserved.

## Phase 4 - Backend Lifecycle Refactor

- [x] Split `backend/src/routes/tasks.ts` into smaller route modules or services. Shared validation and proof/review logic are extracted; full route-file split deferred to a lower-risk follow-up after relaunch.
- [x] Extract lifecycle operations into a service layer with transaction-like behavior where possible. Proof/review policy moved into service; lifecycle mutations now have optimistic status guards. Full transaction wrapper deferred because Supabase JS route handlers do not provide multi-statement transactions without RPC.
- [x] Move request validation schemas into shared modules and update tests to import them.
- [x] Normalize response/error shape for agent clients. Core lifecycle validation now returns explicit errors and missing proof details; broad error-envelope refactor deferred to avoid breaking public clients before relaunch.
- [x] Add proof-requirement validation to submission flow if schema exists.
- [x] Standardize reject/revision/complete behavior and notification hooks.
- [x] Add integration tests around accept, submit, reject, revision, complete, and reopen flows.

Acceptance criteria:

- Task lifecycle behavior is covered by tests that exercise real route handlers.
- Rejecting bad work reopens a task predictably.
- Revision-request flow does not lose worker/submission state.

## Phase 5 - Contract Sync and Reconciliation

- [x] Write a read-only reconciliation script for current contract tasks.
- [x] Compare contract state against `tasks` rows with chain IDs. Transaction-level reconciliation still needs a deeper follow-up.
- [x] Fix event listener transaction semantics.
- [x] Add event backfill/checkpointing if approved. Decision: not approved for P1; documented as P2 migration if reconciliation proves it is needed.
- [x] Add an admin-only reconciliation report endpoint or script output for Ricky/Max.

Acceptance criteria:

- A missed event can be detected and repaired.
- Contract completed count and database completed paid count can be explained.
- Transaction types are semantically correct.

## Phase 6 - Frontend Agent/User Flow Refresh

- [x] Consolidate `/gigs` and `/tasks`; add redirects for stale routes if needed.
- [x] Update API client types and methods for current backend behavior.
- [x] Show proof requirements and review policy on gig detail pages.
- [x] Show task origin labels where relevant, especially for seed/test/onboarding.
- [x] Add a clear post-onboarding path to a real paid gig. `/gigs` now defaults to funded gigs and points agents from onboarding to funded work with proof requirements.
- [x] Add submission feedback/status UI. Gig detail pages show submission status, submission feedback, and task reviews.
- [x] Update API stats types and key UI/admin surfaces to separate real external activity.

Acceptance criteria:

- A new agent can onboard, find one suitable real gig, understand proof, and submit without reading source code.
- The UI no longer implies test completions are external traction.

## Phase 7 - Public Agent Protocol Refresh

- [x] Update `frontend/public/skill.md` with current stats and reject/revision semantics.
- [x] Update `frontend/public/llms.txt`.
- [x] Update `frontend/public/openapi.json`.
- [x] Update agent card metadata and endpoint examples.
- [x] Update heartbeat content to include top valid gigs, protocol version, and next action.
- [x] Add a small MCP wrapper plan or prototype if it can be done without distracting from core cleanup.
- [x] Add x402/AP2/ACP compatibility notes once Phase 1 decides scope.

Acceptance criteria:

- An agent can use only public docs and API responses to complete the intended flow.
- Public docs include current domains, auth, errors, and safety guidance.

## Phase 8 - Ricky Growth Operating System Refresh

This phase happens in the Ricky repo unless Max asks to keep it as planning only.

- [x] Update Ricky `GOALS.md` to make first real external paid completion the primary KPI.
- [x] Update Ricky `PLAYBOOK.md` away from single-channel Moltbook dependency.
- [x] Fix MoltGig CLI scripts that drifted from live API responses.
- [x] Add real-completion/funnel reporting.
- [x] Add stale-funded-gig and pending-submission reports.
- [x] Add experiment ledger and weekly result review.
- [x] Change cron prompts so blocked channels produce useful drafts/research, not pretend execution.
- [x] Add policy text forbidding house-agent test completions from growth metrics.

Acceptance criteria:

- Ricky can produce an accurate weekly MoltGig operating report.
- Ricky knows the difference between tests, onboarding, seeded work, and real third-party completion.
- Ricky has at least three non-Moltbook growth actions ready for Max approval.

## Phase 9 - Growth Relaunch and Incentives

- [x] Retire or label stale/duplicate seeded gigs. Existing rows were preserved and classified by `task_origin`; old generic gig guidance is marked superseded. Actual cancellation/funding changes remain owner-approved production operations.
- [x] Create 5-10 high-quality, verifiable gigs with proof requirements. Completed as owner-approved seeding templates; production funding remains gated.
- [x] Create first external completion bounty terms.
- [x] Create integration bounties for AgentKit/x402/OpenClaw/MCP examples if approved.
- [x] Publish/queue approved outreach for target channels. Deferred until deploy plus owner approval for public posting.
- [x] Ask Ricky to monitor conversions daily for the first launch week. Deferred until deploy/funded relaunch start.
- [x] Review every external submission quickly; no submissions should sit unnoticed. Operating process added to Ricky submission cron and playbook; live review remains ongoing operations.

Acceptance criteria:

- At least one external non-house agent submits valid work to a non-onboarding gig.
- Review turnaround is under 24 hours.
- Metrics report whether a true external paid completion happened.

## Phase 10 - Testing and Verification

- [x] Backend: run targeted tests and `npx tsc --noEmit`.
- [x] Frontend: run build. Browser smoke tests still need a follow-up if UI changes continue.
- [x] Database: verify schema, RLS, generated types, backfill counts, and metrics taxonomy.
- [x] Contract: run read-only reconciliation and document mismatches.
- [x] Public docs: validate OpenAPI JSON parses.
- [x] Ricky: dry-run updated scripts/prompts without printing secrets.
- [x] Production smoke: health, stats, heartbeat, onboarding/gig list surfaces checked safely. Submit/review write flow was not run because no production write was needed for this branch.

## Phase 11 - Peer Review

- [x] Product review: Codex Round 27/28 confirmed no HIGH/MEDIUM source findings; remaining launch actions are operational/deploy-gated.
- [x] Systems review: Codex Round 27/28 confirmed no HIGH/MEDIUM source findings; transaction undercount edge remains documented for reconciliation.
- [x] Growth review: Codex Round 27/28 confirmed public metrics/incentive framing do not count house/test/seeded/Ricky activity as real third-party paid completions.
- [x] Ricky review: Codex Round 27/28 confirmed Ricky scripts/source paths and autonomy guards; Claude review is externally blocked by org usage limit.
- [x] Docs review: Codex Round 27/28 confirmed no HIGH/MEDIUM docs drift; remaining stale-memory LOW was cleaned after Round 28.

## Phase 12 - Documentation and Cleanup

- [x] Update affected reference docs.
- [x] Update active planning docs with completion, deferred, or blocked status.
- [x] Archive completed or obsolete plans.
- [x] Record final production metrics after relaunch. Blocked/deferred until Max manually deploys MoltGig on Replit and the relaunch is live.
- [x] Move this plan to `archive/` only after implementation and verification are complete. Blocked until Claude CLI review availability returns or Max accepts the documented external review-tool blocker.

## Initial Backlog by Priority

### P1

- Segment metrics and classify real vs test/onboarding/seeded activity.
- Fix docs drift and active plan hygiene.
- Add proof requirements to gigs.
- Refresh seeded gigs around verifiable work.
- Fix Ricky reporting so the weekly report is trustworthy.
- Consolidate frontend route/test drift.
- Add contract/database reconciliation report.

### P2

- Service-layer backend refactor.
- MCP wrapper for MoltGig.
- x402/USDC compatibility design.
- Public stats dashboard with funnel metrics.
- Reviewer/evaluator incentive model.
- Ricky experiment ledger.

### P3

- Hackathon.
- Token/governance work.
- Broad enterprise marketplace positioning.
- Deep ACP integration.
- Advanced gamification.

## Success Metrics

Near-term:

- One real external paid marketplace gig completion.
- Zero unreviewed MoltGig-funded submissions older than 24 hours.
- Public stats split by test/onboarding/seeded/external.
- At least 5 high-quality active gigs with explicit proof requirements.
- Ricky weekly report is accurate and source-linked.

Four-week relaunch targets, after implementation:

| Metric | Target |
|--------|-------:|
| External onboarded agents | 5 |
| External non-onboarding submissions | 3 |
| Real external paid completions | 1-3 |
| Valid seeded gigs live | 10 |
| Review SLA | <24h |
| Broken/stale active docs | 0 known |

## Non-Goals

- Do not launch a token before marketplace demand exists.
- Do not spend meaningful ETH to create artificial volume.
- Do not let Ricky edit code, SQL, deployments, keys, or contract state.
- Do not build a broad enterprise marketplace before solving first external completion.
- Do not count house-agent tests as growth.

## Post-Deploy Verification - 2026-05-19

Max manually deployed MoltGig on Replit after `main` was pushed to `e60bdf1`.

Production-safe checks against `https://moltgig.com`:

- `GET /api/health` returned `200` and `status: healthy`.
- `GET /tasks` returned `308` to `/gigs`, confirming the latest frontend redirect is live.
- `GET /gigs` returned `200`.
- `GET /api/tasks?status=funded&limit=5&sort=newest` returned `200` and includes new DB fields such as `task_origin`, `review_policy`, and `proof_requirements`.
- `GET /api/stats` returned `200` but still has the old shape: top-level `agents` and `tasks`, with no segmented `traction` or `completed_all_origins` fields.
- `GET /api/heartbeat` returned `200` but still has the old Markdown heartbeat format, not the new `moltgig-heartbeat/2026-05` content.
- `GET /api/admin/funnel`, `GET /api/admin/reconcile/contract`, and `POST /api/admin/reconcile/contract/backfill-transactions` returned `401` using the local admin key.

Conclusion:

- The frontend/static route changes appear deployed.
- The database schema/data changes are live.
- The backend API exposed through Replit is not yet serving the latest backend code or is running with mismatched environment/auth configuration.
- Before public relaunch, Replit needs backend runtime/config review so `/api/stats`, `/api/heartbeat`, and the admin endpoints match this branch.

Next steps:

- Check Replit `BACKEND_URL` and backend process target; ensure the deployed backend is built from `main@e60bdf1`.
- Confirm Replit has `MOLTGIG_ADMIN_KEY` or `ADMIN_API_KEY` set to the intended value.
- Re-run the same production-safe checks after backend config/runtime is fixed.

Follow-up applied:

- Updated `.replit` deployment commands so Autoscale builds nested frontend/backend dependencies, builds with `BACKEND_URL=http://127.0.0.1:3000`, starts the backend on `API_PORT=3000`, starts the frontend on `WEB_PORT=5000`, and proxies API rewrites to the local backend.
- Updated root `package.json` scripts so production start passes explicit backend/frontend ports and local backend URL.
- Verified `npm run build` passes.
- Verified local production process wiring with dummy DB credentials on alternate frontend port `5010`: direct backend `GET /api/health` and frontend-proxied `GET /api/health` both returned the new backend health shape.
- Local smoke noted expected RPC/auth noise because dummy Supabase/RPC credentials were used; production must provide real `SUPABASE_SERVICE_KEY` and Alchemy/Base RPC configuration.

Remaining Replit actions for Max:

- Redeploy from `main` after these deployment-command changes are pushed.
- In Replit secrets/config, remove any stale external `BACKEND_URL` or set it to `http://127.0.0.1:3000`.
- Confirm `SUPABASE_URL` or `SUPABASE_PROJECT_URL`, `SUPABASE_SERVICE_KEY`, `MOLTGIG_ADMIN_KEY` or `ADMIN_API_KEY`, and the Base RPC/Alchemy variables are present.
- After redeploy, rerun `/api/stats`, `/api/heartbeat`, `/api/admin/funnel`, `/api/admin/reconcile/contract`, and the backfill dry-run.

Hosting recommendation:

- Hetzner is likely a better fit than Replit for MoltGig once this deploy is stable. The app is now a multi-process production service with a Next frontend, Express backend, admin endpoints, contract event listening, secret-heavy blockchain/Supabase configuration, and operational reconciliation tasks. A VPS with systemd or PM2, nginx, explicit env files, logs, and SSH deploys gives more control and makes Codex-assisted deployment easier.
- Replit remains acceptable for quick manual deploys and demos, but its multi-process/env behavior is opaque enough that it has already hidden an old-backend/new-frontend mismatch.
- Recommended path: finish this Replit verification first, then create a separate Hetzner migration plan with rollback, env parity, nginx/TLS, process supervision, log rotation, Supabase/RPC secret handling, and production-safe smoke checks.

## Hetzner Migration - 2026-05-19

Max created Hetzner server `moltgig-prod-01`:

- IPv4: `77.42.47.157`
- IPv6 allocation: `2a01:4f9:c014:8ede::/64`
- Plan: CX23, Helsinki
- OS observed over SSH: Ubuntu 26.04 LTS

Provisioning completed:

- SSH verified using Max's Mac key.
- Installed base packages: git, nginx, certbot, ufw, jq, rsync, build tooling.
- Installed Node.js `v22.22.1` and npm `9.2.0`.
- Created runtime user/group `moltgig`.
- Cloned `https://github.com/MoltGig/moltgig.git` to `/opt/moltgig/app` at `main@f9dcf56`.
- Installed root, backend, and frontend npm dependencies.
- Built backend and frontend successfully on server.
- Created `/etc/moltgig/production.env` with protected permissions and current non-missing production values.
- Created systemd units:
  - `/etc/systemd/system/moltgig-backend.service`
  - `/etc/systemd/system/moltgig-frontend.service`
- Configured nginx reverse proxy:
  - `/` -> `127.0.0.1:5000`
  - `/api/` -> `127.0.0.1:3000`
- Enabled UFW with inbound `22`, `80`, and `443`.
- Started frontend service for IP-level smoke only.
- Verified `http://77.42.47.157/` returns the built MoltGig frontend via nginx.

Current blocker:

- Backend is intentionally stopped because the local env files do not contain `SUPABASE_SERVICE_KEY`. The backend now requires the Supabase service-role key for production write/admin routes and should not be started with the anon/publishable key as a substitute.

Remaining cutover steps:

- Add the real `SUPABASE_SERVICE_KEY` to `/etc/moltgig/production.env` on Hetzner.
- Confirm Base RPC/Alchemy env is valid.
- Start and enable `moltgig-backend` and `moltgig-frontend`.
- Verify by IP:
  - `http://77.42.47.157/api/health`
  - `http://77.42.47.157/api/stats`
  - `http://77.42.47.157/api/heartbeat`
  - `http://77.42.47.157/api/admin/funnel`
  - `http://77.42.47.157/api/admin/reconcile/contract`
  - dry-run `POST /api/admin/reconcile/contract/backfill-transactions`
- Point GoDaddy DNS at Hetzner:
  - `A @ 77.42.47.157`
  - `A www 77.42.47.157`
  - optional `AAAA @ 2a01:4f9:c014:8ede::1` if the server has that IPv6 address assigned
  - optional `AAAA www 2a01:4f9:c014:8ede::1`
- Once DNS resolves to Hetzner, issue TLS with certbot for `moltgig.com` and `www.moltgig.com`.
- Re-run production-safe checks over `https://moltgig.com`.
- Keep Replit live as rollback for 24-48 hours, then unlink/remove the Replit custom domain.

Cutover verification update:

- GoDaddy DNS now points `moltgig.com` and `www.moltgig.com` to Hetzner IPv4 `77.42.47.157` and IPv6 `2a01:4f9:c014:8ede::1`.
- Certbot successfully issued and installed TLS for `moltgig.com` and `www.moltgig.com`; certificate expires 2026-08-17 and auto-renewal is installed.
- Added `SUPABASE_SERVICE_KEY` and required runtime aliases to `/etc/moltgig/production.env`.
- Started and enabled both systemd services:
  - `moltgig-backend`
  - `moltgig-frontend`
- Fixed production backend proxy handling in `main@05d4978` by setting Express `trust proxy` for nginx/rate-limit correctness.
- Pulled `main@05d4978` to Hetzner, rebuilt backend, and restarted backend.
- Alchemy RPC key is over monthly capacity; switched `BASE_RPC_URL` to `https://base-rpc.publicnode.com` and temporarily set `ENABLE_EVENT_LISTENER=false` while repairing event sync.

Production-safe checks over `https://moltgig.com` passed:

- `GET /api/health` returned `200`, `healthy`, Base mainnet contract `0xf605936078F3d9670780a9582d53998a383f8020`.
- `GET /api/stats` returned segmented traction with `real_third_party_paid_marketplace_completions: 0`.
- `GET /api/heartbeat` returned the new `moltgig-heartbeat/2026-05` content.
- `GET /api/tasks?status=funded&limit=5&sort=newest` returned `200` with five funded gigs.
- `GET /api/contract/stats` returned `totalTasks: 43`, `activeTasks: 39`, `completedTasks: 3`, `totalFeesCollected: "5055000000000"`.
- `GET /api/admin/funnel` returned `200` with task origins and paid-on-chain origin segmentation.
- `GET /api/admin/reconcile/contract` returned `200` with `missing_in_database: 7`, `missing_on_chain: 0`, and `mismatches: 0`.
- Dry-run `POST /api/admin/reconcile/contract/backfill-transactions` returned `200`, `dry_run: true`, `scanned_payment_mismatches: 0`, `repaired_count: 0`, and `skipped_count: 0`.

RPC repair update:

- Ricky/OpenClaw companion changes were merged to Ricky `main` and pushed in merge commit `1924244`.
- Added `BASE_EVENT_RPC_URL` support in MoltGig `main@994e2c1` so event listening can use a separate provider from ordinary contract reads.
- Public Base RPC reads work, but live JSON-RPC filters remained unreliable: `eth_getFilterChanges` produced `filter not found` errors even after separating the event provider.
- Replaced `contract.on(...)` subscriptions with bounded `eth_getLogs` polling in `backend/src/services/eventListener.ts`. The listener now scans recent safe blocks with configurable `EVENT_POLL_INTERVAL_MS`, `EVENT_POLL_BLOCK_LAG`, and `EVENT_POLL_BLOCK_RANGE`.
- Local verification passed: `npm run build:backend` and backend Jest (`7` suites, `78` tests).
- Deployed MoltGig `main@fec865a` to Hetzner, rebuilt backend, set `ENABLE_EVENT_LISTENER=true`, kept ordinary reads on `https://base-rpc.publicnode.com`, and set event polling to `https://mainnet.base.org` with `EVENT_POLL_INTERVAL_MS=30000`, `EVENT_POLL_BLOCK_LAG=3`, and `EVENT_POLL_BLOCK_RANGE=20`.
- Post-deploy verification passed: backend service is active, public/admin production-safe checks returned `200`, and two event-poll cycles showed no `filter not found`, `eth_getFilterChanges`, or polling timeout errors.

Remaining operational follow-ups:

- Longer term, replace temporary public RPC with a quota-backed Base RPC provider for better production reliability.
- Keep Replit available as rollback for 24-48 hours, then remove/unlink the Replit custom domain after Max confirms stable traffic on Hetzner.
- Optional hardening: restrict public SSH to Max's IP or Tailscale once remote access path is settled.
