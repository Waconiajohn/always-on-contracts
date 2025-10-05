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
    console.log('Starting match-opportunities function');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }
    
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
    
    console.log('User authenticated:', user.id);

    // Fetch user's resume analysis for skills matching
    console.log('Fetching resume analysis');
    const { data: resumeAnalysis, error: resumeError } = await supabase
      .from('resume_analysis')
      .select('skills, industry_expertise, years_experience, recommended_positions')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (resumeError) {
      console.error('Resume fetch error:', resumeError);
      throw resumeError;
    }

    if (!resumeAnalysis) {
      console.log('No resume analysis found');
      return new Response(
        JSON.stringify({ error: 'No resume analysis found. Please upload your resume first.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Resume analysis found, fetching opportunities');

    // Fetch active job opportunities - limit to 50 most recent
    const { data: opportunities, error: oppError } = await supabase
      .from('job_opportunities')
      .select('*, staffing_agencies(agency_name, location)')
      .eq('status', 'active')
      .order('posted_date', { ascending: false })
      .limit(50);

    if (oppError) {
      console.error('Opportunities fetch error:', oppError);
      throw oppError;
    }

    if (!opportunities || opportunities.length === 0) {
      console.log('No opportunities found');
      return new Response(
        JSON.stringify({ message: 'No active opportunities found', matches: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Processing ${opportunities.length} opportunities`);

    // Use AI to match opportunities with user skills
    const userProfile = {
      skills: resumeAnalysis.skills || [],
      industries: resumeAnalysis.industry_expertise || [],
      experience: resumeAnalysis.years_experience || 0,
      positions: resumeAnalysis.recommended_positions || []
    };

    const matches = [];
    let processedCount = 0;

    for (const opp of opportunities) {
      try {
        processedCount++;
        if (processedCount % 10 === 0) {
          console.log(`Processed ${processedCount}/${opportunities.length} opportunities`);
        }
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

      // Cap the score at 100 to comply with database constraint
      matchScore = Math.min(matchScore, 100);

      // Lower threshold - consider more opportunities
      const shouldProcess = matchScore > 20 || matchingSkills.length > 0 || titleMatch || industryMatch;
      
      if (shouldProcess) {
        // Use AI to generate personalized recommendation with timeout
        let aiRecommendation = 'Your extensive experience makes you a strong candidate for this contract opportunity.';
        
        try {
          const aiResponse = await Promise.race([
          fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
                    content: 'You are an executive career strategist who creates high-impact job match recommendations. Focus on concrete value propositions and specific alignment points. Never use generic language.'
                  },
                  {
                    role: 'user',
                    content: `ROLE: You are an executive career strategist specializing in high-value job matching.

CANDIDATE PROFILE:
Skills: ${userProfile.skills.join(", ")}
Industry Expertise: ${userProfile.industries.join(", ")}
Experience Level: ${userProfile.experience} years
Target Roles: ${userProfile.positions.join(", ")}

OPPORTUNITY DETAILS:
Role: ${opp.job_title}
Company: ${opp.company_name || "Not disclosed"}
Location: ${opp.location || "Not specified"}
Description: ${(opp.job_description || "").substring(0, 600)}
Rate: $${opp.hourly_rate_min}-${opp.hourly_rate_max}/hour
Duration: ${opp.contract_duration_months} months
Match Score: ${Math.round(matchScore)}%

TASK: Generate a compelling, results-focused pitch (2-3 sentences) that:
1. Opens with the strongest alignment point (skill/experience match)
2. Quantifies the value proposition where possible
3. Creates urgency with a clear call-to-action

TONE: Professional, confident, benefit-driven
FORMAT: Direct recommendation without fluff
AVOID: Generic phrases like "great opportunity" or "exciting role"

OUTPUT: Return ONLY the recommendation text, no preamble.`
                  }
                ],
              }),
            }),
            new Promise<Response>((_, reject) => setTimeout(() => reject(new Error('AI timeout')), 8000))
          ]) as Response;

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            aiRecommendation = aiData.choices?.[0]?.message?.content || aiRecommendation;
          } else {
            console.error('AI recommendation failed:', await aiResponse.text());
          }
        } catch (aiError) {
          console.error('AI call error:', aiError);
          // Use default recommendation on error
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
    } catch (oppError) {
      console.error(`Error processing opportunity ${opp.id}:`, oppError);
      // Continue with next opportunity
    }
  }
  
  console.log(`Successfully processed ${matches.length} matches`);

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