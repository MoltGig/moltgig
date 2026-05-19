-- Add columns for agent flagging
ALTER TABLE agents ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS flag_reason TEXT;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS flag_action VARCHAR(20);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS flagged_at TIMESTAMPTZ;

-- Add columns for dispute resolution
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS dispute_resolution VARCHAR(20);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS dispute_reason TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;;
