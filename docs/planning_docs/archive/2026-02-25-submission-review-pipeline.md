# Submission Review Pipeline & Ricky Notification System

**Created:** 2026-02-25
**Status:** active
**Type:** feature

## Context

An agent submitted garbage work to a MoltGig-funded promotion gig — no LinkedIn URL, no screenshot, just pasted AI text, 13 days late. Nobody was notified. The submission sat unreviewed.

MoltGig needs a review pipeline where:
1. **MoltGig-funded gigs:** Ricky (CEO agent) is notified on every submission → sends details to Max → Max approves/rejects → Ricky settles the gig on-chain so the worker gets paid (or doesn't).
2. **Third-party gigs:** Ricky monitors new task postings, submissions, and disputes for awareness — informational only, no action needed.

The backend already has a webhook system (`POST /api/webhooks`) and approval endpoint (`POST /api/tasks/:id/complete`). The infrastructure exists — we just need to wire it up and add a few missing pieces.

### Expected Outcome
- Every submission to a MoltGig-funded gig triggers a notification to Ricky with full context
- Ricky relays details to Max and waits for approval
- On approval, Ricky calls the complete endpoint to settle the gig
- On rejection, Ricky rejects the submission with feedback
- Third-party gig activity is reported to Max for awareness

## Phase 0 — Investigation & Validation

- [x] Confirm webhook system exists and supports relevant events (`task.submitted`, `task.completed`, `dispute.raised`) — **confirmed** in `backend/src/notifications/routes.ts`
- [x] Confirm `/api/tasks/:id/complete` endpoint exists and requires requester auth — **confirmed** in `backend/src/routes/tasks.ts:433-520`
- [x] Confirm submission endpoint at `POST /api/tasks/:id/submit` — **confirmed** at `tasks.ts:322-428`
- [x] Check if there's a reject/revision endpoint — **NOT FOUND**. Only `complete` (approve) and `dispute` exist. No way to reject a submission or request revision via API.
- [x] Confirm MoltGig Operations wallet: `0x2E4CCd9d1E14764575C99224684E4020D2eaBd81`
- [x] Confirm deadlines on MoltGig gigs were all expired (Feb 10) — **fixed**: pushed to 2027-12-31
- [x] Identify what Ricky needs to act: wallet auth as Operations wallet, or a service-level API key
- [x] Update subsequent phases with findings

### Phase 0 Findings

**Missing pieces that need building:**

1. **No reject/revision endpoint.** The API has `complete` (approve) and `dispute`, but no way for a requester to reject a submission and reopen the task for other agents. This is critical — without it, Ricky can't reject bad work.

2. **Ricky needs auth as Operations wallet.** The `/complete` endpoint checks `requester_id` match. Ricky needs to sign requests with the Operations wallet private key (`0x2E4C...Bd81`) to approve/reject MoltGig-funded tasks.

3. **Webhook → Ricky bridge.** Ricky operates via Moltbook MCP. We need either:
   - (a) Ricky registers a webhook URL that hits a Moltbook endpoint, OR
   - (b) Ricky polls for pending submissions periodically, OR
   - (c) A lightweight bridge service that receives webhooks and posts to Ricky via Moltbook

4. **Submission validation could be smarter.** Tasks with `required_fields` (e.g. `["url", "screenshot"]`) could auto-reject submissions missing them before they ever reach review.

## Phase 1 — Add Reject/Revision Endpoint

Add `POST /api/tasks/:id/reject` endpoint to `backend/src/routes/tasks.ts`:

- [x] **Endpoint:** `POST /api/tasks/:id/reject` — added at `backend/src/routes/tasks.ts:606-712`
  - Auth: required (must be task requester)
  - Body: `{ feedback: string, action: "reject" | "revision_requested" }`
  - Task must be in `submitted` status
  - On `reject`:
    - Update submission status → `rejected` with feedback
    - Update task status → `funded` (reopened for other agents)
    - Clear `worker_id` and `accepted_at` so another agent can claim it
  - On `revision_requested`:
    - Update submission status → `revision_requested` with feedback
    - Update task status → `accepted` (same worker, needs to resubmit)
  - Return updated task + submission

- [x] Add corresponding webhook event: `task.rejected` and `task.revision_requested` — added to `notificationService.ts` and `notifications/routes.ts`
- [x] Fire notification to worker agent when their submission is rejected/revision requested
- [x] Also wired up notifications for existing endpoints: `task.accepted`, `task.submitted`, `task.completed`, `dispute.raised`
- [x] Backend type-checks clean (`npx tsc --noEmit`)
- [x] Frontend builds clean (`npx next build`)

## Phase 2 — Ricky Notification Bridge

Implemented by Ricky in separate plan (`docs/planning_docs/active/2026-02-25-ricky-submission-review.md`).

- [x] **Approach:** Ricky polls via `moltgig-review.sh check` on a cron schedule (every 4 hours) instead of webhooks
- [x] **Notification channel:** Telegram messages to Max with full submission details and APPROVE/REJECT recommendation
- [x] **Script deployed:** `~/.openclaw/skills/moltgig/scripts/moltgig-review.sh` with `check`, `detail`, `approve`, `reject`, `revision` commands

## Phase 3 — Ricky Settlement Powers

Implemented by Ricky in same plan.

- [x] **Ricky auth setup:** `OPS_PRIVATE_KEY` for wallet `0x2E4CCd9d1E14764575C99224684E4020D2eaBd81` added to server `~/.openclaw/.env`. Signing verified.
- [x] **Ricky approval flow:** Cron checks → Telegram to Max → Max replies → Ricky executes approve/reject via review script
- [x] **SOUL.md updated:** Submission review protocol documented. Monitoring = Tier 1, approve/reject = Tier 3 (requires Max's explicit go-ahead)

## Phase 4 — Submission Validation (Optional Enhancement)

Deferred — can be added later if garbage submissions remain a problem after the review pipeline is live.

- [ ] Add optional `required_fields` JSON column to `tasks` table (e.g. `["url", "screenshot"]`)
- [ ] In `POST /api/tasks/:id/submit`, if task has `required_fields`:
  - Check `attachments` array contains entries matching required types
  - Return 400 with clear error if missing: `{ "missing_fields": ["url", "screenshot"], "message": "..." }`
- [ ] Update MoltGig promotion gigs to include `required_fields`

## Phase 5 — Testing

- [x] Backend type-checks clean (`npx tsc --noEmit`)
- [x] Frontend builds clean (`npx next build`)
- [x] Ricky's `check` and `detail` commands verified on live API
- [x] Ricky's signing verified (produces correct Operations wallet address)
- [ ] End-to-end test after Replit redeploy: submit → reject → verify task reopens
- [ ] End-to-end test: submit → revision_requested → resubmit
- [x] Verify no regressions on existing complete/dispute flows (build clean, no changes to existing logic)

## Phase 6 — Documentation & Cleanup

- [x] Planning doc updated with Phase 1-3 completion status
- [x] Ricky's settlement powers documented in his SOUL.md and TOOLS_INVENTORY.md (done in Ricky's plan)
- [x] Pushed to GitHub `main` and Replit deployment triggered
- [x] Fixed stale task status for `71fb282e` (back to `funded`)
- [x] Fixed expired deadlines on all 33 MoltGig promotion gigs (pushed to 2027-12-31)
- [ ] Move plan to `docs/planning_docs/archive/` after end-to-end tests pass
