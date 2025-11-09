-- ============================================================================
-- VAULT WORK POSITIONS & EDUCATION TRACKING
-- ============================================================================
-- This migration adds proper tracking for:
-- 1. Work positions (companies, titles, dates) - separate from achievement bullets
-- 2. Multiple education entries (degrees, certifications, schools)
-- ============================================================================

-- Create vault_work_positions table
CREATE TABLE IF NOT EXISTS public.vault_work_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL,
  user_id UUID NOT NULL,
  
  -- Core position details
  company_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE, -- NULL if current position
  is_current BOOLEAN DEFAULT false,
  
  -- Additional details
  location TEXT,
  employment_type TEXT, -- 'full-time', 'contract', 'part-time', etc.
  industry TEXT,
  company_size TEXT, -- 'startup', 'mid-size', 'enterprise'
  
  -- Context
  description TEXT, -- Overall role description
  reporting_structure TEXT, -- Who they reported to, team size managed
  
  -- Metadata
  quality_tier TEXT DEFAULT 'assumed',
  confidence_score NUMERIC DEFAULT 0.8,
  extraction_source TEXT, -- 'resume', 'linkedin', 'manual', 'ai_extraction'
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create vault_education table
CREATE TABLE IF NOT EXISTS public.vault_education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL,
  user_id UUID NOT NULL,
  
  -- Core education details
  institution_name TEXT NOT NULL,
  degree_type TEXT NOT NULL, -- 'bachelor', 'master', 'doctorate', 'certification', 'bootcamp', etc.
  field_of_study TEXT,
  degree_name TEXT, -- 'Bachelor of Science', 'MBA', 'Ph.D.', etc.
  
  -- Dates
  start_date DATE,
  end_date DATE,
  graduation_year INTEGER, -- For when only year is known
  is_in_progress BOOLEAN DEFAULT false,
  
  -- Additional details
  gpa NUMERIC,
  honors TEXT, -- 'summa cum laude', 'honors', etc.
  relevant_coursework TEXT[],
  thesis_title TEXT,
  
  -- Context
  description TEXT,
  
  -- Metadata
  quality_tier TEXT DEFAULT 'assumed',
  confidence_score NUMERIC DEFAULT 0.8,
  extraction_source TEXT, -- 'resume', 'linkedin', 'manual', 'ai_extraction'
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vault_work_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_education ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vault_work_positions
CREATE POLICY "Users can view their own work positions"
  ON public.vault_work_positions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own work positions"
  ON public.vault_work_positions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own work positions"
  ON public.vault_work_positions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own work positions"
  ON public.vault_work_positions FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for vault_education
CREATE POLICY "Users can view their own education"
  ON public.vault_education FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own education"
  ON public.vault_education FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own education"
  ON public.vault_education FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own education"
  ON public.vault_education FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_vault_work_positions_vault_id ON public.vault_work_positions(vault_id);
CREATE INDEX idx_vault_work_positions_user_id ON public.vault_work_positions(user_id);
CREATE INDEX idx_vault_work_positions_dates ON public.vault_work_positions(start_date DESC, end_date DESC);

CREATE INDEX idx_vault_education_vault_id ON public.vault_education(vault_id);
CREATE INDEX idx_vault_education_user_id ON public.vault_education(user_id);
CREATE INDEX idx_vault_education_degree_type ON public.vault_education(degree_type);

-- Add triggers for updated_at
CREATE TRIGGER update_vault_work_positions_updated_at
  BEFORE UPDATE ON public.vault_work_positions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_last_updated_at();

CREATE TRIGGER update_vault_education_updated_at
  BEFORE UPDATE ON public.vault_education
  FOR EACH ROW
  EXECUTE FUNCTION public.update_last_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.vault_work_positions IS 'Tracks actual work history (companies, titles, dates) - separate from achievement bullets in vault_power_phrases';
COMMENT ON TABLE public.vault_education IS 'Tracks education history including multiple degrees, certifications, and credentials';

COMMENT ON COLUMN public.vault_work_positions.is_current IS 'True if this is their current position (end_date should be NULL)';
COMMENT ON COLUMN public.vault_education.degree_type IS 'Type of credential: bachelor, master, doctorate, certification, bootcamp, associate, diploma, etc.';
COMMENT ON COLUMN public.vault_education.is_in_progress IS 'True if currently pursuing this degree/certification';