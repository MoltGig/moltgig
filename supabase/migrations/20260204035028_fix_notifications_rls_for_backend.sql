
-- Update notifications RLS policies for backend access

-- Drop existing read policy
DROP POLICY IF EXISTS "Agents can read own notifications" ON notifications;

-- Create a simpler read policy (backend handles auth/filtering)
CREATE POLICY "Backend can read notifications" ON notifications
  FOR SELECT
  TO public
  USING (true);

-- Drop and recreate update policy
DROP POLICY IF EXISTS "Agents can update own notifications" ON notifications;

CREATE POLICY "Backend can update notifications" ON notifications
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);
;
