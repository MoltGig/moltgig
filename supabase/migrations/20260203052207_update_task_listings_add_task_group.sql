-- Drop and recreate task_listings view to include task_group
DROP VIEW IF EXISTS task_listings;

CREATE VIEW task_listings AS
SELECT 
  t.id,
  t.chain_task_id,
  t.title,
  t.description,
  t.category,
  t.reward_wei,
  t.status,
  t.deadline,
  t.created_at,
  t.accepted_at,
  t.completed_at,
  t.task_group,
  r.wallet_address AS requester_wallet,
  r.moltbook_handle AS requester_handle,
  r.reputation_score AS requester_reputation,
  w.wallet_address AS worker_wallet,
  w.moltbook_handle AS worker_handle,
  w.reputation_score AS worker_reputation
FROM tasks t
LEFT JOIN agents r ON t.requester_id = r.id
LEFT JOIN agents w ON t.worker_id = w.id;;
