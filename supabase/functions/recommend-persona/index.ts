import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callPerplexity, PERPLEXITY_MODELS } from '../_shared/ai-config.ts';
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
    const { jobDescription, agentType } = await req.json();

    if (!jobDescription || !agentType) {
      throw new Error('Job description and agent type are required');
    }

    let personas: any[] = [];
    let systemPrompt = '';

    // Define personas based on agent type
    if (agentType === 'resume') {
      personas = [
        {
          id: 'executive',
          name: 'Executive',
          voiceId: 'JBFqnCBsd6RMkjVDRZzb',
          description: 'Strategic leader focused on business impact and P&L responsibility',
          writingStyle: 'Emphasizes leadership, strategic initiatives, revenue growth, and team management'
        },
        {
          id: 'technical',
          name: 'Technical Expert',
          voiceId: 'pFZP5JQG7iQjIQuC4Bku',
          description: 'Deep technical specialist showcasing expertise and innovation',
          writingStyle: 'Highlights technical depth, certifications, cutting-edge technologies, and complex problem-solving'
        },
        {
          id: 'transitioner',
          name: 'Career Transitioner',
          voiceId: 'EXAVITQu4vr4xnSDxMaL',
          description: 'Adaptable professional pivoting to new opportunities',
          writingStyle: 'Focuses on transferable skills, learning agility, cross-functional experience, and growth mindset'
        }
      ];
      systemPrompt = `Analyze this job description and recommend which resume persona would be most effective. Consider:
- Leadership requirements and P&L responsibility → Executive
- Technical depth and specialized expertise → Technical Expert
- Career pivots or role transitions → Career Transitioner

Return JSON with: { "recommendedPersona": "executive|technical|transitioner", "reasoning": "brief explanation", "confidence": 0-100 }`;

    } else if (agentType === 'interview') {
      personas = [
        {
          id: 'mentor',
          name: 'The Mentor',
          voiceId: 'CwhRBWXzGAHq8TQ4Fs17',
          description: 'Supportive coach building your confidence',
          style: 'Warm, encouraging, builds confidence through positive reinforcement'
        },
        {
          id: 'challenger',
          name: 'The Challenger',
          voiceId: 'TX3LPaxmHKxFdv7VOQHJ',
          description: 'Tough interviewer preparing you for adversity',
          style: 'Direct, demanding, pushes you with difficult questions'
        },
        {
          id: 'strategist',
          name: 'The Strategist',
          voiceId: 'nPczCjzI2devNBz1zQrb',
          description: 'Analytical expert optimizing your responses',
          style: 'Methodical, analytical, focuses on structure and technique'
        }
      ];
      systemPrompt = `Analyze this job description and recommend which interview persona would best prepare the candidate. Consider:
- Junior roles or confidence-building needed → Mentor
- High-pressure roles or stress testing needed → Challenger
- Strategic/consulting roles or structured thinking needed → Strategist

Return JSON with: { "recommendedPersona": "mentor|challenger|strategist", "reasoning": "brief explanation", "confidence": 0-100 }`;

    } else if (agentType === 'networking') {
      personas = [
        {
          id: 'relationship_builder',
          name: 'Relationship Builder',
          description: 'Warm connector focused on authentic relationships',
          emailTone: 'Warm, personal, emphasizes mutual benefit and long-term connection'
        },
        {
          id: 'strategic_connector',
          name: 'Strategic Connector',
          description: 'Professional networker with clear objectives',
          emailTone: 'Professional, goal-oriented, emphasizes value exchange and clear next steps'
        },
        {
          id: 'data_driven',
          name: 'Data-Driven Networker',
          description: 'Results-focused with metrics and efficiency',
          emailTone: 'Concise, results-focused, emphasizes ROI and measurable outcomes'
        }
      ];
      systemPrompt = `Analyze this job description and recommend which networking persona would be most effective. Consider:
- Relationship-focused roles (sales, client-facing) → Relationship Builder
- Strategic roles (BD, partnerships, consulting) → Strategic Connector
- Data/analytics/efficiency roles → Data-Driven Networker

Return JSON with: { "recommendedPersona": "relationship_builder|strategic_connector|data_driven", "reasoning": "brief explanation", "confidence": 0-100 }`;
    }

    const { response, metrics } = await callPerplexity(
      {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Job Description:\n\n${jobDescription}` }
        ],
        model: PERPLEXITY_MODELS.DEFAULT,
        temperature: 0.3,
        max_tokens: 1000,
        return_citations: false,
      },
      'recommend-persona'
    );

    await logAIUsage(metrics);

    const content = response.choices[0].message.content;
    
    // Extract JSON from response (Perplexity returns JSON in content)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No recommendation returned');
    }

    const recommendation = JSON.parse(jsonMatch[0]);

    return new Response(
      JSON.stringify({
        ...recommendation,
        personas,
        success: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in recommend-persona:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
