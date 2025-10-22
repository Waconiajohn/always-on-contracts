-- Add ATS scoring columns to resumes table
ALTER TABLE resumes
ADD COLUMN IF NOT EXISTS ats_analysis JSONB,
ADD COLUMN IF NOT EXISTS ats_score NUMERIC,
ADD COLUMN IF NOT EXISTS last_ats_analysis_at TIMESTAMPTZ;

-- Add index on ats_score for faster queries
CREATE INDEX IF NOT EXISTS idx_resumes_ats_score ON resumes(ats_score);

-- Add comment for documentation
COMMENT ON COLUMN resumes.ats_analysis IS 'Full ATS analysis results from analyze-ats-score function';
COMMENT ON COLUMN resumes.ats_score IS 'Overall ATS compatibility score (0-100)';
COMMENT ON COLUMN resumes.last_ats_analysis_at IS 'Timestamp of the last ATS analysis';