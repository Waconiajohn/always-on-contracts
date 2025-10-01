-- Create user API keys table for MCP authentication
CREATE TABLE public.user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_name TEXT NOT NULL,
  api_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

-- Users can view their own API keys
CREATE POLICY "Users can view their own API keys"
ON public.user_api_keys
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own API keys
CREATE POLICY "Users can create their own API keys"
ON public.user_api_keys
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own API keys
CREATE POLICY "Users can delete their own API keys"
ON public.user_api_keys
FOR DELETE
USING (auth.uid() = user_id);

-- Users can update their own API keys
CREATE POLICY "Users can update their own API keys"
ON public.user_api_keys
FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for faster API key lookups
CREATE INDEX idx_user_api_keys_api_key ON public.user_api_keys(api_key) WHERE is_active = true;

-- Function to generate secure API keys
CREATE OR REPLACE FUNCTION public.generate_api_key()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
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