// =====================================================
// VALIDATE EXTRACTION COMPLETENESS
// =====================================================
// Uses AI to compare original resume against extracted data
// to ensure nothing was missed during extraction.
// Returns completeness score and identifies missing items.
// =====================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { extractJSON } from '../_shared/json-parser.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidationRequest {
  resumeText: string;
  vaultId: string;
}

interface ExtractedData {
  workPositions: any[];
  education: any[];
  milestones: any[];
  skills: any[];
  powerPhrases: any[];
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { resumeText, vaultId }: ValidationRequest = await req.json();

    if (!resumeText || !vaultId) {
      return new Response(
        JSON.stringify({ error: 'resumeText and vaultId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔍 Starting extraction validation...');

    // Fetch extracted data from vault
    const { data: vaultData } = await supabase
      .from('career_vault')
      .select('user_id')
      .eq('id', vaultId)
      .single();

    if (!vaultData) {
      return new Response(
        JSON.stringify({ error: 'Vault not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = vaultData.user_id;

    const [workPositions, education, milestones, skills, powerPhrases] = await Promise.all([
      supabase.from('vault_work_positions').select('*').eq('vault_id', vaultId),
      supabase.from('vault_education').select('*').eq('vault_id', vaultId),
      supabase.from('vault_resume_milestones').select(`
        *,
        work_position:vault_work_positions!work_position_id (
          id,
          company_name,
          job_title,
          start_date,
          end_date,
          is_current
        )
      `).eq('vault_id', vaultId),
      supabase.from('vault_transferable_skills').select('*').eq('vault_id', vaultId),
      supabase.from('vault_power_phrases').select('*').eq('vault_id', vaultId),
    ]);

    const extractedData: ExtractedData = {
      workPositions: workPositions.data || [],
      education: education.data || [],
      milestones: milestones.data || [],
      skills: skills.data || [],
      powerPhrases: powerPhrases.data || [],
    };

    // Build AI validation prompt
    const validationPrompt = `You are a meticulous resume data validator. Compare the ORIGINAL RESUME against the EXTRACTED DATA to identify ANY missing information.

**ORIGINAL RESUME:**
${resumeText}

**EXTRACTED DATA:**

Work Positions: ${extractedData.workPositions.length} positions extracted
${extractedData.workPositions.map((wp, i) => `  ${i + 1}. ${wp.job_title} at ${wp.company_name} (${wp.start_date || '?'} - ${wp.end_date || 'Current'})`).join('\n')}

Education: ${extractedData.education.length} degrees extracted
${extractedData.education.map((ed, i) => `  ${i + 1}. ${ed.degree_type} in ${ed.field_of_study} from ${ed.institution_name} (${ed.graduation_year || '?'})`).join('\n')}

Achievements/Milestones: ${extractedData.milestones.length} milestones extracted
${extractedData.milestones.slice(0, 5).map((m, i) => `  ${i + 1}. ${m.milestone_title}`).join('\n')}${extractedData.milestones.length > 5 ? `\n  ... and ${extractedData.milestones.length - 5} more` : ''}

Skills: ${extractedData.skills.length} skills extracted
Power Phrases: ${extractedData.powerPhrases.length} phrases extracted

**VALIDATION TASK:**
Compare the resume against extracted data. Be EXTREMELY STRICT:
- If resume mentions "managed $350M budget" but extraction doesn't capture the $350M amount, FLAG IT
- If resume lists a job but extraction missed it, FLAG IT
- If resume shows 5 jobs but only 3 were extracted, FLAG IT
- If resume has education but extraction has 0 education records, FLAG IT
- If resume has quantified achievements but extraction captured them generically, FLAG IT

Return JSON with:
{
  "completeness_score": 0-100,
  "missing_work_positions": ["company/role not extracted or partially captured"],
  "missing_education": ["degree/cert not extracted"],
  "missing_achievements": ["specific achievement with numbers not captured"],
  "missing_skills": ["technical skill not extracted"],
  "partially_captured": ["items extracted but missing key details like dollar amounts, team sizes, percentages"],
  "extraction_quality": "excellent|good|fair|poor",
  "critical_gaps": ["most important missing items that impact resume strength"],
  "recommendations": ["specific improvements for extraction"]
}`;

    console.log('🤖 Calling AI validator...');

    const { response } = await callLovableAI({
      model: LOVABLE_AI_MODELS.DEFAULT,
      messages: [
        { role: 'system', content: 'You are a meticulous resume data validator. Be STRICT and thorough.' },
        { role: 'user', content: validationPrompt }
      ],
      temperature: 0.1,
      response_mime_type: 'application/json'
    }, 'validate-extraction', 'system');

    const parseResult = extractJSON(response.choices[0].message.content);

    if (!parseResult.success || !parseResult.data) {
      console.error('Failed to parse validation response:', parseResult.error);
      throw new Error(`JSON parsing failed: ${parseResult.error}`);
    }

    const validation = parseResult.data;
    console.log('✅ Validation complete');
    console.log(`   Completeness score: ${validation.completeness_score}%`);
    console.log(`   Quality: ${validation.extraction_quality}`);

    // Store validation results
    await supabase.from('vault_activity_log').insert({
      vault_id: vaultId,
      user_id: userId,
      activity_type: 'extraction_validation',
      description: `Extraction validation completed: ${validation.completeness_score}% complete`,
      metadata: {
        completeness_score: validation.completeness_score,
        missing_items: {
          work_positions: validation.missing_work_positions,
          education: validation.missing_education,
          achievements: validation.missing_achievements,
          skills: validation.missing_skills,
        },
        partially_captured: validation.partially_captured,
        critical_gaps: validation.critical_gaps,
        quality: validation.extraction_quality,
        extracted_counts: {
          work_positions: extractedData.workPositions.length,
          education: extractedData.education.length,
          milestones: extractedData.milestones.length,
          skills: extractedData.skills.length,
        }
      }
    });

    // Update career_vault with extraction quality metrics
    await supabase
      .from('career_vault')
      .update({
        extraction_completeness_score: validation.completeness_score,
        extraction_quality: validation.extraction_quality,
      })
      .eq('id', vaultId);

    return new Response(
      JSON.stringify({
        success: true,
        data: validation,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Validation error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown validation error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
