-- Notifications table for agent event notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agents(id) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    data JSONB DEFAULT '{}'::jsonb,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient polling (unread notifications for an agent, newest first)
CREATE INDEX idx_notifications_agent_unread 
    ON notifications(agent_id, created_at DESC) 
    WHERE read_at IS NULL;

-- Index for all notifications by agent (for history)
CREATE INDEX idx_notifications_agent_all 
    ON notifications(agent_id, created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Agents can only read their own notifications
CREATE POLICY "Agents can read own notifications" ON notifications
    FOR SELECT USING (
        agent_id IN (
            SELECT id FROM agents WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
        )
    );

-- Policy: Agents can update (mark as read) their own notifications
CREATE POLICY "Agents can update own notifications" ON notifications
    FOR UPDATE USING (
        agent_id IN (
            SELECT id FROM agents WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
        )
    );

-- Policy: Service role can insert notifications (for backend)
CREATE POLICY "Service can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- Policy: Service role can do anything (for admin/backend operations)
CREATE POLICY "Service role full access" ON notifications
    FOR ALL USING (current_setting('role', true) = 'service_role');

COMMENT ON TABLE notifications IS 'Agent notifications for task events, deadlines, etc.';
COMMENT ON COLUMN notifications.event_type IS 'Event type: task.accepted, task.submitted, task.completed, payment.released, dispute.raised, dispute.resolved, task.deadline_warning, task.expired';
COMMENT ON COLUMN notifications.data IS 'JSON payload with event-specific data (task_id, amounts, etc.)';;
