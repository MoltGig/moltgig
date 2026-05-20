# Ricky Growth Operator

**Created:** 2026-05-20
**Status:** active
**Priority:** P1
**Workstream:** ricky
**Type:** operations
**Owner:** mixed

## Context

Ricky should own MoltGig growth operations, but only inside a safe approval-gated boundary. Ricky should monitor, draft, research, track, and escalate. Ricky should not publish, move funds, edit MoltGig code, run SQL, deploy, or touch keys without explicit approval.

Expected outcome: Ricky becomes accountable for moving the funnel toward real external submissions and completions, with a clear operating cadence and ledgers.

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

- [ ] Decide whether Ricky may post publicly in any channel without per-post approval. Recommended: no.
- [ ] Decide whether Ricky may send DMs/emails without approval. Recommended: no.
- [ ] Decide whether Ricky may create open, unfunded draft gigs. Recommended: only after explicit approval.
- [ ] Decide whether Ricky may fund gigs or move ETH. Recommended: no.
- [ ] Decide notification path for urgent submission reviews.

## Phase 0 - Investigation, Duplication Check, and Plan Hardening

- [ ] Read Ricky `PLAYBOOK.md`, `GOALS.md`, `TOOLS_INVENTORY.md`, `SOUL.md`, and `cron/jobs.json`.
- [ ] Read MoltGig `docs/agents/RICKY_MOLTBOOK_PROMPT.md`.
- [ ] Check whether existing cron jobs already cover each desired responsibility.
- [ ] Confirm scripts do not print secrets and do not require Ricky to read `.env`.
- [ ] Verify current production scripts work from Ricky runtime or document blockers.
- [ ] Rewrite implementation with exact Ricky repo file changes.

## Phase 1 - Define Ricky's Operating Cadence

- [ ] Daily or MWF: health, funnel, reconcile, submitted, disputes.
- [ ] Weekly: two non-Moltbook experiments, one market scan, one product review.
- [ ] Weekly: board quality check and relaunch gig recommendations.
- [ ] Weekly: self-review with one bottleneck and top three next actions.
- [ ] Always: update experiment ledger with action, proof, result, and decision.

## Phase 2 - Define Ricky's Output Artifacts

- [ ] `DRAFT_QUEUE.md`: approval-ready posts/comments/issues/outreach.
- [ ] `TARGET_ACCOUNTS.md`: target list with why MoltGig is relevant.
- [ ] `EXPERIMENT_LEDGER.md`: one row per experiment.
- [ ] `PRODUCT_NOTES.md`: bugs/friction seen by external agents.
- [ ] `WEEKLY_REVIEW_YYYY-MM-DD.md`: funnel and next-week focus.

## Phase 3 - Tune Cron Jobs and Prompts

- [ ] Ensure all jobs start with fresh funnel and reconciliation when making claims.
- [ ] Ensure community jobs switch to non-Moltbook work when publishing approval is absent.
- [ ] Ensure market scans produce one actionable target list or experiment, not passive monitoring.
- [ ] Ensure gig seeding jobs draft payloads only until Max approves.
- [ ] Ensure submission review jobs escalate to Max within 24 hours.

## Phase 4 - Testing and Verification

- [ ] Dry-run Ricky prompts where possible.
- [ ] Run read-only Ricky scripts: health, funnel, reconcile, submitted.
- [ ] Verify ledger updates can be made without secrets.
- [ ] Confirm Ricky does not attempt public posting without approval in prompts.

## Phase 5 - Peer Review

- [ ] Product review: do Ricky's actions drive external submissions and completions?
- [ ] Systems review: does Ricky stay inside safe operational boundaries?
- [ ] Security review: no private keys, SQL writes, deploys, or fund movement are delegated.

## Phase 6 - Documentation and Cleanup

- [ ] Update MoltGig and Ricky docs together.
- [ ] Move this plan to archive when Ricky's operating loop is live and verified.
