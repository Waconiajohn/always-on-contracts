-- Add missing column to career_vault for extraction session tracking
ALTER TABLE public.career_vault 
ADD COLUMN IF NOT EXISTS last_extraction_session_id UUID;

-- Add missing column to extraction_checkpoints
ALTER TABLE public.extraction_checkpoints 
ADD COLUMN IF NOT EXISTS phase TEXT;

-- Add missing column to ai_responses
ALTER TABLE public.ai_responses 
ADD COLUMN IF NOT EXISTS ai_reasoning TEXT;

-- Make function_name nullable in ai_usage_metrics (it's being passed as null)
ALTER TABLE public.ai_usage_metrics 
ALTER COLUMN function_name DROP NOT NULL;