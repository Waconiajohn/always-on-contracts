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
    const { question, answer } = await req.json();

    if (!question || !answer) {
      throw new Error('Question and answer are required');
    }

    // Use Lovable AI to validate the response quality
    const validationPrompt = `You are validating an interview response for completeness and quality.

QUESTION ASKED:
${question}

USER'S ANSWER:
${answer}

Evaluate this answer for:
1. Specificity (Are there concrete details, not vague statements?)
2. Quantification (Are there numbers, metrics, percentages, dollar amounts?)
3. Context (Team size, timeline, technologies/tools mentioned?)
4. Impact (Results, outcomes, what changed?)

Return JSON:
{
  "is_sufficient": boolean,
  "quality_score": number (0-100),
  "missing_elements": ["element1", "element2"],
  "follow_up_prompt": "Friendly follow-up message asking for missing details, or empty string if sufficient",
  "strengths": ["what they did well"]
}

If the answer is too vague, generic, or missing key details, set is_sufficient to false and provide a helpful follow_up_prompt.
If the answer is good, set is_sufficient to true and follow_up_prompt to empty string.`;

    console.log('Validating interview response');
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert interview coach validating response quality. Return only valid JSON.' 
          },
          { role: 'user', content: validationPrompt }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`Failed to validate response: ${response.status}`);
    }

    const aiResponse = await response.json();
    const validationText = aiResponse.choices[0].message.content.trim();
    
    // Extract JSON from response
    const jsonMatch = validationText.match(/\{[\s\S]*\}/);
    const validation = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      is_sufficient: true,
      quality_score: 70,
      missing_elements: [],
      follow_up_prompt: "",
      strengths: []
    };

    return new Response(
      JSON.stringify(validation),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error validating interview response:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        is_sufficient: true, // Default to accepting the answer on error
        quality_score: 70,
        missing_elements: [],
        follow_up_prompt: "",
        strengths: []
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
