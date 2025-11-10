-- Fix schema issues preventing extraction progress tracking

-- Make ai_usage_metrics columns nullable since token counts may not always be available
ALTER TABLE public.ai_usage_metrics 
ALTER COLUMN input_tokens DROP NOT NULL,
ALTER COLUMN output_tokens DROP NOT NULL,
ALTER COLUMN cost_usd DROP NOT NULL;

-- Set defaults for ai_usage_metrics
ALTER TABLE public.ai_usage_metrics 
ALTER COLUMN input_tokens SET DEFAULT 0,
ALTER COLUMN output_tokens SET DEFAULT 0,
ALTER COLUMN cost_usd SET DEFAULT 0;

-- Make checkpoint_name nullable in extraction_checkpoints 
ALTER TABLE public.extraction_checkpoints 
ALTER COLUMN checkpoint_name DROP NOT NULL;

-- Add confidence_score column to ai_responses if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ai_responses' 
    AND column_name = 'confidence_score'
  ) THEN
    ALTER TABLE public.ai_responses 
    ADD COLUMN confidence_score NUMERIC;
  END IF;
END $$;