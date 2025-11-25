-- Step 1: Update foreign key references to point to the keeper record
WITH duplicates AS (
  SELECT 
    id,
    vault_id,
    company_name,
    start_date,
    end_date,
    ROW_NUMBER() OVER (
      PARTITION BY vault_id, company_name, start_date, end_date
      ORDER BY created_at DESC
    ) as rn
  FROM vault_work_positions
),
keeper_map AS (
  SELECT 
    d1.id as duplicate_id,
    d2.id as keeper_id
  FROM duplicates d1
  JOIN duplicates d2 ON 
    d1.vault_id = d2.vault_id AND
    d1.company_name = d2.company_name AND
    (d1.start_date = d2.start_date OR (d1.start_date IS NULL AND d2.start_date IS NULL)) AND
    (d1.end_date = d2.end_date OR (d1.end_date IS NULL AND d2.end_date IS NULL)) AND
    d2.rn = 1
  WHERE d1.rn > 1
)
UPDATE vault_resume_milestones
SET work_position_id = keeper_map.keeper_id
FROM keeper_map
WHERE vault_resume_milestones.work_position_id = keeper_map.duplicate_id;

-- Step 2: Delete duplicate work positions (keep only rn = 1)
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY vault_id, company_name, start_date, end_date
      ORDER BY created_at DESC
    ) as rn
  FROM vault_work_positions
)
DELETE FROM vault_work_positions
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);