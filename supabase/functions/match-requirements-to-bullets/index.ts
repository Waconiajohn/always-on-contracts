import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { extractJSON } from '../_shared/json-parser.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, jobRequirements, atsKeywords } = await req.json();

    if (!userId) throw new Error('userId is required');
    if (!jobRequirements) throw new Error('jobRequirements is required');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Fetch Vault Data - First get vault_id
    const { data: vaultData, error: vaultError } = await supabase
      .from('career_vault')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (vaultError) {
      console.error('[MATCH-REQ-TO-BULLETS] Vault fetch error:', vaultError);
      throw vaultError;
    }

    if (!vaultData) {
      console.log('[MATCH-REQ-TO-BULLETS] No vault found for user');
      return new Response(
        JSON.stringify({ 
          success: true, 
          evidenceMatrix: [],
          statistics: { totalRequirements: 0, matchedRequirements: 0, unmatchedRequirements: 0, averageMatchScore: 0 }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[MATCH-REQ-TO-BULLETS] Found vault_id:', vaultData.id);

    const [milestones, workPositions] = await Promise.all([
      supabase.from('vault_resume_milestones').select('*').eq('vault_id', vaultData.id),
      supabase.from('vault_work_positions').select('*').eq('vault_id', vaultData.id)
    ]);

    console.log('[MATCH-REQ-TO-BULLETS] Fetched', milestones.data?.length || 0, 'milestones and', workPositions.data?.length || 0, 'work positions');

    const bullets = (milestones.data || []).map((m: any) => {
      const position = (workPositions.data || []).find((p: any) => 
        p.company_name?.toLowerCase() === m.company_name?.toLowerCase() // Rough matching
      );
      
      return {
        id: m.id,
        content: m.description || m.milestone_title,
        source: {
          company: m.company_name || position?.company_name || 'Unknown',
          jobTitle: m.title || position?.job_title || 'Unknown',
          dateRange: m.milestone_date || (position ? `${position.start_date} - ${position.end_date || 'Present'}` : '')
        }
      };
    });

    // 2. AI Matching
    const prompt = `You are analyzing a candidate's actual work history to find the BEST evidence for job requirements.

JOB REQUIREMENTS:
${JSON.stringify(jobRequirements.slice(0, 15), null, 2)}

ATS KEYWORDS (Include these if possible):
Critical: ${(atsKeywords?.critical || []).join(', ')}
Important: ${(atsKeywords?.important || []).join(', ')}

CANDIDATE'S ACTUAL WORK HISTORY BULLETS (${bullets.length} items):
${JSON.stringify(bullets.map((b: any, i: number) => `[${i}] ${b.content} (Source: ${b.source.jobTitle} at ${b.source.company})`), null, 2)}

TASK:
For each JOB REQUIREMENT, find the SINGLE BEST bullet from the candidate's history that proves they meet it.
If no good match exists (score < 40), mark as unmatched.

Return JSON:
{
  "matches": [
    {
      "requirementIndex": 0, // Index in the requirements array provided
      "bestBulletIndex": 2, // Index in the bullets array provided
      "matchScore": 95, // 0-100
      "matchReasons": ["Direct experience", "Quantified result"],
      "enhancedBullet": "Rewrite the bullet to specifically address the requirement and include ATS keywords. Keep it factual.",
      "atsKeywordsAdded": ["keyword1", "keyword2"]
    }
  ]
}`;

    const { response, metrics } = await callLovableAI({
      messages: [{ role: 'user', content: prompt }],
      model: LOVABLE_AI_MODELS.DEFAULT,
      temperature: 0.3,
      max_tokens: 4000,
      response_mime_type: "application/json"
    }, 'match-requirements-to-bullets', userId);

    await logAIUsage(metrics);

    const content = response.choices[0].message.content;
    console.log('[MATCH-REQ-TO-BULLETS] Raw AI response length:', content?.length);
    console.log('[MATCH-REQ-TO-BULLETS] Raw AI response preview:', content?.substring(0, 500));
    
    const parseResult = extractJSON(content);

    if (!parseResult.success) {
      console.error('[MATCH-REQ-TO-BULLETS] Parse error:', parseResult.error);
      console.error('[MATCH-REQ-TO-BULLETS] Full response:', content);
      throw new Error(`Failed to parse AI response: ${parseResult.error}`);
    }

    if (!parseResult.data) {
      console.error('[MATCH-REQ-TO-BULLETS] No data in parse result');
      throw new Error('Failed to parse AI response: No data returned');
    }
    
    console.log('[MATCH-REQ-TO-BULLETS] Successfully parsed response with', parseResult.data.matches?.length || 0, 'matches');

    // 3. Construct Evidence Matrix
    const evidenceMatrix = (parseResult.data.matches || []).map((match: any) => {
      const req = jobRequirements[match.requirementIndex];
      const bullet = bullets[match.bestBulletIndex];
      
      if (!req || !bullet) return null;

      return {
        requirementId: req.id || `req-${match.requirementIndex}`,
        requirementText: req.text || req,
        requirementCategory: req.priority || 'required',
        
        milestoneId: bullet.id,
        originalBullet: bullet.content,
        originalSource: bullet.source,
        
        matchScore: match.matchScore,
        matchReasons: match.matchReasons,
        
        enhancedBullet: match.enhancedBullet,
        atsKeywords: match.atsKeywordsAdded
      };
    }).filter(Boolean);

    return new Response(
      JSON.stringify({
        success: true,
        evidenceMatrix,
        stats: {
          totalRequirements: jobRequirements.length,
          matchedRequirements: evidenceMatrix.length,
          coverageScore: Math.round((evidenceMatrix.length / jobRequirements.length) * 100)
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in match-requirements-to-bullets:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
