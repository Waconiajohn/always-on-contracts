// =====================================================
// TIER 1: CREATIVE QUALITY ENHANCEMENT
// =====================================================
// Runs automatically after extraction to enhance vault
// Model: sonar (cheap, fast) - $0.002 per enhancement
// Purpose: Use AI creativity to discover & fix issues
// =====================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';

interface QualityCheckRequest {
  vaultId: string;
  resumeText: string;
}

interface Enhancement {
  table: string;
  action: 'add' | 'update' | 'delete';
  confidence: number; // 0-100
  reasoning: string;
  data: any;
}

interface EnhancementResult {
  enhancementsApplied: number;
  enhancementsSkipped: number;
  vaultStrengthBefore: number;
  vaultStrengthAfter: number;
  summary: string;
  enhancements: Enhancement[];
}

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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { vaultId, resumeText }: QualityCheckRequest = await req.json();

    console.log('✨ CREATIVE ENHANCEMENT: Starting AI-powered vault enhancement for vault:', vaultId);

    // Fetch ALL vault data for comprehensive enhancement
    const [
      vault,
      powerPhrases,
      skills,
      competencies,
      softSkills,
      leadership,
      education,
      executivePresence,
      personalityTraits,
      workStyle,
      valuesMot,
      behavioral,
      technical,
    ] = await Promise.all([
      supabase.from('career_vault').select('*').eq('id', vaultId).single(),
      supabase.from('vault_power_phrases').select('*').eq('vault_id', vaultId),
      supabase.from('vault_transferable_skills').select('*').eq('vault_id', vaultId),
      supabase.from('vault_hidden_competencies').select('*').eq('vault_id', vaultId),
      supabase.from('vault_soft_skills').select('*').eq('vault_id', vaultId),
      supabase.from('vault_leadership_philosophy').select('*').eq('vault_id', vaultId),
      supabase.from('vault_education').select('*').eq('vault_id', vaultId),
      supabase.from('vault_executive_presence').select('*').eq('vault_id', vaultId),
      supabase.from('vault_personality_traits').select('*').eq('vault_id', vaultId),
      supabase.from('vault_work_style').select('*').eq('vault_id', vaultId),
      supabase.from('vault_values_motivations').select('*').eq('vault_id', vaultId),
      supabase.from('vault_behavioral_indicators').select('*').eq('vault_id', vaultId),
      supabase.from('vault_technical_skills').select('*').eq('vault_id', vaultId),
    ]);

    const vaultStrengthBefore = vault.data?.vault_strength_before_qa || 0;

    // Build creative AI enhancement prompt
    const prompt = `You are a creative AI career intelligence enhancer. You've just extracted career vault data from a resume. Now use your reasoning and creativity to discover what's missing or could be better.

**RESUME TEXT:**
${resumeText}

**EXTRACTED VAULT DATA:**
- Power Phrases: ${powerPhrases.data?.length || 0} items
  ${powerPhrases.data?.slice(0, 8).map((p: any) => `  • "${p.power_phrase}"`).join('\n') || 'None'}

- Transferable Skills: ${skills.data?.length || 0} items
  ${skills.data?.slice(0, 8).map((s: any) => `  • ${s.stated_skill}`).join('\n') || 'None'}

- Technical Skills: ${technical.data?.length || 0} items
  ${technical.data?.slice(0, 8).map((t: any) => `  • ${t.skill_name}`).join('\n') || 'None'}

- Hidden Competencies: ${competencies.data?.length || 0} items
  ${competencies.data?.slice(0, 4).map((c: any) => `  • ${c.inferred_capability}`).join('\n') || 'None'}

- Soft Skills: ${softSkills.data?.length || 0} items
- Leadership Philosophy: ${leadership.data?.length || 0} items
- Education: ${education.data?.length || 0} items
- Executive Presence: ${executivePresence.data?.length || 0} items

**YOUR CREATIVE MISSION:**
Use your reasoning to discover enhancements for THIS specific vault. Don't follow a rigid checklist - be creative and contextual.

Ask yourself:
- What obvious items from the resume did we miss?
- Which achievements are vague and need metrics/context added from the resume?
- What skills are mentioned in the resume but not extracted?
- Are there duplicate items that should be merged?
- Can any items be enhanced with more context from the resume?
- What educational credentials or certifications are in the resume but missing from the vault?

For EACH enhancement you want to make, return:

{
  "enhancements": [
    {
      "table": "vault_power_phrases",
      "action": "add",
      "confidence": 95,
      "reasoning": "Resume clearly states 'Increased revenue by 40%' but this achievement wasn't extracted",
      "data": {
        "vault_id": "${vaultId}",
        "power_phrase": "Increased revenue by 40% through strategic pricing optimization",
        "quality_tier": "gold",
        "context": "Strategic pricing optimization initiative",
        "evidence_quote": "Exact quote from resume"
      }
    },
    {
      "table": "vault_education",
      "action": "add",
      "confidence": 98,
      "reasoning": "Resume shows 'B.S. Computer Science, MIT, 2015' but no education extracted",
      "data": {
        "vault_id": "${vaultId}",
        "degree_type": "Bachelor of Science",
        "field": "Computer Science",
        "institution": "Massachusetts Institute of Technology",
        "graduation_year": "2015",
        "quality_tier": "gold"
      }
    },
    {
      "table": "vault_power_phrases",
      "action": "update",
      "confidence": 85,
      "reasoning": "Achievement 'Led team' is vague - resume shows 'Led team of 12 engineers'",
      "data": {
        "id": "<existing_id_from_vault>",
        "power_phrase": "Led team of 12 engineers to deliver product 2 months ahead of schedule",
        "quality_tier": "gold"
      }
    }
  ],
  "summary": "Found 3 high-confidence enhancements: added missing revenue achievement, added MIT degree, enhanced vague leadership statement with team size and timeline"
}

**CRITICAL RULES:**
- ONLY return enhancements with confidence > 85%
- Each enhancement must reference specific evidence from the resume
- For "add" actions, include ALL required fields for that table
- For "update" actions, you must know the item ID (you don't have IDs, so focus on "add" actions)
- Maximum 10 enhancements total (focus on highest impact)
- Be fast - this is a $0.002 operation, not deep analysis
- Return ONLY valid JSON, no markdown

**TABLE SCHEMAS:**
- vault_power_phrases: { vault_id, power_phrase, quality_tier, context, evidence_quote }
- vault_transferable_skills: { vault_id, stated_skill, quality_tier, evidence_quote }
- vault_technical_skills: { vault_id, skill_name, proficiency_level, quality_tier }
- vault_education: { vault_id, degree_type, field, institution, graduation_year, quality_tier }
- vault_soft_skills: { vault_id, skill_name, quality_tier, evidence_quote }
- vault_hidden_competencies: { vault_id, inferred_capability, quality_tier, evidence_quote }`;

    const startTime = Date.now();

    const aiResponse = await callLovableAI(
      {
        model: LOVABLE_AI_MODELS.DEFAULT,
        messages: [{
          role: 'system',
          content: 'You are a creative AI career enhancer. Use reasoning to discover enhancements. Return only valid JSON, no markdown.'
        }, {
          role: 'user',
          content: prompt
        }],
        temperature: 0.7,
        max_tokens: 3000,
        response_format: { type: 'json_object' },
      },
      'vault-quality-check',
      user.id
    );

    const duration = Date.now() - startTime;
    console.log(`✅ AI enhancement analysis completed in ${duration}ms`);

    // Log AI usage
    await logAIUsage({
      user_id: user.id,
      model: 'sonar',
      input_tokens: prompt.length / 4,
      output_tokens: (aiResponse.response.choices[0]?.message?.content || '').length / 4,
      cost_usd: aiResponse.metrics.cost_usd || 0.002,
      function_name: 'vault-quality-check',
      request_id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    });

    // Parse AI response
    const resultText = aiResponse.response.choices[0]?.message?.content || '{"enhancements": [], "summary": "No enhancements found"}';
    const cleanedText = resultText.includes('```')
      ? resultText.split('```')[1].replace('json', '').trim()
      : resultText;

    const aiResult = JSON.parse(cleanedText);
    const enhancements: Enhancement[] = aiResult.enhancements || [];
    const summary = aiResult.summary || 'No summary provided';

    console.log(`🔍 AI discovered ${enhancements.length} potential enhancements`);

    // Apply high-confidence enhancements to database
    let applied = 0;
    let skipped = 0;

    for (const enhancement of enhancements) {
      if (enhancement.confidence >= 90 && enhancement.action === 'add') {
        try {
          const { error: insertError } = await supabase
            .from(enhancement.table)
            .insert(enhancement.data);

          if (insertError) {
            console.error(`❌ Failed to apply enhancement to ${enhancement.table}:`, insertError);
            skipped++;
          } else {
            console.log(`✅ Applied: ${enhancement.reasoning}`);
            applied++;
          }
        } catch (err) {
          console.error(`❌ Error applying enhancement:`, err);
          skipped++;
        }
      } else if (enhancement.confidence < 90) {
        console.log(`⏭️ Skipped (confidence ${enhancement.confidence}%): ${enhancement.reasoning}`);
        skipped++;
      } else if (enhancement.action !== 'add') {
        console.log(`⏭️ Skipped (action ${enhancement.action} not supported): ${enhancement.reasoning}`);
        skipped++;
      }
    }

    // Recalculate vault strength after enhancements
    const [updatedPowerPhrases, updatedSkills, updatedCompetencies] = await Promise.all([
      supabase.from('vault_power_phrases').select('*', { count: 'exact', head: true }).eq('vault_id', vaultId),
      supabase.from('vault_transferable_skills').select('*', { count: 'exact', head: true }).eq('vault_id', vaultId),
      supabase.from('vault_hidden_competencies').select('*', { count: 'exact', head: true }).eq('vault_id', vaultId),
    ]);

    const newItemCount =
      (updatedPowerPhrases.count || 0) +
      (updatedSkills.count || 0) +
      (updatedCompetencies.count || 0);

    const vaultStrengthAfter = Math.min(100, Math.floor(newItemCount * 1.5));

    // Update vault_strength_after_qa
    await supabase
      .from('career_vault')
      .update({ vault_strength_after_qa: vaultStrengthAfter })
      .eq('id', vaultId);

    const result: EnhancementResult = {
      enhancementsApplied: applied,
      enhancementsSkipped: skipped,
      vaultStrengthBefore,
      vaultStrengthAfter,
      summary,
      enhancements
    };

    console.log('✨ CREATIVE ENHANCEMENT COMPLETE:', {
      applied,
      skipped,
      strengthBefore: vaultStrengthBefore,
      strengthAfter: vaultStrengthAfter,
      improvement: vaultStrengthAfter - vaultStrengthBefore
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('❌ CREATIVE ENHANCEMENT FAILED:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
