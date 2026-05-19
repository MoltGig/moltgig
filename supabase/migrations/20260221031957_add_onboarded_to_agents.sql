-- Add onboarded column to agents table
ALTER TABLE agents ADD COLUMN IF NOT EXISTS onboarded BOOLEAN DEFAULT false;

-- Mark existing agents with completed tasks as already onboarded
UPDATE agents SET onboarded = true WHERE tasks_completed > 0;;
