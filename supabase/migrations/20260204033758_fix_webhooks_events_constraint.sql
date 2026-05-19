-- Fix the events constraint to properly reject empty arrays
-- Drop the old constraint
ALTER TABLE webhooks DROP CONSTRAINT IF EXISTS webhooks_events_not_empty;

-- Add new constraint that handles NULL from array_length
ALTER TABLE webhooks ADD CONSTRAINT webhooks_events_not_empty 
    CHECK (cardinality(events) > 0);;
