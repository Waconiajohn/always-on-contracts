import "https://deno.land/x/xhr@0.1.0/mod.ts";
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

const logger = createLogger('parse-resume-milestones');

// Helper function to find or create a work position
async function findOrCreateWorkPosition(supabase: any, data: {
  vault_id: string;
  user_id: string;
  company_name: string;
  job_title: string;
  start_date?: string;
  end_date?: string;
}) {
  // Try to find existing position (case-insensitive match on company and title)
  const { data: existing } = await supabase
    .from('vault_work_positions')
    .select('id')
    .eq('vault_id', data.vault_id)
    .ilike('company_name', data.company_name)
    .ilike('job_title', data.job_title)
    .maybeSingle();
  
  if (existing) {
    console.log(`[FIND-OR-CREATE-POSITION] Found existing position: ${data.company_name} - ${data.job_title}`);
    return existing.id;
  }
  
  // Create new position
  console.log(`[FIND-OR-CREATE-POSITION] Creating new position: ${data.company_name} - ${data.job_title}`);
  const { data: newPosition, error: createError } = await supabase
    .from('vault_work_positions')
    .insert({
      vault_id: data.vault_id,
      user_id: data.user_id,
      company_name: data.company_name,
      job_title: data.job_title,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      is_current: data.end_date === 'Present' || !data.end_date,
      quality_tier: 'gold',
      confidence_score: 0.95,
      extraction_source: 'resume-parser'
    })
    .select('id')
    .single();
  
  if (createError) {
    console.error('[FIND-OR-CREATE-POSITION] Error creating position:', createError);
    throw createError;
  }
  
  return newPosition.id;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) throw new Error('Unauthorized');

    const { resumeText, vaultId, targetRoles = [], targetIndustries = [] } = await req.json();

    console.log('[PARSE-RESUME-MILESTONES] Parsing resume with career focus:', { targetRoles, targetIndustries });

    // Delete existing milestones to prevent duplicates
    const { error: deleteError } = await supabase
      .from('vault_resume_milestones')
      .delete()
      .eq('vault_id', vaultId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('[PARSE-RESUME-MILESTONES] Error deleting old milestones:', deleteError);
    }

    const careerFocusContext = targetRoles.length > 0 || targetIndustries.length > 0
      ? `\n\nUSER'S CAREER FOCUS:
- Target Roles: ${targetRoles.join(', ') || 'Any'}
- Target Industries: ${targetIndustries.join(', ') || 'Any'}

PRIORITIZE jobs that are most relevant to this career focus. Score each job's relevance (0-100%).`
      : '';

    const systemPrompt = `You are an expert resume parser specialized in career trajectory analysis. Extract ALL employment positions and education entries to build a complete career record.`;

    const prompt = `Parse this resume and extract ALL employment positions and ALL education entries. Capture the complete career history.

${careerFocusContext}

EXTRACTION RULES:
1. Extract ALL employment positions (complete work history - no limit)
2. Extract ALL education entries (degrees, certifications, relevant training)
3. Do NOT create separate entries for achievements - include them within the job context
4. Do NOT create project-only entries unless they were paid contract/freelance work
5. Every job entry MUST have: company_name, job_title, start_date, end_date
6. Every education entry MUST have: institution_name, degree_title, field_of_study, graduation_date
7. Assign a relevance_score (0-100%) to help prioritize entries, but extract EVERYTHING
8. Sort by date (most recent first)

RESUME TEXT:
${resumeText}

Return as JSON:
{
  "milestones": [
    {
      "type": "job",
      "company_name": "Full company name (REQUIRED)",
      "job_title": "Job title (REQUIRED)",
      "start_date": "YYYY-MM or YYYY (REQUIRED)",
      "end_date": "YYYY-MM or 'Present' (REQUIRED)",
      "description": "Brief role summary",
      "key_achievements": ["Achievement 1", "Achievement 2", "Achievement 3"],
      "relevance_score": 85
    },
    {
      "type": "education",
      "institution_name": "University of XYZ (REQUIRED)",
      "degree_title": "Bachelor of Science (REQUIRED)",
      "field_of_study": "Computer Science",
      "graduation_date": "YYYY-MM or YYYY (REQUIRED)",
      "honors": "Magna Cum Laude",
      "relevance_score": 70
    }
  ]
}

SCORING GUIDELINES:
- 90-100%: Perfect match to target role + industry
- 70-89%: Strong match (either role OR industry aligned)
- 50-69%: Moderate match (transferable skills/experience)
- Below 50%: Still valuable for career narrative

QUESTION ALLOCATION GUIDANCE (for jobs):
- Most recent role (last 2 years): 6-8 questions
- Previous 2-3 key roles: 4-5 questions each
- Earlier career-defining roles: 2-3 questions
- Education entries: 1-2 questions each

OUTPUT REQUIREMENTS:
- Extract ALL jobs and ALL education entries (complete career record)
- Sort by date (most recent first)
- SKIP any entry missing required fields`;

    console.log('[PARSE-RESUME-MILESTONES] Calling AI...');
    const { response, metrics } = await callLovableAI(
      {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        model: LOVABLE_AI_MODELS.DEFAULT,
        response_format: { type: 'json_object' }
      },
      'parse-resume-milestones',
      user.id
    );

    await logAIUsage(metrics);

    const aiResponse = response.choices[0].message.content;

    const parseResult = extractJSON(aiResponse);
    if (!parseResult.success || !parseResult.data) {
      logger.error('JSON parsing failed for resume milestones', {
        error: parseResult.error,
        content: aiResponse.substring(0, 500)
      });
      throw new Error('Failed to parse AI response');
    }

    const parsed = parseResult.data;

    console.log('[PARSE-RESUME-MILESTONES] Parsed milestones:', parsed.milestones.length);

    // Process each milestone and create/link to work positions
    const milestoneInserts = [];
    
    for (let index = 0; index < parsed.milestones.length; index++) {
      const m = parsed.milestones[index];
      
      // Skip incomplete entries
      if (m.type === 'job') {
        const hasAllRequiredFields = m.company_name && m.job_title && m.start_date && m.end_date;
        if (!hasAllRequiredFields) {
          console.log('[PARSE-RESUME-MILESTONES] Skipping incomplete job:', {
            company: m.company_name || 'MISSING',
            title: m.job_title || 'MISSING',
            start: m.start_date || 'MISSING',
            end: m.end_date || 'MISSING'
          });
          continue;
        }
        
        // Find or create work position for this job
        const workPositionId = await findOrCreateWorkPosition(supabase, {
          vault_id: vaultId,
          user_id: user.id,
          company_name: m.company_name,
          job_title: m.job_title,
          start_date: m.start_date,
          end_date: m.end_date
        });
        
        // Dynamic question allocation based on recency
        let questionsForEntry = 2;
        if (index === 0) questionsForEntry = 8; // Most recent: 8 questions
        else if (index <= 2) questionsForEntry = 5; // Next 2: 5 questions
        else if (index <= 5) questionsForEntry = 3; // Next 3: 3 questions
        
        // Create milestone entries for each achievement
        const achievements = m.key_achievements || [];
        for (const achievement of achievements) {
          milestoneInserts.push({
            vault_id: vaultId,
            user_id: user.id,
            work_position_id: workPositionId, // ← THE FIX: Link via FK
            milestone_type: 'job',
            milestone_title: achievement,
            description: achievement,
            questions_asked: questionsForEntry,
            questions_answered: 0,
            completion_percentage: 0,
            intelligence_extracted: 0
          });
        }
        
      } else if (m.type === 'education') {
        const hasAllRequiredFields = m.institution_name && m.degree_title && m.graduation_date;
        if (!hasAllRequiredFields) {
          console.log('[PARSE-RESUME-MILESTONES] Skipping incomplete education:', {
            institution: m.institution_name || 'MISSING',
            degree: m.degree_title || 'MISSING',
            graduation: m.graduation_date || 'MISSING'
          });
          continue;
        }
        
        // Find or create work position for education (using institution as "company")
        const workPositionId = await findOrCreateWorkPosition(supabase, {
          vault_id: vaultId,
          user_id: user.id,
          company_name: m.institution_name,
          job_title: m.degree_title,
          start_date: undefined,
          end_date: m.graduation_date
        });
        
        milestoneInserts.push({
          vault_id: vaultId,
          user_id: user.id,
          work_position_id: workPositionId, // ← THE FIX: Link via FK
          milestone_type: 'education',
          milestone_title: m.degree_title,
          description: `${m.field_of_study || ''}${m.honors ? ' • ' + m.honors : ''}`.trim() || '',
          questions_asked: 2,
          questions_answered: 0,
          completion_percentage: 0,
          intelligence_extracted: 0
        });
      }
    }

    if (milestoneInserts.length === 0) {
      console.error('[PARSE-RESUME-MILESTONES] No valid milestones found');
      throw new Error('Could not extract valid career milestones from resume');
    }

    const { data: insertedMilestones, error: insertError } = await supabase
      .from('vault_resume_milestones')
      .insert(milestoneInserts)
      .select();

    if (insertError) {
      console.error('[PARSE-RESUME-MILESTONES] Insert error:', insertError);
      throw insertError;
    }

    console.log('[PARSE-RESUME-MILESTONES] Saved milestones:', insertedMilestones.length);

    const jobCount = insertedMilestones.filter((m: any) => m.milestone_type === 'job').length;
    const eduCount = insertedMilestones.filter((m: any) => m.milestone_type === 'education').length;
    
    console.log('[PARSE-RESUME-MILESTONES] Summary:', { 
      totalMilestones: insertedMilestones.length,
      jobs: jobCount,
      education: eduCount
    });

    return new Response(
      JSON.stringify({
        success: true,
        milestones: insertedMilestones,
        summary: {
          total: insertedMilestones.length,
          jobs: jobCount,
          education: eduCount
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[PARSE-RESUME-MILESTONES] Error:', error);
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
