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
    const { resumeText, jobDescription, careerProfile } = await req.json();
    
    if (!resumeText || !jobDescription) {
      throw new Error('Resume text and job description are required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert career strategist and hiring manager. Your job is to perform a deep, honest analysis of how well a candidate's resume matches a specific job description.

You must categorize EVERY job requirement into one of three categories:
1. HIGHLY QUALIFIED - Clear match with strong evidence from resume
2. PARTIALLY QUALIFIED - Some relevant experience but needs strategic positioning
3. EXPERIENCE GAP - Missing qualification requiring creative addressing

For each requirement, provide:
- A clear explanation of why it falls into that category
- For partial/gaps: what specific experience they have and what's missing
- Suggested resume language that is TRUTHFUL (never fabricate experience)
- A confidence level: "very-high", "high", "moderate", or "low"
- Evidence citations from the actual resume

Be honest but constructive. The goal is to help position real experience strategically, not to fabricate qualifications.`;

    const userPrompt = `Analyze this resume against the job description. Extract ALL requirements from the job and categorize each one.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

${careerProfile ? `CAREER PROFILE CONTEXT:
- Years of experience: ${careerProfile.yearsOfExperience}
- Seniority: ${careerProfile.seniority}
- Industries: ${careerProfile.industries?.join(', ')}
- Technical expertise: ${careerProfile.technicalExpertise?.join(', ')}` : ''}

Return a JSON object with this exact structure:
{
  "highlyQualified": [
    {
      "id": "hq-1",
      "requirement": "The job requirement text",
      "category": "highly-qualified",
      "explanation": "Why this is a strong match",
      "suggestedLanguage": "Specific resume bullet to emphasize this strength",
      "confidence": "very-high",
      "resumeEvidence": ["Specific quote from resume showing this experience"],
      "alternatives": []
    }
  ],
  "partiallyQualified": [
    {
      "id": "pq-1",
      "requirement": "The job requirement text",
      "category": "partially-qualified",
      "explanation": "Why this matters for the role",
      "yourExperience": "What relevant experience they have",
      "whatsGap": "What specific experience or skills are missing",
      "suggestedLanguage": "Strategic positioning language that stays truthful",
      "confidence": "moderate",
      "resumeEvidence": ["Related experience from resume"],
      "alternatives": [
        {
          "id": "alt-1",
          "tone": "formal",
          "text": "Alternative phrasing in formal tone",
          "rationale": "Why this positioning works"
        }
      ]
    }
  ],
  "experienceGaps": [
    {
      "id": "eg-1",
      "requirement": "The job requirement text",
      "category": "experience-gap",
      "explanation": "Why this qualification is important",
      "yourExperience": "Any tangentially related experience",
      "whatsGap": "The core skill or experience that is missing",
      "suggestedLanguage": "How to address this gap honestly (e.g., willingness to learn, transferable skills)",
      "confidence": "low",
      "resumeEvidence": [],
      "alternatives": [
        {
          "id": "alt-1",
          "tone": "executive",
          "text": "Executive-level positioning for the gap",
          "rationale": "Strategic approach to this gap"
        }
      ]
    }
  ],
  "overallFitScore": 72,
  "summary": "One-sentence summary of the overall fit assessment"
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
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits to continue.' }), {
          status: 402,
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

    // Parse the JSON response
    let analysisResult;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      analysisResult = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse analysis result');
    }

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Deep fit analysis error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
