import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('VITE_SUPABASE_PUBLISHABLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { resume_text, target_roles, target_industries } = await req.json();

    if (!resume_text) {
      throw new Error('resume_text is required');
    }

    const rolesText = target_roles?.join(', ') || 'Not specified';
    const industriesText = target_industries?.join(', ') || 'Not specified';

    // Use Lovable AI to analyze resume and generate skill taxonomy
    const prompt = `Analyze this resume and generate a comprehensive skill taxonomy:

RESUME:
${resume_text}

TARGET ROLES: ${rolesText}
TARGET INDUSTRIES: ${industriesText}

Generate three categories of skills:

1. CORE SKILLS (from resume): Skills explicitly mentioned or demonstrated in the resume
2. INFERRED SKILLS (likely has): Skills the candidate likely possesses based on their roles/responsibilities but not explicitly stated
3. GROWTH SKILLS (needs for target roles): Skills commonly required in target roles that are missing or need development

For each skill, provide:
- skill_name: Clear, specific skill name
- skill_category: One of: technical, leadership, domain_expertise, soft_skills, tools
- source: "resume", "inferred", or "growth"
- confidence_score: 0-100 (how confident you are they have this skill)
- sub_attributes: Array of 3-5 specific sub-skills or applications
- market_frequency: Estimated % of target job postings requiring this skill (0-100)

Return ONLY a JSON array of skill objects. Example:
[
  {
    "skill_name": "Strategic Planning",
    "skill_category": "leadership",
    "source": "resume",
    "confidence_score": 95,
    "sub_attributes": [
      "Multi-year roadmap development",
      "Cross-functional planning",
      "Budget forecasting ($1M+)",
      "Competitive positioning"
    ],
    "market_frequency": 85
  }
]

Aim for 40-50 total skills across all three categories.`;

    const aiResponse = await fetch('https://api.lovable.app/v1/ai/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 4000,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error('Failed to analyze resume');
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0]?.message?.content || '[]';
    
    // Extract JSON from markdown code blocks if present
    let jsonContent = content;
    const jsonMatch = content.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1];
    }

    const skills = JSON.parse(jsonContent);

    // Delete existing taxonomy for this user
    await supabase
      .from('war_chest_skill_taxonomy')
      .delete()
      .eq('user_id', user.id);

    // Insert new skill taxonomy
    const taxonomyData = skills.map((skill: any) => ({
      user_id: user.id,
      skill_name: skill.skill_name,
      skill_category: skill.skill_category,
      source: skill.source,
      confidence_score: skill.confidence_score,
      sub_attributes: skill.sub_attributes,
      market_frequency: skill.market_frequency,
    }));

    const { error: insertError } = await supabase
      .from('war_chest_skill_taxonomy')
      .insert(taxonomyData);

    if (insertError) {
      throw insertError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        skills_count: skills.length,
        breakdown: {
          resume: skills.filter((s: any) => s.source === 'resume').length,
          inferred: skills.filter((s: any) => s.source === 'inferred').length,
          growth: skills.filter((s: any) => s.source === 'growth').length,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in analyze-resume-and-research:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
