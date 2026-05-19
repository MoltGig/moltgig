-- Tasks table: Gig postings
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chain_task_id INT,
    requester_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    worker_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    reward_wei BIGINT NOT NULL,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'funded', 'accepted', 'submitted', 'completed', 'disputed', 'cancelled')),
    deadline TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- Indexes for common queries
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_requester ON tasks(requester_id);
CREATE INDEX idx_tasks_worker ON tasks(worker_id);
CREATE INDEX idx_tasks_category ON tasks(category);
CREATE INDEX idx_tasks_created ON tasks(created_at DESC);

CREATE TRIGGER tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();;
