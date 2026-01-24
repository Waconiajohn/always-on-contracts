-- Resume Builder V2: Phase 1 Foundation Tables
-- Using 'rb_' prefix to avoid conflicts with existing tables

-- 1. rb_projects: Main project container
CREATE TABLE public.rb_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'ready', 'completed', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Job description data
  jd_text TEXT,
  jd_confidence NUMERIC(3,2),
  
  -- Target classification
  role_title TEXT,
  seniority_level TEXT CHECK (seniority_level IN ('IC', 'Senior IC', 'Manager', 'Senior Manager', 'Director', 'Senior Director', 'VP', 'SVP', 'C-Level')),
  industry TEXT,
  sub_industry TEXT,
  target_confirmed BOOLEAN DEFAULT false,
  user_override_target JSONB,
  
  -- Scoring
  current_score NUMERIC(5,2),
  original_score NUMERIC(5,2)
);

-- 2. rb_documents: Uploaded resume files and parsed content
CREATE TABLE public.rb_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.rb_projects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  raw_text TEXT,
  parsed_json JSONB,
  span_index JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. rb_evidence: Claims with evidence quotes for anti-hallucination
CREATE TABLE public.rb_evidence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.rb_projects(id) ON DELETE CASCADE,
  claim_text TEXT NOT NULL,
  evidence_quote TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('skill', 'tool', 'domain', 'responsibility', 'metric', 'leadership')),
  source TEXT NOT NULL DEFAULT 'extracted' CHECK (source IN ('extracted', 'user_provided')),
  span_location JSONB,
  confidence TEXT NOT NULL DEFAULT 'medium' CHECK (confidence IN ('high', 'medium')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. rb_versions: Version history with 30-day retention
CREATE TABLE public.rb_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.rb_projects(id) ON DELETE CASCADE,
  section_name TEXT NOT NULL,
  version_number INTEGER NOT NULL DEFAULT 1,
  content TEXT NOT NULL,
  action_source TEXT NOT NULL CHECK (action_source IN ('tighten', 'executive', 'specific', 'reduce_buzzwords', 'match_jd', 'conservative', 'try_another', 'micro_edit', 'manual', 'initial')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. rb_keyword_decisions: User decisions on keywords (add/ignore/not_true)
CREATE TABLE public.rb_keyword_decisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.rb_projects(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('add', 'ignore', 'not_true', 'ask_me')),
  evidence_id UUID REFERENCES public.rb_evidence(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, keyword)
);

-- 6. rb_jd_requirements: Extracted job description requirements
CREATE TABLE public.rb_jd_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.rb_projects(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('hard_skill', 'tool', 'domain', 'responsibility', 'outcome', 'education', 'title', 'soft_skill')),
  text TEXT NOT NULL,
  weight INTEGER NOT NULL DEFAULT 3 CHECK (weight >= 1 AND weight <= 5),
  exact_phrases JSONB,
  synonyms JSONB,
  section_hint TEXT CHECK (section_hint IN ('Summary', 'Skills', 'Experience', 'Education')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. rb_benchmark_requirements: Generated benchmark expectations
CREATE TABLE public.rb_benchmark_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.rb_projects(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('hard_skill', 'tool', 'domain', 'leadership', 'responsibility', 'metric')),
  text TEXT NOT NULL,
  weight INTEGER NOT NULL DEFAULT 3 CHECK (weight >= 1 AND weight <= 5),
  section_hint TEXT CHECK (section_hint IN ('Summary', 'Skills', 'Experience')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.rb_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rb_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rb_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rb_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rb_keyword_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rb_jd_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rb_benchmark_requirements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rb_projects
CREATE POLICY "Users can view their own rb_projects" ON public.rb_projects
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own rb_projects" ON public.rb_projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own rb_projects" ON public.rb_projects
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own rb_projects" ON public.rb_projects
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for rb_documents (via project ownership)
CREATE POLICY "Users can view rb_documents for their projects" ON public.rb_documents
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.rb_projects WHERE id = project_id AND user_id = auth.uid()));
CREATE POLICY "Users can create rb_documents for their projects" ON public.rb_documents
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.rb_projects WHERE id = project_id AND user_id = auth.uid()));
CREATE POLICY "Users can update rb_documents for their projects" ON public.rb_documents
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.rb_projects WHERE id = project_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete rb_documents for their projects" ON public.rb_documents
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.rb_projects WHERE id = project_id AND user_id = auth.uid()));

