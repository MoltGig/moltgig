-- Transactions table: On-chain payment records
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    tx_hash VARCHAR(66) UNIQUE NOT NULL,
    tx_type VARCHAR(20) NOT NULL CHECK (tx_type IN ('fund', 'complete', 'refund', 'dispute_resolve')),
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42),
    amount_wei BIGINT,
    block_number BIGINT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_transactions_task ON transactions(task_id);
CREATE INDEX idx_transactions_hash ON transactions(tx_hash);
CREATE INDEX idx_transactions_from ON transactions(from_address);
CREATE INDEX idx_transactions_type ON transactions(tx_type);;
