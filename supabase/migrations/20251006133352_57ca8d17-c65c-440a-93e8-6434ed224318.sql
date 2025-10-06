-- Create skill taxonomy table for AI-generated skills
CREATE TABLE war_chest_skill_taxonomy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  skill_name text NOT NULL,
  skill_category text,
  source text NOT NULL CHECK (source IN ('resume', 'inferred', 'growth', 'job_market')),
  confidence_score integer CHECK (confidence_score >= 0 AND confidence_score <= 100),
  sub_attributes jsonb DEFAULT '[]'::jsonb,
  market_frequency integer,
  created_at timestamptz DEFAULT now()
);

-- Create confirmed skills table for user-validated skills
CREATE TABLE war_chest_confirmed_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  skill_name text NOT NULL,
  source text NOT NULL CHECK (source IN ('resume', 'inferred', 'growth', 'custom')),
  proficiency text CHECK (proficiency IN ('none', 'working', 'strong_working', 'proficient', 'expert')),
  sub_attributes jsonb DEFAULT '[]'::jsonb,
  want_to_develop boolean DEFAULT false,
  custom_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Update profiles table with target roles and industries
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS target_roles text[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS target_industries text[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS completeness_score integer DEFAULT 0;

-- Enable RLS
ALTER TABLE war_chest_skill_taxonomy ENABLE ROW LEVEL SECURITY;
ALTER TABLE war_chest_confirmed_skills ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for skill taxonomy
CREATE POLICY "Users can view own skill taxonomy"
  ON war_chest_skill_taxonomy FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own skill taxonomy"
  ON war_chest_skill_taxonomy FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own skill taxonomy"
  ON war_chest_skill_taxonomy FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own skill taxonomy"
  ON war_chest_skill_taxonomy FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for confirmed skills
CREATE POLICY "Users can view own confirmed skills"
  ON war_chest_confirmed_skills FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own confirmed skills"
  ON war_chest_confirmed_skills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own confirmed skills"
  ON war_chest_confirmed_skills FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own confirmed skills"
  ON war_chest_confirmed_skills FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_war_chest_confirmed_skills_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_war_chest_confirmed_skills_updated_at
  BEFORE UPDATE ON war_chest_confirmed_skills
  FOR EACH ROW
  EXECUTE FUNCTION update_war_chest_confirmed_skills_updated_at();