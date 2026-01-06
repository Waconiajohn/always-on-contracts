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
    const { requirement, category, explanation, currentLanguage, resumeEvidence, jobContext } = await req.json();
    
    if (!requirement) {
      throw new Error('Requirement is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert resume writer who creates compelling, truthful resume language. You NEVER fabricate experience - you only help position real experience strategically.

Generate four alternative phrasings for a resume bullet, each in a different tone:
1. FORMAL - Professional, traditional business language
2. TECHNICAL - Precise, industry-specific terminology
3. CONVERSATIONAL - Approachable, personable tone
4. EXECUTIVE - Strategic, leadership-focused language

Each phrasing must:
- Be truthful and based only on the provided evidence
- Address the specific job requirement
- Be concise (1-2 sentences max)
- Use action verbs and quantify where possible`;

    const userPrompt = `Generate four alternative resume bullet phrasings for this requirement:

REQUIREMENT: ${requirement}
CATEGORY: ${category}
CONTEXT: ${explanation}
CURRENT LANGUAGE: ${currentLanguage}
RESUME EVIDENCE: ${resumeEvidence?.join('; ') || 'No specific evidence provided'}
${jobContext?.title ? `JOB TITLE: ${jobContext.title}` : ''}
${jobContext?.company ? `COMPANY: ${jobContext.company}` : ''}

Return a JSON object with this structure:
{
  "alternatives": {
    "formal": "Professional, traditional phrasing...",
    "technical": "Precise, technical phrasing...",
    "conversational": "Approachable, personable phrasing...",
    "executive": "Strategic, leadership-focused phrasing..."
  }
}`;

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
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
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
      throw new Error('Failed to parse language suggestions');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Generate strategic language error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
