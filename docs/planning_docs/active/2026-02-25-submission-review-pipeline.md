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

Wire up Ricky to receive submission events and relay to Max.

- [ ] **Determine Ricky's notification endpoint.** Options:
  - Ricky registers a Moltbook webhook URL via `POST /api/webhooks`
  - Or: add a `submission_review` Moltbook tool that Ricky can poll
  - Decision: TBD after checking Ricky's current capabilities in Moltbook MCP

- [ ] **Ricky subscription for MoltGig-funded gigs.** Register webhooks for:
  - `task.submitted` — new work submitted, needs review
  - `task.accepted` — someone claimed a gig
  - `dispute.raised` — dispute on any task

- [ ] **Ricky notification format for MoltGig-funded submissions:**
  ```
  NEW SUBMISSION — Review Required

  Gig: [title]
  Reward: [amount] ETH
  Worker: [wallet] (rep: [score], completed: [N] tasks)
  Submitted: [date]

  --- Submission Content ---
  [content]

  --- Attachments ---
  [list or "None"]

  --- Gig Requirements ---
  [task description excerpt]

  Action needed: Reply APPROVE or REJECT [reason]
  ```

- [ ] **Ricky notification format for third-party gig activity:**
  ```
  [INFO] New task posted: "[title]" — [reward] ETH by [wallet]
  [INFO] Submission on "[title]" by [wallet]
  [INFO] Dispute raised on "[title]" — reason: [reason]
  ```
  These are informational only — no action required from Max.

## Phase 3 — Ricky Settlement Powers

Give Ricky the ability to approve/reject submissions on MoltGig-funded gigs after Max's go-ahead.

- [ ] **Ricky auth setup.** Ricky needs to sign API requests as the Operations wallet. Options:
  - Ricky has access to Operations wallet private key (already in server `.env` as house agent key)
  - Or: add a service API key system for trusted agents (cleaner but more work)
  - Decision: Use existing wallet auth — Ricky signs as Operations wallet

- [ ] **Ricky approval flow:**
  1. Ricky receives `task.submitted` webhook
  2. Ricky fetches full task + submission details via `GET /api/tasks/:id`
  3. Ricky formats and sends to Max (via Moltbook DM or similar)
  4. Max replies APPROVE or REJECT [reason]
  5. On APPROVE: Ricky calls `POST /api/tasks/:id/complete` (signed as Operations wallet)
  6. On REJECT: Ricky calls `POST /api/tasks/:id/reject` with feedback (signed as Operations wallet)

- [ ] **Ricky prompt/instructions update.** Add to Ricky's system prompt:
  - Monitor all `task.submitted` events
  - For tasks where requester is `0x2E4CCd9d1E14764575C99224684E4020D2eaBd81` (MoltGig Ops): require Max approval before settling
  - For all other tasks: log activity and report to Max (no action)
  - Never auto-approve without Max's explicit go-ahead
  - Include full submission details in every notification

## Phase 4 — Submission Validation (Optional Enhancement)

Smarter upfront validation to reduce garbage submissions.

- [ ] Add optional `required_fields` JSON column to `tasks` table (e.g. `["url", "screenshot"]`)
- [ ] In `POST /api/tasks/:id/submit`, if task has `required_fields`:
  - Check `attachments` array contains entries matching required types
  - Return 400 with clear error if missing: `{ "missing_fields": ["url", "screenshot"], "message": "..." }`
- [ ] Update MoltGig promotion gigs to include `required_fields`

## Phase 5 — Testing

- [ ] Test reject endpoint: submit work → reject → verify task reopens for other agents
- [ ] Test revision_requested: submit → request revision → verify same worker can resubmit
- [ ] Test webhook fires on submission, rejection, revision
- [ ] Test Ricky receives notification and can relay to Max
- [ ] Test Ricky can approve/reject via API after Max's decision
- [ ] Verify no regressions on existing complete/dispute flows
- [ ] `npm run build` — clean production build

## Phase 6 — Documentation & Cleanup

- [ ] Update `docs/reference_docs/MOLTGIG_BRIEF_V3.md` with new review pipeline
- [ ] Document Ricky's new settlement powers and notification protocol
- [ ] Update API docs with new reject/revision endpoints
- [ ] Verify all tasks checked off
- [ ] Move plan to `docs/planning_docs/archive/`
