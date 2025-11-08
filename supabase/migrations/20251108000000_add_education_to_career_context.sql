-- Add missing education fields to vault_career_context table
-- These fields are required by generate-gap-filling-questions function

ALTER TABLE vault_career_context
ADD COLUMN IF NOT EXISTS education_level text,
ADD COLUMN IF NOT EXISTS education_field text,
ADD COLUMN IF NOT EXISTS certifications text[];

-- Comment the columns
COMMENT ON COLUMN vault_career_context.education_level IS 'Highest degree level (Bachelors, Masters, PhD, etc.)';
COMMENT ON COLUMN vault_career_context.education_field IS 'Field of study/major (Petroleum Engineering, Mechanical Engineering, etc.)';
COMMENT ON COLUMN vault_career_context.certifications IS 'Professional certifications and licenses';
