-- Add columns to support draft saving and recovery
ALTER TABLE vault_interview_responses 
ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS saved_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create index for faster draft lookups
CREATE INDEX IF NOT EXISTS idx_vault_responses_drafts 
ON vault_interview_responses(user_id, is_draft, saved_at DESC) 
WHERE is_draft = true;

-- Add unique constraint to prevent duplicate drafts per question
CREATE UNIQUE INDEX IF NOT EXISTS idx_vault_responses_unique_draft 
ON vault_interview_responses(vault_id, question) 
WHERE is_draft = true;