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
    const { currentHeadline, currentAbout, targetRole, industry, skills } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an elite LinkedIn profile optimization expert specializing in executive branding and recruiter psychology.

PROFILE OPTIMIZATION FRAMEWORK:

HEADLINE OPTIMIZATION (120 characters):
- Formula: [Role/Identity] | [Value Proposition] | [Unique Differentiator]
- Include searchable keywords (avoid buzzwords)
- Lead with impact, not job title
- Example: "VP Product → 3 SaaS Unicorns | Building AI-First Teams | Ex-Google, Stanford MBA"

ABOUT SECTION OPTIMIZATION (2600 characters max):
Structure:
1. HOOK (First 2 lines - visible without "see more"):
   - Provocative statement or compelling question
   - Pattern interruption for profile visitors

2. CREDIBILITY STACK (Lines 3-6):
   - Quantified achievements
   - Brand-name experience
   - Unique expertise intersection

3. VALUE NARRATIVE (Main body):
   - Problem you solve
   - Approach/methodology
   - Results delivered (with numbers)
   - Client/company types you serve

4. PERSONAL TOUCH:
   - Authentic detail (hobby, passion, quirk)
   - Humanizes expertise

5. CALL-TO-ACTION:
   - How to connect
   - What collaboration looks like
   - Contact preference

KEYWORD OPTIMIZATION:
- Identify top 15 recruiter search terms for target role
- Natural integration (no keyword stuffing)
- Front-load important terms
- Include role variations and synonyms

SKILLS PRIORITIZATION:
- Top 3 skills weighted heavily by algorithm
- Balance hard skills + leadership skills
- Endorsement magnets (clear, specific)
- Industry-standard terminology

SCORING DIMENSIONS (0-100):
- Keyword density and placement
- Headline impact and clarity
- About section storytelling
- Skills relevance and endorsability
- Overall recruiter appeal

Return JSON:
{
  "optimizedHeadline": "New headline",
  "optimizedAbout": "Full about section with line breaks",
  "prioritizedSkills": ["Skill 1", "Skill 2", ...],
  "keywordStrategy": {
    "primary": ["keyword1", "keyword2"],
    "secondary": ["keyword3", "keyword4"],
    "placement": "Where to emphasize keywords"
  },
  "optimizationScore": 0-100,
  "improvements": [
    { "area": "headline|about|skills", "change": "What changed", "impact": "Why it matters" }
  ],
  "recruiterAppeal": "Score with reasoning",
  "beforeAfterComparison": {
    "searchability": "Before: X/10, After: Y/10",
    "clarity": "Assessment",
    "memorability": "Assessment"
  }
}`;

    const userPrompt = `Optimize this LinkedIn profile:

CURRENT HEADLINE: ${currentHeadline || 'Not provided'}
CURRENT ABOUT: ${currentAbout || 'Not provided'}
TARGET ROLE: ${targetRole}
INDUSTRY: ${industry}
CURRENT SKILLS: ${skills?.join(', ') || 'Not provided'}

Provide comprehensive optimization focused on recruiter visibility and executive presence.`;

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
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI optimization failed: ${response.status}`);
    }

    const data = await response.json();
    const optimizationResult = data.choices[0].message.content;

    let parsedResult;
    try {
      const jsonMatch = optimizationResult.match(/\{[\s\S]*\}/);
      parsedResult = JSON.parse(jsonMatch ? jsonMatch[0] : optimizationResult);
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      parsedResult = {
        optimizedHeadline: currentHeadline,
        optimizedAbout: currentAbout,
        prioritizedSkills: skills || [],
        keywordStrategy: { primary: [], secondary: [], placement: "" },
        optimizationScore: 50,
        improvements: [],
        recruiterAppeal: "Analysis unavailable"
      };
    }

    return new Response(JSON.stringify(parsedResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in optimize-linkedin-profile:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});