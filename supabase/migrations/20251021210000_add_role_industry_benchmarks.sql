-- Migration: Role/Industry Specific Benchmarks
-- Extends benchmarking to support segmentation by role and industry

-- Add role/industry tracking to user_competency_profile
ALTER TABLE user_competency_profile
ADD COLUMN IF NOT EXISTS user_role TEXT,
ADD COLUMN IF NOT EXISTS user_industry TEXT;

-- Create index for fast role/industry lookups
CREATE INDEX IF NOT EXISTS idx_competency_profile_role_industry
ON user_competency_profile(competency_name, user_role, user_industry)
WHERE has_experience = true AND proficiency_level IS NOT NULL;

-- Update competency_benchmarks to better support multiple segments
CREATE INDEX IF NOT EXISTS idx_competency_benchmarks_segment
ON competency_benchmarks(competency_name, role, industry);

-- Add aggregate stats table for monitoring
CREATE TABLE IF NOT EXISTS competency_benchmark_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_benchmarks INTEGER,
  universal_benchmarks INTEGER,  -- role='all', industry='all'
  role_specific_benchmarks INTEGER,
  industry_specific_benchmarks INTEGER,
  full_segment_benchmarks INTEGER,  -- role+industry specific
  total_users_analyzed INTEGER,
  total_competencies_analyzed INTEGER,
  avg_sample_size DECIMAL,
  calculation_duration_ms INTEGER
);

-- Function to update user_competency_profile with role/industry
CREATE OR REPLACE FUNCTION sync_user_role_industry_to_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- When user_competency_profile is inserted/updated, sync role/industry from profiles
  UPDATE user_competency_profile ucp
  SET
    user_role = p.target_roles[1],  -- Take first role
    user_industry = p.target_industries[1]  -- Take first industry
  FROM profiles p
  WHERE ucp.user_id = p.user_id
    AND ucp.id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-sync role/industry
DROP TRIGGER IF EXISTS sync_role_industry_trigger ON user_competency_profile;
CREATE TRIGGER sync_role_industry_trigger
  AFTER INSERT OR UPDATE ON user_competency_profile
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_role_industry_to_profile();

-- Function to calculate role/industry specific benchmarks
CREATE OR REPLACE FUNCTION calculate_segmented_benchmarks(
  p_min_sample_size INTEGER DEFAULT 10
) RETURNS JSONB AS $$
DECLARE
  v_start_time TIMESTAMP := clock_timestamp();
  v_universal_count INTEGER := 0;
  v_role_count INTEGER := 0;
  v_industry_count INTEGER := 0;
  v_full_segment_count INTEGER := 0;
  v_total_users INTEGER;
  v_duration_ms INTEGER;
  v_result JSONB;
