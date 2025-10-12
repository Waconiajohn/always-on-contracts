-- Fix security: Recreate function with proper search_path
DROP TRIGGER IF EXISTS trigger_update_last_activity ON user_activities;
DROP FUNCTION IF EXISTS update_user_last_activity() CASCADE;

CREATE OR REPLACE FUNCTION update_user_last_activity()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles 
  SET last_activity_at = NOW()
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER trigger_update_last_activity
  AFTER INSERT ON user_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_user_last_activity();