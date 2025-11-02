import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callPerplexity, PERPLEXITY_MODELS } from '../_shared/ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { research_type, query_params } = await req.json();

    if (!research_type) {
      throw new Error('research_type is required');
    }

    let researchQuery = '';
    
    switch (research_type) {
      case 'market_intelligence':
        researchQuery = `Provide comprehensive market intelligence for ${query_params.role} in ${query_params.industry}:
        
1. Current hiring trends and demand
2. Salary ranges by experience level
3. Most sought-after skills
4. Remote work prevalence
5. Career growth opportunities
6. Key companies hiring

Focus on data from the last 3 months.`;
        break;
        
      case 'company_research':
        researchQuery = `Research ${query_params.company_name}:
        
1. Recent company news (last 6 months)
2. Financial health and funding rounds
3. Employee reviews and culture insights
4. Interview process and tips
5. Technical stack and tools used
6. Growth trajectory and hiring patterns

Prioritize recent, credible sources.`;
        break;
        
      case 'skills_demand':
        researchQuery = `Analyze skill demand for ${query_params.skills.join(', ')} in the ${query_params.industry} industry:
        
1. Current demand trends
2. Salary premium for each skill
3. Complementary skills to learn
4. Learning resources
5. Certification value

Use job posting data from the last 2 months.`;
        break;
        
      case 'career_path':
        researchQuery = `Career path analysis for someone currently at ${query_params.current_role} targeting ${query_params.target_role}:
        
1. Typical progression timeline
2. Required skills to develop
3. Intermediate roles
4. Salary progression
5. Success stories and case studies
6. Common challenges and how to overcome them`;
        break;
        
      case 'interview_prep':
        researchQuery = `Interview preparation for ${query_params.role} at ${query_params.company || 'similar companies'}:

1. Common interview questions
2. Technical assessment format
3. Company-specific interview process
4. Recent interview experiences shared online
5. Key topics to prepare
6. Red flags to watch for`;
        break;

      case 'resume_job_analysis':
        researchQuery = `Analyze this job posting for world-class resume optimization:

JOB TITLE: ${query_params.job_title}
COMPANY: ${query_params.company || 'Not specified'}
INDUSTRY: ${query_params.industry || 'Not specified'}
LOCATION: ${query_params.location || 'Not specified'}

JOB DESCRIPTION:
${query_params.job_description}

Provide comprehensive analysis:

1. CORE PROBLEM STATEMENT
   - What specific business problem does this role solve?
   - What pain points will this hire address?
   - What outcomes define success in this role?
   - What would make this hire "exceptional" vs "acceptable"?

2. CRITICAL ATS KEYWORDS (Top 15)
   - Extract exact phrases from job description (not synonyms)
   - Rank by importance: must-have vs nice-to-have
   - Include job title variations
   - Note technical terms and industry buzzwords
   - Identify skills with highest mention frequency

3. INDUSTRY BENCHMARKING
   - Research 20+ similar "${query_params.job_title}" postings in ${query_params.industry || 'this industry'}
   - What do top-performer resumes typically emphasize?
   - What quantified achievements are most common? (%, $, #)
   - What is typical salary range for this role in ${query_params.location || 'major markets'}?
   - What years of experience are expected?

4. COMPETITIVE INTELLIGENCE
   - Recent news about ${query_params.company || 'companies in this industry'} (last 3 months)
   - Company priorities and strategic initiatives
   - Culture signals from job description
   - Technology stack and tools mentioned
   - Growth stage indicators (startup/scaleup/enterprise)

5. RESUME OPTIMIZATION RECOMMENDATIONS
   - What resume format works best? (chronological/functional/hybrid)
   - What sections should be prioritized?
   - What tone is appropriate? (formal/conversational/technical)
   - What common mistakes should be avoided?
   - What achievements would make candidate stand out?

Use only recent data (last 3 months). Cite all salary data and market statistics with sources.`;
        break;

      default:
        researchQuery = query_params.custom_query || 'Provide relevant market research';
    }

    console.log(`Perplexity research request: ${research_type}`);
    
    const { response, metrics } = await callPerplexity(
      {
        messages: [
          {
            role: 'system',
            content: 'You are a career intelligence researcher. Provide detailed, actionable insights with specific data points and sources. Always include salary ranges in USD and cite your sources.'
          },
          {
            role: 'user',
            content: researchQuery
          }
        ],
        model: PERPLEXITY_MODELS.HUGE,
        temperature: 0.2,
        max_tokens: 3000,
        return_related_questions: true,
        search_recency_filter: 'month',
      },
      'perplexity-research',
      user.id
    );

    await logAIUsage(metrics);

    const research_result = response.choices[0]?.message?.content;
    const citations = response.citations || [];
    const related_questions = response.related_questions || [];

    // Store research result
    const { error: insertError } = await supabase
      .from('vault_research')
      .insert({
        user_id: user.id,
        research_type,
        query_params,
        research_result,
        citations,
        related_questions,
        researched_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error storing research:', insertError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        research_result,
        citations,
        related_questions,
        researched_at: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in perplexity-research:', error);
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