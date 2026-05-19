
-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;

-- Create the cleanup function
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete notifications older than 30 days
  DELETE FROM notifications
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log if any were deleted (will appear in Supabase logs)
  IF deleted_count > 0 THEN
    RAISE NOTICE 'Deleted % old notifications', deleted_count;
  END IF;
END;
$$;

-- Schedule the cleanup to run daily at 3:00 AM UTC
SELECT cron.schedule(
  'cleanup-old-notifications',           -- job name
  '0 3 * * *',                           -- cron expression: 3:00 AM daily
  'SELECT cleanup_old_notifications()'   -- SQL to execute
);

-- Comment for documentation
COMMENT ON FUNCTION cleanup_old_notifications() IS 
  'Deletes notifications older than 30 days. Scheduled to run daily at 3:00 AM UTC via pg_cron.';
;
