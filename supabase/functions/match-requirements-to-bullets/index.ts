import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Requirement {
  id: string;
  text: string;
  category: 'required' | 'preferred' | 'nice_to_have';
  priority: number;
}

interface EvidenceMatch {
  requirementId: string;
  requirementText: string;
  requirementCategory: string;
  
  // Original evidence
  milestoneId: string;
  originalBullet: string;
  originalSource: {
    jobTitle: string;
    company: string;
    dateRange: string;
  };
  
  // Match quality
  matchScore: number;
  matchReasons: string[];
  matchConfidence: number;
  
  // Enhanced version
  enhancedBullet: string;
  atsKeywords: string[];
  suggestedKeywords: string[];
  enhancementReasoning: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      userId,
      jobRequirements = [],
      atsKeywords = { critical: [], important: [], nice_to_have: [] }
    } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔍 Matching ${jobRequirements.length} requirements to career history for user ${userId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Step 1: Fetch user's career vault data
    const { data: vaultRecord } = await supabase
      .from('career_vault')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!vaultRecord) {
      return new Response(
        JSON.stringify({ 
          error: 'NO_VAULT',
          message: 'Career vault not found. Please complete vault setup first.'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Fetch work positions and milestones (actual history)
    const [workPositions, milestones] = await Promise.all([
      supabase.from('vault_work_positions').select('*').eq('vault_id', vaultRecord.id).order('start_date', { ascending: false }),
      supabase.from('vault_resume_milestones').select('*').eq('vault_id', vaultRecord.id).order('created_at', { ascending: false })
    ]);

    const positions = workPositions.data || [];
    const historyMilestones = milestones.data || [];

    if (positions.length === 0 && historyMilestones.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'INSUFFICIENT_DATA',
          message: 'No work history found in vault. Please add your experience first.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Loaded ${positions.length} positions and ${historyMilestones.length} milestone bullets`);

    // Step 3: Prepare all bullets for matching
    const allBullets = historyMilestones.flatMap((milestone: any) => {
      const position = positions.find((p: any) => 
        p.company_name === milestone.company || p.job_title === milestone.role
      );
      
      const bullets = Array.isArray(milestone.key_achievements) 
        ? milestone.key_achievements 
        : typeof milestone.key_achievements === 'string'
          ? [milestone.key_achievements]
          : [];

      return bullets.map((bullet: string) => ({
        id: milestone.id,
        bullet: bullet,
        jobTitle: milestone.role || position?.job_title || 'Unknown',
        company: milestone.company || position?.company_name || 'Unknown',
        dateRange: milestone.is_current 
          ? `${milestone.start_date} - Present` 
          : `${milestone.start_date} - ${milestone.end_date || 'Unknown'}`,
        context: milestone.context || '',
        skills: milestone.skills_used || []
      }));
    });

    console.log(`📋 Processing ${allBullets.length} total bullets against ${jobRequirements.length} requirements`);

    // Step 4: Use AI to match requirements to best evidence
    const evidenceMatrix: EvidenceMatch[] = [];
    const unmatchedRequirements: Requirement[] = [];

    for (const req of jobRequirements) {
      const requirement = typeof req === 'string' 
        ? { id: crypto.randomUUID(), text: req, category: 'required', priority: 1 }
        : req;

      // Build matching prompt
      const matchingPrompt = `You are analyzing a candidate's actual work history to find the BEST evidence for a job requirement.

JOB REQUIREMENT: "${requirement.text}"
Category: ${requirement.category}

CANDIDATE'S ACTUAL WORK HISTORY BULLETS (${allBullets.length} total):
${allBullets.map((item: any, idx: number) => `
[${idx + 1}] ${item.bullet}
Context: ${item.jobTitle} at ${item.company} (${item.dateRange})
Skills: ${item.skills.join(', ')}
`).join('\n')}

CRITICAL ATS KEYWORDS TO INCLUDE:
${atsKeywords.critical.join(', ')}

IMPORTANT KEYWORDS:
${atsKeywords.important.join(', ')}

Task:
1. Find the TOP 1 bullet that BEST demonstrates this requirement
2. Score the match (0-100) based on relevance and strength
3. Explain WHY it's a match (2-3 specific reasons)
4. Create an ENHANCED version of the bullet that:
   - Keeps the FACTUAL core (no fabrication)
   - Adds relevant ATS keywords naturally
   - Strengthens the language with power verbs
   - Quantifies impact if possible
5. Identify which ATS keywords were added

Return JSON format:
{
  "bestMatch": {
    "bulletIndex": <number>,
    "matchScore": <0-100>,
    "matchReasons": ["reason 1", "reason 2"],
    "confidence": <0.0-1.0>
  },
  "enhancedBullet": "<improved version>",
  "atsKeywordsAdded": ["keyword1", "keyword2"],
  "suggestedKeywords": ["keyword3"],
  "reasoning": "<why this enhancement works>"
}

If NO bullet is relevant (match score < 40), return:
{
  "bestMatch": null,
  "suggestion": "<what evidence is missing>"
}`;

      const { response, metrics } = await callLovableAI({
        messages: [{ role: 'user', content: matchingPrompt }],
        model: LOVABLE_AI_MODELS.DEFAULT,
        temperature: 0.3,
        max_tokens: 1000,
      }, 'match-requirements-to-bullets', userId);

      await logAIUsage(metrics);

      try {
        const content = response.choices?.[0]?.message?.content || '{}';
        const result = JSON.parse(content);

        if (result.bestMatch && result.bestMatch.matchScore >= 40) {
          const bulletData = allBullets[result.bestMatch.bulletIndex];
          
          evidenceMatrix.push({
            requirementId: requirement.id,
            requirementText: requirement.text,
            requirementCategory: requirement.category,
            
            milestoneId: bulletData.id,
            originalBullet: bulletData.bullet,
            originalSource: {
              jobTitle: bulletData.jobTitle,
              company: bulletData.company,
              dateRange: bulletData.dateRange
            },
            
            matchScore: result.bestMatch.matchScore,
            matchReasons: result.bestMatch.matchReasons || [],
            matchConfidence: result.bestMatch.confidence || 0.8,
            
            enhancedBullet: result.enhancedBullet || bulletData.bullet,
            atsKeywords: result.atsKeywordsAdded || [],
            suggestedKeywords: result.suggestedKeywords || [],
            enhancementReasoning: result.reasoning || ''
          });

          console.log(`✅ Matched requirement "${requirement.text}" to bullet (score: ${result.bestMatch.matchScore})`);
        } else {
          unmatchedRequirements.push(requirement);
          console.log(`⚠️ No good match for requirement: "${requirement.text}"`);
        }
      } catch (parseError) {
        console.error(`Failed to parse AI response for requirement "${requirement.text}":`, parseError);
        unmatchedRequirements.push(requirement);
      }
    }

    // Step 5: Calculate coverage statistics
    const coverageScore = Math.round((evidenceMatrix.length / Math.max(jobRequirements.length, 1)) * 100);
    const avgMatchScore = evidenceMatrix.length > 0
      ? Math.round(evidenceMatrix.reduce((sum, m) => sum + m.matchScore, 0) / evidenceMatrix.length)
      : 0;

    console.log(`📊 Coverage: ${coverageScore}% (${evidenceMatrix.length}/${jobRequirements.length} requirements matched)`);
    console.log(`📊 Average match quality: ${avgMatchScore}/100`);

    return new Response(
      JSON.stringify({
        success: true,
        evidenceMatrix,
        unmatchedRequirements,
        stats: {
          totalRequirements: jobRequirements.length,
          matchedRequirements: evidenceMatrix.length,
          unmatchedRequirements: unmatchedRequirements.length,
          coverageScore,
          avgMatchScore,
          totalBulletsAnalyzed: allBullets.length
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Match requirements error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});