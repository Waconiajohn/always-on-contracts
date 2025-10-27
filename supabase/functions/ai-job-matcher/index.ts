import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VaultData {
  power_phrases: any[];
  transferable_skills: any[];
  hidden_competencies: any[];
  target_roles: string[];
  target_industries: string[];
  leadership_philosophy: any[];
  intangible_skills: any[];
  working_knowledge: any[];
  vault_strength: number;
}

interface JobOpportunity {
  id: string;
  job_title: string;
  job_description: string;
  required_skills: string[];
  location: string;
  hourly_rate_min: number;
  hourly_rate_max: number;
}

interface MatchResult {
  job_id: string;
  match_score: number;
  matching_skills: string[];
  ai_recommendation: string;
  hidden_strengths: string[];
  gap_analysis: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get userId from request body or from auth token
    const body = await req.json();
    const userId = body.userId;

    let user;
    if (userId) {
      // Called from cron job with userId in body
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
      if (userError || !userData) {
        throw new Error('User not found');
      }
      user = userData.user;
    } else {
      // Called by user directly
      const token = authHeader.replace('Bearer ', '');
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !authUser) {
        throw new Error('Unauthorized');
      }
      user = authUser;
    }

    console.log(`[AI-JOB-MATCHER] Processing for user: ${user.id}`);

    // 1. Check subscription tier (must be concierge_elite or retirement)
    const { data: subData } = await supabase.functions.invoke('check-subscription', {
      headers: { Authorization: authHeader }
    });

    if (!subData?.has_access || (subData.tier !== 'concierge_elite' && !subData.is_retirement_client)) {
      return new Response(
        JSON.stringify({ 
          error: 'AI Job Matching is exclusive to Concierge Elite subscribers',
          required_tier: 'concierge_elite'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Check if AI matching is enabled for this user
    const { data: preferences } = await supabase
      .from('user_ai_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (preferences && !preferences.enabled) {
      return new Response(
        JSON.stringify({ 
          message: 'AI matching is disabled for this user',
          matches_found: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Fetch Career Vault Data
    const { data: vaultData, error: vaultError } = await supabase
      .from('career_vault')
      .select(`
        id,
        target_roles,
        target_industries,
        overall_strength_score,
        vault_power_phrases (id, phrase, category, context, impact_metrics),
        vault_transferable_skills (id, skill_name, proficiency_level, years_experience, endorsements),
        vault_hidden_competencies (id, competency, evidence, depth_score),
        vault_leadership_philosophy (id, principle, application, outcomes),
        vault_intangible_skills (id, skill_name, manifestation, recognition),
        vault_working_knowledge (id, technology, experience_level, last_used)
      `)
      .eq('user_id', user.id)
      .single();

    if (vaultError || !vaultData) {
      throw new Error('Career Vault not found. Please complete your vault first.');
    }

    if ((vaultData.overall_strength_score || 0) < 50) {
      return new Response(
        JSON.stringify({ 
          error: 'Career Vault completeness too low. Please add more content before using AI matching.',
          current_strength: vaultData.overall_strength_score
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Fetch Active Job Opportunities
    let jobsQuery = supabase
      .from('job_opportunities')
      .select('*')
      .gte('posted_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('posted_date', { ascending: false })
      .limit(100);

    // Apply user preferences if they exist
    if (preferences) {
      if (preferences.preferred_locations && preferences.preferred_locations.length > 0) {
        jobsQuery = jobsQuery.in('location', preferences.preferred_locations);
      }
      if (preferences.min_salary) {
        jobsQuery = jobsQuery.gte('hourly_rate_min', preferences.min_salary);
      }
    }

    const { data: jobs, error: jobsError } = await jobsQuery;

    if (jobsError) {
      console.error('[AI-JOB-MATCHER] Error fetching jobs:', jobsError);
      throw jobsError;
    }

    if (!jobs || jobs.length === 0) {
      console.log('[AI-JOB-MATCHER] No jobs found matching criteria');
      return new Response(
        JSON.stringify({ 
          message: 'No new jobs available matching your criteria',
          matches_found: 0,
          jobs_analyzed: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[AI-JOB-MATCHER] Analyzing ${jobs.length} jobs`);

    // 5. Check for existing matches and applications to avoid duplicates
    const { data: existingMatches } = await supabase
      .from('opportunity_matches')
      .select('opportunity_id')
      .eq('user_id', user.id);

    const { data: existingApplications } = await supabase
      .from('application_queue')
      .select('opportunity_id')
      .eq('user_id', user.id);

    const existingJobIds = new Set([
      ...(existingMatches || []).map(m => m.opportunity_id),
      ...(existingApplications || []).map(a => a.opportunity_id)
    ]);

    const jobsToAnalyze = jobs.filter(job => !existingJobIds.has(job.id));

    if (jobsToAnalyze.length === 0) {
      console.log('[AI-JOB-MATCHER] All jobs already matched or in queue');
      return new Response(
        JSON.stringify({ 
          message: 'All available jobs already reviewed',
          matches_found: 0,
          jobs_analyzed: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Prepare compact vault data for AI
    const compactVault = {
      target_roles: vaultData.target_roles || [],
      target_industries: vaultData.target_industries || [],
      key_phrases: (vaultData.vault_power_phrases || []).slice(0, 20).map((p: any) => p.phrase),
      skills: (vaultData.vault_transferable_skills || []).slice(0, 15).map((s: any) => 
        `${s.skill_name} (${s.proficiency_level}, ${s.years_experience}y)`
      ),
      competencies: (vaultData.vault_hidden_competencies || []).slice(0, 10).map((c: any) => c.competency),
      leadership: (vaultData.vault_leadership_philosophy || []).slice(0, 5).map((l: any) => l.principle)
    };

    // 7. Fetch recent feedback for learning
    const { data: recentFeedback } = await supabase
      .from('ai_match_feedback')
      .select('action, feedback_notes')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    const learningContext = recentFeedback && recentFeedback.length > 0 
      ? `\nUser feedback history: ${JSON.stringify(recentFeedback)}`
      : '';

    // 8. Process jobs in batches with Lovable AI
    const batchSize = 10;
    const matches: any[] = [];
    let totalAnalyzed = 0;

    for (let i = 0; i < jobsToAnalyze.length; i += batchSize) {
      const batch = jobsToAnalyze.slice(i, i + batchSize);
      
      for (const job of batch) {
        try {
          const prompt = `You are an expert career matching AI. Analyze if this job is a good match for the candidate.

CANDIDATE PROFILE:
- Target Roles: ${compactVault.target_roles.join(', ')}
- Target Industries: ${compactVault.target_industries.join(', ')}
- Key Achievements: ${compactVault.key_phrases.join(' | ')}
- Skills: ${compactVault.skills.join(', ')}
- Competencies: ${compactVault.competencies.join(', ')}
- Leadership Philosophy: ${compactVault.leadership.join(', ')}${learningContext}

JOB POSTING:
Title: ${job.job_title}
Location: ${job.location}
Salary: $${job.hourly_rate_min}-${job.hourly_rate_max}/hr
Description: ${job.job_description?.substring(0, 1000)}
Required Skills: ${(job.required_skills || []).join(', ')}

Analyze this match and respond with ONLY valid JSON in this exact format:
{
  "match_score": <number 0-100>,
  "matching_skills": ["skill1", "skill2"],
  "ai_recommendation": "2-3 sentence explanation",
  "hidden_strengths": ["unique angle 1", "unique angle 2"],
  "gap_analysis": ["missing requirement 1", "missing requirement 2"]
}`;

          const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${lovableApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                { role: 'system', content: 'You are a career matching expert. Always respond with valid JSON.' },
                { role: 'user', content: prompt }
              ],
              temperature: 0.7,
              max_tokens: 1000
            })
          });

          if (!aiResponse.ok) {
            if (aiResponse.status === 429) {
              console.error('[AI-JOB-MATCHER] Rate limit hit, pausing...');
              await new Promise(resolve => setTimeout(resolve, 2000));
              continue;
            }
            throw new Error(`AI API error: ${aiResponse.status}`);
          }

          const aiData = await aiResponse.json();
          const content = aiData.choices[0].message.content;
          
          // Parse JSON response
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            console.error('[AI-JOB-MATCHER] Invalid JSON response from AI');
            continue;
          }

          const matchData = JSON.parse(jsonMatch[0]);
          totalAnalyzed++;

          // Only save matches with score >= 70%
          if (matchData.match_score >= 70) {
            matches.push({
              user_id: user.id,
              opportunity_id: job.id,
              match_score: matchData.match_score,
              matching_skills: matchData.matching_skills,
              ai_recommendation: matchData.ai_recommendation,
              status: 'new',
              source: 'ai_suggestion',
              created_at: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error(`[AI-JOB-MATCHER] Error analyzing job ${job.id}:`, error);
        }
      }
    }

    // 9. Insert matches into database
    if (matches.length > 0) {
      const { error: insertError } = await supabase
        .from('opportunity_matches')
        .insert(matches);

      if (insertError) {
        console.error('[AI-JOB-MATCHER] Error inserting matches:', insertError);
        throw insertError;
      }
    }

    // 10. Update last_match_run timestamp
    await supabase
      .from('user_ai_preferences')
      .upsert({
        user_id: user.id,
        last_match_run: new Date().toISOString(),
        enabled: true
      });

    const avgScore = matches.length > 0 
      ? matches.reduce((sum, m) => sum + m.match_score, 0) / matches.length 
      : 0;

    console.log(`[AI-JOB-MATCHER] Complete: ${matches.length} matches from ${totalAnalyzed} jobs`);

    return new Response(
      JSON.stringify({
        success: true,
        matches_found: matches.length,
        jobs_analyzed: totalAnalyzed,
        avg_score: Math.round(avgScore)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[AI-JOB-MATCHER] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});