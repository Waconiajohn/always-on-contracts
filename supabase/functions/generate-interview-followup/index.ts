import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      console.error('[generate-interview-followup] Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { jobProjectId, communicationType, customInstructions } = await req.json();

    // Fetch job project details
    const { data: project, error: projectError } = await supabaseClient
      .from('job_projects')
      .select('*, opportunity:job_opportunities(*)')
      .eq('id', jobProjectId)
      .single();

    if (projectError || !project) {
      throw new Error('Job project not found');
    }

    // Fetch Master Resume data
    const { data: resumeData } = await supabaseClient
      .from('career_vault')
      .select(`
        *,
        vault_power_phrases(*),
        vault_hidden_competencies(*),
        vault_transferable_skills(*)
      `)
      .eq('user_id', user.id)
      .single();

    // Fetch user profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('full_name, email')
      .eq('user_id', user.id)
      .single();

    // Define timing based on communication type
    let timing = '';
    switch (communicationType) {
      case 'thank_you':
        timing = 'Send within 24 hours of interview';
        break;
      case 'follow_up':
        timing = 'Send 5-7 days after last contact';
        break;
      case 'check_in':
        timing = 'Send 2 weeks after interview if no response';
        break;
    }

    // STANDARDIZED SYSTEM PROMPT
    const systemPrompt = `You are an expert career coach writing professional follow-up communications after job interviews.

Your task: Create ${communicationType.replace('_', ' ')} emails that are warm, professional, and reference specific discussion points.

CRITICAL RULES:
- Professional but warm tone
- Reference specific competencies that align with the role
- Keep under 150 words
- Include specific call-to-action
- ${timing}

CRITICAL OUTPUT FORMAT - Return ONLY this JSON structure:
{
  "subject": "Email subject line",
  "body": "Email body text",
  "sendingTips": ["timing tip", "personalization tip"],
  "followUpTimeline": "When to send next communication"
}`;

    // STANDARDIZED USER PROMPT
    const userPrompt = `Generate a professional ${communicationType.replace('_', ' ')} email:

JOB DETAILS:
- Position: ${project.job_title}
- Company: ${project.company_name}
- Interview Date: ${project.interview_date || 'Recent'}
- Interview Stage: ${project.interview_stage || 'Not specified'}
- Interviewer: ${project.interviewer_name || 'Hiring team'}

CANDIDATE INFO:
- Name: ${profile?.full_name || 'The candidate'}
- Key Competencies: ${resumeData?.vault_hidden_competencies?.map((c: any) => c.competency_area).join(', ') || 'N/A'}
- Notable Skills: ${resumeData?.vault_transferable_skills?.slice(0, 5).map((s: any) => s.stated_skill).join(', ') || 'N/A'}

CUSTOM INSTRUCTIONS: ${customInstructions || 'None'}

REQUIREMENTS:
1. Professional but warm tone
2. Reference specific competencies
3. Keep under 150 words
4. Include specific call-to-action
5. ${timing}

Return your email in the required JSON format.`;

    console.log('[GENERATE-INTERVIEW-FOLLOWUP] Calling Lovable AI');

    const { response, metrics } = await callLovableAI(
      {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: LOVABLE_AI_MODELS.DEFAULT,
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      },
      'generate-interview-followup',
      user.id
    );

    await logAIUsage(metrics);

    const content = response.choices[0].message.content;

    // Parse JSON from response
    let generatedContent;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      generatedContent = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      generatedContent = {
        subject: `Following up on ${project.job_title} Interview`,
        body: content,
        timing: timing,
        tips: []
      };
    }

    return new Response(
      JSON.stringify({
        ...generatedContent,
        defaultTiming: timing,
        variables: {
          interviewer_name: project.interviewer_name,
          company_name: project.company_name,
          position_title: project.job_title,
          interview_date: project.interview_date,
          interview_stage: project.interview_stage,
          candidate_name: profile?.full_name
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error generating follow-up:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
