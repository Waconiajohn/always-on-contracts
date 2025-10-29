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
    const { vaultId, resumeData, industryResearch, targetRole, targetIndustry } = await req.json();

    console.log('[GENERATE-QUESTIONS] Generating intelligent questions for vault:', vaultId);

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build AI prompt for question generation
    const prompt = `
You are an AI career coach generating intelligent questions to build a comprehensive career vault.

RESUME DATA:
${JSON.stringify(resumeData, null, 2)}

INDUSTRY STANDARDS (${targetRole} in ${targetIndustry}):
${JSON.stringify(industryResearch, null, 2)}

Generate 15-20 targeted questions that:
1. QUANTIFY vague achievements (e.g., "led team" → ask team size, budget)
2. PROBE FOR GAPS in industry-expected experiences
3. DISCOVER HIDDEN ACHIEVEMENTS not on resume
4. IDENTIFY TRANSFERABLE SKILLS and soft skills
5. EXPLORE COMPETITIVE ADVANTAGES unique to this person

Return a JSON array of question objects with this structure:
[
  {
    "id": "q1",
    "type": "quantify_achievement|gap_probe|hidden_achievement|soft_skills|competitive_advantage",
    "category": "leadership_scope|regulatory|board_experience|soft_skills|etc",
    "question": "Clear, specific question",
    "inputType": "multiple_choice|checkbox_grid|range_slider|textarea|yes_no_expand",
    "options": [
      { "value": "option1", "label": "Display text", "icon": "emoji" }
    ],
    "followUp": "Optional follow-up question if they select certain options",
    "why": "Why this question matters (shown to user)",
    "impactScore": 15,
    "priority": 1-3
  }
]

CRITICAL RULES:
- Only ask questions that ADD VALUE beyond the resume
- Make options actionable and specific
- Use emojis for visual appeal
- Group related questions by category
- Prioritize high-impact questions
- Don't ask about things already clearly stated in resume
`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          {
            role: 'system',
            content: 'You are an expert career coach who generates targeted questions to build comprehensive career profiles. Always respond with valid JSON arrays.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const questionsContent = aiData.choices[0]?.message?.content || '[]';
    
    // Extract JSON from markdown if present
    let questions;
    try {
      const jsonMatch = questionsContent.match(/```json\n([\s\S]*?)\n```/) || 
                       questionsContent.match(/```\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : questionsContent;
      questions = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('[GENERATE-QUESTIONS] Parse error:', parseError);
      questions = [];
    }

    // Sort by priority and impact
    questions.sort((a: any, b: any) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return (b.impactScore || 0) - (a.impactScore || 0);
    });

    // Group questions by category for batching
    const questionBatches: any[] = [];
    const categories = [...new Set(questions.map((q: any) => q.category))];
    
    for (const category of categories) {
      const categoryQuestions = questions.filter((q: any) => q.category === category);
      questionBatches.push({
        category,
        questions: categoryQuestions.slice(0, 5), // Max 5 questions per batch
        totalImpact: categoryQuestions.reduce((sum: number, q: any) => sum + (q.impactScore || 0), 0)
      });
    }

    console.log('[GENERATE-QUESTIONS] Generated', questions.length, 'questions in', questionBatches.length, 'batches');

    return new Response(
      JSON.stringify({
        success: true,
        questions,
        questionBatches,
        totalQuestions: questions.length,
        metadata: {
          targetRole,
          targetIndustry,
          vaultId
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[GENERATE-QUESTIONS] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
