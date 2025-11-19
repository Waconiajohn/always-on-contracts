-- Add item_subtype to distinguish skills from expertise
ALTER TABLE vault_transferable_skills 
ADD COLUMN item_subtype VARCHAR(20) DEFAULT 'skill';

-- Add check constraint
ALTER TABLE vault_transferable_skills
ADD CONSTRAINT check_item_subtype CHECK (item_subtype IN ('skill', 'expertise'));

-- Set existing items based on length (short = skill, long = expertise)
UPDATE vault_transferable_skills
SET item_subtype = CASE
  WHEN LENGTH(stated_skill) <= 50 THEN 'skill'
  ELSE 'expertise'
END;