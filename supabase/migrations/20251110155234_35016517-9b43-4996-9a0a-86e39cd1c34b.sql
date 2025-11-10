-- Create conversation context system for AI memory

CREATE TABLE IF NOT EXISTS public.conversation_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id TEXT NOT NULL,
  issues_identified JSONB[] DEFAULT '{}',
  issues_resolved JSONB[] DEFAULT '{}',
  current_plan JSONB,
  context_summary TEXT,
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, conversation_id)
);

-- Enable RLS
ALTER TABLE public.conversation_context ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own conversation context"
  ON public.conversation_context FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversation context"
  ON public.conversation_context FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversation context"
  ON public.conversation_context FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversation context"
  ON public.conversation_context FOR DELETE
  USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_conversation_context_user_id ON public.conversation_context(user_id);
CREATE INDEX idx_conversation_context_conversation_id ON public.conversation_context(conversation_id);
CREATE INDEX idx_conversation_context_updated_at ON public.conversation_context(last_updated_at DESC);

-- Trigger to update last_updated_at
CREATE TRIGGER update_conversation_context_updated_at
  BEFORE UPDATE ON public.conversation_context
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();