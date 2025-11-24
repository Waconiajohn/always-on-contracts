-- Career Intelligence Builder: Foundation Tables & Schema Updates
-- Week 1 Database Setup (Additive Only - No Breaking Changes)

-- =====================================================
-- NEW TABLES (Additive)
-- =====================================================

-- Track market research for benchmarking
CREATE TABLE IF NOT EXISTS public.vault_market_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL REFERENCES public.career_vault(id) ON DELETE CASCADE,
  target_role TEXT NOT NULL,
  target_industry TEXT,
  researched_at TIMESTAMPTZ DEFAULT NOW(),
  sample_jobs JSONB, -- Array of 10-15 analyzed job descriptions
  common_requirements JSONB, -- What companies want (skills, experience, etc.)
  skill_frequency JSONB, -- How often each skill appears across jobs
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track gap-filling progress
CREATE TABLE IF NOT EXISTS public.vault_gap_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL REFERENCES public.career_vault(id) ON DELETE CASCADE,
  gap_id TEXT NOT NULL,
  gap_type TEXT CHECK (gap_type IN ('critical', 'important', 'nice_to_have')),
  gap_description TEXT,
  questions_generated JSONB,
  questions_answered INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'skipped')),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Skills can link to multiple positions (many-to-many)
CREATE TABLE IF NOT EXISTS public.vault_skill_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID NOT NULL REFERENCES public.vault_transferable_skills(id) ON DELETE CASCADE,
  position_id UUID NOT NULL REFERENCES public.vault_work_positions(id) ON DELETE CASCADE,
  proficiency_level TEXT CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  years_used INTEGER,
  context_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(skill_id, position_id)
);

-- Track AI coaching history for improvement and evidence integrity
CREATE TABLE IF NOT EXISTS public.vault_ai_coaching_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL REFERENCES public.career_vault(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  item_id UUID,
  item_type TEXT, -- 'power_phrase', 'skill', 'answer', etc.
  position_id UUID REFERENCES public.vault_work_positions(id),
  coaching_type TEXT CHECK (coaching_type IN ('improve', 'quantify', 'expand', 'star')),
  original_text TEXT NOT NULL,
  suggested_text TEXT NOT NULL,
  user_action TEXT CHECK (user_action IN ('accepted', 'rejected', 'modified', 'pending')),
  final_text TEXT,
  fact_drift_detected BOOLEAN DEFAULT false,
  fact_drift_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MODIFY EXISTING TABLES (Additive Columns - SAFE)
-- =====================================================

-- Link power phrases to work positions + adaptation tracking + deduplication
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'vault_power_phrases' 
                 AND column_name = 'work_position_id') THEN
    ALTER TABLE public.vault_power_phrases 
      ADD COLUMN work_position_id UUID REFERENCES public.vault_work_positions(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'vault_power_phrases' 
                 AND column_name = 'adapted_from_id') THEN
    ALTER TABLE public.vault_power_phrases 
      ADD COLUMN adapted_from_id UUID REFERENCES public.vault_power_phrases(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'vault_power_phrases' 
                 AND column_name = 'adaptation_notes') THEN
    ALTER TABLE public.vault_power_phrases 
      ADD COLUMN adaptation_notes TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'vault_power_phrases' 
                 AND column_name = 'adaptation_tier') THEN
    ALTER TABLE public.vault_power_phrases 
      ADD COLUMN adaptation_tier TEXT DEFAULT 'general' CHECK (adaptation_tier IN ('general', 'specialized', 'custom'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'vault_power_phrases' 
                 AND column_name = 'target_keywords') THEN
    ALTER TABLE public.vault_power_phrases 
      ADD COLUMN target_keywords TEXT[];
  END IF;
END $$;

-- Link transferable skills to work positions
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'vault_transferable_skills' 
                 AND column_name = 'work_position_id') THEN
    ALTER TABLE public.vault_transferable_skills 
      ADD COLUMN work_position_id UUID REFERENCES public.vault_work_positions(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Link hidden competencies to work positions
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'vault_hidden_competencies' 
                 AND column_name = 'work_position_id') THEN
    ALTER TABLE public.vault_hidden_competencies 
      ADD COLUMN work_position_id UUID REFERENCES public.vault_work_positions(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Track wizard completion in career_vault
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'career_vault' 
                 AND column_name = 'intelligence_builder_completed') THEN
    ALTER TABLE public.career_vault 
      ADD COLUMN intelligence_builder_completed BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'career_vault' 
                 AND column_name = 'current_phase') THEN
    ALTER TABLE public.career_vault 
      ADD COLUMN current_phase INTEGER DEFAULT 1 CHECK (current_phase >= 1 AND current_phase <= 5);
  END IF;
