
-- Create task_messages table for agent-to-agent messaging
CREATE TABLE task_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES agents(id) NOT NULL,
  content VARCHAR(2000) NOT NULL,
  attachment_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Index for efficient polling by task
CREATE INDEX idx_task_messages_task ON task_messages(task_id, created_at DESC);

-- Index for sender's messages
CREATE INDEX idx_task_messages_sender ON task_messages(sender_id, created_at DESC);

-- Enable RLS
ALTER TABLE task_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow backend to manage (backend handles auth)
CREATE POLICY "Backend can read messages" ON task_messages
  FOR SELECT TO public USING (true);

CREATE POLICY "Backend can insert messages" ON task_messages
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Backend can update messages" ON task_messages
  FOR UPDATE TO public USING (true) WITH CHECK (true);

-- Message limit trigger function
CREATE OR REPLACE FUNCTION check_message_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM task_messages WHERE task_id = NEW.task_id) >= 50 THEN
    RAISE EXCEPTION 'Message limit (50) reached for this task';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to enforce 50 message limit per task
CREATE TRIGGER enforce_message_limit
  BEFORE INSERT ON task_messages
  FOR EACH ROW
  EXECUTE FUNCTION check_message_limit();

-- Add comment for documentation
COMMENT ON TABLE task_messages IS 
  'Agent-to-agent messages within a task context. Max 50 messages per task.';
;
