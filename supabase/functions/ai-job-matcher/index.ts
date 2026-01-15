import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { extractJSON } from '../_shared/json-parser.ts';
import { createLogger } from '../_shared/logger.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logger = createLogger('ai-job-matcher');

// Helper: Calculate years of experience from work positions
function calculateWorkExperience(positions: any[]): number {
  let totalDays = 0;
  const now = new Date();
  
  for (const pos of positions) {
    if (!pos.start_date) continue;
    const start = new Date(pos.start_date);
    const end = pos.is_current || !pos.end_date ? now : new Date(pos.end_date);
    totalDays += (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  }
  
  return Math.floor(totalDays / 365);
}

interface VaultData {
  power_phrases: any[];
  transferable_skills: any[];
  hidden_competencies: any[];
  target_roles: string[];
  target_industries: string[];
  leadership_philosophy: any[];
  intangible_skills: any[];
  working_knowledge: any[];
  resume_strength: number;
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

    // 3. Fetch Master Resume Data (ALL categories + CRITICAL: work positions, education, milestones)
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
        vault_soft_skills (id, skill_category, skill_name, proficiency_level),
        vault_leadership_philosophy (id, philosophy_statement, application_examples),
        vault_executive_presence (id, indicator_type, manifestation, recognition),
        vault_personality_traits (id, trait_name, trait_category, professional_context),
        vault_work_style (id, style_category, preference_description),
        vault_values_motivations (id, value_name, value_category, manifestation),
        vault_behavioral_indicators (id, indicator_type, behavior_description, evidence),
        vault_work_positions (company_name, job_title, start_date, end_date, is_current, description, team_size),
        vault_education (institution_name, degree_type, field_of_study, graduation_year),
        vault_resume_milestones (milestone_title, description, metric_type, metric_value, context)
      `)
      .eq('user_id', user.id)
      .single();

    if (vaultError || !vaultData) {
      throw new Error('Master Resume not found. Please complete your resume first.');
    }

    if ((vaultData.overall_strength_score || 0) < 50) {
      return new Response(
        JSON.stringify({ 
          error: 'Master Resume completeness too low. Please add more content before using AI matching.',
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

    // 6. Prepare compact resume data for AI (ALL 10 categories)
    const compactVault = {
      target_roles: vaultData.target_roles || [],
      target_industries: vaultData.target_industries || [],
      key_phrases: (vaultData.vault_power_phrases || []).slice(0, 20).map((p: any) => p.phrase),
      skills: (vaultData.vault_transferable_skills || []).slice(0, 15).map((s: any) => 
        `${s.skill_name} (${s.proficiency_level}, ${s.years_experience}y)`
      ),
      competencies: (vaultData.vault_hidden_competencies || []).slice(0, 10).map((c: any) => c.competency),
      soft_skills: (vaultData.vault_soft_skills || []).slice(0, 10).map((s: any) => s.skill_name),
      leadership: (vaultData.vault_leadership_philosophy || []).slice(0, 5).map((l: any) => l.philosophy_statement),
      executive_presence: (vaultData.vault_executive_presence || []).slice(0, 5).map((e: any) => e.indicator_type),
      personality: (vaultData.vault_personality_traits || []).slice(0, 5).map((p: any) => p.trait_name),
      work_style: (vaultData.vault_work_style || []).slice(0, 5).map((w: any) => w.style_category),
      values: (vaultData.vault_values_motivations || []).slice(0, 5).map((v: any) => v.value_name)
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

    // 8. Process jobs in batches with Perplexity AI
    const batchSize = 10;
    const matches: any[] = [];
    let totalAnalyzed = 0;

    for (let i = 0; i < jobsToAnalyze.length; i += batchSize) {
      const batch = jobsToAnalyze.slice(i, i + batchSize);
      
      for (const job of batch) {
        try {
          const systemPrompt = `You are an expert career matching AI. Return ONLY valid JSON, no additional text or explanations.

CRITICAL: Return ONLY this exact JSON structure, nothing else:
{
  "match_score": "number (0-100)",
  "matching_skills": ["array of strings - skills that match"],
  "ai_recommendation": "string - 2-3 sentence explanation",
  "hidden_strengths": ["array of strings - unique angles"],
  "gap_analysis": ["array of strings - missing requirements"]
}`;

          const userPrompt = `Analyze if this job is a good match for the candidate.

CANDIDATE PROFILE:
- Years of Experience: ${vaultData.vault_work_positions?.length > 0 ? `${calculateWorkExperience(vaultData.vault_work_positions)} years (from ${vaultData.vault_work_positions.length} positions)` : 'Unknown'}
- Education: ${vaultData.vault_education?.map((e: any) => `${e.degree_type} in ${e.field_of_study}`).join(', ') || 'Not specified'}
- Current/Recent Roles: ${vaultData.vault_work_positions?.slice(0, 2).map((wp: any) => `${wp.job_title} at ${wp.company_name}`).join(', ') || 'Not specified'}
- Target Roles: ${compactVault.target_roles.join(', ')}
- Target Industries: ${compactVault.target_industries.join(', ')}
- Key Achievements: ${compactVault.key_phrases.join(' | ')}
- Technical Skills: ${compactVault.skills.join(', ')}
- Soft Skills: ${compactVault.soft_skills.join(', ')}
- Competencies: ${compactVault.competencies.join(', ')}
- Leadership Philosophy: ${compactVault.leadership.join(', ')}
- Executive Presence: ${compactVault.executive_presence.join(', ')}
- Personality Traits: ${compactVault.personality.join(', ')}
- Work Style: ${compactVault.work_style.join(', ')}
- Values: ${compactVault.values.join(', ')}${learningContext}

// Helper function to calculate years from work positions
function calculateWorkExperience(positions: any[]): number {
  let totalDays = 0;
  const now = new Date();
  
  for (const pos of positions) {
    if (!pos.start_date) continue;
    const start = new Date(pos.start_date);
    const end = pos.is_current || !pos.end_date ? now : new Date(pos.end_date);
    totalDays += (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  }
  
  return Math.floor(totalDays / 365);
}

JOB POSTING:
Title: ${job.job_title}
Location: ${job.location}
Salary: $${job.hourly_rate_min}-${job.hourly_rate_max}/hr
Description: ${job.job_description?.substring(0, 1000)}
Required Skills: ${(job.required_skills || []).join(', ')}`;

          const { response, metrics } = await callLovableAI(
            {
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
              ],
              model: LOVABLE_AI_MODELS.DEFAULT,
              temperature: 0.7,
              max_tokens: 1000,
              response_format: { type: 'json_object' }
            },
            'ai-job-matcher',
            user.id
          );

          await logAIUsage(metrics);

          const rawContent = response.choices[0].message.content;
          console.log(`[ai-job-matcher] Raw AI response for job ${job.id}:`, rawContent.substring(0, 300));

          const parseResult = extractJSON(rawContent);
          if (!parseResult.success || !parseResult.data) {
            console.error(`[ai-job-matcher] JSON parse failed for job ${job.id}:`, parseResult.error);
            console.error(`[ai-job-matcher] Full response:`, rawContent);
            logger.error('JSON parsing failed for job match', {
              error: parseResult.error,
              jobId: job.id,
              content: rawContent.substring(0, 500)
            });
            continue;
          }

          const matchData = parseResult.data;

          // Validate required fields
          if (typeof matchData.match_score !== 'number' ||
              !Array.isArray(matchData.matching_skills) ||
              !matchData.ai_recommendation) {
            console.error(`[ai-job-matcher] Missing required fields for job ${job.id}:`, matchData);
            continue;
          }

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