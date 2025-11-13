// =====================================================
// TIER 1: FAST QUALITY CHECK
// =====================================================
// Runs automatically after extraction to catch errors
// Model: sonar (cheap, fast) - $0.002 per check
// Purpose: Find missing items, contradictions, low quality
// =====================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callPerplexity } from '../_shared/ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';

interface QualityCheckRequest {
  vaultId: string;
  resumeText: string;
}

interface QualityIssue {
  category: string;
  severity: 'critical' | 'moderate' | 'minor';
  issue: string;
  suggestedFix: string;
  autoFixable: boolean;
}

interface MissingItem {
  itemType: string;
  evidence: string; // Quote from resume
  confidence: number;
  suggestedAdd: any;
}

interface QualityCheckResult {
  overallQuality: number; // 0-100
  completenessScore: number; // 0-100
  consistencyScore: number; // 0-100
  issues: QualityIssue[];
  missingItems: MissingItem[];
  autoFixCount: number;
  reviewNeededCount: number;
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

    console.log('🔍 QUALITY CHECK: Starting fast quality check for vault:', vaultId);

    // Fetch all vault data
    const [vault, powerPhrases, skills, competencies, softSkills, leadership, education] = await Promise.all([
      supabase.from('career_vault').select('*').eq('id', vaultId).single(),
      supabase.from('vault_power_phrases').select('*').eq('vault_id', vaultId),
      supabase.from('vault_transferable_skills').select('*').eq('vault_id', vaultId),
      supabase.from('vault_hidden_competencies').select('*').eq('vault_id', vaultId),
      supabase.from('vault_soft_skills').select('*').eq('vault_id', vaultId),
      supabase.from('vault_leadership_philosophy').select('*').eq('vault_id', vaultId),
      supabase.from('vault_education').select('*').eq('vault_id', vaultId),
    ]);

    // Build prompt for AI quality check
    const prompt = `You are a quality assurance expert for career data extraction. Review the extracted vault data against the original resume and identify issues.

**RESUME TEXT:**
${resumeText}

**EXTRACTED VAULT DATA:**
- Power Phrases (Achievements): ${powerPhrases.data?.length || 0} items
  ${powerPhrases.data?.slice(0, 10).map((p: any) => `  • ${p.power_phrase}`).join('\n') || 'None'}

- Transferable Skills: ${skills.data?.length || 0} items
  ${skills.data?.slice(0, 10).map((s: any) => `  • ${s.stated_skill}`).join('\n') || 'None'}

- Hidden Competencies: ${competencies.data?.length || 0} items
  ${competencies.data?.slice(0, 5).map((c: any) => `  • ${c.inferred_capability}`).join('\n') || 'None'}

- Soft Skills: ${softSkills.data?.length || 0} items
  ${softSkills.data?.slice(0, 5).map((ss: any) => `  • ${ss.skill_name}`).join('\n') || 'None'}

- Leadership Philosophy: ${leadership.data?.length || 0} items
- Education: ${education.data?.length || 0} items

**YOUR TASK:**
Perform a FAST quality check (< 30 seconds) and identify:

1. **Missing Obvious Items** - Items clearly stated in resume but NOT extracted
   - Look for: Education degrees, certifications, job titles, skills mentioned multiple times
   - ONLY flag if confidence > 85% (very obvious)

2. **Data Contradictions** - Inconsistencies in extracted data
   - Example: "5 years experience" but job dates show 8 years
   - Example: Skill listed twice with different names

3. **Low Quality Items** - Extracted items with issues
   - Vague achievements without metrics
   - Skills without context
   - Duplicate entries

4. **Completeness Gaps** - Expected fields that are empty
   - No education when resume has degrees
   - No skills when resume lists technical skills
   - No achievements when resume has bullet points

Return JSON:
{
  "overallQuality": 85,  // 0-100 score
  "completenessScore": 90,  // % of expected fields filled
  "consistencyScore": 80,  // % free of contradictions
  "issues": [
    {
      "category": "missing_education",
      "severity": "critical",
      "issue": "Resume shows 'B.S. in Computer Science' but no education extracted",
      "suggestedFix": "Add: B.S. Computer Science, [University Name if stated]",
      "autoFixable": true
    }
  ],
  "missingItems": [
    {
      "itemType": "education",
      "evidence": "Quote from resume showing the missing item",
      "confidence": 95,
      "suggestedAdd": {
        "degree_type": "Bachelor of Science",
        "field": "Computer Science",
        "institution": "...",
        "graduation_year": "..."
      }
    }
  ]
}

**RULES:**
- Be FAST - only check obvious issues (< 10,000 tokens)
- Only flag CLEAR problems (confidence > 85%)
- Focus on critical/moderate issues, skip minor nitpicks
- Maximum 10 issues total
- Maximum 5 missing items
- All missing items must be AUTO-FIXABLE (clear extraction from resume)`;

    const startTime = Date.now();

    const aiResponse = await callPerplexity({
      model: 'sonar',  // Cheap, fast model
      messages: [{
        role: 'system',
        content: 'You are a quality assurance expert. Return only valid JSON, no markdown.'
      }, {
        role: 'user',
        content: prompt
      }],
      temperature: 0.2,
      max_tokens: 2000,
    });

    const duration = Date.now() - startTime;
    console.log(`✅ Quality check completed in ${duration}ms`);

    // Log AI usage
    await logAIUsage({
      supabase,
      userId: user.id,
      model: 'sonar',
      inputTokens: prompt.length / 4,  // Rough estimate
      outputTokens: (aiResponse.content || '').length / 4,
      cost: 0.002,  // Approximate cost
      operation: 'vault-quality-check',
      metadata: { vaultId, duration }
    });

    // Parse AI response
    const resultText = aiResponse.content || '{}';
    const cleanedText = resultText.includes('```')
      ? resultText.split('```')[1].replace('json', '').trim()
      : resultText;

    const result: QualityCheckResult = JSON.parse(cleanedText);

    // Add counts
    result.autoFixCount = result.missingItems?.filter((item: MissingItem) => item.confidence > 90).length || 0;
    result.reviewNeededCount = result.issues?.filter((issue: QualityIssue) => !issue.autoFixable).length || 0;

    // Store quality check results
    const { error: insertError } = await supabase
      .from('vault_quality_checks')
      .insert({
        vault_id: vaultId,
        user_id: user.id,
        overall_quality: result.overallQuality,
        completeness_score: result.completenessScore,
        consistency_score: result.consistencyScore,
        issues: result.issues,
        missing_items: result.missingItems,
        auto_fix_count: result.autoFixCount,
        review_needed_count: result.reviewNeededCount,
        checked_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Failed to store quality check:', insertError);
    }

    console.log('📊 Quality Check Results:', {
      overallQuality: result.overallQuality,
      completenessScore: result.completenessScore,
      issues: result.issues?.length || 0,
      missingItems: result.missingItems?.length || 0,
      autoFixable: result.autoFixCount
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
    console.error('❌ QUALITY CHECK FAILED:', error);
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
