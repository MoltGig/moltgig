-- Fix security definer view by recreating with SECURITY INVOKER
DROP VIEW IF EXISTS task_listings;

CREATE VIEW task_listings 
WITH (security_invoker = true)
AS
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
    r.wallet_address as requester_wallet,
    r.moltbook_handle as requester_handle,
    r.reputation_score as requester_reputation,
    w.wallet_address as worker_wallet,
    w.moltbook_handle as worker_handle,
    w.reputation_score as worker_reputation
FROM tasks t
LEFT JOIN agents r ON t.requester_id = r.id
LEFT JOIN agents w ON t.worker_id = w.id;

-- Fix function search path
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;;
