-- Fix search_path security issue for check_password_strength function
DROP FUNCTION IF EXISTS public.check_password_strength(text);

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;