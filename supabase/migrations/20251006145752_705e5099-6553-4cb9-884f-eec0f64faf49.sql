-- Make resume_id nullable in resume_analysis table since we're not using a separate resumes table currently
ALTER TABLE resume_analysis 
ALTER COLUMN resume_id DROP NOT NULL;