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
    const { 
      resumeText, 
      jobDescription, 
      fitBlueprint, 
      missingBulletResponses, 
      customization 
    } = await req.json();
    
    if (!resumeText || !jobDescription || !fitBlueprint) {
      throw new Error('Resume text, job description, and fit blueprint are required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are a resume writer who produces "benchmark resumes" that hiring teams compare others against. Your writing is crisp, metrics-forward, and structurally aligned to the job's evaluation rubric. You never fabricate.

HARD RULES:
- No fabricated metrics, tools, titles, or ownership
- Every bullet must be supported by evidence IDs from the blueprint
- If a requirement is a true gap, you may only: de-emphasize it, reframe adjacent experience, or include it in a "Development / Exposure" line (optional), never as a claim

BUILD INSTRUCTIONS:

STEP 1 — CHOOSE THE TARGET TITLE & BRANDING LINE
Use the JD title or a close match (truthful).
Add a branding line that matches the role's core outcomes.

STEP 2 — WRITE A "BENCHMARK" SUMMARY (5–7 lines)
Must include:
- Scope (years, domains)
- Lifecycle ownership (onboarding → adoption → support → renewal)
- Cross-functional leadership
- 1–2 concrete proof points (from evidence)

STEP 3 — CORE COMPETENCIES SECTION
12–16 items aligned to the JD keywords and requirements.

STEP 4 — EXPERIENCE REWRITE
For each role:
- 1-line role framing that matches the JD outcomes
- 5–8 bullets that map to requirements
- Order bullets by: business outcomes → leadership → systems → tooling
- Each bullet ends with evidence tag in brackets for internal traceability: [E4, R7]

STEP 5 — "IMPACT HIGHLIGHTS" (Optional but powerful)
A short section with 3–5 bullets that read like executive outcomes.
Only if evidence supports it.

STEP 6 — TOOLS / PLATFORMS
Only list tools explicitly in evidence inventory.
If a JD tool is missing but the candidate has equivalent tooling, say: "Workflow/ticketing platforms (multiple)" — only if truthful.

STEP 7 — EDUCATION & CERTIFICATIONS`;

    // Build user prompt with all the context
    const userPrompt = `Generate a benchmark resume based on this analysis.

ORIGINAL RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

FIT BLUEPRINT:
${JSON.stringify(fitBlueprint, null, 2)}

${Object.keys(missingBulletResponses || {}).length > 0 ? `USER-PROVIDED INFORMATION FOR MISSING BULLETS:
${Object.entries(missingBulletResponses).map(([id, response]) => `- ${id}: ${response}`).join('\n')}` : ''}

CUSTOMIZATION:
- Intensity: ${customization?.intensity || 'moderate'}
- Tone: ${customization?.tone || 'formal'}

Return valid JSON only, no markdown, no commentary. Use this exact schema:

{
  "resume_text": "Full resume as plain text, ATS-friendly",
  "sections": [
    {
      "id": "summary",
      "type": "summary",
      "title": "Professional Summary",
      "content": ["Paragraph 1...", "Paragraph 2..."],
      "evidence_tags": {"0": ["E1", "E3"]}
    },
    {
      "id": "competencies",
      "type": "competencies",
      "title": "Core Competencies",
      "content": ["Competency 1", "Competency 2", "..."],
      "evidence_tags": {}
    },
    {
      "id": "experience-1",
      "type": "experience",
      "title": "Professional Experience",
      "content": ["COMPANY NAME | Title | Dates", "• Bullet 1 [E1, R2]", "• Bullet 2 [E3, R4]"],
      "evidence_tags": {"1": ["E1", "R2"], "2": ["E3", "R4"]}
    },
    {
      "id": "skills",
      "type": "skills",
      "title": "Tools & Platforms",
      "content": ["Tool 1", "Tool 2"],
      "evidence_tags": {}
    },
    {
      "id": "education",
      "type": "education",
      "title": "Education",
      "content": ["Degree, University, Year"],
      "evidence_tags": {}
    }
  ],
  "changelog": [
    {
      "change": "Added quantified retention metric to summary",
      "reason": "Directly addresses R3 requirement for retention experience",
      "requirement_ids": ["R3"]
    }
  ],
  "follow_up_questions": ["Question for candidate if more info needed"]
}`;

    console.log('Calling Lovable AI for Benchmark Resume generation...');

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

    console.log('AI response received, parsing...');

    // Parse the JSON response
    let benchmarkResume;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      const rawResume = JSON.parse(jsonStr.trim());
      
      // Transform to camelCase for frontend
      benchmarkResume = {
        resumeText: rawResume.resume_text || '',
        sections: (rawResume.sections || []).map((s: any) => ({
          id: s.id,
          type: s.type,
          title: s.title,
          content: s.content || [],
          evidenceTags: s.evidence_tags || {},
          isEdited: false
        })),
        changelog: (rawResume.changelog || []).map((c: any) => ({
          section: c.section || 'General',
          change: c.change,
          rationale: c.reason || c.rationale || '',
          evidenceUsed: c.evidence_used || [],
          requirementIds: c.requirement_ids || []
        })),
        followUpQuestions: rawResume.follow_up_questions || []
      };
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse benchmark resume result');
    }

    console.log('Benchmark Resume generated successfully');

    return new Response(JSON.stringify(benchmarkResume), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Benchmark Resume error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