END $$;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_vault_market_research_vault_id ON public.vault_market_research(vault_id);
CREATE INDEX IF NOT EXISTS idx_vault_gap_progress_vault_id ON public.vault_gap_progress(vault_id);
CREATE INDEX IF NOT EXISTS idx_vault_gap_progress_status ON public.vault_gap_progress(status);
CREATE INDEX IF NOT EXISTS idx_vault_skill_positions_skill_id ON public.vault_skill_positions(skill_id);
CREATE INDEX IF NOT EXISTS idx_vault_skill_positions_position_id ON public.vault_skill_positions(position_id);
CREATE INDEX IF NOT EXISTS idx_vault_ai_coaching_history_vault_id ON public.vault_ai_coaching_history(vault_id);
CREATE INDEX IF NOT EXISTS idx_vault_ai_coaching_history_user_id ON public.vault_ai_coaching_history(user_id);
CREATE INDEX IF NOT EXISTS idx_vault_power_phrases_work_position_id ON public.vault_power_phrases(work_position_id);
CREATE INDEX IF NOT EXISTS idx_vault_power_phrases_adapted_from_id ON public.vault_power_phrases(adapted_from_id);

-- =====================================================
-- TRIGGERS FOR AUTO-UPDATING TIMESTAMPS
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_vault_intelligence_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_vault_market_research_updated_at') THEN
    CREATE TRIGGER update_vault_market_research_updated_at
      BEFORE UPDATE ON public.vault_market_research
      FOR EACH ROW
      EXECUTE FUNCTION public.update_vault_intelligence_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_vault_gap_progress_updated_at') THEN
    CREATE TRIGGER update_vault_gap_progress_updated_at
      BEFORE UPDATE ON public.vault_gap_progress
      FOR EACH ROW
      EXECUTE FUNCTION public.update_vault_intelligence_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_vault_skill_positions_updated_at') THEN
    CREATE TRIGGER update_vault_skill_positions_updated_at
      BEFORE UPDATE ON public.vault_skill_positions
      FOR EACH ROW
      EXECUTE FUNCTION public.update_vault_intelligence_updated_at();
  END IF;
END $$;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.vault_market_research ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_gap_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_skill_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_ai_coaching_history ENABLE ROW LEVEL SECURITY;

-- vault_market_research policies
CREATE POLICY "Users can view their own market research"
  ON public.vault_market_research FOR SELECT
  USING (vault_id IN (SELECT id FROM public.career_vault WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own market research"
  ON public.vault_market_research FOR INSERT
  WITH CHECK (vault_id IN (SELECT id FROM public.career_vault WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own market research"
  ON public.vault_market_research FOR UPDATE
  USING (vault_id IN (SELECT id FROM public.career_vault WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own market research"
  ON public.vault_market_research FOR DELETE
  USING (vault_id IN (SELECT id FROM public.career_vault WHERE user_id = auth.uid()));

-- vault_gap_progress policies
CREATE POLICY "Users can view their own gap progress"
  ON public.vault_gap_progress FOR SELECT
  USING (vault_id IN (SELECT id FROM public.career_vault WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own gap progress"
  ON public.vault_gap_progress FOR INSERT
  WITH CHECK (vault_id IN (SELECT id FROM public.career_vault WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own gap progress"
  ON public.vault_gap_progress FOR UPDATE
  USING (vault_id IN (SELECT id FROM public.career_vault WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own gap progress"
  ON public.vault_gap_progress FOR DELETE
  USING (vault_id IN (SELECT id FROM public.career_vault WHERE user_id = auth.uid()));

-- vault_skill_positions policies
CREATE POLICY "Users can view their skill positions"
  ON public.vault_skill_positions FOR SELECT
  USING (skill_id IN (SELECT id FROM public.vault_transferable_skills WHERE vault_id IN (SELECT id FROM public.career_vault WHERE user_id = auth.uid())));

CREATE POLICY "Users can insert their skill positions"
  ON public.vault_skill_positions FOR INSERT
  WITH CHECK (skill_id IN (SELECT id FROM public.vault_transferable_skills WHERE vault_id IN (SELECT id FROM public.career_vault WHERE user_id = auth.uid())));

CREATE POLICY "Users can update their skill positions"
  ON public.vault_skill_positions FOR UPDATE
  USING (skill_id IN (SELECT id FROM public.vault_transferable_skills WHERE vault_id IN (SELECT id FROM public.career_vault WHERE user_id = auth.uid())));

CREATE POLICY "Users can delete their skill positions"
  ON public.vault_skill_positions FOR DELETE
  USING (skill_id IN (SELECT id FROM public.vault_transferable_skills WHERE vault_id IN (SELECT id FROM public.career_vault WHERE user_id = auth.uid())));

-- vault_ai_coaching_history policies
CREATE POLICY "Users can view their own coaching history"
  ON public.vault_ai_coaching_history FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own coaching history"
  ON public.vault_ai_coaching_history FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own coaching history"
  ON public.vault_ai_coaching_history FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own coaching history"
  ON public.vault_ai_coaching_history FOR DELETE
  USING (user_id = auth.uid());