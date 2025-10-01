-- Fix search_path security issue in generate_api_key function
CREATE OR REPLACE FUNCTION public.generate_api_key()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  key_prefix TEXT := 'ccp_';
  random_part TEXT;
BEGIN
  -- Generate 32 random characters (base64-like)
  random_part := encode(gen_random_bytes(24), 'base64');
  random_part := replace(random_part, '/', '_');
  random_part := replace(random_part, '+', '-');
  random_part := replace(random_part, '=', '');
  
  RETURN key_prefix || random_part;
END;
$$;