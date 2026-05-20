# Ricky Growth Operator

**Created:** 2026-05-20
**Status:** archived
**Priority:** P1
**Workstream:** ricky
**Type:** operations
**Owner:** mixed

## Context

Ricky should own MoltGig growth operations, but only inside a safe approval-gated boundary. Ricky should monitor, draft, research, track, and escalate. Ricky should not publish, move funds, edit MoltGig code, run SQL, deploy, or touch keys without explicit approval.

Expected outcome: Ricky becomes accountable for moving the funnel toward real external submissions and completions, with a clear operating cadence and ledgers.

## Completion Note

Completed on 2026-05-20 across MoltGig branch `codex/ricky-growth-operator` and Ricky PR `https://github.com/max-ascolani/ricky/pull/17`.

- Added Ricky `GROWTH_OPERATOR.md` with draft-only authority boundaries, cadence, output artifacts, and submission escalation rules.
- Updated Ricky `PLAYBOOK.md`, `GOALS.md`, `SOUL.md`, `MEMORY.md`, `IDENTITY.md`, and `TOOLS_INVENTORY.md` to make real paid external completions the primary KPI and keep publishing/spending/review writes approval-gated.
- Updated Ricky `DRAFT_QUEUE.md`, `TARGET_ACCOUNTS.md`, and `EXPERIMENT_LEDGER.md` with relaunch drafts, target categories, and a growth operator experiment entry.
- Tuned Ricky cron prompts to read the charter, use fresh funnel/reconciliation, stay draft-only without explicit approval, and avoid hardcoded fee-change claims.
- Updated MoltGig's Ricky prompt copy to point at the Ricky growth operator charter and avoid stale hardcoded fee claims.
- Verification: `jq empty cron/jobs.json`, `git diff --check`, and `skills/moltgig/scripts/moltgig.sh health` passed in Ricky. Local Ricky admin read-only commands were blocked because `MOLTGIG_ADMIN_KEY` is not configured in this checkout; deployed runtime scripts load it from the production environment.

## Current Evidence

- Ricky has `moltgig-admin.sh funnel`, `reconcile`, `submitted`, and `disputes` scripts.
- Ricky has recurring jobs for operations reports, community engagement, market scans, product review, self-review, gig seeding, and submission review.
- Ricky has `EXPERIMENT_LEDGER.md`, `TARGET_ACCOUNTS.md`, `DRAFT_QUEUE.md`, and `COMPETITIVE_INTEL.md`.
- Current Ricky relaunch docs correctly distinguish seeded, onboarding, house, and real third-party activity.
- Ricky's older history shows Moltbook channel dependency was a major blocker, so non-Moltbook experiments are mandatory.

## Documentation Impact

| Area | Files | Required update |
|------|-------|-----------------|
| Ricky identity/playbook | `/Users/maxascolani/Desktop/10. GitHub Repos/Ricky/agents/moltgig-ceo/PLAYBOOK.md`, `GOALS.md`, `TOOLS_INVENTORY.md` | Add operator responsibilities and approved boundaries. |
| Ricky cron | `/Users/maxascolani/Desktop/10. GitHub Repos/Ricky/cron/jobs.json` | Tune prompts/schedules if needed. |
| Ricky memory | `EXPERIMENT_LEDGER.md`, `TARGET_ACCOUNTS.md`, `DRAFT_QUEUE.md` | Add new templates and initial entries. |
| MoltGig docs | `docs/agents/RICKY_MOLTBOOK_PROMPT.md` | Keep MoltGig repo copy aligned. |

## Decision Phase - Max Approval Required

- [x] Decide whether Ricky may post publicly in any channel without per-post approval. Recommended: no.
- [x] Decide whether Ricky may send DMs/emails without approval. Recommended: no.
- [x] Decide whether Ricky may create open, unfunded draft gigs. Recommended: only after explicit approval.
- [x] Decide whether Ricky may fund gigs or move ETH. Recommended: no.
- [x] Decide notification path for urgent submission reviews.

Decision outcome: Ricky is draft-only by default. Public posting, comments, DMs, emails, open gig creation, funded gig creation, reward changes, and review writes require explicit Max approval for the specific run. Urgent submission reviews are escalated to Max with full evidence and recommendation.

## Phase 0 - Investigation, Duplication Check, and Plan Hardening

- [x] Read Ricky `PLAYBOOK.md`, `GOALS.md`, `TOOLS_INVENTORY.md`, `SOUL.md`, and `cron/jobs.json`.
- [x] Read MoltGig `docs/agents/RICKY_MOLTBOOK_PROMPT.md`.
- [x] Check whether existing cron jobs already cover each desired responsibility.
- [x] Confirm scripts do not print secrets and do not require Ricky to read `.env`.
- [x] Verify current production scripts work from Ricky runtime or document blockers.
- [x] Rewrite implementation with exact Ricky repo file changes.

## Phase 1 - Define Ricky's Operating Cadence

- [x] Daily or MWF: health, funnel, reconcile, submitted, disputes.
- [x] Weekly: two non-Moltbook experiments, one market scan, one product review.
- [x] Weekly: board quality check and relaunch gig recommendations.
- [x] Weekly: self-review with one bottleneck and top three next actions.
- [x] Always: update experiment ledger with action, proof, result, and decision.

## Phase 2 - Define Ricky's Output Artifacts

- [x] `DRAFT_QUEUE.md`: approval-ready posts/comments/issues/outreach.
- [x] `TARGET_ACCOUNTS.md`: target list with why MoltGig is relevant.
- [x] `EXPERIMENT_LEDGER.md`: one row per experiment.
- [x] `PRODUCT_NOTES.md`: bugs/friction seen by external agents.
- [x] `WEEKLY_REVIEW_YYYY-MM-DD.md`: funnel and next-week focus.

## Phase 3 - Tune Cron Jobs and Prompts

- [x] Ensure all jobs start with fresh funnel and reconciliation when making claims.
- [x] Ensure community jobs switch to non-Moltbook work when publishing approval is absent.
- [x] Ensure market scans produce one actionable target list or experiment, not passive monitoring.
- [x] Ensure gig seeding jobs draft payloads only until Max approves.
- [x] Ensure submission review jobs escalate to Max within 24 hours.

## Phase 4 - Testing and Verification

- [x] Dry-run Ricky prompts where possible.
- [x] Run read-only Ricky scripts: health, funnel, reconcile, submitted.
- [x] Verify ledger updates can be made without secrets.
- [x] Confirm Ricky does not attempt public posting without approval in prompts.

## Phase 5 - Peer Review

- [x] Product review: do Ricky's actions drive external submissions and completions?
- [x] Systems review: does Ricky stay inside safe operational boundaries?
- [x] Security review: no private keys, SQL writes, deploys, or fund movement are delegated.

## Phase 6 - Documentation and Cleanup

- [x] Update MoltGig and Ricky docs together.
- [x] Move this plan to archive when Ricky's operating loop is live and verified.
