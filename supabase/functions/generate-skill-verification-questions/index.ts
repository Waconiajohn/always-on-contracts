import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { callPerplexity } from '../_shared/ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { selectOptimalModel } from '../_shared/model-optimizer.ts';

/**
 * Generate Dynamic Skill Verification Questions
 *
 * Takes a user's resume milestones and extracts skills/technologies/tools,
 * then generates verification questions asking user to rate proficiency.
 *
 * This makes the quiz universal - works for ANY profession!
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SkillQuestion {
  skill_name: string;
  category: string; // 'technical', 'tool', 'methodology', 'domain'
  source_milestone_id?: string;
  question_text: string;
  confidence: number; // How confident AI is this is a real skill (0-100)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { vault_id, user_id } = await req.json();

    if (!user_id) {
      throw new Error('User ID required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[SKILL-VERIFICATION] Generating questions for user:', user_id);

    // 1. Fetch user's resume milestones
    const { data: milestones, error: milestonesError } = await supabase
      .from('vault_resume_milestones')
      .select('*')
      .eq('user_id', user_id)
      .eq('vault_id', vault_id)
      .order('end_date', { ascending: false });

    if (milestonesError) throw milestonesError;

    if (!milestones || milestones.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          skill_questions: [],
          message: 'No resume milestones found - skipping skill verification'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Use AI to extract skills from milestone descriptions

    // Combine milestone data for analysis
    const milestoneContext = milestones.map(m => `
Job: ${m.job_title || 'N/A'} at ${m.company_name || 'N/A'}
Dates: ${m.start_date || 'N/A'} - ${m.end_date || 'Present'}
Description: ${m.description || 'N/A'}
Achievements: ${JSON.stringify(m.key_achievements || [])}
    `).join('\n---\n');

    const prompt = `Extract ALL skills, technologies, tools, and methodologies from this resume.

RESUME CONTENT:
${milestoneContext}

EXTRACTION RULES:
1. Extract ONLY real, verifiable skills (not soft skills like "leadership" - we ask those separately)
2. Include:
   - Technical skills (programming languages, frameworks, databases)
   - Tools & software (Excel, Salesforce, AutoCAD, etc.)
   - Methodologies (Agile, Six Sigma, GAAP, etc.)
   - Domain expertise (Financial Modeling, Clinical Research, etc.)
   - Certifications mentioned

3. DO NOT include:
   - Soft skills (communication, teamwork, etc.)
   - Job responsibilities (those are in milestones)
   - Generic terms like "problem solving"

4. For each skill, determine:
   - skill_name: The skill/tool/methodology
   - category: technical | tool | methodology | domain | certification
   - recency: How recently used (current, 1-2 years, 3-5 years, 5+ years)
   - confidence: 0-100 (how certain this is a real skill vs just mentioned)

5. Prioritize skills by recency and frequency of mention

Return as JSON:
{
  "skills": [
    {
      "skill_name": "Python",
      "category": "technical",
      "recency": "current",
      "confidence": 95,
      "mentioned_in": ["job_title_1", "job_title_2"]
    }
  ]
}

Extract up to 20 most important skills. Focus on what makes this person SPECIALIZED.`;

    const { response, metrics } = await callPerplexity(
      {
        messages: [{ role: 'user', content: prompt }],
        model: selectOptimalModel({
          taskType: 'extraction',
          complexity: 'medium',
          requiresReasoning: false,
          outputLength: 'medium'
        }),
        temperature: 0.3,
      },
      'generate-skill-verification-questions',
      user_id
    );

    await logAIUsage(metrics);

    const extractedSkills = JSON.parse(response.choices[0].message.content);

    console.log(`[SKILL-VERIFICATION] Extracted ${extractedSkills.skills?.length || 0} skills`);

    // 3. Generate verification questions for each skill
    const skillQuestions = (extractedSkills.skills || [])
      .filter((skill: any) => skill.confidence >= 70) // Only high-confidence skills
      .slice(0, 15) // Limit to 15 questions
      .map((skill: any) => ({
        competency_name: `Skill: ${skill.skill_name}`,
        category: 'Skills & Expertise (Resume-Based)',
        question_text: `Rate your proficiency in ${skill.skill_name}`,
        question_type: 'scale',
        answer_options: [
          { value: 1, label: "Beginner (learning/familiar)" },
          { value: 2, label: "Intermediate (can work independently)" },
          { value: 3, label: "Advanced (expert in most areas)" },
          { value: 4, label: "Expert (go-to person, can teach others)" },
          { value: 5, label: "Master (recognized authority, innovative)" }
        ],
        follow_up_question: `How recently have you used ${skill.skill_name}?`,
        follow_up_options: [
          { value: "current", label: "Currently using" },
          { value: "recent", label: "Within last 1-2 years" },
          { value: "past", label: "3-5 years ago" },
          { value: "old", label: "More than 5 years ago" }
        ],
        ats_keywords: [skill.skill_name],
        skill_metadata: {
          category: skill.category,
          recency: skill.recency,
          confidence: skill.confidence,
          mentioned_in: skill.mentioned_in
        },
        help_text: `We see ${skill.skill_name} in your resume. Verifying your proficiency helps us highlight the right skills for each job.`,
        required_percentage: 0, // Dynamic, not universally required
        differentiator_weight: skill.category === 'technical' ? 0.8 : 0.6,
        is_dynamic: true, // Flag to indicate this was dynamically generated
        applicable_roles: ['*'],
        applicable_industries: ['*']
      }));

    console.log(`[SKILL-VERIFICATION] Generated ${skillQuestions.length} verification questions`);

    return new Response(
      JSON.stringify({
        success: true,
        skill_questions: skillQuestions,
        total_skills_extracted: extractedSkills.skills?.length || 0,
        skills_with_questions: skillQuestions.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[SKILL-VERIFICATION] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        skill_questions: [] // Return empty array so quiz can continue with just universal questions
      }),
      {
        status: 200, // Return 200 so frontend doesn't error out
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
