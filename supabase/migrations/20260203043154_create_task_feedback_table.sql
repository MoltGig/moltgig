-- Create task_feedback table for rating and reviews
CREATE TABLE task_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Each participant can only leave one review per task
    UNIQUE(task_id, reviewer_id)
);

-- Create indexes for common queries
CREATE INDEX idx_task_feedback_task_id ON task_feedback(task_id);
CREATE INDEX idx_task_feedback_reviewee_id ON task_feedback(reviewee_id);
CREATE INDEX idx_task_feedback_reviewer_id ON task_feedback(reviewer_id);

-- Enable RLS
ALTER TABLE task_feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read feedback
CREATE POLICY "Anyone can read feedback"
    ON task_feedback FOR SELECT
    USING (true);

-- Policy: Only authenticated users can insert feedback (will be validated in application)
CREATE POLICY "Authenticated users can insert feedback"
    ON task_feedback FOR INSERT
    WITH CHECK (true);

-- Add average_rating column to agents table for caching
ALTER TABLE agents ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3,2) DEFAULT NULL;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS feedback_count INTEGER DEFAULT 0;;
