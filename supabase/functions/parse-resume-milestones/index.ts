import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) throw new Error('Unauthorized');

    const { resumeText, vaultId, targetRoles = [], targetIndustries = [] } = await req.json();

    console.log('[PARSE-RESUME-MILESTONES] Parsing resume with career focus:', { targetRoles, targetIndustries });

    // Delete existing milestones to prevent duplicates
    const { error: deleteError } = await supabase
      .from('vault_resume_milestones')
      .delete()
      .eq('vault_id', vaultId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('[PARSE-RESUME-MILESTONES] Error deleting old milestones:', deleteError);
    }

    const careerFocusContext = targetRoles.length > 0 || targetIndustries.length > 0
      ? `\n\nUSER'S CAREER FOCUS:
- Target Roles: ${targetRoles.join(', ') || 'Any'}
- Target Industries: ${targetIndustries.join(', ') || 'Any'}

PRIORITIZE jobs that are most relevant to this career focus. Score each job's relevance (0-100%).`
      : '';

    const systemPrompt = `You are an expert resume parser specialized in career trajectory analysis. Extract job positions and assess their relevance to the user's career goals.`;

    const prompt = `Parse this resume and extract job positions (employment history), prioritizing relevance to the user's career focus.

${careerFocusContext}

EXTRACTION RULES:
1. Extract ONLY jobs/positions (employment roles with company, title, dates)
2. Do NOT create separate entries for achievements - include them within the job context
3. Do NOT create project-only entries unless they were paid contract/freelance work
4. Every entry MUST have: company_name, job_title, start_date, end_date
5. Assign a relevance_score (0-100%) based on alignment with target roles/industries
6. PRIORITIZE: Recent + Senior + Relevant jobs
7. LIMIT: Extract 8-12 MOST RELEVANT jobs maximum

RESUME TEXT:
${resumeText}

Return as JSON:
{
  "milestones": [
    {
      "type": "job",
      "company_name": "Full company name (REQUIRED)",
      "job_title": "Job title (REQUIRED)",
      "start_date": "YYYY-MM or YYYY (REQUIRED)",
      "end_date": "YYYY-MM or 'Present' (REQUIRED)",
      "description": "Brief role summary",
      "key_achievements": ["Achievement 1", "Achievement 2", "Achievement 3"],
      "relevance_score": 85,
      "relevance_reason": "Aligns with target VP Operations in Oil & Gas",
      "estimated_question_count": 6
    }
  ],
  "total_estimated_questions": 35
}

SCORING GUIDELINES:
- 90-100%: Perfect match to target role + industry
- 70-89%: Strong match (either role OR industry aligned)
- 50-69%: Moderate match (transferable skills/experience)
- Below 50%: Low relevance (skip unless critical to career narrative)

QUESTION ALLOCATION:
- Most recent role (last 2 years): 6-8 questions
- Previous 2-3 key roles: 4-5 questions each
- Earlier career-defining roles: 2-3 questions
- Target: 30-40 total questions maximum

OUTPUT REQUIREMENTS:
- Return 8-12 jobs maximum
- Sort by: relevance_score DESC, then recency
- SKIP any entry missing required fields`;

    console.log('[PARSE-RESUME-MILESTONES] Calling Gemini 2.5 Flash...');
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[PARSE-RESUME-MILESTONES] AI error:', response.status, errorText);
      throw new Error(`AI parsing failed: ${response.status}`);
    }

    const aiData = await response.json();
    const aiResponse = aiData.choices[0].message.content;

    let parsed;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : aiResponse);
    } catch (e) {
      console.error('[PARSE-RESUME-MILESTONES] Failed to parse:', e);
      throw new Error('Failed to parse AI response');
    }

    console.log('[PARSE-RESUME-MILESTONES] Parsed milestones:', parsed.milestones.length);

    // CRITICAL: Only accept jobs with complete data AND filter by relevance
    const milestoneInserts = parsed.milestones
      .filter((m: any) => {
        // MUST have ALL required fields
        const hasAllRequiredFields = 
          m.company_name && 
          m.job_title && 
          m.start_date && 
          m.end_date &&
          m.type === 'job';
        
        // Filter by relevance if career focus is set
        const isRelevant = targetRoles.length === 0 && targetIndustries.length === 0
          ? true // No career focus = accept all
          : (m.relevance_score || 0) >= 50; // With focus = require 50%+ relevance
        
        if (!hasAllRequiredFields) {
          console.log('[PARSE-RESUME-MILESTONES] Skipping incomplete job:', {
            company: m.company_name || 'MISSING',
            title: m.job_title || 'MISSING',
            start: m.start_date || 'MISSING',
            end: m.end_date || 'MISSING'
          });
        } else if (!isRelevant) {
          console.log('[PARSE-RESUME-MILESTONES] Skipping low-relevance job:', {
            company: m.company_name,
            title: m.job_title,
            relevance: m.relevance_score,
            reason: 'Below 50% relevance threshold'
          });
        }
        
        return hasAllRequiredFields && isRelevant;
      })
      .slice(0, 12) // Hard cap at 12 milestones
      .map((m: any, index: number) => {
        // Dynamic question allocation based on priority
        let questionsForJob = 3; // Default
        if (index === 0) questionsForJob = 8; // Most recent: 8 questions
        else if (index <= 2) questionsForJob = 5; // Next 2: 5 questions each
        else if (index <= 5) questionsForJob = 3; // Next 3: 3 questions each
        else questionsForJob = 2; // Older roles: 2 questions

        return {
          vault_id: vaultId,
          user_id: user.id,
          milestone_type: 'job',
          company_name: m.company_name,
          job_title: m.job_title,
          start_date: m.start_date,
          end_date: m.end_date,
          description: m.description || '',
          key_achievements: m.key_achievements || [],
          questions_asked: questionsForJob,
          questions_answered: 0,
          completion_percentage: 0,
          intelligence_extracted: 0
        };
      });

    if (milestoneInserts.length === 0) {
      console.error('[PARSE-RESUME-MILESTONES] No valid milestones found');
      throw new Error('Could not extract valid career milestones from resume');
    }

    const { data: insertedMilestones, error: insertError } = await supabase
      .from('vault_resume_milestones')
      .insert(milestoneInserts)
      .select();

    if (insertError) {
      console.error('[PARSE-RESUME-MILESTONES] Insert error:', insertError);
      throw insertError;
    }

    console.log('[PARSE-RESUME-MILESTONES] Saved milestones:', insertedMilestones.length);

    return new Response(
      JSON.stringify({
        success: true,
        milestones: insertedMilestones,
        total_estimated_questions: parsed.total_estimated_questions
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[PARSE-RESUME-MILESTONES] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});