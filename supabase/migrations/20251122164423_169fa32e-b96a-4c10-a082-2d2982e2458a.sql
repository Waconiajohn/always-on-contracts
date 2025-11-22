-- Phase 1: Add work_position_id foreign key to vault_resume_milestones
-- This creates the critical link between milestones and their associated work positions

-- Add the foreign key column (NOT NULL since we have 0 milestones)
ALTER TABLE vault_resume_milestones 
ADD COLUMN work_position_id uuid NOT NULL 
REFERENCES vault_work_positions(id) ON DELETE CASCADE;

-- Create index for query performance
CREATE INDEX idx_milestones_work_position 
ON vault_resume_milestones(work_position_id);

-- Create composite index for common query pattern (user + position)
CREATE INDEX idx_milestones_user_position 
ON vault_resume_milestones(user_id, work_position_id);

-- Add helpful comment
COMMENT ON COLUMN vault_resume_milestones.work_position_id IS 'Foreign key linking milestone to its associated work position. Ensures data integrity and eliminates job context duplication.';