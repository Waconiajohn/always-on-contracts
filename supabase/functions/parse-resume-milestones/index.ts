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

    const systemPrompt = `You are an expert resume parser. Extract discrete career milestones (jobs, projects, achievements) from resumes in a structured format.`;

    const prompt = `Parse this resume into structured milestones. Focus on extracting:

1. **Jobs**: Each position held with company, title, dates, key responsibilities
2. **Major Projects**: Significant projects with clear outcomes
3. **Key Achievements**: Quantifiable accomplishments that stand alone

RESUME TEXT:
${resumeText}

Return as JSON:
{
  "milestones": [
    {
      "type": "job|project|achievement",
      "company_name": "Company name (for jobs)",
      "job_title": "Job title (for jobs)",
      "start_date": "YYYY-MM or just year",
      "end_date": "YYYY-MM or 'Present'",
      "description": "Brief summary",
      "key_achievements": ["Achievement 1", "Achievement 2"],
      "estimated_question_count": 2-5 (based on role seniority/impact)
    }
  ],
  "total_estimated_questions": 25-50
}

Guidelines:
- For senior roles or longer tenures: 3-5 questions
- For junior roles or short tenures: 2-3 questions
- For major projects: 2-4 questions
- For achievements: 1-2 questions
- Prioritize roles/projects with quantifiable impact`;

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

    // Save milestones to database
    const milestoneInserts = parsed.milestones.map((m: any) => ({
      vault_id: vaultId,
      user_id: user.id,
      milestone_type: m.type,
      company_name: m.company_name,
      job_title: m.job_title,
      start_date: m.start_date,
      end_date: m.end_date,
      description: m.description,
      key_achievements: m.key_achievements || [],
      questions_asked: m.estimated_question_count || 3,
      completion_percentage: 0
    }));

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