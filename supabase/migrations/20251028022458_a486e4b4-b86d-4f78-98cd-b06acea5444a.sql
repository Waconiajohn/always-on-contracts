-- Fix get_items_needing_review function - vault_confirmed_skills doesn't have vault_id column
DROP FUNCTION IF EXISTS public.get_items_needing_review(uuid);

CREATE OR REPLACE FUNCTION public.get_items_needing_review(p_user_id uuid)
RETURNS TABLE(
  id uuid,
  content text,
  type text,
  vault_id uuid,
  quality_tier text,
  evidence text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  RETURN QUERY
  -- Power phrases with assumed quality
  SELECT 
    vpp.id,
    vpp.power_phrase as content,
    'power_phrase'::TEXT as type,
    vpp.vault_id,
    vpp.quality_tier,
    vpp.impact_metrics as evidence,
    vpp.created_at
  FROM public.vault_power_phrases vpp
  WHERE vpp.vault_id IN (
    SELECT cv.id FROM public.career_vault cv WHERE cv.user_id = p_user_id
  )
  AND vpp.quality_tier = 'assumed'
  
  UNION ALL
  
  -- Confirmed skills with assumed quality (using user_id directly)
  SELECT 
    vcs.id,
    vcs.skill_name as content,
    'skill'::TEXT as type,
    NULL::uuid as vault_id,  -- vault_confirmed_skills doesn't have vault_id
    vcs.quality_tier,
    NULL as evidence,
    vcs.created_at
  FROM public.vault_confirmed_skills vcs
  WHERE vcs.user_id = p_user_id
  AND vcs.quality_tier = 'assumed'
  
  UNION ALL
  
  -- Hidden competencies with assumed quality
  SELECT 
    vhc.id,
    vhc.inferred_capability as content,
    'competency'::TEXT as type,
    vhc.vault_id,
    vhc.quality_tier,
    vhc.evidence_from_resume as evidence,
    vhc.created_at
  FROM public.vault_hidden_competencies vhc
  WHERE vhc.vault_id IN (
    SELECT cv.id FROM public.career_vault cv WHERE cv.user_id = p_user_id
  )
  AND vhc.quality_tier = 'assumed'
  
  ORDER BY created_at DESC
  LIMIT 100;
END;
$function$;