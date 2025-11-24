import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MarketFitRequest {
  vaultId: string;
  targetRole: string;
  targetIndustry?: string;
  resumeText?: string;
  numJobs?: number; // Default 10
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body: MarketFitRequest = await req.json();
    const { vaultId, targetRole, targetIndustry, resumeText, numJobs = 10 } = body;

    if (!vaultId || !targetRole) {
      return new Response(JSON.stringify({ error: 'Missing vaultId or targetRole' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[analyze-market-fit] Analyzing market for role: ${targetRole}`);

    // Step 1: Search live jobs using unified-job-search
    console.log('[analyze-market-fit] Searching live jobs...');
    const jobSearchResponse = await supabaseClient.functions.invoke('unified-job-search', {
      body: {
        query: targetRole,
        location: 'Remote',
        limit: numJobs
      }
    });

    if (jobSearchResponse.error) {
      console.error('[analyze-market-fit] Job search error:', jobSearchResponse.error);
      throw new Error(`Failed to search jobs: ${jobSearchResponse.error.message}`);
    }

    const jobs = jobSearchResponse.data?.results || [];
    console.log(`[analyze-market-fit] Found ${jobs.length} jobs`);

    if (jobs.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No jobs found for this role. Try a different title or industry.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Step 2: Extract requirements from jobs using AI
    console.log('[analyze-market-fit] Extracting requirements from job descriptions...');
    
    const jobDescriptions = jobs.map((job: any) => ({
      title: job.title,
      company: job.company,
      description: job.description?.substring(0, 1000) // Limit for token efficiency
    }));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const extractionPrompt = `Analyze these ${jobs.length} job postings for ${targetRole} and extract:

1. **Common Skills** (mentioned in 40%+ of jobs)
2. **Common Requirements** (experience level, education, certifications)
3. **Skill Frequency** (how often each skill appears)
4. **Key Themes** (what companies care about most)

Job Data:
${JSON.stringify(jobDescriptions, null, 2)}

Return JSON format:
{
  "commonSkills": ["skill1", "skill2", ...],
  "commonRequirements": {
    "yearsExperience": "3-5 years",
    "education": "Bachelor's degree",
    "certifications": ["cert1", "cert2"]
  },
  "skillFrequency": {
    "Python": 8,
    "Leadership": 6,
    ...
  },
  "keyThemes": ["theme1", "theme2", ...]
}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-preview",
        messages: [
          { 
            role: "system", 
            content: "You are a job market analyst. Extract structured data from job postings. Return only valid JSON." 
          },
          { role: "user", content: extractionPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[analyze-market-fit] Lovable AI error:', aiResponse.status, errorText);
      throw new Error(`AI extraction failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const extractedText = aiData.choices?.[0]?.message?.content || "";
    
    // Parse JSON from AI response
    let marketData;
    try {
      const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
      marketData = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch (parseError) {
      console.error('[analyze-market-fit] Failed to parse AI JSON:', extractedText);
      marketData = {
        commonSkills: [],
        commonRequirements: {},
        skillFrequency: {},
        keyThemes: []
      };
    }

    console.log('[analyze-market-fit] Market data extracted:', marketData);

    // Step 3: Store in vault_market_research
    const { data: savedResearch, error: saveError } = await supabaseClient
      .from('vault_market_research')
      .insert({
        vault_id: vaultId,
        target_role: targetRole,
        target_industry: targetIndustry,
        sample_jobs: jobs,
        common_requirements: marketData.commonRequirements || {},
        skill_frequency: marketData.skillFrequency || {}
      })
      .select()
      .single();

    if (saveError) {
      console.error('[analyze-market-fit] Save error:', saveError);
      throw saveError;
    }

    console.log('[analyze-market-fit] Market research saved:', savedResearch.id);

    // Step 4: Compare user's resume to market (if resumeText provided)
    let gaps = [];
    if (resumeText) {
      const userSkills = extractSkillsFromText(resumeText);
      const requiredSkills = marketData.commonSkills || [];
      
      gaps = requiredSkills
        .filter((skill: string) => !userSkills.some(us => us.toLowerCase().includes(skill.toLowerCase())))
        .map((skill: string) => ({
          type: 'skill',
          name: skill,
          frequency: marketData.skillFrequency?.[skill] || 0,
          priority: marketData.skillFrequency?.[skill] >= 5 ? 'critical' : 'important'
        }));
    }

    return new Response(JSON.stringify({
      success: true,
      marketData: {
        jobsAnalyzed: jobs.length,
        commonSkills: marketData.commonSkills || [],
        commonRequirements: marketData.commonRequirements || {},
        skillFrequency: marketData.skillFrequency || {},
        keyThemes: marketData.keyThemes || []
      },
      gaps: gaps,
      researchId: savedResearch.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[analyze-market-fit] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Helper: Extract skills from resume text (basic keyword matching)
function extractSkillsFromText(text: string): string[] {
  const commonSkillKeywords = [
    'python', 'javascript', 'java', 'react', 'node', 'aws', 'docker',
    'kubernetes', 'sql', 'leadership', 'agile', 'scrum', 'project management',
    'data analysis', 'machine learning', 'ai', 'communication', 'teamwork'
  ];

  const textLower = text.toLowerCase();
  return commonSkillKeywords.filter(skill => textLower.includes(skill));
}
