// =====================================================
// REPAIR VAULT
// =====================================================
// One-time repair function to fix extraction data for users
// who had incomplete extractions (missing work positions, 
// education, or milestones). Re-extracts ONLY structural data.
// =====================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { extractStructuredResumeData } from '../_shared/extraction/ai-structured-extractor.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user ID from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    console.log(`🔧 Starting vault repair for user: ${userId}`);

    // Get user's vault and resume text
    const { data: vault, error: vaultError } = await supabase
      .from('career_vault')
      .select('id, resume_raw_text')
      .eq('user_id', userId)
      .single();

    if (vaultError || !vault || !vault.resume_raw_text) {
      return new Response(
        JSON.stringify({ 
          error: 'No resume text found in vault. Please upload your resume first.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const vaultId = vault.id;
    const resumeText = vault.resume_raw_text;

    console.log('📄 Re-extracting structured data from resume...');

    // Re-extract structured data (work, education, achievements)
    const structuredData = await extractStructuredResumeData(resumeText, userId);

    console.log(`✅ Extracted: ${structuredData.experience.roles.length} positions, ${structuredData.education.degrees.length} education, ${structuredData.achievements.quantified.length + structuredData.achievements.strategic.length} achievements`);

    // Check what's already in the vault
    const [existingWork, existingEdu, existingMilestones] = await Promise.all([
      supabase.from('vault_work_positions').select('id').eq('vault_id', vaultId),
      supabase.from('vault_education').select('id').eq('vault_id', vaultId),
      supabase.from('vault_resume_milestones').select('id').eq('vault_id', vaultId),
    ]);

    let repairedItems = 0;

    // Store work positions if missing
    if (structuredData.experience.roles.length > 0 && (!existingWork.data || existingWork.data.length === 0)) {
      console.log('💼 Storing work positions...');
      const workPositions = structuredData.experience.roles.map(role => ({
        vault_id: vaultId,
        user_id: userId,
        company_name: role.company,
        job_title: role.title,
        start_date: role.startYear ? `${role.startYear}-01-01` : null,
        end_date: role.isCurrent ? null : (role.endYear ? `${role.endYear}-12-31` : null),
        is_current: role.isCurrent,
        description: role.description,
        confidence_score: role.confidence / 100,
        quality_tier: role.confidence > 85 ? 'silver' : 'bronze',
        extraction_source: 'ai-structured-repair'
      }));
      
      const { error: wpError } = await supabase
        .from('vault_work_positions')
        .insert(workPositions);
      
      if (!wpError) {
        repairedItems += workPositions.length;
        console.log(`✅ Added ${workPositions.length} work positions`);
      }
    }

    // Store education if missing
    if (structuredData.education.degrees.length > 0 && (!existingEdu.data || existingEdu.data.length === 0)) {
      console.log('🎓 Storing education records...');
      const educationRecords = structuredData.education.degrees.map(deg => ({
        vault_id: vaultId,
        user_id: userId,
        institution_name: deg.institution,
        degree_type: deg.level,
        field_of_study: deg.field,
        graduation_year: deg.graduationYear,
        confidence_score: deg.confidence / 100,
        quality_tier: deg.confidence > 85 ? 'silver' : 'bronze',
        extraction_source: 'ai-structured-repair'
      }));
      
      const { error: eduError } = await supabase
        .from('vault_education')
        .insert(educationRecords);
      
      if (!eduError) {
        repairedItems += educationRecords.length;
        console.log(`✅ Added ${educationRecords.length} education records`);
      }
    }

    // Store milestones if missing
    const totalAchievements = structuredData.achievements.quantified.length + structuredData.achievements.strategic.length;
    if (totalAchievements > 0 && (!existingMilestones.data || existingMilestones.data.length === 0)) {
      console.log('🏆 Storing milestones...');
      const milestones: any[] = [];
      
      structuredData.achievements.quantified.forEach(ach => {
        milestones.push({
          vault_id: vaultId,
          user_id: userId,
          milestone_title: ach.achievement,
          description: ach.achievement,
          metric_type: ach.metric,
          metric_value: ach.impact,
          context: ach.context,
          confidence_score: ach.confidence / 100,
          quality_tier: ach.confidence > 85 ? 'gold' : 'silver',
          extraction_source: 'ai-structured-repair'
        });
      });
      
      structuredData.achievements.strategic.forEach(ach => {
        milestones.push({
          vault_id: vaultId,
          user_id: userId,
          milestone_title: ach.achievement,
          description: `${ach.achievement}\n\nScope: ${ach.scope}\nImpact: ${ach.impact}`,
          confidence_score: ach.confidence / 100,
          quality_tier: ach.confidence > 80 ? 'silver' : 'bronze',
          extraction_source: 'ai-structured-repair'
        });
      });
      
      const { error: mlError } = await supabase
        .from('vault_resume_milestones')
        .insert(milestones);
      
      if (!mlError) {
        repairedItems += milestones.length;
        console.log(`✅ Added ${milestones.length} milestones`);
      }
    }

    // Update career_vault counters
    console.log('📊 Updating vault counters...');
    const { data: stats } = await supabase
      .rpc('get_vault_statistics', { p_vault_id: vaultId });

    if (stats) {
      const statsData = stats as any;
      await supabase
        .from('career_vault')
        .update({
          onboarding_step: 'completed',
          total_power_phrases: statsData.categoryBreakdown?.power_phrases || 0,
          total_transferable_skills: statsData.categoryBreakdown?.transferable_skills || 0,
          total_hidden_competencies: statsData.categoryBreakdown?.hidden_competencies || 0,
          total_soft_skills: statsData.categoryBreakdown?.soft_skills || 0,
          extraction_item_count: statsData.totalItems || 0,
          overall_strength_score: statsData.vaultStrength || 0,
          last_updated_at: new Date().toISOString()
        })
        .eq('id', vaultId);
    }

    console.log(`✅ Vault repair complete! Repaired ${repairedItems} items`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          repairedItems,
          workPositions: structuredData.experience.roles.length,
          education: structuredData.education.degrees.length,
          milestones: totalAchievements,
          message: repairedItems > 0 
            ? `Successfully repaired your vault! Added ${repairedItems} missing items.`
            : 'Your vault is already up to date. No repairs needed.'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Repair error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown repair error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
