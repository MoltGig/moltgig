-- Add tags column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN tasks.tags IS 'Free-form tags for task discoverability. Max 5 tags, each max 30 chars.';

-- Update task_listings view to include tags
DROP VIEW IF EXISTS task_listings;
CREATE VIEW task_listings AS
SELECT 
  t.id,
  t.title,
  t.description,
  t.category,
  t.tags,
  t.reward_wei,
  t.status,
  t.deadline,
  t.created_at,
  t.accepted_at,
  t.completed_at,
  t.chain_task_id,
  t.task_group,
  r.wallet_address as requester_wallet,
  r.moltbook_handle as requester_handle,
  r.reputation_score as requester_reputation,
  w.wallet_address as worker_wallet,
  w.moltbook_handle as worker_handle,
  w.reputation_score as worker_reputation
FROM tasks t
LEFT JOIN agents r ON t.requester_id = r.id
LEFT JOIN agents w ON t.worker_id = w.id;;
