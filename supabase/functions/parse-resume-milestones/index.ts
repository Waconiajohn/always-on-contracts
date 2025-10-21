import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

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
- SKIP any entry missing required fields

    console.log('[PARSE-RESUME-MILESTONES] Calling Gemini 2.5 Flash...');
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[PARSE-RESUME-MILESTONES] AI error:', response.status, errorText);
      throw new Error(`AI parsing failed: ${response.status}`);
    }

    const aiData = await response.json();
    const aiResponse = aiData.choices[0].message.content;

    let parsed;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : aiResponse);
    } catch (e) {
      console.error('[PARSE-RESUME-MILESTONES] Failed to parse:', e);
      throw new Error('Failed to parse AI response');
    }

    console.log('[PARSE-RESUME-MILESTONES] Parsed milestones:', parsed.milestones.length);

    // Extract ALL jobs and education entries with complete data
    const milestoneInserts = parsed.milestones
      .filter((m: any) => {
        // Jobs must have complete data
        if (m.type === 'job') {
          const hasAllRequiredFields = 
            m.company_name && 
            m.job_title && 
            m.start_date && 
            m.end_date;
          
          if (!hasAllRequiredFields) {
            console.log('[PARSE-RESUME-MILESTONES] Skipping incomplete job:', {
              company: m.company_name || 'MISSING',
              title: m.job_title || 'MISSING',
              start: m.start_date || 'MISSING',
              end: m.end_date || 'MISSING'
            });
          }
          return hasAllRequiredFields;
        }
        
        // Education must have complete data
        if (m.type === 'education') {
          const hasAllRequiredFields =
            m.institution_name &&
            m.degree_title &&
            m.graduation_date;
          
          if (!hasAllRequiredFields) {
            console.log('[PARSE-RESUME-MILESTONES] Skipping incomplete education:', {
              institution: m.institution_name || 'MISSING',
              degree: m.degree_title || 'MISSING',
              graduation: m.graduation_date || 'MISSING'
            });
          }
          return hasAllRequiredFields;
        }
        
        // Unknown type - skip
        console.log('[PARSE-RESUME-MILESTONES] Skipping unknown type:', m.type);
        return false;
      })
      .map((m: any, index: number) => {
        // Dynamic question allocation based on priority
        let questionsForEntry = 2; // Default for education
        
        if (m.type === 'job') {
          if (index === 0) questionsForEntry = 8; // Most recent job: 8 questions
          else if (index <= 2) questionsForEntry = 5; // Next 2 jobs: 5 questions each
          else if (index <= 5) questionsForEntry = 3; // Next 3 jobs: 3 questions each
          else questionsForEntry = 2; // Older jobs: 2 questions
        }

        // Map to database schema (handle both job and education types)
        return {
          vault_id: vaultId,
          user_id: user.id,
          milestone_type: m.type,
          
          // Job fields (or mapped education fields)
          company_name: m.company_name || m.institution_name || null,
          job_title: m.job_title || m.degree_title || null,
          start_date: m.start_date || null,
          end_date: m.end_date || m.graduation_date || null,
          description: m.type === 'education' 
            ? `${m.field_of_study || ''}${m.honors ? ' • ' + m.honors : ''}`.trim() || ''
            : (m.description || ''),
          key_achievements: m.key_achievements || [],
          
          questions_asked: questionsForEntry,
          questions_answered: 0,
          completion_percentage: 0,
          intelligence_extracted: 0
        };
      });

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