import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Fetch user's resume analysis for skills matching
    const { data: resumeAnalysis } = await supabase
      .from('resume_analysis')
      .select('skills, industry_expertise, years_experience, recommended_positions')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!resumeAnalysis) {
      return new Response(
        JSON.stringify({ error: 'No resume analysis found. Please upload your resume first.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch active job opportunities
    const { data: opportunities, error: oppError } = await supabase
      .from('job_opportunities')
      .select('*, staffing_agencies(agency_name, location)')
      .eq('status', 'active')
      .order('posted_date', { ascending: false });

    if (oppError) throw oppError;

    if (!opportunities || opportunities.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active opportunities found', matches: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use AI to match opportunities with user skills
    const userProfile = {
      skills: resumeAnalysis.skills || [],
      industries: resumeAnalysis.industry_expertise || [],
      experience: resumeAnalysis.years_experience || 0,
      positions: resumeAnalysis.recommended_positions || []
    };

    const matches = [];

    for (const opp of opportunities) {
      // Calculate basic skill match score
      const requiredSkills = opp.required_skills || [];
      const matchingSkills = userProfile.skills.filter((skill: string) => 
        requiredSkills.some((reqSkill: string) => 
          reqSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(reqSkill.toLowerCase())
        )
      );

      const skillMatchScore = requiredSkills.length > 0 
        ? (matchingSkills.length / requiredSkills.length) * 100 
        : 50;

      // Only process opportunities with some skill match
      if (skillMatchScore > 30 || matchingSkills.length > 0) {
        // Use AI to generate personalized recommendation
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: 'You are a career advisor helping match contractors with opportunities. Provide concise, actionable recommendations.'
              },
              {
                role: 'user',
                content: `Match analysis needed:

Job: ${opp.job_title}
Description: ${opp.job_description || 'Not provided'}
Required Skills: ${requiredSkills.join(', ')}
Location: ${opp.location || 'Remote'}
Rate: $${opp.hourly_rate_min}-$${opp.hourly_rate_max}/hr
Duration: ${opp.contract_duration_months} months

Candidate Profile:
Skills: ${userProfile.skills.join(', ')}
Experience: ${userProfile.experience} years
Industries: ${userProfile.industries.join(', ')}
Matching Skills Found: ${matchingSkills.join(', ')}

Provide a 2-3 sentence recommendation on why this is a good match and what the candidate should emphasize in their outreach.`
              }
            ],
          }),
        });

        let aiRecommendation = 'Good potential match based on your skills.';
        
        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          aiRecommendation = aiData.choices?.[0]?.message?.content || aiRecommendation;
        }

        // Check if match already exists
        const { data: existingMatch } = await supabase
          .from('opportunity_matches')
          .select('id')
          .eq('user_id', user.id)
          .eq('opportunity_id', opp.id)
          .single();

        if (!existingMatch) {
          // Insert new match
          await supabase
            .from('opportunity_matches')
            .insert({
              user_id: user.id,
              opportunity_id: opp.id,
              match_score: Math.round(skillMatchScore),
              matching_skills: matchingSkills,
              ai_recommendation: aiRecommendation,
              status: 'new'
            });
        }

        matches.push({
          opportunity: opp,
          match_score: Math.round(skillMatchScore),
          matching_skills: matchingSkills,
          ai_recommendation: aiRecommendation
        });
      }
    }

    // Sort by match score
    matches.sort((a, b) => b.match_score - a.match_score);

    return new Response(
      JSON.stringify({ 
        message: `Found ${matches.length} matching opportunities`,
        matches: matches.slice(0, 20) // Return top 20 matches
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in match-opportunities function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});