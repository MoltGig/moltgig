-- Preserve actual on-chain platform fee amounts from payout events.
-- amount_wei remains the transferred task/payment amount for the transaction;
-- fee_wei is the fee emitted by TaskCompleted/DisputeResolved events.

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS fee_wei BIGINT;

CREATE INDEX IF NOT EXISTS idx_transactions_fee_wei
  ON public.transactions(fee_wei)
  WHERE fee_wei IS NOT NULL;
