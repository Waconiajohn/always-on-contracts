-- Create saved_boolean_searches table
CREATE TABLE public.saved_boolean_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  boolean_string TEXT NOT NULL,
  search_query TEXT,
  location TEXT,
  filters JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  use_count INTEGER DEFAULT 0,
  CONSTRAINT name_not_empty CHECK (length(trim(name)) > 0)
);

-- Enable RLS
ALTER TABLE public.saved_boolean_searches ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own saved searches"
ON public.saved_boolean_searches
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved searches"
ON public.saved_boolean_searches
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved searches"
ON public.saved_boolean_searches
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved searches"
ON public.saved_boolean_searches
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_saved_boolean_searches_user_id ON public.saved_boolean_searches(user_id);
CREATE INDEX idx_saved_boolean_searches_last_used ON public.saved_boolean_searches(user_id, last_used_at DESC);