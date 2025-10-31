-- Fix search_vault_items to remove non-existent effectiveness_score column

DROP FUNCTION IF EXISTS search_vault_items(UUID, TEXT, TEXT, TEXT, INTEGER);

CREATE OR REPLACE FUNCTION search_vault_items(
  p_vault_id UUID,
  p_search_query TEXT,
  p_category TEXT DEFAULT NULL,
  p_quality_tier TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  item_id UUID,
  item_type TEXT,
  content TEXT,
  quality_tier VARCHAR(20),
  confidence_score DECIMAL,
  match_rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM (
    -- Power Phrases
    SELECT
      pp.id as item_id,
      'power_phrases'::TEXT as item_type,
      pp.power_phrase as content,
      pp.quality_tier::VARCHAR(20) as quality_tier,
      COALESCE(pp.confidence_score::DECIMAL, 0)::DECIMAL as confidence_score,
      ts_rank(to_tsvector('english', pp.power_phrase), plainto_tsquery('english', p_search_query)) as match_rank
    FROM vault_power_phrases pp
    WHERE pp.vault_id = p_vault_id
      AND (p_category IS NULL OR p_category = 'power_phrases')
      AND (p_quality_tier IS NULL OR pp.quality_tier = p_quality_tier)
      AND to_tsvector('english', pp.power_phrase) @@ plainto_tsquery('english', p_search_query)

    UNION ALL

    -- Transferable Skills
    SELECT
      ts.id,
      'transferable_skills'::TEXT,
      ts.stated_skill,
      ts.quality_tier::VARCHAR(20),
      COALESCE(ts.confidence_score::DECIMAL, 0)::DECIMAL,
      ts_rank(to_tsvector('english', ts.stated_skill), plainto_tsquery('english', p_search_query))
    FROM vault_transferable_skills ts
    WHERE ts.vault_id = p_vault_id
      AND (p_category IS NULL OR p_category = 'transferable_skills')
      AND (p_quality_tier IS NULL OR ts.quality_tier = p_quality_tier)
      AND to_tsvector('english', ts.stated_skill) @@ plainto_tsquery('english', p_search_query)

    UNION ALL

    -- Hidden Competencies
    SELECT
      hc.id,
      'hidden_competencies'::TEXT,
      hc.competency_area || ': ' || hc.inferred_capability,
      hc.quality_tier::VARCHAR(20),
      COALESCE(hc.confidence_score::DECIMAL, 0)::DECIMAL,
      ts_rank(to_tsvector('english', hc.competency_area || ' ' || hc.inferred_capability), plainto_tsquery('english', p_search_query))
    FROM vault_hidden_competencies hc
    WHERE hc.vault_id = p_vault_id
      AND (p_category IS NULL OR p_category = 'hidden_competencies')
      AND (p_quality_tier IS NULL OR hc.quality_tier = p_quality_tier)
      AND to_tsvector('english', hc.competency_area || ' ' || hc.inferred_capability) @@ plainto_tsquery('english', p_search_query)

    UNION ALL

    -- Soft Skills
    SELECT
      ss.id,
      'soft_skills'::TEXT,
      ss.skill_name,
      ss.quality_tier::VARCHAR(20),
      COALESCE(ss.ai_confidence, 0)::DECIMAL,
      ts_rank(to_tsvector('english', ss.skill_name), plainto_tsquery('english', p_search_query))
    FROM vault_soft_skills ss
    WHERE ss.vault_id = p_vault_id
      AND (p_category IS NULL OR p_category = 'soft_skills')
      AND (p_quality_tier IS NULL OR ss.quality_tier = p_quality_tier)
      AND to_tsvector('english', ss.skill_name) @@ plainto_tsquery('english', p_search_query)

    UNION ALL

    -- Leadership Philosophy
    SELECT
      lp.id,
      'leadership_philosophy'::TEXT,
      lp.philosophy_statement,
      lp.quality_tier::VARCHAR(20),
      COALESCE(lp.ai_confidence, 0)::DECIMAL,
      ts_rank(to_tsvector('english', lp.philosophy_statement), plainto_tsquery('english', p_search_query))
    FROM vault_leadership_philosophy lp
    WHERE lp.vault_id = p_vault_id
      AND (p_category IS NULL OR p_category = 'leadership_philosophy')
      AND (p_quality_tier IS NULL OR lp.quality_tier = p_quality_tier)
      AND to_tsvector('english', lp.philosophy_statement) @@ plainto_tsquery('english', p_search_query)

    UNION ALL

    -- Executive Presence
    SELECT
      ep.id,
      'executive_presence'::TEXT,
      ep.presence_indicator,
      ep.quality_tier::VARCHAR(20),
      COALESCE(ep.ai_confidence, 0)::DECIMAL,
      ts_rank(to_tsvector('english', ep.presence_indicator), plainto_tsquery('english', p_search_query))
    FROM vault_executive_presence ep
    WHERE ep.vault_id = p_vault_id
      AND (p_category IS NULL OR p_category = 'executive_presence')
      AND (p_quality_tier IS NULL OR ep.quality_tier = p_quality_tier)
      AND to_tsvector('english', ep.presence_indicator) @@ plainto_tsquery('english', p_search_query)

    UNION ALL

    -- Personality Traits
    SELECT
      pt.id,
      'personality_traits'::TEXT,
      pt.trait_name,
      pt.quality_tier::VARCHAR(20),
      COALESCE(pt.ai_confidence, 0)::DECIMAL,
      ts_rank(to_tsvector('english', pt.trait_name), plainto_tsquery('english', p_search_query))
    FROM vault_personality_traits pt
    WHERE pt.vault_id = p_vault_id
      AND (p_category IS NULL OR p_category = 'personality_traits')
      AND (p_quality_tier IS NULL OR pt.quality_tier = p_quality_tier)
      AND to_tsvector('english', pt.trait_name) @@ plainto_tsquery('english', p_search_query)

    UNION ALL

    -- Work Style
    SELECT
      ws.id,
      'work_style'::TEXT,
      ws.preference_area || ': ' || ws.preference_description,
      ws.quality_tier::VARCHAR(20),
      COALESCE(ws.ai_confidence, 0)::DECIMAL,
      ts_rank(to_tsvector('english', ws.preference_area || ' ' || ws.preference_description), plainto_tsquery('english', p_search_query))
    FROM vault_work_style ws
    WHERE ws.vault_id = p_vault_id
      AND (p_category IS NULL OR p_category = 'work_style')
      AND (p_quality_tier IS NULL OR ws.quality_tier = p_quality_tier)
      AND to_tsvector('english', ws.preference_area || ' ' || ws.preference_description) @@ plainto_tsquery('english', p_search_query)

    UNION ALL

    -- Values & Motivations
    SELECT
      vm.id,
      'values_motivations'::TEXT,
      vm.value_name,
      vm.quality_tier::VARCHAR(20),
      COALESCE(vm.ai_confidence, 0)::DECIMAL,
      ts_rank(to_tsvector('english', vm.value_name), plainto_tsquery('english', p_search_query))
    FROM vault_values_motivations vm
    WHERE vm.vault_id = p_vault_id
      AND (p_category IS NULL OR p_category = 'values_motivations')
      AND (p_quality_tier IS NULL OR vm.quality_tier = p_quality_tier)
      AND to_tsvector('english', vm.value_name) @@ plainto_tsquery('english', p_search_query)

    UNION ALL

    -- Behavioral Indicators
    SELECT
      bi.id,
      'behavioral_indicators'::TEXT,
      bi.indicator_type || ': ' || bi.specific_behavior,
      bi.quality_tier::VARCHAR(20),
      COALESCE(bi.ai_confidence, 0)::DECIMAL,
      ts_rank(to_tsvector('english', bi.indicator_type || ' ' || bi.specific_behavior), plainto_tsquery('english', p_search_query))
    FROM vault_behavioral_indicators bi
    WHERE bi.vault_id = p_vault_id
      AND (p_category IS NULL OR p_category = 'behavioral_indicators')
      AND (p_quality_tier IS NULL OR bi.quality_tier = p_quality_tier)
      AND to_tsvector('english', bi.indicator_type || ' ' || bi.specific_behavior) @@ plainto_tsquery('english', p_search_query)
  ) combined_results
  ORDER BY combined_results.match_rank DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION search_vault_items IS 'Full-text search across all 10 Career Vault intelligence categories with relevance ranking';