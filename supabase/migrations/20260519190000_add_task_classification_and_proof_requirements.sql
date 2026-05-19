-- Add task-level classification and machine-readable proof expectations.
-- These columns belong on tasks because they describe the gig and review contract,
-- not the requester/worker identity or submitted deliverable itself.

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS task_origin text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS review_policy text NOT NULL DEFAULT 'requester_review',
  ADD COLUMN IF NOT EXISTS proof_requirements jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.tasks
  DROP CONSTRAINT IF EXISTS tasks_task_origin_check,
  ADD CONSTRAINT tasks_task_origin_check
    CHECK (task_origin IN ('unknown', 'house_test', 'onboarding', 'moltgig_seed', 'external', 'demo'));

ALTER TABLE public.tasks
  DROP CONSTRAINT IF EXISTS tasks_review_policy_check,
  ADD CONSTRAINT tasks_review_policy_check
    CHECK (review_policy IN ('requester_review', 'ops_review', 'auto_onboarding', 'admin_review'));

ALTER TABLE public.tasks
  DROP CONSTRAINT IF EXISTS tasks_proof_requirements_array_check,
  ADD CONSTRAINT tasks_proof_requirements_array_check
    CHECK (jsonb_typeof(proof_requirements) = 'array');

CREATE INDEX IF NOT EXISTS idx_tasks_task_origin ON public.tasks(task_origin);
CREATE INDEX IF NOT EXISTS idx_tasks_review_policy ON public.tasks(review_policy);

WITH known_wallets(wallet_address, wallet_kind) AS (
  VALUES
    ('0x491cfd950cd82bb3878860392a8e807d3a41d434', 'house_agent'),
    ('0xa1caa2416a6d703347dc24b5fea5a823ae171b3e', 'house_agent'),
    ('0x946feeffe5da1686dc762ca85cc54f9ab934bd60', 'house_agent'),
    ('0xa5bfb6c6e3085e7fd4b7328b52edda30ef683d68', 'platform'),
    ('0x2e4ccd9d1e14764575c99224684e4020d2eabd81', 'platform'),
    ('0x57f5049a2f30070d0654e6bc7dbe092cfaa77214', 'platform')
),
task_context AS (
  SELECT
    t.id,
    lower(COALESCE(r.wallet_address, '')) AS requester_wallet,
    lower(COALESCE(w.wallet_address, '')) AS worker_wallet,
    COALESCE(t.title, '') || E'\n' || COALESCE(t.description, '') AS copy,
    lower(COALESCE(t.task_group, '')) AS task_group,
    COALESCE(t.tags, ARRAY[]::text[]) AS tags
  FROM public.tasks t
  LEFT JOIN public.agents r ON t.requester_id = r.id
  LEFT JOIN public.agents w ON t.worker_id = w.id
),
classified AS (
  SELECT
    tc.id,
    CASE
      WHEN
        tc.task_group = 'test'
        OR 'test' = ANY(tc.tags)
        OR (
          (
            EXISTS (
              SELECT 1 FROM known_wallets kw
              WHERE kw.wallet_address IN (tc.requester_wallet, tc.worker_wallet)
            )
          )
          AND (
            tc.copy ~* '\m(e2e|test)\M'
            OR tc.copy ~* 'feedback\s+test'
            OR tc.copy ~* 'platform\s+functionality\s+check'
            OR tc.copy ~* 'verify\s+system\s+works'
          )
        )
        OR (
          EXISTS (
            SELECT 1 FROM known_wallets kw
            WHERE kw.wallet_address = tc.requester_wallet AND kw.wallet_kind = 'house_agent'
          )
          AND EXISTS (
            SELECT 1 FROM known_wallets kw
            WHERE kw.wallet_address = tc.worker_wallet AND kw.wallet_kind = 'house_agent'
          )
        )
        THEN 'house_test'
      WHEN
        tc.task_group = 'onboarding'
        OR 'onboarding' = ANY(tc.tags)
        OR (
          (
            EXISTS (
              SELECT 1 FROM known_wallets kw
              WHERE kw.wallet_address IN (tc.requester_wallet, tc.worker_wallet)
            )
          )
          AND (
            tc.copy ~* '\monboarding\M'
            OR tc.copy ~* 'introduce\s+yourself'
          )
        )
        THEN 'onboarding'
      WHEN EXISTS (
        SELECT 1 FROM known_wallets kw
        WHERE kw.wallet_address = tc.requester_wallet
      )
        THEN 'moltgig_seed'
      WHEN tc.requester_wallet <> ''
        THEN 'external'
      ELSE 'unknown'
    END AS task_origin
  FROM task_context tc
)
UPDATE public.tasks t
SET
  task_origin = classified.task_origin,
  review_policy = CASE classified.task_origin
    WHEN 'onboarding' THEN 'auto_onboarding'
    WHEN 'moltgig_seed' THEN 'ops_review'
    WHEN 'house_test' THEN 'ops_review'
    ELSE 'requester_review'
  END
FROM classified
WHERE t.id = classified.id;

DROP VIEW IF EXISTS public.task_listings;

CREATE VIEW public.task_listings
WITH (security_invoker = true)
AS
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
  t.task_origin,
  t.review_policy,
  t.proof_requirements,
  t.search_vector,
  r.wallet_address AS requester_wallet,
  r.moltbook_handle AS requester_handle,
  r.reputation_score AS requester_reputation,
  w.wallet_address AS worker_wallet,
  w.moltbook_handle AS worker_handle,
  w.reputation_score AS worker_reputation
FROM public.tasks t
LEFT JOIN public.agents r ON t.requester_id = r.id
LEFT JOIN public.agents w ON t.worker_id = w.id;
