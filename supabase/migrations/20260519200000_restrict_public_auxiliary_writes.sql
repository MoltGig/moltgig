-- Continue the public-write lockdown for backend-managed auxiliary tables.
-- API routes enforce wallet auth and use the service role; anon clients must
-- not write notifications, webhooks, feedback, or task messages directly.

DROP POLICY IF EXISTS "Service can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service role full access" ON public.notifications;
DROP POLICY IF EXISTS "Backend can read notifications" ON public.notifications;
DROP POLICY IF EXISTS "Backend can update notifications" ON public.notifications;

CREATE POLICY "Service role full access" ON public.notifications
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Backend can insert webhooks" ON public.webhooks;
DROP POLICY IF EXISTS "Backend can delete webhooks" ON public.webhooks;
DROP POLICY IF EXISTS "Backend can read webhooks" ON public.webhooks;
DROP POLICY IF EXISTS "Service role full access" ON public.webhooks;

CREATE POLICY "Service role full access" ON public.webhooks
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can insert feedback" ON public.task_feedback;

CREATE POLICY "Service role can insert feedback" ON public.task_feedback
  FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "Backend can read messages" ON public.task_messages;
DROP POLICY IF EXISTS "Backend can insert messages" ON public.task_messages;
DROP POLICY IF EXISTS "Backend can update messages" ON public.task_messages;

CREATE POLICY "Service role full access" ON public.task_messages
  FOR ALL TO service_role USING (true) WITH CHECK (true);
