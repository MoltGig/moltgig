-- Costs table for tracking platform expenses
CREATE TABLE costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL,  -- 'gas', 'server', 'domain', 'api', 'other'
  description TEXT,
  amount_wei BIGINT,              -- For crypto costs (in wei)
  amount_usd DECIMAL(10,2),       -- For fiat costs
  tx_hash VARCHAR(66),            -- If gas cost, link to transaction
  period_start DATE,              -- For recurring costs (e.g., server monthly)
  period_end DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT                 -- Who added this cost
);

-- Enable RLS
ALTER TABLE costs ENABLE ROW LEVEL SECURITY;

-- Only service role can access (admin API will use service role)
CREATE POLICY "Service role full access" ON costs
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Create index for date-based queries
CREATE INDEX idx_costs_created_at ON costs(created_at DESC);
CREATE INDEX idx_costs_category ON costs(category);;
