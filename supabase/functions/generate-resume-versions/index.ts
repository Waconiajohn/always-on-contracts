import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumeText, jobDescription, gapAnalysis, selectedAnswers, customization, careerProfile } = await req.json();
    
    if (!resumeText || !jobDescription) {
      throw new Error('Resume text and job description are required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert resume strategist. Generate 2-3 distinct resume versions, each with a different strategic emphasis.

Each version should:
- Use the same base content but emphasize different strengths
- Be truthful (never fabricate experience)
- Be optimized for ATS systems
- Include clear section headers: Summary, Experience, Skills, Education

Version types to create:
1. LEADERSHIP EMPHASIS - Highlights management and team accomplishments
2. TECHNICAL DEPTH - Showcases technical skills and project complexity
3. RESULTS FOCUS - Emphasizes measurable outcomes and business impact`;

    const userPrompt = `Generate strategic resume versions based on this analysis:

ORIGINAL RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

CUSTOMIZATION:
- Intensity: ${customization?.intensity || 'moderate'}
- Tone: ${customization?.tone || 'formal'}

${selectedAnswers && Object.keys(selectedAnswers).length > 0 ? `USER-SELECTED LANGUAGE:
${Object.entries(selectedAnswers).map(([id, text]) => `- ${id}: ${text}`).join('\n')}` : ''}

${careerProfile ? `CAREER PROFILE:
- Years: ${careerProfile.yearsOfExperience}
- Industries: ${careerProfile.industries?.join(', ')}
- Expertise: ${careerProfile.technicalExpertise?.join(', ')}` : ''}

Return a JSON object with this structure:
{
  "versions": [
    {
      "id": "version-1",
      "name": "Leadership Focus",
      "emphasis": "leadership",
      "description": "Emphasizes management experience and team outcomes",
      "score": 78,
      "sections": [
        {
          "id": "summary",
          "type": "summary",
          "title": "Professional Summary",
          "content": ["Summary paragraph here..."]
        },
        {
          "id": "experience",
          "type": "experience",
          "title": "Professional Experience",
          "content": ["Bullet 1", "Bullet 2", "Bullet 3"]
        },
        {
          "id": "skills",
          "type": "skills",
          "title": "Skills",
          "content": ["Skill 1", "Skill 2", "Skill 3"]
        }
      ]
    }
  ]
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from AI');
    }

    let result;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      result = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse resume versions');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Generate resume versions error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
