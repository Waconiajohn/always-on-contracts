-- Fix cron job to use hardcoded project URL instead of current_setting()
-- This is required because current_setting() is not configured in the database

-- First, unschedule the existing cron job
SELECT cron.unschedule('check-cost-alerts');

-- Recreate with hardcoded values
SELECT cron.schedule(
  'check-cost-alerts',
  '0 */6 * * *',  -- Every 6 hours
  $$
  SELECT
    net.http_post(
      url:='https://ubcghjlfxkamyyefnbkf.supabase.co/functions/v1/check-cost-alerts',
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViY2doamxmeGthbXl5ZWZuYmtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMjkyMDEsImV4cCI6MjA3NDgwNTIwMX0.DZVK8rhuXv_nyUBUW1QNss9aDdWD73w6RVr51vipWmQ'
      ),
      body:='{}'::jsonb
    ) as request_id;
  $$
);
