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

    // Use Lovable AI to validate the response quality with guided enhancement options
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

Return JSON with guided prompts for missing elements:
{
  "is_sufficient": boolean,
  "quality_score": number (0-100),
  "missing_elements": ["specificity", "quantification", "context", "impact"],
  "follow_up_prompt": "Friendly message explaining what's missing",
  "strengths": ["what they did well"],
  "guided_prompts": {
    "specificity": {
      "question": "Can you add more specific details?",
      "options": [
        "Named specific technologies/tools used",
        "Mentioned specific methodologies or frameworks",
        "Referenced particular projects or initiatives",
        "Described concrete examples or scenarios",
        "I don't remember more specifics"
      ]
    },
    "quantification": {
      "question": "What was the measurable impact?",
      "options": [
        "10-25% improvement",
        "25-50% improvement", 
        "50-100% improvement",
        "100%+ improvement or transformation",
        "Saved specific $ amount or hours",
        "Reduced costs or increased revenue by X%",
        "I don't remember specific numbers"
      ]
    },
    "context": {
      "question": "What was the team and project context?",
      "options": [
        "Solo project or individual contributor",
        "Small team (2-5 people)",
        "Medium team (6-15 people)",
        "Large team (15+ people)",
        "Timeline: weeks",
        "Timeline: months",
        "Timeline: years",
        "I don't remember team size or timeline"
      ]
    },
    "impact": {
      "question": "What were the outcomes and results?",
      "options": [
        "Improved efficiency or productivity",
        "Increased revenue or sales",
        "Reduced costs or waste",
        "Enhanced customer/user satisfaction",
        "Solved critical business problem",
        "Enabled new capabilities or features",
        "Received recognition or awards",
        "I can't recall specific outcomes"
      ]
    }
  }
}

IMPORTANT: 
- Only include guided_prompts for elements that are actually missing
- If quality_score >= 70, set is_sufficient to true
- Be encouraging and constructive in follow_up_prompt
- Acknowledge strengths while suggesting improvements`;

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
