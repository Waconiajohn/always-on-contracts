-- Create vault_career_context cache table
CREATE TABLE vault_career_context (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id uuid REFERENCES career_vault(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Core career data
  inferred_seniority text NOT NULL,
  seniority_confidence integer NOT NULL,
  years_of_experience integer NOT NULL,
  
  -- Management experience
  has_management_experience boolean NOT NULL,
  management_details text,
  team_sizes_managed integer[],
  
  -- Executive/Budget
  has_executive_exposure boolean NOT NULL,
  executive_details text,
  has_budget_ownership boolean NOT NULL,
  budget_details text,
  budget_sizes_managed bigint[],
  
  -- Work characteristics
  company_sizes text[],
  technical_depth integer,
  leadership_depth integer,
  strategic_depth integer,
  primary_responsibilities text[],
  impact_scale text,
  
  -- Career trajectory
  next_likely_role text,
  career_archetype text,
  ai_reasoning text,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(vault_id)
);

-- RLS policies
ALTER TABLE vault_career_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own career context"
  ON vault_career_context FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own career context"
  ON vault_career_context FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own career context"
  ON vault_career_context FOR UPDATE
  USING (auth.uid() = user_id);

-- Invalidation trigger: regenerate context when vault items change significantly
CREATE OR REPLACE FUNCTION invalidate_career_context()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark context as stale when high-confidence vault items are added/updated
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.confidence_score > 0.8 THEN
    UPDATE vault_career_context
    SET updated_at = now() - interval '1 year' -- Force stale
    WHERE vault_id = NEW.vault_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vault_power_phrases_changed
AFTER INSERT OR UPDATE ON vault_power_phrases
FOR EACH ROW
EXECUTE FUNCTION invalidate_career_context();

CREATE TRIGGER vault_transferable_skills_changed
AFTER INSERT OR UPDATE ON vault_transferable_skills
FOR EACH ROW
EXECUTE FUNCTION invalidate_career_context();