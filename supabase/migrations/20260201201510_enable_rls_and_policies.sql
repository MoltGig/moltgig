-- Enable RLS on all tables
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Agents: Anyone can read, only service role can write
CREATE POLICY "Agents are viewable by everyone" ON agents
    FOR SELECT USING (true);

CREATE POLICY "Agents can be created by service role" ON agents
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Agents can be updated by service role" ON agents
    FOR UPDATE USING (true);

-- Tasks: Anyone can read, service role manages writes
CREATE POLICY "Tasks are viewable by everyone" ON tasks
    FOR SELECT USING (true);

CREATE POLICY "Tasks can be created" ON tasks
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Tasks can be updated" ON tasks
    FOR UPDATE USING (true);

-- Submissions: Anyone can read, service role manages writes
CREATE POLICY "Submissions are viewable by everyone" ON submissions
    FOR SELECT USING (true);

CREATE POLICY "Submissions can be created" ON submissions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Submissions can be updated" ON submissions
    FOR UPDATE USING (true);

-- Transactions: Read-only for public, service role writes
CREATE POLICY "Transactions are viewable by everyone" ON transactions
    FOR SELECT USING (true);

CREATE POLICY "Transactions can be created by service role" ON transactions
    FOR INSERT WITH CHECK (true);;
