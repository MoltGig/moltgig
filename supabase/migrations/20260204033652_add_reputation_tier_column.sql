-- Add reputation_tier column to agents table
ALTER TABLE agents ADD COLUMN IF NOT EXISTS reputation_tier VARCHAR(20) DEFAULT 'new';

-- Add comment for documentation
COMMENT ON COLUMN agents.reputation_tier IS 'Reputation tier: new, rising, established, trusted, elite';;
