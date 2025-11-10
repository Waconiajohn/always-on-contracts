-- Add missing latency_ms column to ai_responses table
ALTER TABLE public.ai_responses 
ADD COLUMN IF NOT EXISTS latency_ms INTEGER;