BEGIN
  -- Get total users
  SELECT COUNT(DISTINCT user_id) INTO v_total_users
  FROM user_competency_profile
  WHERE has_experience = true AND proficiency_level IS NOT NULL;

  -- Delete old benchmarks (we'll recalculate all)
  DELETE FROM competency_benchmarks;

  -- 1. UNIVERSAL BENCHMARKS (role='all', industry='all')
  INSERT INTO competency_benchmarks (
    competency_name, category, role, industry,
    percentile_25, percentile_50, percentile_75, percentile_90,
    sample_size, total_users, last_updated
  )
  SELECT
    competency_name,
    category,
    'all' as role,
    'all' as industry,
    PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY proficiency_level) as p25,
    PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY proficiency_level) as p50,
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY proficiency_level) as p75,
    PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY proficiency_level) as p90,
    COUNT(*)::INTEGER as sample_size,
    COUNT(DISTINCT user_id)::INTEGER as total_users,
    NOW() as last_updated
  FROM user_competency_profile
  WHERE has_experience = true
    AND proficiency_level IS NOT NULL
  GROUP BY competency_name, category
  HAVING COUNT(*) >= p_min_sample_size;

  GET DIAGNOSTICS v_universal_count = ROW_COUNT;

  -- 2. ROLE-SPECIFIC BENCHMARKS (specific role, industry='all')
  INSERT INTO competency_benchmarks (
    competency_name, category, role, industry,
    percentile_25, percentile_50, percentile_75, percentile_90,
    sample_size, total_users, last_updated
  )
  SELECT
    competency_name,
    category,
    user_role as role,
    'all' as industry,
    PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY proficiency_level) as p25,
    PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY proficiency_level) as p50,
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY proficiency_level) as p75,
    PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY proficiency_level) as p90,
    COUNT(*)::INTEGER as sample_size,
    COUNT(DISTINCT user_id)::INTEGER as total_users,
    NOW() as last_updated
  FROM user_competency_profile
  WHERE has_experience = true
    AND proficiency_level IS NOT NULL
    AND user_role IS NOT NULL
    AND user_role != 'all'
  GROUP BY competency_name, category, user_role
  HAVING COUNT(*) >= p_min_sample_size;

  GET DIAGNOSTICS v_role_count = ROW_COUNT;

  -- 3. INDUSTRY-SPECIFIC BENCHMARKS (role='all', specific industry)
  INSERT INTO competency_benchmarks (
    competency_name, category, role, industry,
    percentile_25, percentile_50, percentile_75, percentile_90,
    sample_size, total_users, last_updated
  )
  SELECT
    competency_name,
    category,
    'all' as role,
    user_industry as industry,
    PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY proficiency_level) as p25,
    PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY proficiency_level) as p50,
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY proficiency_level) as p75,
    PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY proficiency_level) as p90,
    COUNT(*)::INTEGER as sample_size,
    COUNT(DISTINCT user_id)::INTEGER as total_users,
    NOW() as last_updated
  FROM user_competency_profile
  WHERE has_experience = true
    AND proficiency_level IS NOT NULL
    AND user_industry IS NOT NULL
    AND user_industry != 'all'
  GROUP BY competency_name, category, user_industry
  HAVING COUNT(*) >= p_min_sample_size;

  GET DIAGNOSTICS v_industry_count = ROW_COUNT;

  -- 4. FULL SEGMENT BENCHMARKS (specific role + specific industry)
  INSERT INTO competency_benchmarks (
    competency_name, category, role, industry,
    percentile_25, percentile_50, percentile_75, percentile_90,
    sample_size, total_users, last_updated
  )
  SELECT
    competency_name,
    category,
    user_role as role,
    user_industry as industry,
    PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY proficiency_level) as p25,
    PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY proficiency_level) as p50,
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY proficiency_level) as p75,
    PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY proficiency_level) as p90,
    COUNT(*)::INTEGER as sample_size,
    COUNT(DISTINCT user_id)::INTEGER as total_users,
    NOW() as last_updated
  FROM user_competency_profile
  WHERE has_experience = true
    AND proficiency_level IS NOT NULL
    AND user_role IS NOT NULL
    AND user_role != 'all'
    AND user_industry IS NOT NULL
    AND user_industry != 'all'
  GROUP BY competency_name, category, user_role, user_industry
  HAVING COUNT(*) >= p_min_sample_size;

  GET DIAGNOSTICS v_full_segment_count = ROW_COUNT;

  -- Calculate duration
  v_duration_ms := EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time))::INTEGER;

  -- Insert stats record
  INSERT INTO competency_benchmark_stats (
    total_benchmarks,
    universal_benchmarks,
    role_specific_benchmarks,
    industry_specific_benchmarks,
    full_segment_benchmarks,
    total_users_analyzed,
    total_competencies_analyzed,
    avg_sample_size,
    calculation_duration_ms
  )
  SELECT
    v_universal_count + v_role_count + v_industry_count + v_full_segment_count,
    v_universal_count,
    v_role_count,
    v_industry_count,
    v_full_segment_count,
    v_total_users,
    COUNT(DISTINCT competency_name),
    AVG(sample_size),
    v_duration_ms
  FROM competency_benchmarks;

  v_result := jsonb_build_object(
    'success', true,
    'totalBenchmarks', v_universal_count + v_role_count + v_industry_count + v_full_segment_count,
    'breakdown', jsonb_build_object(
      'universal', v_universal_count,
      'roleSpecific', v_role_count,
      'industrySpecific', v_industry_count,
      'fullSegment', v_full_segment_count
    ),
    'totalUsers', v_total_users,
    'durationMs', v_duration_ms
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION calculate_segmented_benchmarks IS
'Calculates benchmarks at 4 levels:
1. Universal (all roles, all industries)
2. Role-specific (specific role, all industries)
3. Industry-specific (all roles, specific industry)
4. Full segment (specific role + industry)

Requires minimum sample size (default 10) for statistical validity.';

-- Function to get best available benchmark for a user
CREATE OR REPLACE FUNCTION get_best_benchmark(
  p_competency_name TEXT,
  p_user_role TEXT,
  p_user_industry TEXT
) RETURNS TABLE (
  benchmark_type TEXT,
  percentile_25 DECIMAL,
  percentile_50 DECIMAL,
  percentile_75 DECIMAL,
  percentile_90 DECIMAL,
  sample_size INTEGER
) AS $$
BEGIN
  -- Try full segment first (most specific)
  RETURN QUERY
  SELECT
    'full_segment'::TEXT,
    cb.percentile_25,
    cb.percentile_50,
    cb.percentile_75,
    cb.percentile_90,
    cb.sample_size
  FROM competency_benchmarks cb
  WHERE cb.competency_name = p_competency_name
    AND cb.role = p_user_role
    AND cb.industry = p_user_industry
  LIMIT 1;

  IF FOUND THEN RETURN; END IF;

  -- Try role-specific
  RETURN QUERY
  SELECT
    'role_specific'::TEXT,
    cb.percentile_25,
    cb.percentile_50,
    cb.percentile_75,
    cb.percentile_90,
    cb.sample_size
  FROM competency_benchmarks cb
  WHERE cb.competency_name = p_competency_name
    AND cb.role = p_user_role
    AND cb.industry = 'all'
  LIMIT 1;

  IF FOUND THEN RETURN; END IF;

  -- Try industry-specific
  RETURN QUERY
  SELECT
    'industry_specific'::TEXT,
    cb.percentile_25,
    cb.percentile_50,
    cb.percentile_75,
    cb.percentile_90,
    cb.sample_size
  FROM competency_benchmarks cb
  WHERE cb.competency_name = p_competency_name
    AND cb.role = 'all'
    AND cb.industry = p_user_industry
  LIMIT 1;

  IF FOUND THEN RETURN; END IF;

  -- Fall back to universal
  RETURN QUERY
  SELECT
    'universal'::TEXT,
    cb.percentile_25,
    cb.percentile_50,
    cb.percentile_75,
    cb.percentile_90,
    cb.sample_size
  FROM competency_benchmarks cb
  WHERE cb.competency_name = p_competency_name
    AND cb.role = 'all'
    AND cb.industry = 'all'
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_best_benchmark IS
'Returns the most specific benchmark available for a competency.
Priority: Full Segment > Role-Specific > Industry-Specific > Universal.
This ensures users always get the most relevant comparison.';
