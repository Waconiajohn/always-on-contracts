// =====================================================
// TIER 2: DEEP STRATEGIC ENHANCEMENT
// =====================================================
// User-triggered deep AI reasoning to enhance vault
// Model: sonar-reasoning-pro (deep thinking) - $0.05 per enhancement
// Purpose: Creative gap discovery, smart questions, vault optimization
// =====================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callPerplexity } from '../_shared/ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';

interface StrategicAuditRequest {
  vaultId: string;
}

interface StrategicEnhancement {
  table: string;
  action: 'add' | 'update';
  confidence: number;
  reasoning: string;
  strategicValue: string; // Why this matters for career trajectory
  data: any;
}

interface SmartQuestion {
  question: string;
  category: string;
  reasoning: string; // Why asking this would improve the vault
  impact: 'high' | 'medium' | 'low';
  targetTable: string; // Where the answer would be stored
}

interface StrategicGap {
  gapType: string;
  description: string;
  impact: string;
  suggestedEnhancement: StrategicEnhancement | null;
}

interface StrategicEnhancementResult {
  enhancementsApplied: number;
  enhancementsSkipped: number;
  vaultStrengthBefore: number;
  vaultStrengthAfter: number;
  executiveSummary: string;
  strategicGapsDiscovered: StrategicGap[];
  smartQuestionsToAsk: SmartQuestion[];
  enhancements: StrategicEnhancement[];
  generatedAt: string;
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

    const { vaultId }: StrategicAuditRequest = await req.json();

    console.log('🧠 STRATEGIC ENHANCEMENT: Starting deep AI reasoning for vault:', vaultId);

