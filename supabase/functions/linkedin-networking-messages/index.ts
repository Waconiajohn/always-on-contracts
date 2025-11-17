import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type NetworkingScenario = 
  | 'cold_connection'
  | 'warm_intro'
  | 'recruiter_outreach'
  | 'hiring_manager'
  | 'post_application_followup'
  | 'thank_you'
  | 'informational_interview';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      scenario,
      targetProfile,
      candidateProfile,
      constraints,
      jobContext
    } = await req.json();

    if (!scenario || !targetProfile || !candidateProfile) {
      throw new Error('Scenario, target profile, and candidate profile are required');
    }

    // Auth with JWT
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: req.headers.get("Authorization")! },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const maxWords = constraints?.maxWords || 150;
    const tone = constraints?.tone || 'professional';
    const avoid = constraints?.avoid || [];

    const scenarioGuidelines: Record<NetworkingScenario, string> = {
      cold_connection: 'Brief connection request. Establish common ground. Show genuine interest. No hard asks.',
      warm_intro: 'Reference mutual connection. Express specific interest. Suggest low-commitment next step.',
      recruiter_outreach: 'Highlight relevant achievements. Express interest in opportunities. Include availability.',
      hiring_manager: 'Reference specific role. Demonstrate fit. Show company knowledge. Request conversation.',
      post_application_followup: 'Acknowledge application. Reiterate interest. Add one new insight. Respectful timing.',
      thank_you: 'Express genuine gratitude. Reference specific discussion points. Suggest concrete next step.',
      informational_interview: 'Show research on their work. Ask for 15-20 min call. Offer flexibility.'
    };

    const systemPrompt = `You are an expert networking communication strategist focused on authentic, professional outreach.

SCENARIO: ${scenario.replace('_', ' ')}
Guidelines: ${scenarioGuidelines[scenario as NetworkingScenario]}

COMMUNICATION PRINCIPLES:
- Be genuine and specific (no generic templates)
- Lead with value or common ground
- Respect their time (max ${maxWords} words)
- Tone: ${tone}
- NEVER use these words: ${avoid.join(', ') || 'none'}

TARGET PROFILE:
Name: ${targetProfile.name || 'Not provided'}
Title: ${targetProfile.title || 'Not provided'}
Company: ${targetProfile.company || 'Not provided'}
${jobContext ? `
JOB CONTEXT:
Target Role: ${jobContext.jobTitle}
Reference: ${jobContext.jobRef || 'N/A'}
Source: ${jobContext.jobSource || 'Direct'}
` : ''}
Shared Context: ${targetProfile.sharedContext || 'None'}

CANDIDATE PROFILE:
Headline: ${candidateProfile.headline}
Background: ${candidateProfile.careerVaultSummary}
Relevant Achievements:
${candidateProfile.relevantAchievements?.map((a: string, i: number) => `${i + 1}. ${a}`).join('\n') || 'None provided'}

CRITICAL RULES:
- Reference specific details about target (their work, company, shared context)
- Mention 1 relevant achievement that shows credibility
- Include clear, low-pressure CTA
- Sound human, not templated
- No buzzwords: synergy, rockstar, guru, world-class, cutting-edge
- Max 4-6 sentences

Return JSON with 3 message variants:
{
  "messages": [
    {
      "variant": "direct",
      "channel": "connection_request",
      "subject": "Optional subject line",
      "body": "The message text",
      "rationale": "Why this approach works",
      "followUpSuggestion": "Optional 2nd touchpoint idea"
    }
  ]
}`;

    const userPrompt = `Generate 3 networking message variants for this scenario: ${scenario.replace('_', ' ')}

Requirements:
- Max ${maxWords} words each
- ${tone} tone
- Reference: ${targetProfile.sharedContext || 'their work at ' + targetProfile.company}
- Highlight relevant achievement without bragging
${jobContext?.jobTitle ? `- Mention interest in: ${jobContext.jobTitle}` : ''}

Provide:
1. Direct variant (straightforward, confident)
2. Warm variant (friendly, conversational)
3. Brief variant (ultra-concise, under 100 words)`;

    console.log(`[Networking] Generating messages for scenario: ${scenario}`);

    const { response, metrics } = await callLovableAI(
      {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: LOVABLE_AI_MODELS.DEFAULT,
        temperature: 0.8,
        max_tokens: 1500
      },
      'linkedin-networking-messages',
      user.id
    );

    await logAIUsage(metrics);

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    const result = JSON.parse(jsonMatch[0]);

    console.log(`[Networking] Generated ${result.messages?.length || 0} message variants`);

    return new Response(
      JSON.stringify({
        success: true,
        ...result,
        metadata: {
          scenario,
          tone,
          maxWords,
          targetCompany: targetProfile.company
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[Networking Error]:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: error.message === 'Unauthorized' ? 401 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
