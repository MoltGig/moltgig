
-- Add a policy that allows inserts unconditionally (backend handles auth)
-- The backend verifies wallet signature before calling this

-- First drop the existing insert policy that requires JWT claims
DROP POLICY IF EXISTS "Agents can insert own webhooks" ON webhooks;

-- Create a simpler policy - backend handles authentication
CREATE POLICY "Backend can insert webhooks" ON webhooks
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Update delete policy similarly
DROP POLICY IF EXISTS "Agents can delete own webhooks" ON webhooks;

CREATE POLICY "Backend can delete webhooks" ON webhooks
  FOR DELETE
  TO public
  USING (true);

-- Update select policy to allow reading all webhooks (backend filters by agent)
DROP POLICY IF EXISTS "Agents can read own webhooks" ON webhooks;

CREATE POLICY "Backend can read webhooks" ON webhooks
  FOR SELECT
  TO public
  USING (true);
;
