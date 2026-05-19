-- Webhooks table for push notification delivery
CREATE TABLE webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agents(id) NOT NULL,
    url TEXT NOT NULL,
    secret VARCHAR(64) NOT NULL,
    events TEXT[] NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    failure_count INT DEFAULT 0,
    last_failure_at TIMESTAMPTZ,
    last_success_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for finding active webhooks by agent
CREATE INDEX idx_webhooks_agent_active 
    ON webhooks(agent_id) 
    WHERE is_active = TRUE;

-- Index for finding webhooks by event type (for delivery)
CREATE INDEX idx_webhooks_events 
    ON webhooks USING GIN(events);

-- Enable RLS
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

-- Policy: Agents can read their own webhooks
CREATE POLICY "Agents can read own webhooks" ON webhooks
    FOR SELECT USING (
        agent_id IN (
            SELECT id FROM agents WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
        )
    );

-- Policy: Agents can insert their own webhooks
CREATE POLICY "Agents can insert own webhooks" ON webhooks
    FOR INSERT WITH CHECK (
        agent_id IN (
            SELECT id FROM agents WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
        )
    );

-- Policy: Agents can delete their own webhooks
CREATE POLICY "Agents can delete own webhooks" ON webhooks
    FOR DELETE USING (
        agent_id IN (
            SELECT id FROM agents WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
        )
    );

-- Policy: Service role can do anything (for backend operations like updating failure_count)
CREATE POLICY "Service role full access" ON webhooks
    FOR ALL USING (current_setting('role', true) = 'service_role');

-- Constraint: URL must be HTTPS (security)
ALTER TABLE webhooks ADD CONSTRAINT webhooks_url_https 
    CHECK (url LIKE 'https://%');

-- Constraint: Must have at least one event
ALTER TABLE webhooks ADD CONSTRAINT webhooks_events_not_empty 
    CHECK (array_length(events, 1) > 0);

-- Constraint: Max 5 webhooks per agent
CREATE OR REPLACE FUNCTION check_webhook_limit()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM webhooks WHERE agent_id = NEW.agent_id) >= 5 THEN
        RAISE EXCEPTION 'Maximum webhook limit (5) reached for this agent';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_webhook_limit
    BEFORE INSERT ON webhooks
    FOR EACH ROW
    EXECUTE FUNCTION check_webhook_limit();

COMMENT ON TABLE webhooks IS 'Registered webhooks for push notification delivery';
COMMENT ON COLUMN webhooks.secret IS 'HMAC-SHA256 secret for signing webhook payloads';
COMMENT ON COLUMN webhooks.events IS 'Array of event types to receive: task.accepted, task.submitted, etc.';
COMMENT ON COLUMN webhooks.failure_count IS 'Consecutive failures. Webhook disabled at 10.';;
