import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
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

    // Fetch Career Vault data
    const { data: vault } = await supabaseClient
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

    // Build AI prompt based on communication type
    let systemPrompt = '';
    let timing = '';

    switch (communicationType) {
      case 'thank_you':
        systemPrompt = `You are an expert career coach writing a professional thank you email after a job interview. 
The email should be warm, genuine, and reference specific discussion points from the interview.`;
        timing = 'Send within 24 hours of interview';
        break;
      case 'follow_up':
        systemPrompt = `You are an expert career coach writing a professional follow-up email to check on interview status.
The email should be polite, express continued interest, and not sound desperate.`;
        timing = 'Send 5-7 days after last contact';
        break;
      case 'check_in':
        systemPrompt = `You are an expert career coach writing a professional check-in email to maintain rapport.
The email should be brief, value-adding, and keep the relationship warm.`;
        timing = 'Send 2 weeks after interview if no response';
        break;
    }

    const userPrompt = `
Generate a professional ${communicationType.replace('_', ' ')} email for:

**Job Details:**
- Position: ${project.job_title}
- Company: ${project.company_name}
- Interview Date: ${project.interview_date || 'Recent'}
- Interview Stage: ${project.interview_stage || 'Not specified'}
- Interviewer: ${project.interviewer_name || 'Hiring team'}

**Candidate Info:**
- Name: ${profile?.full_name || 'The candidate'}
- Key Competencies: ${vault?.vault_hidden_competencies?.map((c: any) => c.competency_area).join(', ') || 'N/A'}
- Notable Skills: ${vault?.vault_transferable_skills?.slice(0, 5).map((s: any) => s.stated_skill).join(', ') || 'N/A'}

**Custom Instructions:** ${customInstructions || 'None'}

**Requirements:**
1. Professional but warm tone
2. Reference specific competencies that align with the role
3. ${communicationType === 'thank_you' ? 'Express gratitude and reiterate interest' : 'Politely inquire about status'}
4. Keep under 200 words
5. Include a clear call-to-action
6. Use STAR method highlights if applicable

Return a JSON object with:
{
  "subject": "Email subject line",
  "body": "Email body with proper formatting (use \\n for line breaks)",
  "timing": "Recommended send time",
  "tips": ["Tip 1", "Tip 2", "Tip 3"]
}
`;

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
