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
      const requiredSkills = opp.required_skills || [];
      
      // Enhanced fuzzy skill matching - check for partial matches and related terms
      const matchingSkills = userProfile.skills.filter((skill: string) => {
        const skillLower = skill.toLowerCase();
        return requiredSkills.some((reqSkill: string) => {
          const reqSkillLower = reqSkill.toLowerCase();
          // Direct matches or partial matches
          if (reqSkillLower.includes(skillLower) || skillLower.includes(reqSkillLower)) {
            return true;
          }
          // Check for related terms (operations/operational, management/manager, etc.)
          const skillWords = skillLower.split(/\s+/);
          const reqWords = reqSkillLower.split(/\s+/);
          return skillWords.some(sw => reqWords.some(rw => 
            (sw.length > 4 && rw.includes(sw.slice(0, -1))) || 
            (rw.length > 4 && sw.includes(rw.slice(0, -1)))
          ));
        });
      });

      // Check if job title matches recommended positions
      const titleMatch = userProfile.positions.some((pos: string) => {
        const posLower = pos.toLowerCase();
        const titleLower = opp.job_title.toLowerCase();
        return titleLower.includes(posLower) || posLower.includes(titleLower) ||
          titleLower.split(/\s+/).some((word: string) => posLower.includes(word) && word.length > 4);
      });

      // Check industry alignment
      const industryMatch = userProfile.industries.some((ind: string) => {
        const indLower = ind.toLowerCase();
        const descLower = (opp.job_description || '').toLowerCase();
        const titleLower = opp.job_title.toLowerCase();
        return descLower.includes(indLower) || titleLower.includes(indLower);
      });

      // Calculate comprehensive match score
      let matchScore = 0;
      
      // Skill matching (0-50 points)
      if (requiredSkills.length > 0) {
        matchScore += (matchingSkills.length / requiredSkills.length) * 50;
      } else {
        matchScore += 25; // No specific skills required = medium score
      }
      
      // Title/position match (0-30 points)
      if (titleMatch) {
        matchScore += 30;
      }
      
      // Industry match (0-20 points)
      if (industryMatch) {
        matchScore += 20;
      }

      // Experience level consideration - senior roles need senior candidates
      const isSeniorRole = ['director', 'vp', 'chief', 'head', 'senior'].some(term => 
        opp.job_title.toLowerCase().includes(term)
      );
      if (isSeniorRole && userProfile.experience >= 10) {
        matchScore += 10; // Bonus for senior candidates in senior roles
      }

      // Lower threshold - consider more opportunities
      const shouldProcess = matchScore > 20 || matchingSkills.length > 0 || titleMatch || industryMatch;
      
      if (shouldProcess) {
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
                content: 'You are an executive career advisor specializing in contract and interim placements. Be persuasive and highlight the candidate\'s strengths. Focus on why they\'re an excellent fit.'
              },
              {
                role: 'user',
                content: `Analyze this opportunity match:

OPPORTUNITY:
Title: ${opp.job_title}
Description: ${opp.job_description || 'Senior-level contract role'}
Required Skills: ${requiredSkills.join(', ') || 'Not specified'}
Location: ${opp.location || 'Remote'}
Rate: $${opp.hourly_rate_min}-${opp.hourly_rate_max}/hour
Duration: ${opp.contract_duration_months} months

CANDIDATE PROFILE:
${userProfile.experience} years experience
Skills: ${userProfile.skills.join(', ')}
Industries: ${userProfile.industries.join(', ')}
Target Roles: ${userProfile.positions.join(', ')}

MATCH ANALYSIS:
Direct Skill Matches: ${matchingSkills.join(', ') || 'Transferable skills applicable'}
Match Score: ${Math.round(matchScore)}%

Write 2-3 compelling sentences explaining why this candidate is an excellent fit for this contract role. Focus on their relevant experience, transferable skills, and what unique value they bring. Be enthusiastic and professional.`
              }
            ],
          }),
        });

        let aiRecommendation = 'Your extensive experience makes you a strong candidate for this contract opportunity.';
        
        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          aiRecommendation = aiData.choices?.[0]?.message?.content || aiRecommendation;
        } else {
          console.error('AI recommendation failed:', await aiResponse.text());
        }

        // Check if match already exists
        const { data: existingMatch } = await supabase
          .from('opportunity_matches')
          .select('id')
          .eq('user_id', user.id)
          .eq('opportunity_id', opp.id)
          .single();

        const finalMatchScore = Math.round(matchScore);

        if (!existingMatch) {
          // Insert new match
          const { error: insertError } = await supabase
            .from('opportunity_matches')
            .insert({
              user_id: user.id,
              opportunity_id: opp.id,
              match_score: finalMatchScore,
              matching_skills: matchingSkills,
              ai_recommendation: aiRecommendation,
              status: 'new'
            });
          
          if (insertError) {
            console.error('Error inserting match:', insertError);
          }
        }

        matches.push({
          opportunity: opp,
          match_score: finalMatchScore,
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