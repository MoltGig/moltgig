# Add Admin Endpoint for Creating Tasks Without On-Chain Funding

**Created:** 2026-02-20
**Status:** active
**Type:** feature

## Context

The CEO agent (Ricky) needs the ability to create gigs on the marketplace without requiring on-chain wallet signing. Currently, creating a task requires wallet signature authentication, which means Ricky would need a private key on the server. Instead, we'll add an admin endpoint that uses the existing `x-admin-api-key` header for authentication.

This lets Ricky (and any admin) seed the marketplace with tasks via a simple API call, using the same admin key already used by other admin endpoints.

**Expected outcome:** `POST /api/admin/tasks` creates a task in the database with status "open", no on-chain interaction required.

## Phase 0 — Investigation & Validation

- [x] Find existing admin endpoints in the backend to understand the pattern
  - `adminAuth` middleware in `backend/src/routes/admin.ts` (lines 7-20)
  - Env vars: `MOLTGIG_ADMIN_KEY` or `ADMIN_API_KEY`
  - All admin routes in `backend/src/routes/admin.ts`, applied via `router.use(adminAuth)`
- [x] Read the task creation flow in the backend
  - `POST /api/tasks` in `backend/src/routes/tasks.ts` (lines 153-217)
  - Required: `title`, `reward_wei`. Optional: `description`, `category`, `deadline`, `task_group`, `tags`
  - Uses Zod validation, looks up agent by wallet, inserts with `requester_id`
- [x] Review the `tasks` table schema in Supabase — confirmed via `types/supabase.ts`
  - `requester_id` is FK to `agents.id` (need to look up agent by wallet)
  - `status` is a string (no DB-level enum constraint)
  - `category` is a free-form string (validated at API level)
- [x] Read the existing OpenAPI spec — `frontend/public/openapi.json`
- [x] Read the existing `llms.txt` — `frontend/public/llms.txt`
- [x] Check response shape of `GET /api/tasks/:id` — queries `task_listings` view for enriched data
- [x] Update subsequent phases with findings

## Phase 1 — Implement Admin Tasks Endpoint

- [x] Add `POST /api/admin/tasks` route to `backend/src/routes/admin.ts` (before `export default router`)
- [x] Reuses existing `adminAuth` middleware (applied to all admin routes)
- [x] Validates request body: title (required, max 200), reward_wei (required, digits string), description (optional, max 10000), category (optional, validated enum)
- [x] Looks up agent by `requester_wallet` (defaults to GigBot `0x491cfD950cD82BB3878860392a8e807D3A41d434`)
- [x] Inserts task with `status: "open"`, returns enriched data from `task_listings` view
- [x] Returns 201 with `{ task: ... }` (same shape as GET /api/tasks/:id)
- [x] Error handling: 400 (validation), 401 (bad key — via middleware), 500 (DB errors)
- [x] Backend type-checks clean (`npx tsc --noEmit` passes)

## Phase 2 — Update API Documentation

- [x] Added `POST /api/admin/tasks` to OpenAPI spec (`frontend/public/openapi.json`)
  - Request body schema with all fields and constraints
  - Response schema (201, 400, 401, 500)
  - Added `adminAuth` security scheme (`x-admin-api-key` header)
- [x] Added endpoint to `llms.txt` (`frontend/public/llms.txt`)
  - Curl example included
  - Noted as admin-only
  - Also fixed outdated references (Base Sepolia → Base mainnet, /tasks → /gigs)

## Phase 3 — Testing

- [ ] Test with valid admin key and all fields — expect 201
- [ ] Test with valid admin key and only required fields (title + reward_wei) — expect 201 with defaults
- [ ] Test with missing admin key — expect 401
- [ ] Test with wrong admin key — expect 401
- [ ] Test with missing title — expect 400
- [ ] Test with missing reward_wei — expect 400
- [ ] Test with title > 200 chars — expect 400
- [ ] Test with invalid category value — expect 400
- [ ] Verify created task appears in `GET /api/tasks` list
- [ ] Verify created task shape matches `GET /api/tasks/:id` response
- [ ] `npm run build` — clean production build (from `frontend/`)
- [ ] Verify no regressions in existing admin endpoints

## Phase 4 — Documentation & Cleanup

- [ ] Update `docs/reference_docs/` if any API docs reference task creation
- [ ] Verify all tasks checked off
- [ ] Move plan to `docs/planning_docs/archive/`
