# Ricky Submission Review Pipeline

**Created:** 2026-02-25
**Status:** active
**Type:** feature

## Context

MoltGig now has a submission review pipeline (built in the MoltGig repo — see `docs/plans/active/2026-02-25-submission-review-pipeline.md` for the full plan). Phases 1-2 are done:

- `POST /api/tasks/:id/reject` — reject or request revision on submissions
- `POST /api/tasks/:id/complete` — approve submissions (already existed)
- Notifications wired for `task.submitted`, `task.rejected`, `task.revision_requested`, `task.accepted`, `task.completed`, `dispute.raised`

**What Ricky needs to do:** Be the review intermediary for MoltGig-funded gigs. Monitor submissions, relay full details to Max, then approve/reject only after Max's explicit decision.

**Operations wallet:** `0x2E4CCd9d1E14764575C99224684E4020D2eaBd81` — this is the requester for all MoltGig-funded gigs.

**Expected outcome:** No submission sits unreviewed. Every MoltGig-funded submission is reported to Max with full context. Ricky can settle gigs on Max's command.

## Phase 0 — Investigation & Validation

- [ ] Verify which private key env vars exist on server: `ssh openclaw@46.225.50.229 "grep -oP '^[A-Z_]+(?=\=)' ~/.openclaw/.env | sort"` (names only, no values)
- [ ] Determine if an `OPS_PRIVATE_KEY` (or equivalent for wallet `0x2E4C...Bd81`) already exists, or if Max needs to add it
- [ ] Verify the `POST /api/tasks?status=submitted` endpoint returns submitted tasks (test via `curl -s 'https://moltgig.com/api/tasks?status=submitted'`)
- [ ] Verify `GET /api/tasks/:id` returns submission details (content, attachments, worker info)
- [ ] Confirm ethers.js is available on server (used by `moltgig-post-gig.sh` for signing)
- [ ] Update subsequent phases with findings

## Phase 1 — Create Review Script

Create `skills/moltgig/scripts/moltgig-review.sh` — wallet-authenticated review CLI for the Operations wallet.

Based on the signing pattern in `skills/moltgig/scripts/moltgig-post-gig.sh` (loads private key from `~/.openclaw/.env`, signs with ethers.js via node).

Commands:

- [ ] `check` — `GET /api/tasks?status=submitted`, list all submitted tasks. Highlight MoltGig-funded ones (requester wallet = `0x2E4CCd9d1E14764575C99224684E4020D2eaBd81`). Show: title, ID, reward, worker, submitted date.
- [ ] `detail <task_id>` — `GET /api/tasks/<id>`, display full task + submission details: title, description, reward, worker wallet, worker reputation, submission content, attachments, deadline, gig requirements.
- [ ] `approve <task_id>` — Sign as Ops wallet, `POST /api/tasks/<id>/complete`. Requires wallet auth headers (`x-wallet-address`, `x-signature`, `x-timestamp`).
- [ ] `reject <task_id> "reason"` — Sign as Ops wallet, `POST /api/tasks/<id>/reject` with `{"feedback": "reason", "action": "reject"}`.
- [ ] `revision <task_id> "feedback"` — Sign as Ops wallet, `POST /api/tasks/<id>/reject` with `{"feedback": "feedback", "action": "revision_requested"}`.
- [ ] Default (no args) — Show help/usage.
- [ ] Make executable: `chmod +x`

Env var: `OPS_PRIVATE_KEY` from `~/.openclaw/.env` (same `grep ... | cut -d= -f2-` pattern as `moltgig-post-gig.sh`).

## Phase 2 — Add Cron Job

Add a new cron job to `cron/jobs.json`: **"Submission Review Check"**

- [ ] Schedule: `0 */4 * * *` (every 4 hours: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00 UTC)
- [ ] Job ID: `a1b2c3d4-aaaa-4ddd-8888-00000000000a` (follows existing pattern)
- [ ] Model: `moonshot/kimi-k2.5` (same as other jobs)
- [ ] Timeout: 180 seconds
- [ ] Prompt instructs Ricky to:
  1. Run `~/.openclaw/skills/moltgig/scripts/moltgig-review.sh check` for submitted tasks
  2. For each MoltGig-funded submission (requester = `0x2E4CCd9d1E14764575C99224684E4020D2eaBd81`):
     - Run `~/.openclaw/skills/moltgig/scripts/moltgig-review.sh detail <id>` for full info
     - Report to Max: gig title, reward, worker wallet/reputation, submission content, attachments, whether it meets gig requirements
     - Recommend APPROVE or REJECT with reasoning, but **never auto-approve**
  3. For third-party gig submissions: log informational summary (no action needed)
  4. If no submitted tasks: respond HEARTBEAT_OK
  5. Log to `~/.openclaw/workspace/memory/YYYY-MM-DD.md`

## Phase 3 — Update SOUL.md

Edit `agents/moltgig-ceo/SOUL.md`:

- [ ] Add to **Tier 1 (Autonomous)**: "Monitor all task submissions and report to Max"
- [ ] Add to **Tier 3 (Ad-hoc + Approval)**: "Approve or reject MoltGig-funded gig submissions (only after Max's explicit APPROVE/REJECT)"
- [ ] Add new section: **Submission Review Protocol** with:
  - Operations wallet address
  - Review workflow: check → report details to Max → wait for decision → execute approve/reject
  - Rule: Never auto-approve without Max's explicit go-ahead
  - Rule: Always include full submission details when reporting
  - Rule: If submission is obviously garbage, recommend rejection but still wait for Max
  - Available commands and when to use them

## Phase 4 — Update TOOLS_INVENTORY.md

Edit `agents/moltgig-ceo/TOOLS_INVENTORY.md`:

- [ ] Add `moltgig-review` to Quick Reference table
- [ ] Add new subsection under "1. MoltGig Platform (Core)" documenting:
  - All commands with examples
  - Which commands are Tier 1 (check, detail) vs Tier 3 (approve, reject, revision)
  - Env requirement: `OPS_PRIVATE_KEY` in `~/.openclaw/.env`

## Phase 5 — Testing

- [ ] Run `bash skills/moltgig/scripts/moltgig-review.sh` locally to verify syntax and help output
- [ ] Deploy to server: `./deploy.sh "Add submission review pipeline for Ricky"`
- [ ] Restart gateway: `ssh openclaw@46.225.50.229 "systemctl --user restart openclaw-gateway.service"`
- [ ] Verify cron job registered (check `nextRunAtMs` populated)
- [ ] SSH to server, test `~/.openclaw/skills/moltgig/scripts/moltgig-review.sh check` — should return submitted tasks (or empty list)
- [ ] SSH to server, test `~/.openclaw/skills/moltgig/scripts/moltgig-review.sh detail <task_id>` with a known task
- [ ] Verify `approve`/`reject` commands produce correct auth headers (dry-run if no submitted tasks to test with)
- [ ] Check gateway logs: `journalctl --user -u openclaw-gateway.service --no-pager -n 50`

## Phase 6 — Documentation & Cleanup

- [ ] Update CLAUDE.md cron jobs table with new "Submission Review Check" job
- [ ] Verify all tasks across all phases are checked off
- [ ] Move plan to `docs/plans/archive/`
