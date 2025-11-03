-- Migration: Create cost alerts and notifications infrastructure
-- Purpose: Track sent alerts and provide in-app notifications

-- 1. Table to track sent cost alerts (prevent spam)
CREATE TABLE IF NOT EXISTS cost_alerts_sent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('warning_80', 'warning_90', 'critical_100', 'budget_exceeded')),
  message_subject TEXT NOT NULL,
  message_body TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cost_alerts_user ON cost_alerts_sent(user_id);
CREATE INDEX idx_cost_alerts_type ON cost_alerts_sent(alert_type);
CREATE INDEX idx_cost_alerts_sent_at ON cost_alerts_sent(sent_at DESC);

-- Enable RLS
ALTER TABLE cost_alerts_sent ENABLE ROW LEVEL SECURITY;

-- Users can view their own alerts
CREATE POLICY "Users can view own alerts"
  ON cost_alerts_sent FOR SELECT
  USING (user_id = auth.uid());

-- Service can insert alerts
CREATE POLICY "Service can insert alerts"
  ON cost_alerts_sent FOR INSERT
  WITH CHECK (true);

-- 2. Notifications table for in-app alerts
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read) WHERE read = false;

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can manage their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Service can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- 3. Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE notifications
  SET read = true
  WHERE id = p_notification_id
    AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function to mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS void AS $$
BEGIN
  UPDATE notifications
  SET read = true
  WHERE user_id = auth.uid()
    AND read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM notifications
    WHERE user_id = auth.uid()
      AND read = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Setup cron job for cost alerts (runs every 6 hours)
SELECT cron.schedule(
  'check-cost-alerts',
  '0 */6 * * *',  -- Every 6 hours
  $$
  SELECT
    net.http_post(
      url:=current_setting('app.settings.supabase_url') || '/functions/v1/check-cost-alerts',
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key')
      ),
      body:='{}'::jsonb
    ) as request_id;
  $$
);

-- 7. Auto-cleanup old notifications (keep last 30 days)
SELECT cron.schedule(
  'cleanup-old-notifications',
  '0 2 * * *',  -- Daily at 2 AM
  $$
  DELETE FROM notifications
  WHERE created_at < NOW() - INTERVAL '30 days';
  $$
);

COMMENT ON TABLE cost_alerts_sent IS 'Tracks cost alerts sent to users to prevent spam';
COMMENT ON TABLE notifications IS 'In-app notifications for users';
COMMENT ON FUNCTION mark_notification_read IS 'Mark a notification as read';
COMMENT ON FUNCTION mark_all_notifications_read IS 'Mark all user notifications as read';
COMMENT ON FUNCTION get_unread_count IS 'Get count of unread notifications';
