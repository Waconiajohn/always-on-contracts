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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
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
    
    // Build flexible search parameters based on industry
    // For specialized industries (oil & gas, construction, etc.), search across all location types
    const searchBody: any = {
      query: targetRole,
      limit: Math.max(numJobs, 20), // Request more to account for filtering
      filters: {
        datePosted: '30d' as const,
        remoteType: 'any' as const, // Search all: remote, hybrid, onsite
        contractOnly: false
      }
    };
    
    // Don't restrict by specific location - let all locations come through
    // This is critical for specialized roles that are location-based
    
    console.log('[analyze-market-fit] Search params:', JSON.stringify(searchBody, null, 2));
    
    const jobSearchResponse = await supabaseClient.functions.invoke('unified-job-search', {
      body: searchBody
    });

    console.log('[analyze-market-fit] Raw response:', JSON.stringify({
      error: jobSearchResponse.error,
      dataKeys: jobSearchResponse.data ? Object.keys(jobSearchResponse.data) : null,
      hasJobs: jobSearchResponse.data?.jobs ? true : false,
      hasResults: jobSearchResponse.data?.results ? true : false,
      jobsLength: jobSearchResponse.data?.jobs?.length,
      resultsLength: jobSearchResponse.data?.results?.length
    }));

    if (jobSearchResponse.error) {
      console.error('[analyze-market-fit] Job search error:', jobSearchResponse.error);
      throw new Error(`Failed to search jobs: ${jobSearchResponse.error.message}`);
    }

    const jobs = jobSearchResponse.data?.jobs || [];
    console.log(`[analyze-market-fit] Found ${jobs.length} jobs for "${targetRole}"`);

    // If no jobs found and the role includes seniority level, try searching without it
    if (jobs.length === 0 && /^(Senior|Lead|Principal|Staff|Junior|Mid-Level|Mid Level)\s+/i.test(targetRole)) {
      console.log('[analyze-market-fit] No jobs found, retrying without seniority level...');
      const baseRole = targetRole.replace(/^(Senior|Lead|Principal|Staff|Junior|Mid-Level|Mid Level)\s+/i, '').trim();
      
      const fallbackSearchBody = {
        query: baseRole,
        limit: Math.max(numJobs, 20),
        filters: {
          datePosted: '30d' as const,
          remoteType: 'any' as const,
          contractOnly: false
        }
      };
      
      const fallbackResponse = await supabaseClient.functions.invoke('unified-job-search', {
        body: fallbackSearchBody
      });
      
      console.log('[analyze-market-fit] Fallback raw response:', JSON.stringify({
        error: fallbackResponse.error,
        hasJobs: fallbackResponse.data?.jobs ? true : false,
        jobsLength: fallbackResponse.data?.jobs?.length
      }));
      
      if (!fallbackResponse.error && fallbackResponse.data?.jobs?.length > 0) {
        jobs.push(...fallbackResponse.data.jobs);
        console.log(`[analyze-market-fit] Fallback search found ${fallbackResponse.data.jobs.length} jobs for "${baseRole}"`);
      }
    }
    
    console.log(`[analyze-market-fit] Total jobs to analyze: ${jobs.length}`);

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
    
    // Limit to 20 jobs for better AI processing
    const jobsToAnalyze = jobs.slice(0, 20);
    
    const jobDescriptions = jobsToAnalyze.map((job: any) => ({
      title: job.title,
      company: job.company,
      location: job.location,
      remoteType: job.remoteType,
      description: job.description?.substring(0, 1500) // Increased for more context
    }));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const extractionPrompt = `Analyze these ${jobsToAnalyze.length} job postings for ${targetRole}${targetIndustry ? ` in ${targetIndustry}` : ''}.

Extract the following data to help understand what skills, requirements, and themes are most important in the current job market:

Job Data:
${JSON.stringify(jobDescriptions, null, 2)}

Focus on identifying:
1. Skills that appear in 40% or more of the job postings
2. Common experience requirements, education levels, and certifications
3. How frequently each skill appears across all postings
4. Key themes and priorities that employers emphasize`;

    // Use structured output with tool calling for guaranteed JSON
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: "You are a job market analyst. Extract structured data from job postings accurately." 
          },
          { role: "user", content: extractionPrompt }
        ],
        max_tokens: 2000,
        tools: [
          {
            type: "function",
            function: {
              name: "extract_market_data",
              description: "Extract structured market analysis data from job postings",
              parameters: {
                type: "object",
                properties: {
                  commonSkills: {
                    type: "array",
                    items: { type: "string" },
                    description: "Skills mentioned in 40% or more of job postings"
                  },
                  commonRequirements: {
                    type: "object",
                    properties: {
                      yearsExperience: { type: "string" },
                      education: { type: "string" },
                      certifications: { type: "array", items: { type: "string" } }
                    }
                  },
                  skillFrequency: {
                    type: "object",
                    additionalProperties: { type: "number" },
                    description: "Number of times each skill appears across all postings"
                  },
                  keyThemes: {
                    type: "array",
                    items: { type: "string" },
                    description: "Key themes and priorities employers emphasize"
                  }
                },
                required: ["commonSkills", "commonRequirements", "skillFrequency", "keyThemes"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_market_data" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[analyze-market-fit] Lovable AI error:', aiResponse.status, errorText);
      throw new Error(`AI extraction failed: ${aiResponse.status} - ${errorText}`);
    }

    const aiData = await aiResponse.json();
    console.log('[analyze-market-fit] Raw AI response:', JSON.stringify(aiData, null, 2));
    
    // Extract from tool_calls (structured output)
    let marketData;
    const toolCalls = aiData.choices?.[0]?.message?.tool_calls;
    
    if (toolCalls && toolCalls.length > 0) {
      try {
        const toolCall = toolCalls[0];
        const argsStr = toolCall.function?.arguments;
        marketData = typeof argsStr === 'string' ? JSON.parse(argsStr) : argsStr;
        console.log('[analyze-market-fit] Successfully extracted structured data from tool call');
      } catch (parseError) {
        console.error('[analyze-market-fit] Failed to parse tool call arguments:', parseError);
        marketData = null;
      }
    } else {
      console.warn('[analyze-market-fit] No tool calls in AI response, trying text parsing fallback');
      const extractedText = aiData.choices?.[0]?.message?.content || "";
      try {
        const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
        marketData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      } catch (parseError) {
        console.error('[analyze-market-fit] Text parsing also failed:', extractedText);
        marketData = null;
      }
    }

    // Fallback: Basic keyword extraction if AI fails
    if (!marketData || !marketData.commonSkills || marketData.commonSkills.length === 0) {
      console.warn('[analyze-market-fit] AI extraction failed, using fallback keyword analysis');
      marketData = performFallbackAnalysis(jobDescriptions, targetRole);
    }

    console.log('[analyze-market-fit] Final market data:', JSON.stringify(marketData, null, 2));

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

    // Step 4: Compare user's resume to market and create benchmark comparison
    let userSkills: string[] = [];
    let gaps: any[] = [];
    let confirmedSkills: string[] = [];
    let likelySkills: string[] = [];
    
    if (resumeText) {
      userSkills = extractSkillsFromText(resumeText);
      const requiredSkills = marketData.commonSkills || [];
      
      // Identify gaps (skills in market but not in resume)
      gaps = requiredSkills
        .filter((skill: string) => !userSkills.some(us => us.toLowerCase().includes(skill.toLowerCase())))
        .map((skill: string, index: number) => {
          const frequency = marketData.skillFrequency?.[skill] || 0;
          return {
            gap_id: `gap_${index + 1}`,
            gap_type: 'skill',
            requirement: skill,
            priority: frequency >= 7 ? 'blocking' : frequency >= 4 ? 'important' : 'nice_to_have',
            reasoning: `This skill appears in ${frequency}/${jobs.length} job postings and is missing from your resume`
          };
        });

      // Confirmed skills (found in resume)
      confirmedSkills = requiredSkills.filter((skill: string) => 
        userSkills.some(us => us.toLowerCase().includes(skill.toLowerCase()))
      );

      // Likely skills (inferred from related terms)
      likelySkills = userSkills.filter(us => 
        !confirmedSkills.some(cs => cs.toLowerCase() === us.toLowerCase())
      ).slice(0, 5);
    }

    // Step 5: Create benchmark comparison record for Phase 3
    const strengthScore = confirmedSkills.length > 0 
      ? Math.round((confirmedSkills.length / (confirmedSkills.length + gaps.length)) * 100)
      : 0;
    
    const completenessPercentage = (marketData.commonSkills?.length || 0) > 0
      ? Math.round((confirmedSkills.length / (marketData.commonSkills?.length || 1)) * 100)
      : 0;

    const { data: benchmarkData, error: benchmarkError } = await supabaseClient
      .from('vault_benchmark_comparison')
      .insert({
        vault_id: vaultId,
        user_id: user.id,
        job_title: targetRole,
        industry: targetIndustry || 'General',
        seniority_level: 'mid',  // TODO: Detect from resume
        benchmark_data: {
          jobsAnalyzed: jobs.length,
          commonSkills: marketData.commonSkills || [],
          commonRequirements: marketData.commonRequirements || {},
          skillFrequency: marketData.skillFrequency || {}
        },
        confirmed_data: {
          technical_skills: confirmedSkills,
          leadership_skills: [],
          achievements: []
        },
        likely_data: {
          technical_skills: likelySkills,
          leadership_skills: [],
          achievements: []
        },
        gaps_requiring_questions: gaps,
        evidence_summary: {
          strength_score: strengthScore,
          completeness_percentage: completenessPercentage
        },
        comparison_confidence: confirmedSkills.length > 0 ? 0.85 : 0.5
      })
      .select()
      .single();

    if (benchmarkError) {
      console.error('[analyze-market-fit] Benchmark save error:', benchmarkError);
      // Don't throw - this is supplementary data
    } else {
      console.log('[analyze-market-fit] Benchmark comparison saved:', benchmarkData.id);
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
      researchId: savedResearch.id,
      benchmarkId: benchmarkData?.id
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
    'data analysis', 'machine learning', 'ai', 'communication', 'teamwork',
    // Oil & Gas / Engineering specific
    'drilling', 'wellbore', 'bha', 'completion', 'hpht', 'directional drilling',
    'mud logging', 'pressure control', 'well design', 'risk assessment',
    'rig operations', 'cementing', 'fracturing', 'reservoir', 'subsurface'
  ];

  const textLower = text.toLowerCase();
  return commonSkillKeywords.filter(skill => textLower.includes(skill));
}

// Fallback: Basic keyword analysis if AI extraction fails
function performFallbackAnalysis(jobDescriptions: any[], targetRole: string): any {
  console.log('[analyze-market-fit] Performing fallback keyword analysis');
  
  // Common technical and soft skills by industry
  const skillKeywords = [
    // General
    'leadership', 'communication', 'project management', 'problem solving', 
    'team collaboration', 'strategic planning', 'analytical',
    // Oil & Gas / Drilling Engineering
    'drilling operations', 'well planning', 'bha design', 'directional drilling',
    'hpht wells', 'well control', 'completion design', 'mud systems',
    'torque and drag', 'hydraulics', 'cementing', 'pressure management',
    'rig supervision', 'drilling optimization', 'cost reduction', 'safety protocols'
  ];

  const skillFrequency: Record<string, number> = {};
  const allText = jobDescriptions.map(j => `${j.title} ${j.description}`.toLowerCase()).join(' ');
  
  skillKeywords.forEach(skill => {
    const regex = new RegExp(skill.toLowerCase(), 'gi');
    const matches = allText.match(regex);
    if (matches) {
      skillFrequency[skill] = matches.length;
    }
  });

  // Filter to skills appearing in at least 40% of jobs
  const threshold = Math.ceil(jobDescriptions.length * 0.4);
  const commonSkills = Object.entries(skillFrequency)
    .filter(([_, count]) => count >= threshold)
    .sort((a, b) => b[1] - a[1])
    .map(([skill]) => skill);

  return {
    commonSkills: commonSkills.length > 0 ? commonSkills : Object.keys(skillFrequency).slice(0, 10),
    commonRequirements: {
      yearsExperience: "3-5 years typical",
      education: "Bachelor's degree preferred",
      certifications: []
    },
    skillFrequency,
    keyThemes: [
      "Technical expertise in role-specific tools",
      "Strong communication and collaboration",
      "Problem-solving and analytical thinking"
    ]
  };
}
