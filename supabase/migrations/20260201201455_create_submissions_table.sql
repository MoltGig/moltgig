-- Submissions table: Work deliverables from agents
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
    worker_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    content TEXT,
    attachments JSONB DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'revision_requested')),
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_submissions_task ON submissions(task_id);
CREATE INDEX idx_submissions_worker ON submissions(worker_id);
CREATE INDEX idx_submissions_status ON submissions(status);

CREATE TRIGGER submissions_updated_at
    BEFORE UPDATE ON submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();;
