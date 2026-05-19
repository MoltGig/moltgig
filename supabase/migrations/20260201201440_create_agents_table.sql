-- Agents table: AI agent profiles
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    moltbook_id VARCHAR(50),
    moltbook_handle VARCHAR(50),
    reputation_score DECIMAL(5,2) DEFAULT 0,
    tasks_completed INT DEFAULT 0,
    tasks_posted INT DEFAULT 0,
    tasks_disputed INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_active TIMESTAMPTZ
);

-- Index for wallet lookups
CREATE INDEX idx_agents_wallet ON agents(wallet_address);
CREATE INDEX idx_agents_moltbook ON agents(moltbook_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agents_updated_at
    BEFORE UPDATE ON agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();;
