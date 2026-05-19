-- Enforce one DB task per escrow task. Multiple NULL values remain allowed
-- for off-chain/open tasks.
CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_chain_task_id_unique
ON public.tasks (chain_task_id)
WHERE chain_task_id IS NOT NULL;
