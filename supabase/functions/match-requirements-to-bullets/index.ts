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
  // Parse request body
  const { userId, jobRequirements, atsKeywords } = await req.json();
  
  // Sprint 1: Filter out null/empty requirements
  const validRequirements = (jobRequirements || []).filter((r: any) => 
    r && r.text && typeof r.text === 'string' && r.text.trim().length > 0
  );
  
  if (validRequirements.length === 0) {
    return new Response(
      JSON.stringify({ 
        success: true,
        error: 'No valid requirements provided',
        evidenceMatrix: [],
        stats: { totalRequirements: 0, matchedRequirements: 0, coverageScore: 0 }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  console.log(`[MATCH-REQ-TO-BULLETS] Filtered ${jobRequirements?.length || 0} requirements down to ${validRequirements.length} valid ones`);

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

    // Build bullets from both milestones and work positions
    const bullets: any[] = [];

    // Add bullets from milestones (if any exist)
    (milestones.data || []).forEach((m: any) => {
      const position = (workPositions.data || []).find((p: any) => 
        p.company_name?.toLowerCase() === m.company_name?.toLowerCase()
      );
      
      if (m.description) {
        bullets.push({
          id: m.id,
          content: m.description,
          source: {
            company: m.company_name || position?.company_name || 'Unknown',
            jobTitle: m.title || position?.job_title || 'Unknown',
            dateRange: m.milestone_date || (position ? `${position.start_date} - ${position.end_date || 'Present'}` : '')
          }
        });
      }
    });

    // Extract bullets from work position descriptions
    // Each description contains multiple achievement sentences separated by periods or newlines
    (workPositions.data || []).forEach((position: any) => {
      if (!position.description) return;
      
      // Split description into individual sentences/bullets
      // Handle both period-separated and newline-separated content
      const rawBullets = position.description
        .split(/(?<=[.!?])\s+(?=[A-Z])/)  // Split on sentence boundaries
        .filter((b: string) => b.trim().length > 20);  // Filter out very short fragments
      
      rawBullets.forEach((bulletText: string, index: number) => {
        bullets.push({
          id: `${position.id}-bullet-${index}`,
          content: bulletText.trim(),
          source: {
            company: position.company_name || 'Unknown',
            jobTitle: position.job_title || 'Unknown',
            dateRange: `${position.start_date || ''} - ${position.end_date || 'Present'}`
          }
        });
      });
    });

    console.log('[MATCH-REQ-TO-BULLETS] Built', bullets.length, 'total bullets from vault data');
    
    if (bullets.length === 0) {
      console.error('[MATCH-REQ-TO-BULLETS] WARNING: No bullets extracted! Returning empty result.');
      return new Response(
        JSON.stringify({ 
          success: true, 
          evidenceMatrix: [],
          stats: { 
            totalRequirements: jobRequirements.length, 
            matchedRequirements: 0, 
            coverageScore: 0 
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. AI Matching
    const prompt = `You are analyzing a candidate's actual work history to find the BEST evidence for job requirements.

JOB REQUIREMENTS (${validRequirements.length} valid):
${JSON.stringify(validRequirements.slice(0, 15), null, 2)}

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

    // 3. Construct Evidence Matrix with Sprint 4 quality scoring
    const evidenceMatrix = (parseResult.data.matches || []).map((match: any) => {
      const req = validRequirements[match.requirementIndex];
      const bullet = bullets[match.bestBulletIndex];
      
      if (!req || !bullet) return null;

      const matchScore = match.matchScore || 0;
      let qualityScore = 'weak';
      if (matchScore >= 80) qualityScore = 'strong';
      else if (matchScore >= 60) qualityScore = 'good';

      return {
        requirementId: req.id || `req-${match.requirementIndex}`,
        requirementText: req.text || req,
        requirementCategory: req.priority || 'required',
        
        milestoneId: bullet.id,
        originalBullet: bullet.content,
        originalSource: bullet.source,
        
        matchScore: matchScore,
        matchReasons: match.matchReasons,
        qualityScore, // Sprint 4 enhancement
        
        enhancedBullet: match.enhancedBullet,
        atsKeywords: match.atsKeywordsAdded
      };
    }).filter(Boolean);

    return new Response(
      JSON.stringify({
        success: true,
        evidenceMatrix,
        stats: {
          totalRequirements: validRequirements.length,
          matchedRequirements: evidenceMatrix.length,
          coverageScore: Math.round((evidenceMatrix.length / validRequirements.length) * 100)
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
