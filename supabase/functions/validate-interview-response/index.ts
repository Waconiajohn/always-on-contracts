import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callPerplexity, cleanCitations } from '../_shared/ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { selectOptimalModel } from '../_shared/model-optimizer.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, answer, selected_guided_options } = await req.json();

    if (!question || !answer) {
      throw new Error('Question and answer are required');
    }

    // Handle both formats: checkbox selections + custom text, or plain text
    let combinedAnswer = '';
    if (typeof answer === 'object' && 'selected_options' in answer) {
      const selectedOptions = (answer.selected_options || []).join('; ');
      const customText = answer.custom_text || '';
      combinedAnswer = selectedOptions + (customText ? `\n\nAdditional details: ${customText}` : '');
    } else {
      combinedAnswer = answer;
    }

    // PHASE 4 FIX: Acknowledge improvement efforts
    const improvementContext = selected_guided_options && selected_guided_options.length > 0
      ? `\n\nUSER IS ACTIVELY IMPROVING THEIR ANSWER:
They selected these enhancement areas: ${selected_guided_options.join(', ')}

CRITICAL: If they added ANY additional detail after selecting improvement areas, increase the score by 10-20 points minimum to acknowledge their effort. Be encouraging!`
      : '';

    // Use Perplexity AI to validate the response quality with guided enhancement options
    const validationPrompt = `You are validating an interview response for completeness and quality.

QUESTION ASKED:
${question}

USER'S ANSWER:
${combinedAnswer}${improvementContext}

CRITICAL SCORING RULES (MUST FOLLOW):
1. Count the number of checkboxes selected (look for semicolons or multiple items in selected_options)
2. Apply MINIMUM scores based on checkbox count:
   - 3-4 checkboxes selected: MINIMUM score = 65
   - 5-6 checkboxes selected: MINIMUM score = 75
   - 7+ checkboxes selected: MINIMUM score = 85
3. If custom text is also provided with 5+ checkboxes, score should be 85+
4. ONLY score below 60 if: fewer than 3 checkboxes AND no meaningful custom text

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
        "Name specific technologies/tools used",
        "Mention specific methodologies or frameworks",
        "Reference particular projects or initiatives",
        "Describe concrete examples or scenarios",
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

CRITICAL VALIDATION RULES: 
- If quality_score >= 70: DO NOT include guided_prompts field AT ALL, set is_sufficient to true, and provide encouraging follow_up_prompt
- If quality_score >= 60 but < 70: Include minimal guided_prompts, acknowledge strong foundation
- If quality_score < 60: Include guided_prompts for missing elements
- Always be encouraging and constructive in follow_up_prompt
- If many checkboxes were selected, acknowledge breadth of experience in strengths
- When score >= 70, celebrate the quality and mention they can continue`;

    console.log('Validating interview response');
    const { response: aiResponse, metrics } = await callPerplexity(
      {
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert interview coach validating response quality. Return only valid JSON.' 
          },
          { role: 'user', content: validationPrompt }
        ],
        model: selectOptimalModel({
          taskType: 'analysis',
          complexity: 'medium',
          requiresReasoning: true,
          outputLength: 'medium'
        }),
      },
      'validate-interview-response'
    );

    await logAIUsage(metrics);

    const validationText = cleanCitations(aiResponse.choices[0].message.content).trim();
    
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
