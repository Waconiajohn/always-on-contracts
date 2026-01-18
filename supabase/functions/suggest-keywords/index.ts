import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callLovableAI, LOVABLE_AI_MODELS } from "../_shared/lovable-ai-config.ts";
import { logAIUsage } from "../_shared/cost-tracking.ts";
import { extractJSON } from "../_shared/json-parser.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Check if this is the new skills suggestion format
    if (body.type === 'skills' && body.currentSkills && body.jobDescription) {
      return await handleSkillsSuggestion(body);
    }
    
    // Original keyword suggestion flow
    const { content, itemType, industry, targetRole } = body;

    console.log('Generating AI keyword suggestions for:', itemType);

    console.log('[suggest-keywords] Generating keyword suggestions for:', itemType);

    // STANDARDIZED SYSTEM PROMPT
    const systemPrompt = `You are an ATS (Applicant Tracking System) expert and recruiter specializing in keyword optimization.

Your task: Generate targeted keywords that maximize ATS visibility and recruiter attention.

CRITICAL OUTPUT FORMAT - Return ONLY this JSON structure:
{
  "primary_keywords": ["keyword1", "keyword2", "keyword3"],
  "secondary_keywords": ["keyword4", "keyword5", "keyword6"],
  "skill_keywords": ["technical1", "tool2", "framework3"],
  "action_keywords": ["achieved", "implemented", "optimized"],
  "reasoning": "Brief explanation of keyword strategy"
}

Requirements:
- All arrays must be populated
- Keywords must be industry-relevant and ATS-friendly
- Focus on measurable achievements and current terminology
- Avoid generic buzzwords without substance`;

    // STANDARDIZED USER PROMPT
    const userPrompt = `Analyze this career item and suggest ATS-optimized keywords:

CONTENT: "${content}"

CONTEXT:
- Item Type: ${itemType}
- Industry: ${industry || 'General'}
- Target Role: ${targetRole || 'Not specified'}

TASK: Provide 10-15 keywords across all categories that:
1. Match what recruiters actively search for
2. Highlight technical expertise and tools
3. Emphasize leadership and measurable impact
4. Use current industry-standard terminology
5. Are specific and quantifiable (avoid vague terms)

Return your analysis in the required JSON format.`;

    console.log('[suggest-keywords] Calling Lovable AI with MINI model');

    const { response, metrics } = await callLovableAI(
      {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        model: LOVABLE_AI_MODELS.MINI, // Use MINI for reliability
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      },
      "suggest-keywords",
      undefined
    );

    await logAIUsage(metrics);

    const rawContent = response.choices?.[0]?.message?.content;
    
    if (!rawContent) {
      console.error('[suggest-keywords] Empty content from AI');
      throw new Error('AI returned empty response');
    }
    
    console.log('[suggest-keywords] Raw AI response:', rawContent.substring(0, 500));
    
    const parseResult = extractJSON(rawContent);
    
    if (!parseResult.success || !parseResult.data) {
      console.error('[suggest-keywords] JSON parse failed:', parseResult.error);
      console.error('[suggest-keywords] Full response:', rawContent);
      throw new Error(`Failed to parse AI response: ${parseResult.error}`);
    }

    const keywords = parseResult.data;
    
    // EXPLICIT FIELD VALIDATION
    if (!keywords.primary_keywords || !Array.isArray(keywords.primary_keywords)) {
      console.error('[suggest-keywords] Missing or invalid primary_keywords:', keywords);
      throw new Error('AI response missing required field: primary_keywords array');
    }
    
    if (!keywords.secondary_keywords || !Array.isArray(keywords.secondary_keywords)) {
      console.error('[suggest-keywords] Missing or invalid secondary_keywords:', keywords);
      throw new Error('AI response missing required field: secondary_keywords array');
    }
    
    if (!keywords.skill_keywords || !Array.isArray(keywords.skill_keywords)) {
      console.error('[suggest-keywords] Missing or invalid skill_keywords:', keywords);
      throw new Error('AI response missing required field: skill_keywords array');
    }
    
    if (!keywords.action_keywords || !Array.isArray(keywords.action_keywords)) {
      console.error('[suggest-keywords] Missing or invalid action_keywords:', keywords);
      throw new Error('AI response missing required field: action_keywords array');
    }

    console.log('[suggest-keywords] Successfully generated keywords:', {
      primaryCount: keywords.primary_keywords.length,
      secondaryCount: keywords.secondary_keywords.length,
      skillCount: keywords.skill_keywords.length,
      actionCount: keywords.action_keywords.length
    });

    return new Response(
      JSON.stringify({
        success: true,
        keywords
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in suggest-keywords:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Keyword suggestion failed' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// New handler for skills gap analysis
async function handleSkillsSuggestion(body: { currentSkills: string[]; jobDescription: string }) {
  const { currentSkills, jobDescription } = body;
  
  console.log('[suggest-keywords] Analyzing skills gap');
  
  const systemPrompt = `You are an expert resume analyst and ATS specialist.
Analyze the job description and identify skills that are mentioned but missing from the candidate's current skills list.

Return your analysis as a JSON object with this exact structure:
{
  "suggestions": [
    {
      "skill": "Skill Name",
      "relevance": "critical" | "high" | "medium",
      "reason": "Brief explanation of why this skill matters for this role"
    }
  ]
}

Guidelines:
- "critical" = Explicitly required or mentioned multiple times in the job posting
- "high" = Strongly preferred or commonly expected for this type of role
- "medium" = Nice to have or would strengthen the application
- Only suggest skills the candidate could realistically claim (no fake certifications)
- Focus on skills, tools, technologies, and methodologies
- Maximum 10 suggestions, prioritize by relevance`;

  const userPrompt = `CANDIDATE'S CURRENT SKILLS:
${currentSkills.join(', ')}

JOB DESCRIPTION:
${jobDescription.substring(0, 3000)}

Identify skills mentioned in the job description that are NOT in the candidate's current skills list.
Focus on skills that would improve ATS matching and interview chances.`;

  const { response, metrics } = await callLovableAI(
    {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      model: LOVABLE_AI_MODELS.FAST,
      max_tokens: 800,
      response_format: { type: 'json_object' }
    },
    "suggest-keywords-skills",
    undefined
  );

  await logAIUsage(metrics);

  const rawContent = response.choices?.[0]?.message?.content;
  
  if (!rawContent) {
    console.error('[suggest-keywords] Skills: Empty content from AI');
    throw new Error('AI returned empty response');
  }
  
  console.log('[suggest-keywords] Skills analysis response:', rawContent.substring(0, 500));
  
  const parseResult = extractJSON(rawContent);
  
  if (!parseResult.success || !parseResult.data) {
    console.error('[suggest-keywords] Skills JSON parse failed:', parseResult.error);
    throw new Error(`Failed to parse skills response: ${parseResult.error}`);
  }

  const result = parseResult.data;
  
  if (!result.suggestions || !Array.isArray(result.suggestions)) {
    console.error('[suggest-keywords] Missing suggestions array:', result);
    throw new Error('AI response missing required field: suggestions array');
  }

  // Filter out any skills already in the list (case-insensitive)
  const currentSkillsLower = new Set(currentSkills.map(s => s.toLowerCase()));
  const filteredSuggestions = result.suggestions.filter(
    (s: { skill: string }) => !currentSkillsLower.has(s.skill.toLowerCase())
  );

  console.log('[suggest-keywords] Found skill suggestions:', filteredSuggestions.length);

  return new Response(
    JSON.stringify({
      success: true,
      suggestions: filteredSuggestions
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
