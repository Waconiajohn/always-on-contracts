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

    const { resumeText, vaultId } = await req.json();

    console.log('[PARSE-RESUME-MILESTONES] Parsing resume into structured milestones...');

    const systemPrompt = `You are an expert resume parser. Extract ONLY job positions from resumes. Do NOT extract standalone achievements or projects.`;

    const prompt = `Parse this resume and extract ONLY job positions (employment history). Each job should include the achievements within that role context.

CRITICAL RULES:
- Extract ONLY jobs/positions (employment roles with company, title, dates)
- Do NOT create separate entries for achievements - include them within the job context
- Do NOT create project-only entries unless they were paid contract/freelance work
- Every entry MUST have: company_name, job_title, start_date, end_date

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
      "estimated_question_count": 3
    }
  ],
  "total_estimated_questions": 30
}

Guidelines:
- Target 10-15 total jobs (typical resume length)
- Each job gets 2-3 questions = ~30 total questions
- Prioritize most recent and most senior roles
- If resume has >15 jobs, prioritize the most impactful ones
- SKIP any entry where company_name, job_title, start_date, or end_date is missing`;

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

    // CRITICAL: Only accept jobs with complete data
    const milestoneInserts = parsed.milestones
      .filter((m: any) => {
        // MUST have ALL required fields for a job
        const hasAllRequiredFields = 
          m.company_name && 
          m.job_title && 
          m.start_date && 
          m.end_date &&
          m.type === 'job';
        
        if (!hasAllRequiredFields) {
          console.log('[PARSE-RESUME-MILESTONES] Skipping incomplete job:', {
            company: m.company_name || 'MISSING',
            title: m.job_title || 'MISSING',
            start: m.start_date || 'MISSING',
            end: m.end_date || 'MISSING',
            type: m.type
          });
        }
        
        return hasAllRequiredFields;
      })
      .map((m: any) => ({
        vault_id: vaultId,
        user_id: user.id,
        milestone_type: 'job',
        company_name: m.company_name,
        job_title: m.job_title,
        start_date: m.start_date,
        end_date: m.end_date,
        description: m.description || '',
        key_achievements: m.key_achievements || [],
        questions_asked: Math.min(m.estimated_question_count || 3, 3), // Cap at 3 questions per job
        questions_answered: 0,
        completion_percentage: 0,
        intelligence_extracted: 0
      }));

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