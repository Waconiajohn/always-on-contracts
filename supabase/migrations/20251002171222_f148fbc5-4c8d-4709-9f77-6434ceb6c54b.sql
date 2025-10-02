-- Phase 1: War Chest Database Foundation

-- Table 1: Main War Chest (one per user)
CREATE TABLE public.career_war_chest (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_raw_text TEXT,
  initial_analysis JSONB DEFAULT '{}'::jsonb,
  overall_strength_score INTEGER CHECK (overall_strength_score >= 0 AND overall_strength_score <= 100),
  interview_completion_percentage INTEGER DEFAULT 0 CHECK (interview_completion_percentage >= 0 AND interview_completion_percentage <= 100),
  total_power_phrases INTEGER DEFAULT 0,
  total_transferable_skills INTEGER DEFAULT 0,
  total_hidden_competencies INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Table 2: Power Phrases (enhanced bullet points)
CREATE TABLE public.war_chest_power_phrases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  war_chest_id UUID NOT NULL REFERENCES public.career_war_chest(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  original_text TEXT,
  power_phrase TEXT NOT NULL,
  impact_metrics JSONB DEFAULT '{}'::jsonb,
  keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  confidence_score INTEGER DEFAULT 80 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  source TEXT DEFAULT 'resume' CHECK (source IN ('resume', 'interview', 'inferred')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table 3: Transferable Skills (skill translation map)
CREATE TABLE public.war_chest_transferable_skills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  war_chest_id UUID NOT NULL REFERENCES public.career_war_chest(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stated_skill TEXT NOT NULL,
  equivalent_skills TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  evidence TEXT NOT NULL,
  confidence_score INTEGER DEFAULT 75 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table 4: Hidden Competencies (inferred capabilities)
CREATE TABLE public.war_chest_hidden_competencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  war_chest_id UUID NOT NULL REFERENCES public.career_war_chest(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  competency_area TEXT NOT NULL,
  supporting_evidence TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  inferred_capability TEXT NOT NULL,
  confidence_score INTEGER DEFAULT 70 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  certification_equivalent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table 5: Interview Responses (conversational data)
CREATE TABLE public.war_chest_interview_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  war_chest_id UUID NOT NULL REFERENCES public.career_war_chest(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  response TEXT NOT NULL,
  follow_up_questions JSONB DEFAULT '[]'::jsonb,
  extracted_insights JSONB DEFAULT '{}'::jsonb,
  phase TEXT NOT NULL CHECK (phase IN ('resume_understanding', 'skills_translation', 'hidden_gems')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.career_war_chest ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.war_chest_power_phrases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.war_chest_transferable_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.war_chest_hidden_competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.war_chest_interview_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for career_war_chest
CREATE POLICY "Users can view their own war chest"
  ON public.career_war_chest FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own war chest"
  ON public.career_war_chest FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own war chest"
  ON public.career_war_chest FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own war chest"
  ON public.career_war_chest FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for war_chest_power_phrases
CREATE POLICY "Users can view their own power phrases"
  ON public.war_chest_power_phrases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own power phrases"
  ON public.war_chest_power_phrases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own power phrases"
  ON public.war_chest_power_phrases FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own power phrases"
  ON public.war_chest_power_phrases FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for war_chest_transferable_skills
CREATE POLICY "Users can view their own transferable skills"
  ON public.war_chest_transferable_skills FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transferable skills"
  ON public.war_chest_transferable_skills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transferable skills"
  ON public.war_chest_transferable_skills FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transferable skills"
  ON public.war_chest_transferable_skills FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for war_chest_hidden_competencies
CREATE POLICY "Users can view their own hidden competencies"
  ON public.war_chest_hidden_competencies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own hidden competencies"
  ON public.war_chest_hidden_competencies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own hidden competencies"
  ON public.war_chest_hidden_competencies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own hidden competencies"
  ON public.war_chest_hidden_competencies FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for war_chest_interview_responses
CREATE POLICY "Users can view their own interview responses"
  ON public.war_chest_interview_responses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interview responses"
  ON public.war_chest_interview_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interview responses"
  ON public.war_chest_interview_responses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interview responses"
  ON public.war_chest_interview_responses FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update last_updated_at on career_war_chest
CREATE TRIGGER update_career_war_chest_updated_at
  BEFORE UPDATE ON public.career_war_chest
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for performance
CREATE INDEX idx_war_chest_user_id ON public.career_war_chest(user_id);
CREATE INDEX idx_power_phrases_war_chest_id ON public.war_chest_power_phrases(war_chest_id);
CREATE INDEX idx_power_phrases_user_id ON public.war_chest_power_phrases(user_id);
CREATE INDEX idx_transferable_skills_war_chest_id ON public.war_chest_transferable_skills(war_chest_id);
CREATE INDEX idx_transferable_skills_user_id ON public.war_chest_transferable_skills(user_id);
CREATE INDEX idx_hidden_competencies_war_chest_id ON public.war_chest_hidden_competencies(war_chest_id);
CREATE INDEX idx_hidden_competencies_user_id ON public.war_chest_hidden_competencies(user_id);
CREATE INDEX idx_interview_responses_war_chest_id ON public.war_chest_interview_responses(war_chest_id);
CREATE INDEX idx_interview_responses_user_id ON public.war_chest_interview_responses(user_id);