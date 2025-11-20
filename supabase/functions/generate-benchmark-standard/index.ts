import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BenchmarkStandard {
  role: string;
  level: string;
  industry: string;
  layer1_foundations: {
    work_experience: {
      target: number;
      current: number;
      percentage: number;
      benchmark_rule: string;
      examples: string[];
    };
    skills: {
      target: number;
      current: number;
      percentage: number;
      critical_missing: string[];
    };
    education: {
      meets_standard: boolean;
      recommendation: string;
    };
  };
  layer2_intelligence: {
    leadership: {
      target: number;
      current: number;
      percentage: number;
      focus_areas: string[];
    };
    strategic_impact: {
      target: number;
      current: number;
      percentage: number;
      missing_metrics: string[];
    };
    professional_resources: {
      target: number;
      current: number;
      percentage: number;
      expected_tools: string[];
    };
  };
  overall_target: number;
  overall_current: number;
  gap_analysis: {
    critical_gaps: string[];
    quick_wins: string[];
    estimated_time: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vaultId } = await req.json();
    
    if (!vaultId) {
      throw new Error('vaultId is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch vault and all related data
    const { data: vault, error: vaultError } = await supabase
      .from('career_vault')
      .select('*')
      .eq('id', vaultId)
      .single();

    if (vaultError || !vault) {
      throw new Error('Vault not found');
    }

    // Fetch all vault items in parallel
    const [
      { data: powerPhrases },
      { data: transferableSkills },
      { data: softSkills },
      { data: leadership },
      { data: executivePresence },
      { data: professionalResources },
    ] = await Promise.all([
      supabase.from('vault_power_phrases').select('*').eq('vault_id', vaultId),
      supabase.from('vault_transferable_skills').select('*').eq('vault_id', vaultId),
      supabase.from('vault_soft_skills').select('*').eq('vault_id', vaultId),
      supabase.from('vault_leadership_philosophy').select('*').eq('vault_id', vaultId),
      supabase.from('vault_executive_presence').select('*').eq('vault_id', vaultId),
      supabase.from('vault_professional_resources').select('*').eq('vault_id', vaultId),
    ]);

    // Prepare context for AI
    const targetRoles = vault.target_roles || ['Professional'];
    const targetRole = Array.isArray(targetRoles) ? targetRoles[0] : 'Professional';
    
    // STEP 1: REALITY CHECK - Fetch live market data
    console.log(`Fetching live market data for: ${targetRole}`);
    let marketContext = "";
    try {
      // Invoke unified-job-search to get real job descriptions
      const { data: jobData, error: jobError } = await supabase.functions.invoke('unified-job-search', {
        body: {
          query: targetRole,
          location: 'Remote', // Default to remote to get broad scope, or omit
          filters: {
            datePosted: '30d',
            limit: 5 // We only need a few samples
          },
          sources: ['google_jobs', 'jsearch'] // Use reliable aggregators
        }
      });

      if (!jobError && jobData?.jobs && jobData.jobs.length > 0) {
        console.log(`Successfully fetched ${jobData.jobs.length} live jobs for benchmarking`);
        
        const jobs = jobData.jobs.slice(0, 5); // Take top 5
        const jobSummaries = jobs.map((job: any, index: number) => {
            // Truncate description to avoid token limits (approx 500 chars per job)
            const desc = job.description ? job.description.substring(0, 800) + "..." : "No description";
            return `JOB ${index + 1}: ${job.title} at ${job.company}\nREQ SKILLS: ${job.required_skills?.join(', ') || 'N/A'}\nEXCERPT: ${desc}`;
        }).join('\n\n');

        marketContext = `
REAL-TIME MARKET DATA (Use this to ground your benchmark):
The following are ACTUAL live job postings for this role found right now. 
Use these specific requirements to define the "Target" level.
If the market is asking for specific certifications or skills (e.g. PMP, Python, Agile), ensure they are in the benchmark.

${jobSummaries}
        `;
      } else {
        console.log('No live jobs found or error fetching, proceeding with internal knowledge');
        if (jobError) console.error('Job fetch error:', jobError);
      }
    } catch (err) {
      console.error('Failed to fetch live jobs:', err);
      // Fail gracefully and proceed with internal knowledge
    }

    const vaultContext = {
      target_roles: vault.target_roles,
      target_industries: vault.target_industries,
      power_phrases_count: powerPhrases?.length || 0,
      skills_count: transferableSkills?.length || 0,
      soft_skills_count: softSkills?.length || 0,
      leadership_count: leadership?.length || 0,
      executive_presence_count: executivePresence?.length || 0,
      professional_resources_count: professionalResources?.length || 0,
      sample_achievements: powerPhrases?.slice(0, 5).map(p => p.power_phrase) || [],
      sample_skills: transferableSkills?.slice(0, 10).map(s => s.stated_skill) || [],
    };

    const systemPrompt = `You are a career benchmarking expert. Generate a personalized benchmark standard for this professional based on their target role, career level, and current vault data.

CRITICAL RULES:
1. Benchmarks must be achievable but challenging (aim for 85/100 as "ready for market")
2. **GROUND YOUR BENCHMARK IN REALITY**: Use the provided "REAL-TIME MARKET DATA" to set specific expectations.
3. Senior/Executive roles require higher standards than Entry/Mid-level
2. Senior/Executive roles require higher standards than Entry/Mid-level
3. Technical roles need 25-30 skills, non-technical need 15-20
4. Leadership roles need 3-5 leadership examples, IC roles need 1-2
5. Every benchmark must include "why" this number matters
6. Quick wins should take <30 minutes each
7. Critical gaps should be high-impact items

CAREER LEVEL DETECTION:
- Entry-Level: 0-2 years experience, foundational skills
- Mid-Level: 3-5 years, proven track record
- Senior: 6-10 years, leadership + strategic impact
- Executive: 10+ years, vision + organizational impact

ROLE CATEGORIES:
- Technical (Engineer, Developer, Data): Higher skills target, metrics focus
- Product/PM: Cross-functional, strategic impact focus
- Leadership (Manager, Director, VP): Team outcomes, org impact
- Creative (Design, Marketing): Portfolio + measurable impact
- Operations: Process improvement, efficiency metrics`;

    const userPrompt = `Analyze this vault and generate a benchmark:

Target Role: ${targetRole}
Target Industries: ${vault.target_industries?.join(', ') || 'Not specified'}

${marketContext}

Current Vault Data:
- Power Phrases (quantified achievements): ${vaultContext.power_phrases_count}
- Skills: ${vaultContext.skills_count}
- Soft Skills: ${vaultContext.soft_skills_count}
- Leadership Philosophy: ${vaultContext.leadership_count}
- Executive Presence: ${vaultContext.executive_presence_count}
- Professional Resources: ${vaultContext.professional_resources_count}

Sample Achievements:
${vaultContext.sample_achievements.join('\n')}

Sample Skills:
${vaultContext.sample_skills.join(', ')}

Generate a BenchmarkStandard JSON object with personalized targets, current status, gap analysis, and actionable recommendations.`;

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'generate_benchmark',
            description: 'Generate personalized career benchmark standard',
            parameters: {
              type: 'object',
              properties: {
                benchmark: {
                  type: 'object',
                  properties: {
                    role: { type: 'string' },
                    level: { type: 'string', enum: ['Entry-Level', 'Mid-Level', 'Senior', 'Executive'] },
                    industry: { type: 'string' },
                    layer1_foundations: {
                      type: 'object',
                      properties: {
                        work_experience: {
                          type: 'object',
                          properties: {
                            target: { type: 'number' },
                            current: { type: 'number' },
                            percentage: { type: 'number' },
                            benchmark_rule: { type: 'string' },
                            examples: { type: 'array', items: { type: 'string' } }
                          },
                          required: ['target', 'current', 'percentage', 'benchmark_rule', 'examples']
                        },
                        skills: {
                          type: 'object',
                          properties: {
                            target: { type: 'number' },
                            current: { type: 'number' },
                            percentage: { type: 'number' },
                            critical_missing: { type: 'array', items: { type: 'string' } }
                          },
                          required: ['target', 'current', 'percentage', 'critical_missing']
                        },
                        education: {
                          type: 'object',
                          properties: {
                            meets_standard: { type: 'boolean' },
                            recommendation: { type: 'string' }
                          },
                          required: ['meets_standard', 'recommendation']
                        }
                      },
                      required: ['work_experience', 'skills', 'education']
                    },
                    layer2_intelligence: {
                      type: 'object',
                      properties: {
                        leadership: {
                          type: 'object',
                          properties: {
                            target: { type: 'number' },
                            current: { type: 'number' },
                            percentage: { type: 'number' },
                            focus_areas: { type: 'array', items: { type: 'string' } }
                          },
                          required: ['target', 'current', 'percentage', 'focus_areas']
                        },
                        strategic_impact: {
                          type: 'object',
                          properties: {
                            target: { type: 'number' },
                            current: { type: 'number' },
                            percentage: { type: 'number' },
                            missing_metrics: { type: 'array', items: { type: 'string' } }
                          },
                          required: ['target', 'current', 'percentage', 'missing_metrics']
                        },
                        professional_resources: {
                          type: 'object',
                          properties: {
                            target: { type: 'number' },
                            current: { type: 'number' },
                            percentage: { type: 'number' },
                            expected_tools: { type: 'array', items: { type: 'string' } }
                          },
                          required: ['target', 'current', 'percentage', 'expected_tools']
                        }
                      },
                      required: ['leadership', 'strategic_impact', 'professional_resources']
                    },
                    overall_target: { type: 'number' },
                    overall_current: { type: 'number' },
                    gap_analysis: {
                      type: 'object',
                      properties: {
                        critical_gaps: { type: 'array', items: { type: 'string' } },
                        quick_wins: { type: 'array', items: { type: 'string' } },
                        estimated_time: { type: 'string' }
                      },
                      required: ['critical_gaps', 'quick_wins', 'estimated_time']
                    }
                  },
                  required: ['role', 'level', 'industry', 'layer1_foundations', 'layer2_intelligence', 'overall_target', 'overall_current', 'gap_analysis']
                }
              },
              required: ['benchmark']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'generate_benchmark' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices[0].message.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const benchmark: BenchmarkStandard = JSON.parse(toolCall.function.arguments).benchmark;

    // Store benchmark in database
    const { error: updateError } = await supabase
      .from('career_vault')
      .update({
        benchmark_standard: benchmark,
        benchmark_generated_at: new Date().toISOString(),
        benchmark_role_level: benchmark.level
      })
      .eq('id', vaultId);

    if (updateError) {
      console.error('Error updating vault with benchmark:', updateError);
      throw updateError;
    }

    console.log('✅ Benchmark generated successfully:', {
      role: benchmark.role,
      level: benchmark.level,
      score: `${benchmark.overall_current}/${benchmark.overall_target}`
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        benchmark 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in generate-benchmark-standard:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
