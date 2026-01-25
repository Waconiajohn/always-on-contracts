-- Fix 3: Add unique constraint on rb_industry_research for caching
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rb_industry_research_unique_key'
  ) THEN
    ALTER TABLE rb_industry_research 
    ADD CONSTRAINT rb_industry_research_unique_key 
    UNIQUE (role_title, seniority_level, industry);
  END IF;
END
$$;