-- Create persona_memories table for storing coach persona memories about users
CREATE TABLE IF NOT EXISTS public.persona_memories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  persona_id TEXT NOT NULL CHECK (persona_id IN ('robert', 'sophia', 'nexus')),
  memory_type TEXT NOT NULL CHECK (memory_type IN ('fact', 'preference', 'goal', 'concern', 'progress', 'mood')),
  content TEXT NOT NULL,
  importance INTEGER NOT NULL DEFAULT 5 CHECK (importance >= 1 AND importance <= 10),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_persona_memories_user_persona ON public.persona_memories(user_id, persona_id);
CREATE INDEX IF NOT EXISTS idx_persona_memories_importance ON public.persona_memories(importance DESC);

-- Enable RLS
ALTER TABLE public.persona_memories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own persona memories"
  ON public.persona_memories
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own persona memories"
  ON public.persona_memories
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own persona memories"
  ON public.persona_memories
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own persona memories"
  ON public.persona_memories
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create persona_conversations table for tracking conversations
CREATE TABLE IF NOT EXISTS public.persona_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  persona_id TEXT NOT NULL CHECK (persona_id IN ('robert', 'sophia', 'nexus')),
  message TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant', 'system')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_persona_conversations_user_persona ON public.persona_conversations(user_id, persona_id);
CREATE INDEX IF NOT EXISTS idx_persona_conversations_created ON public.persona_conversations(created_at DESC);

-- Enable RLS
ALTER TABLE public.persona_conversations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own persona conversations"
  ON public.persona_conversations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own persona conversations"
  ON public.persona_conversations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create trigger for updating updated_at
CREATE OR REPLACE FUNCTION update_persona_memories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_persona_memories_timestamp
  BEFORE UPDATE ON public.persona_memories
  FOR EACH ROW
  EXECUTE FUNCTION update_persona_memories_updated_at();