    // Fetch ALL vault data for comprehensive analysis
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
      thoughtLeadership,
      network,
      advantages
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
      supabase.from('vault_thought_leadership').select('*').eq('vault_id', vaultId),
      supabase.from('vault_professional_network').select('*').eq('vault_id', vaultId),
      supabase.from('vault_competitive_advantages').select('*').eq('vault_id', vaultId),
    ]);

    // Safety check: ensure vault data exists
    if (!vault.data) {
      throw new Error('Vault not found');
    }

    const vaultStrengthBefore = vault.data.vault_strength_after_qa || vault.data.vault_strength_before_qa || 0;

    // Build creative AI strategic enhancement prompt
    const prompt = `You are an elite AI career strategist with deep reasoning capabilities. Use your creativity to strategically enhance THIS specific career vault.

**CAREER CONTEXT:**
- Target Roles: ${vault.data?.target_roles?.join(', ') || 'Not specified'}
- Target Industries: ${vault.data?.target_industries?.join(', ') || 'Not specified'}
- Career Direction: ${vault.data?.career_direction || 'Not specified'}
- Current Vault Strength: ${vaultStrengthBefore}%

**CURRENT VAULT DATA:**
- Power Phrases: ${powerPhrases.data?.length || 0} items
  Examples: ${powerPhrases.data?.slice(0, 5).map((p: any) => `"${p.power_phrase}"`).join('; ') || 'None'}

- Transferable Skills: ${skills.data?.length || 0} items
  ${skills.data?.slice(0, 8).map((s: any) => s.stated_skill).join(', ') || 'None'}

- Technical Skills: ${technical.data?.length || 0} items
  ${technical.data?.slice(0, 8).map((t: any) => t.skill_name).join(', ') || 'None'}

- Hidden Competencies: ${competencies.data?.length || 0} items
  ${competencies.data?.slice(0, 3).map((c: any) => c.inferred_capability).join('; ') || 'None'}

- Leadership Philosophy: ${leadership.data?.length || 0} items
- Executive Presence: ${executivePresence.data?.length || 0} items
- Soft Skills: ${softSkills.data?.length || 0} items
- Education: ${education.data?.length || 0} items
- Thought Leadership: ${thoughtLeadership.data?.length || 0} items
- Professional Network: ${network.data?.length || 0} items
- Competitive Advantages: ${advantages.data?.length || 0} items

**YOUR CREATIVE STRATEGIC MISSION:**
This is a $0.05 deep-thinking operation. Use your reasoning to make this vault as powerful as possible for their career trajectory.

Don't follow a template - use deep thinking to discover:

1. **Strategic Gaps** - What's missing that would significantly strengthen their positioning for their target roles?
   - Think about the narrative arc of their career
   - What context or depth is missing?
   - Are there unexplored angles to their experience?

2. **Smart Questions** - What questions, if answered, would unlock significantly more career intelligence?
   - Generate 5-10 contextual, pointed questions
   - Each question should be tailored to THEIR specific career trajectory
   - Questions should uncover gaps you've identified through reasoning
   - For each question, explain WHY it matters and where the answer would be stored

3. **Strategic Enhancements** - What can you infer and add with high confidence?
   - Use reasoning to infer strategic intelligence from existing data
   - Add thought leadership areas based on their expertise
   - Suggest competitive advantages based on their unique combination of skills
   - Enhance leadership philosophy based on their achievements

Use Perplexity web search to:
- Research their target roles to identify what's truly valued
- Understand market positioning for their skill set
- Discover emerging trends in their target industries
- Find strategic intelligence that would enhance their vault

Return JSON:
{
  "executiveSummary": "2-3 paragraphs on their strategic positioning and top opportunities",
  "strategicGapsDiscovered": [
    {
      "gapType": "leadership_quantification",
      "description": "Leadership achievements lack team size and scope metrics",
      "impact": "Without quantification, leadership impact is harder to communicate in interviews",
      "suggestedEnhancement": {
        "table": "vault_leadership_philosophy",
        "action": "add",
        "confidence": 75,
        "reasoning": "Based on role progression from individual contributor to lead roles",
        "strategicValue": "Quantified leadership scope strengthens executive positioning",
        "data": {...}
      }
    }
  ],
  "smartQuestionsToAsk": [
    {
      "question": "Can you describe a time when you had to influence stakeholders without direct authority?",
      "category": "Executive Presence",
      "reasoning": "Gap: vault shows strong technical skills but lacks evidence of executive-level influence. This question would surface strategic relationship management abilities.",
      "impact": "high",
      "targetTable": "vault_executive_presence"
    }
  ],
  "enhancements": [
    {
      "table": "vault_thought_leadership",
      "action": "add",
      "confidence": 85,
      "reasoning": "User has 8 years in AI/ML based on skills. They should position as thought leader in practical AI implementation.",
      "strategicValue": "Thought leadership in AI differentiates from pure technical roles and opens executive opportunities",
      "data": {
        "vault_id": "${vaultId}",
        "topic": "Practical AI Implementation in Enterprise",
        "evidence": "Extensive AI/ML skills combined with business achievements suggests ability to bridge technical and business",
        "quality_tier": "silver"
      }
    }
  ]
}

**CRITICAL RULES:**
- Use DEEP REASONING - don't just check boxes
- Generate questions that are CONTEXTUAL and SMART, not generic
- Only add enhancements with confidence > 75%
- Each enhancement must explain strategic value for their career
- Maximum 15 enhancements total (focus on high strategic value)
- Return ONLY valid JSON, no markdown

**TABLE SCHEMAS:**
- vault_thought_leadership: { vault_id, topic, evidence, quality_tier }
- vault_competitive_advantages: { vault_id, advantage_statement, category, quality_tier }
- vault_leadership_philosophy: { vault_id, philosophy_statement, quality_tier, evidence_quote }
- vault_executive_presence: { vault_id, trait, behavioral_evidence, quality_tier }
- vault_hidden_competencies: { vault_id, inferred_capability, quality_tier, evidence_quote }`;

    const startTime = Date.now();

    const aiResponse = await callPerplexity({
      model: 'sonar-reasoning-pro',  // Deep thinking model
      messages: [{
        role: 'system',
        content: 'You are an elite AI career strategist. Use deep reasoning and web search to enhance this vault strategically. Return only valid JSON, no markdown.'
      }, {
        role: 'user',
        content: prompt
      }],
      temperature: 0.4,  // Higher for creative reasoning
      max_tokens: 8000,
    });

    const duration = Date.now() - startTime;
    console.log(`✅ Strategic enhancement analysis completed in ${duration}ms`);

    // Log AI usage
    await logAIUsage({
      supabase,
      userId: user.id,
      model: 'sonar-reasoning-pro',
      inputTokens: prompt.length / 4,
      outputTokens: (aiResponse.content || '').length / 4,
      cost: 0.05,
      operation: 'vault-strategic-enhancement',
      metadata: { vaultId, duration }
    });

    // Parse AI response
    const resultText = aiResponse.content || '{"enhancements": [], "smartQuestionsToAsk": [], "strategicGapsDiscovered": [], "executiveSummary": "No analysis generated"}';
    const cleanedText = resultText.includes('```')
      ? resultText.split('```')[1].replace('json', '').trim()
      : resultText;

    const aiResult = JSON.parse(cleanedText);
    const enhancements: StrategicEnhancement[] = aiResult.enhancements || [];
    const smartQuestions: SmartQuestion[] = aiResult.smartQuestionsToAsk || [];
    const strategicGaps: StrategicGap[] = aiResult.strategicGapsDiscovered || [];
    const executiveSummary = aiResult.executiveSummary || 'No summary generated';

    console.log(`🔍 AI discovered ${enhancements.length} strategic enhancements, ${smartQuestions.length} smart questions, ${strategicGaps.length} strategic gaps`);

    // Apply high-confidence strategic enhancements to database
    let applied = 0;
    let skipped = 0;

    for (const enhancement of enhancements) {
      if (enhancement.confidence >= 80 && enhancement.action === 'add') {
        try {
          const { error: insertError } = await supabase
            .from(enhancement.table)
            .insert(enhancement.data);

          if (insertError) {
            console.error(`❌ Failed to apply enhancement to ${enhancement.table}:`, insertError);
            skipped++;
          } else {
            console.log(`✅ Applied: ${enhancement.reasoning}`);
            console.log(`   Strategic Value: ${enhancement.strategicValue}`);
            applied++;
          }
        } catch (err) {
          console.error(`❌ Error applying enhancement:`, err);
          skipped++;
        }
      } else if (enhancement.confidence < 80) {
        console.log(`⏭️ Skipped (confidence ${enhancement.confidence}%): ${enhancement.reasoning}`);
        skipped++;
      }
    }

    // Recalculate vault strength after enhancements
    const [
      updatedPowerPhrases,
      updatedSkills,
      updatedCompetencies,
      updatedThoughtLeadership,
      updatedAdvantages
    ] = await Promise.all([
      supabase.from('vault_power_phrases').select('*', { count: 'exact', head: true }).eq('vault_id', vaultId),
      supabase.from('vault_transferable_skills').select('*', { count: 'exact', head: true }).eq('vault_id', vaultId),
      supabase.from('vault_hidden_competencies').select('*', { count: 'exact', head: true }).eq('vault_id', vaultId),
      supabase.from('vault_thought_leadership').select('*', { count: 'exact', head: true }).eq('vault_id', vaultId),
      supabase.from('vault_competitive_advantages').select('*', { count: 'exact', head: true }).eq('vault_id', vaultId),
    ]);

    const newItemCount =
      (updatedPowerPhrases.count || 0) +
      (updatedSkills.count || 0) +
      (updatedCompetencies.count || 0) +
      (updatedThoughtLeadership.count || 0) +
      (updatedAdvantages.count || 0);

    const vaultStrengthAfter = Math.min(100, Math.floor(newItemCount * 1.5));

    // Update vault_strength_after_qa
    await supabase
      .from('career_vault')
      .update({ vault_strength_after_qa: vaultStrengthAfter })
      .eq('id', vaultId);

    const result: StrategicEnhancementResult = {
      enhancementsApplied: applied,
      enhancementsSkipped: skipped,
      vaultStrengthBefore,
      vaultStrengthAfter,
      executiveSummary,
      strategicGapsDiscovered: strategicGaps,
      smartQuestionsToAsk: smartQuestions,
      enhancements,
      generatedAt: new Date().toISOString()
    };

    console.log('🧠 STRATEGIC ENHANCEMENT COMPLETE:', {
      applied,
      skipped,
      smartQuestions: smartQuestions.length,
      gaps: strategicGaps.length,
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
    console.error('❌ STRATEGIC ENHANCEMENT FAILED:', error);
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
