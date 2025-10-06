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
    const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY')!;
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
        
      default:
        researchQuery = query_params.custom_query || 'Provide relevant market research';
    }

    console.log(`Perplexity research request: ${research_type}`);
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
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
        temperature: 0.2,
        max_tokens: 3000,
        return_related_questions: true,
        search_recency_filter: 'month',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity API error:', response.status, errorText);
      throw new Error(`Perplexity API failed: ${response.status}`);
    }

    const data = await response.json();
    const research_result = data.choices[0]?.message?.content;
    const citations = data.citations || [];
    const related_questions = data.related_questions || [];

    // Store research result
    const { error: insertError } = await supabase
      .from('war_chest_research')
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