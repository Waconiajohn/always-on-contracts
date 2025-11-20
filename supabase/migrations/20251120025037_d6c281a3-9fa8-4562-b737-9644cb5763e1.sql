-- Add missing confidence_score column to vault_resume_milestones
ALTER TABLE public.vault_resume_milestones 
ADD COLUMN IF NOT EXISTS confidence_score INTEGER DEFAULT 0;