-- RLS Policies for rb_evidence
CREATE POLICY "Users can view rb_evidence for their projects" ON public.rb_evidence
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.rb_projects WHERE id = project_id AND user_id = auth.uid()));
CREATE POLICY "Users can create rb_evidence for their projects" ON public.rb_evidence
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.rb_projects WHERE id = project_id AND user_id = auth.uid()));
CREATE POLICY "Users can update rb_evidence for their projects" ON public.rb_evidence
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.rb_projects WHERE id = project_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete rb_evidence for their projects" ON public.rb_evidence
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.rb_projects WHERE id = project_id AND user_id = auth.uid()));

-- RLS Policies for rb_versions
CREATE POLICY "Users can view rb_versions for their projects" ON public.rb_versions
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.rb_projects WHERE id = project_id AND user_id = auth.uid()));
CREATE POLICY "Users can create rb_versions for their projects" ON public.rb_versions
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.rb_projects WHERE id = project_id AND user_id = auth.uid()));
CREATE POLICY "Users can update rb_versions for their projects" ON public.rb_versions
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.rb_projects WHERE id = project_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete rb_versions for their projects" ON public.rb_versions
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.rb_projects WHERE id = project_id AND user_id = auth.uid()));

-- RLS Policies for rb_keyword_decisions
CREATE POLICY "Users can view rb_keyword_decisions for their projects" ON public.rb_keyword_decisions
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.rb_projects WHERE id = project_id AND user_id = auth.uid()));
CREATE POLICY "Users can create rb_keyword_decisions for their projects" ON public.rb_keyword_decisions
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.rb_projects WHERE id = project_id AND user_id = auth.uid()));
CREATE POLICY "Users can update rb_keyword_decisions for their projects" ON public.rb_keyword_decisions
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.rb_projects WHERE id = project_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete rb_keyword_decisions for their projects" ON public.rb_keyword_decisions
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.rb_projects WHERE id = project_id AND user_id = auth.uid()));

-- RLS Policies for rb_jd_requirements
CREATE POLICY "Users can view rb_jd_requirements for their projects" ON public.rb_jd_requirements
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.rb_projects WHERE id = project_id AND user_id = auth.uid()));
CREATE POLICY "Users can create rb_jd_requirements for their projects" ON public.rb_jd_requirements
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.rb_projects WHERE id = project_id AND user_id = auth.uid()));
CREATE POLICY "Users can update rb_jd_requirements for their projects" ON public.rb_jd_requirements
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.rb_projects WHERE id = project_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete rb_jd_requirements for their projects" ON public.rb_jd_requirements
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.rb_projects WHERE id = project_id AND user_id = auth.uid()));

-- RLS Policies for rb_benchmark_requirements
CREATE POLICY "Users can view rb_benchmark_requirements for their projects" ON public.rb_benchmark_requirements
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.rb_projects WHERE id = project_id AND user_id = auth.uid()));
CREATE POLICY "Users can create rb_benchmark_requirements for their projects" ON public.rb_benchmark_requirements
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.rb_projects WHERE id = project_id AND user_id = auth.uid()));
CREATE POLICY "Users can update rb_benchmark_requirements for their projects" ON public.rb_benchmark_requirements
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.rb_projects WHERE id = project_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete rb_benchmark_requirements for their projects" ON public.rb_benchmark_requirements
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.rb_projects WHERE id = project_id AND user_id = auth.uid()));

-- Indexes for performance
CREATE INDEX idx_rb_projects_user_id ON public.rb_projects(user_id);
CREATE INDEX idx_rb_projects_status ON public.rb_projects(status);
CREATE INDEX idx_rb_documents_project_id ON public.rb_documents(project_id);
CREATE INDEX idx_rb_evidence_project_id ON public.rb_evidence(project_id);
CREATE INDEX idx_rb_evidence_is_active ON public.rb_evidence(is_active);
CREATE INDEX idx_rb_versions_project_id ON public.rb_versions(project_id);
CREATE INDEX idx_rb_versions_section ON public.rb_versions(project_id, section_name);
CREATE INDEX idx_rb_keyword_decisions_project_id ON public.rb_keyword_decisions(project_id);
CREATE INDEX idx_rb_jd_requirements_project_id ON public.rb_jd_requirements(project_id);
CREATE INDEX idx_rb_benchmark_requirements_project_id ON public.rb_benchmark_requirements(project_id);

-- Trigger function to update updated_at
CREATE OR REPLACE FUNCTION public.update_rb_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_rb_projects_updated_at
  BEFORE UPDATE ON public.rb_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_rb_updated_at();

CREATE TRIGGER update_rb_documents_updated_at
  BEFORE UPDATE ON public.rb_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_rb_updated_at();