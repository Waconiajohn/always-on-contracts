-- =====================================================
-- EXTRACTION COMPLETENESS & STATUS TRACKING (FIXED)
-- =====================================================

-- Add extraction quality columns to career_vault
ALTER TABLE career_vault 
ADD COLUMN IF NOT EXISTS extraction_completeness_score INTEGER DEFAULT NULL CHECK (extraction_completeness_score >= 0 AND extraction_completeness_score <= 100),
ADD COLUMN IF NOT EXISTS extraction_quality TEXT DEFAULT NULL CHECK (extraction_quality IN ('excellent', 'good', 'fair', 'poor')),
ADD COLUMN IF NOT EXISTS extraction_status TEXT DEFAULT 'pending' CHECK (extraction_status IN ('pending', 'processing', 'completed', 'failed', 'needs_retry'));

-- Vault activity log already exists, just add index if needed
CREATE INDEX IF NOT EXISTS idx_vault_activity_log_vault_id ON vault_activity_log(vault_id);

-- =====================================================
-- VAULT COUNTER TRIGGERS
-- =====================================================

-- Trigger function to update work position count
CREATE OR REPLACE FUNCTION update_vault_work_position_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE career_vault
  SET last_updated_at = NOW()
  WHERE id = COALESCE(NEW.vault_id, OLD.vault_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_update_work_position_count ON vault_work_positions;
CREATE TRIGGER trigger_update_work_position_count
AFTER INSERT OR DELETE ON vault_work_positions
FOR EACH ROW
EXECUTE FUNCTION update_vault_work_position_count();

-- Trigger function to update education count
CREATE OR REPLACE FUNCTION update_vault_education_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE career_vault
  SET last_updated_at = NOW()
  WHERE id = COALESCE(NEW.vault_id, OLD.vault_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_update_education_count ON vault_education;
CREATE TRIGGER trigger_update_education_count
AFTER INSERT OR DELETE ON vault_education
FOR EACH ROW
EXECUTE FUNCTION update_vault_education_count();

-- Trigger function to update milestone count
CREATE OR REPLACE FUNCTION update_vault_milestone_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE career_vault
  SET last_updated_at = NOW()
  WHERE id = COALESCE(NEW.vault_id, OLD.vault_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_update_milestone_count ON vault_resume_milestones;
CREATE TRIGGER trigger_update_milestone_count
AFTER INSERT OR DELETE ON vault_resume_milestones
FOR EACH ROW
EXECUTE FUNCTION update_vault_milestone_count();

COMMENT ON COLUMN career_vault.extraction_completeness_score IS 'AI-validated completeness score (0-100)';
COMMENT ON COLUMN career_vault.extraction_quality IS 'Overall extraction quality: excellent/good/fair/poor';
COMMENT ON COLUMN career_vault.extraction_status IS 'Current extraction status';