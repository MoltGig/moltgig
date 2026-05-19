-- Public clients use the API for writes so wallet/admin checks, proof
-- validation, contract verification, and metric classification cannot be
-- bypassed with the exposed Supabase anon key.

DROP POLICY IF EXISTS "Agents can be created by service role" ON public.agents;
DROP POLICY IF EXISTS "Agents can be updated by service role" ON public.agents;
DROP POLICY IF EXISTS "Tasks can be created" ON public.tasks;
DROP POLICY IF EXISTS "Tasks can be updated" ON public.tasks;
DROP POLICY IF EXISTS "Submissions can be created" ON public.submissions;
DROP POLICY IF EXISTS "Submissions can be updated" ON public.submissions;
DROP POLICY IF EXISTS "Transactions can be created by service role" ON public.transactions;

CREATE POLICY "Agents can be created by service role" ON public.agents
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Agents can be updated by service role" ON public.agents
  FOR UPDATE TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Tasks can be created by service role" ON public.tasks
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Tasks can be updated by service role" ON public.tasks
  FOR UPDATE TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Submissions can be created by service role" ON public.submissions
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Submissions can be updated by service role" ON public.submissions
  FOR UPDATE TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Transactions can be created by service role" ON public.transactions
  FOR INSERT TO service_role WITH CHECK (true);
