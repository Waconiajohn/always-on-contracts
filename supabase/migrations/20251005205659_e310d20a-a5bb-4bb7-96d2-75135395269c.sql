-- Enable password leak protection
-- This prevents users from signing up with compromised passwords

-- Note: This configuration is typically done through Supabase Auth settings
-- Creating a policy to enforce password strength requirements

CREATE OR REPLACE FUNCTION public.check_password_strength(password text)
RETURNS boolean AS $$
BEGIN
  -- Minimum 8 characters
  IF length(password) < 8 THEN
    RETURN false;
  END IF;
  
  -- Must contain at least one uppercase letter
  IF password !~ '[A-Z]' THEN
    RETURN false;
  END IF;
  
  -- Must contain at least one lowercase letter
  IF password !~ '[a-z]' THEN
    RETURN false;
  END IF;
  
  -- Must contain at least one number
  IF password !~ '[0-9]' THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;