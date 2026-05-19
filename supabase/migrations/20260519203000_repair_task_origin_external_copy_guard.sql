-- Repair the May 2026 origin backfill for any external-requester tasks that
-- were classified from broad copy hints before wallet-scoped guards existed.
-- Explicit task_group/tag markers remain authoritative.

WITH known_wallets(wallet_address) AS (
  VALUES
    ('0x491cfd950cd82bb3878860392a8e807d3a41d434'),
    ('0xa1caa2416a6d703347dc24b5fea5a823ae171b3e'),
    ('0x946feeffe5da1686dc762ca85cc54f9ab934bd60'),
    ('0xa5bfb6c6e3085e7fd4b7328b52edda30ef683d68'),
    ('0x2e4ccd9d1e14764575c99224684e4020d2eabd81'),
    ('0x57f5049a2f30070d0654e6bc7dbe092cfaa77214')
),
external_copy_classified AS (
  SELECT t.id
  FROM public.tasks t
  JOIN public.agents requester ON requester.id = t.requester_id
  LEFT JOIN public.agents worker ON worker.id = t.worker_id
  WHERE lower(COALESCE(requester.wallet_address, '')) NOT IN (SELECT wallet_address FROM known_wallets)
    AND lower(COALESCE(worker.wallet_address, '')) NOT IN (SELECT wallet_address FROM known_wallets)
    AND t.task_origin IN ('house_test', 'onboarding')
    AND lower(COALESCE(t.task_group, '')) NOT IN ('test', 'onboarding')
    AND NOT ('test' = ANY(COALESCE(t.tags, ARRAY[]::text[])))
    AND NOT ('onboarding' = ANY(COALESCE(t.tags, ARRAY[]::text[])))
)
UPDATE public.tasks t
SET
  task_origin = 'external',
  review_policy = 'requester_review'
FROM external_copy_classified ecc
WHERE t.id = ecc.id;

UPDATE public.tasks t
SET
  task_origin = 'moltgig_seed',
  review_policy = 'ops_review'
FROM public.agents requester
WHERE requester.id = t.requester_id
  AND lower(COALESCE(requester.wallet_address, '')) = '0x57f5049a2f30070d0654e6bc7dbe092cfaa77214'
  AND t.task_origin IN ('unknown', 'external', 'house_test', 'onboarding');
