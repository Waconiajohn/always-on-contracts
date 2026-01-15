import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json();
    const { verificationId, userId } = body;
    // Support both resumeId and vaultId for backward compatibility
    const vaultId = body.resumeId || body.vaultId;

    if (!verificationId || !vaultId || !userId) {
      throw new Error('verificationId, resumeId, and userId are required');
    }

    console.log(`[REMEDIATE-RESUME-DATA] Starting remediation for verification: ${verificationId}`);

    // Fetch verification results
    const { data: verification, error: verifyError } = await supabase
      .from('resume_verification_results')
      .select('*')
      .eq('id', verificationId)
      .single();

    if (verifyError || !verification) {
      throw new Error('Verification results not found');
    }

    // Update status to in_progress
    await supabase
      .from('resume_verification_results')
      .update({
        remediation_status: 'in_progress',
        auto_remediation_attempted: true
      })
      .eq('id', verificationId);

    const results = verification.results as any[];
    const missingCategories: string[] = [];
    let remediationNotes = '';

    // Identify what needs to be re-extracted
    for (const result of results) {
      if (result.status === 'fail' && result.missingData) {
        missingCategories.push(...result.missingData);
        remediationNotes += `- ${result.category}: ${result.message}\n`;
      }
    }

    console.log(`[REMEDIATE-RESUME-DATA] Missing categories:`, missingCategories);

    if (missingCategories.length === 0) {
      // No critical failures, just warnings
      await supabase
        .from('resume_verification_results')
        .update({
          remediation_status: 'completed',
          remediation_notes: 'No critical failures detected. Minor warnings noted but no re-extraction needed.'
        })
        .eq('id', verificationId);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'No remediation needed - only warnings present',
          reExtractedCategories: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Trigger re-extraction for missing data
    // This would call the extraction function again with specific focus areas
    // For now, we'll flag it for manual review and provide recommendations
    
    const recommendations = [];
    if (missingCategories.includes('work_positions')) {
      recommendations.push('Re-run work experience extraction with enhanced parsing');
    }
    if (missingCategories.includes('education')) {
      recommendations.push('Re-run education extraction with alternative keywords');
    }
    if (missingCategories.includes('milestones')) {
      recommendations.push('Extract achievements and accomplishments from work descriptions');
    }

    remediationNotes += '\nRecommended Actions:\n' + recommendations.map(r => `- ${r}`).join('\n');

    // Update verification with remediation notes
    await supabase
      .from('resume_verification_results')
      .update({
        remediation_status: 'pending',
        remediation_notes: remediationNotes + '\n\nAutomatic re-extraction requires user approval.'
      })
      .eq('id', verificationId);

    // Log activity
    await supabase.from('user_activity').insert({
      user_id: userId,
      activity_type: 'resume_remediation',
      description: `Remediation identified ${missingCategories.length} categories needing re-extraction`,
      metadata: {
        verification_id: verificationId,
        vault_id: vaultId,
        missing_categories: missingCategories,
        recommendations
      }
    });

    console.log(`[REMEDIATE-RESUME-DATA] Remediation assessment complete`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Remediation plan created',
        missingCategories,
        recommendations,
        requiresUserApproval: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const err = error as Error;
    console.error('[REMEDIATE-RESUME-DATA] Error:', err);
    
    // Try to update status to failed if we have the verificationId
    const body = await req.clone().json().catch(() => ({}));
    if (body.verificationId) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );
      
      await supabase
        .from('resume_verification_results')
        .update({
          remediation_status: 'failed',
          remediation_notes: `Error during remediation: ${err.message || 'Unknown error'}`
        })
        .eq('id', body.verificationId);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
