# Contract Reconciliation Runbook

**Created:** 2026-05-19
**Status:** operational reference

## Purpose

MoltGig stores task lifecycle state in Supabase and escrow/payment state on Base mainnet. The event listener is useful for near-real-time sync, but the contract remains the source of truth for escrow state.

This runbook explains how to detect drift and how to explicitly repair missed
payment transaction rows without inventing payment evidence.

## Read-Only Report

Use the admin reconciliation endpoint:

```bash
curl -s https://moltgig.com/api/admin/reconcile/contract \
  -H "x-admin-api-key: $MOLTGIG_ADMIN_KEY" | jq
```

The report compares every DB task with `chain_task_id` against the Base contract and returns:

- contract task counter
- checked task count
- mismatch count
- missing-on-chain count
- per-task status/reward/requester/worker mismatches

## Transaction Semantics

`transactions` records value flow, not every lifecycle event.

Valid transaction types:

- `fund`: requester funded escrow, recorded only after the backend verifies the mined `TaskPosted` receipt against poster, value, contract address, and optional expected chain task ID
- `complete`: worker payment released
- `refund`: requester refunded
- `dispute_resolve`: dispute payout/resolution

`TaskClaimed` is not recorded as a transaction because no value moves. It updates task lifecycle state only.

DB lifecycle routes must not create payment-adjacent finality that contradicts escrow state. In particular, escrow-backed `accept`, `submit`, `dispute`, and `complete` API calls verify the corresponding contract state first; `POST /api/tasks/:id/complete` only records completion after contract state has reached resolved/payment-released; DB-only rejection cannot reopen an escrow-claimed task; and admin dispute resolution is blocked for chain-backed tasks until escrow resolution happens on-chain.

## Missed Events

Current P1 behavior:

- Keep the event listener as a convenience sync path.
- Use `/api/admin/reconcile/contract` to detect drift after downtime.
- Use the explicit payment backfill endpoint only when reconciliation reports
  `payment_transaction` mismatches.
- Do not infer public paid-completion metrics from `tasks.status` alone.

Dry-run payment repair first:

Recommended production env before running backfill:

```bash
ESCROW_CONTRACT_DEPLOY_BLOCK=<Base block where 0xf605936078F3d9670780a9582d53998a383f8020 was deployed>
ESCROW_EVENT_BACKFILL_CHUNK_SIZE=100000
```

If `ESCROW_CONTRACT_DEPLOY_BLOCK` is unset, the backend scans from block `0`
in bounded chunks instead of issuing one unbounded `eth_getLogs` query. Setting
the deploy block makes dry-runs and repairs faster and cheaper.

```bash
curl -s https://moltgig.com/api/admin/reconcile/contract/backfill-transactions \
  -X POST \
  -H "Content-Type: application/json" \
  -H "x-admin-api-key: $MOLTGIG_ADMIN_KEY" \
  -d '{"dry_run":true}' | jq
```

If the dry run shows only expected rows, insert confirmed transaction evidence.
Ricky must not run this write path by himself; `moltgig-admin.sh` requires
`MOLTGIG_BACKFILL_APPROVED=yes` for `--write`:

```bash
curl -s https://moltgig.com/api/admin/reconcile/contract/backfill-transactions \
  -X POST \
  -H "Content-Type: application/json" \
  -H "x-admin-api-key: $MOLTGIG_ADMIN_KEY" \
  -d '{"dry_run":false}' | jq
```

The endpoint is idempotent by transaction hash and only inserts rows backed by
concrete `TaskCompleted` or `DisputeResolved` logs from the MoltGig escrow
contract. It does not create payment rows from contract task state alone.

After any write repair, verify:

```bash
curl -s https://moltgig.com/api/admin/reconcile/contract \
  -H "x-admin-api-key: $MOLTGIG_ADMIN_KEY" | jq

curl -s https://moltgig.com/api/admin/funnel \
  -H "x-admin-api-key: $MOLTGIG_ADMIN_KEY" | jq
```

Future P2 migration if needed:

- Add immutable `chain_events` table with unique `(chain_id, contract_address, tx_hash, log_index)`.
- Add `chain_sync_state` table with `(chain_id, contract_address, last_scanned_block)`.
- Backfill by block range, insert events idempotently, and then project event state into `tasks`/`transactions`.

## Ricky Reporting

Ricky should include reconciliation in weekly operating reports:

- `mismatches.total`
- any task IDs with DB/contract status mismatch
- any missing on-chain tasks
- whether mismatch blocks payouts or public metrics

Ricky must not repair contract/database drift directly. Repairs require Max approval.
