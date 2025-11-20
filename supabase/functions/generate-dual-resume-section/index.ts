import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// Using pinned version to avoid dev environment type resolution issues
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { callLovableAI, LOVABLE_AI_MODELS, cleanCitations } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';

// Dual Resume Section Generator - generates both ideal and personalized versions
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to clean skills format
function cleanSkillsFormat(content: string): string {
  // Remove any bullet points, numbers, or descriptions
  let cleaned = content.replace(/^[-•*\d.)\s]+/gm, '').trim();
  
  // If content has line breaks with descriptions, extract just the skill names
  if (cleaned.includes('\n') && cleaned.includes(':')) {
    const skills = cleaned.split('\n')
      .map(line => line.split(':')[0].trim())
      .filter(skill => skill && skill.length > 0);
    cleaned = skills.join(', ');
  }
  
  // If content has descriptions after dashes or colons, remove them
  if (cleaned.includes(' - ') || cleaned.includes(': ')) {
    const skills = cleaned.split(',')
      .map(skill => {
        // Take only the part before dash or colon
        const cleanSkill = skill.split(/[-:]/)[0].trim();
        return cleanSkill;
      })
      .filter(skill => skill && skill.length > 0);
    cleaned = skills.join(', ');
  }
  
  // Ensure it's comma-separated
  if (!cleaned.includes(',')) {
    const skills = cleaned.split('\n')
      .map(s => s.trim())
      .filter(s => s && s.length > 0);
    cleaned = skills.join(', ');
  }
  
  return cleaned;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      section_type,
      section_guidance,
      job_analysis_research,
      vault_items = [],
      resume_milestones = [],
      user_id,
      job_title,
      industry,
      seniority = 'mid-level',
      ats_keywords = { critical: [], important: [], nice_to_have: [] },
      requirements = []
    } = await req.json();

    console.log(`Generating dual versions for ${section_type}`);

    // SAFETY CHECK: Prevent hallucination when vault is empty
    const isDataRequiredSection = ['experience', 'work_history', 'professional_experience', 'employment', 'education', 'academic_background'].includes(section_type);
    
    if (isDataRequiredSection && resume_milestones.length === 0 && vault_items.length === 0) {
      console.error(`⚠️ SAFETY CHECK FAILED: Cannot generate ${section_type} without resume data`);
      return new Response(
        JSON.stringify({
          error: 'INSUFFICIENT_DATA',
          message: 'Your career vault needs to be populated before generating resume sections. Please complete the vault setup first.',
          section_type
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // CRITICAL FIX: Fetch work positions, education, and milestones for all sections
    let workPositions: any[] = [];
    let education: any[] = [];
    let vaultMilestones: any[] = [];
    
    if (user_id) {
      console.log(`🔍 Fetching complete vault data for user: ${user_id}`);
      
      const { data: vaultRecord } = await supabase
        .from('career_vault')
        .select('id')
        .eq('user_id', user_id)
        .maybeSingle();

      if (vaultRecord) {
        const [workPos, edu, miles] = await Promise.all([
          supabase.from('vault_work_positions').select('*').eq('vault_id', vaultRecord.id).order('start_date', { ascending: false }),
          supabase.from('vault_education').select('*').eq('vault_id', vaultRecord.id).order('graduation_year', { ascending: false }),
          supabase.from('vault_resume_milestones').select('*').eq('vault_id', vaultRecord.id).order('created_at', { ascending: false })
        ]);

        workPositions = workPos.data || [];
        education = edu.data || [];
        vaultMilestones = miles.data || [];

        console.log(`✅ Loaded structural data: ${workPositions.length} positions, ${education.length} degrees, ${vaultMilestones.length} milestones`);
      }
    }

    // Fetch user's vault skills if generating skills section
    let vaultSkills: any[] = [];
    if ((section_type === 'skills' || section_type === 'skills_list' || section_type === 'technical_skills') && user_id) {
      console.log(`🔍 Fetching vault skills for user: ${user_id}`);
      
      const [confirmedSkills, transferableSkills, softSkills] = await Promise.all([
        supabase.from('vault_confirmed_skills').select('*').eq('user_id', user_id),
        supabase.from('vault_transferable_skills').select('*').eq('user_id', user_id),
        supabase.from('vault_soft_skills').select('*').eq('user_id', user_id)
      ]);

      vaultSkills = [
        ...(confirmedSkills.data || []).map((s: any) => ({ skill: s.skill_name, proficiency: s.proficiency_level, source: 'confirmed' })),
        ...(transferableSkills.data || []).map((s: any) => ({ skill: s.stated_skill, evidence: s.evidence, source: 'transferable' })),
        ...(softSkills.data || []).map((s: any) => ({ skill: s.skill_name, source: 'soft' }))
      ];
      
      console.log(`✅ Loaded ${vaultSkills.length} skills from vault (${confirmedSkills.data?.length || 0} confirmed, ${transferableSkills.data?.length || 0} transferable, ${softSkills.data?.length || 0} soft)`);
    } else if ((section_type === 'skills' || section_type === 'skills_list' || section_type === 'technical_skills')) {
      console.log(`⚠️ Skills section requested but user_id is missing! Skills generation will use generic approach.`);
    }

    // Build context strings for prompts
    const workHistoryContext = workPositions.length > 0 
      ? `ACTUAL WORK HISTORY (${workPositions.length} positions):
${workPositions.map((wp: any) => `- ${wp.job_title} at ${wp.company_name} (${wp.start_date || '?'} to ${wp.end_date || 'Present'})
  ${wp.description || ''}`).join('\n')}
`
      : '';

    const educationContext = education.length > 0
      ? `EDUCATION:
${education.map((ed: any) => `- ${ed.degree_type} in ${ed.field_of_study || 'N/A'} from ${ed.institution_name} (${ed.graduation_year || 'N/A'})`).join('\n')}
`
      : '';

    const vaultMilestonesContext = vaultMilestones.length > 0
      ? `VERIFIED ACHIEVEMENTS WITH METRICS:
${vaultMilestones.slice(0, 15).map((m: any) => `- ${m.milestone_title || m.description}: ${m.metric_value || ''} ${m.context || ''}`).join('\n')}
`
      : '';

    // Define section type arrays for conditional logic
    const experienceSections = ['experience', 'employment_history', 'professional_timeline'];
    const educationSections = ['education'];
    const accomplishmentsSections = ['accomplishments', 'achievements', 'selected_accomplishments'];
    const summarySections = ['summary', 'opening_paragraph'];
    const projectSections = ['projects'];
    const skillsSections = ['skills', 'skills_list', 'technical_skills', 'additional_skills', 'core_competencies', 'key_skills'];
    const skillsGroupSections = ['skills_groups', 'core_capabilities'];
    const hasSkillsData = vaultSkills.length > 0;
    const needsBothContexts = skillsGroupSections.includes(section_type);

    // Step 1: Generate IDEAL version (Pure AI, no vault)
    console.log('Generating ideal version...');
    const idealPrompt = `You are an expert resume writer. Create a ${section_type} section for a ${seniority} ${job_title} in ${industry}.

CRITICAL CONTEXT - Real job market research:
${job_analysis_research}

SECTION GUIDANCE:
${section_guidance}

CRITICAL ATS KEYWORDS (MUST include naturally):
${ats_keywords.critical.join(', ')}

Important keywords: ${ats_keywords.important.join(', ')}

REQUIREMENTS TO ADDRESS:
${requirements.slice(0, 10).join('\n- ')}

${section_type === 'skills' ? `
CRITICAL: For skills section, return ONLY a simple comma-separated list. NO descriptions, NO categories, NO bullet points.
Example format: "Python, JavaScript, AWS, Team Leadership, Project Management, Data Analysis, Agile"
` : ''}

Create an INDUSTRY STANDARD version that:
1. Addresses the core problem from research
2. Includes ALL critical ATS keywords naturally
3. Follows ${section_type} best practices for ${industry}
4. Uses quantified achievements (use realistic industry benchmarks)
5. Demonstrates competitive strength

Return ONLY the content, no explanations.`;

    const { response: idealResponse, metrics: idealMetrics } = await callLovableAI({
      messages: [{ role: 'user', content: idealPrompt }],
      model: LOVABLE_AI_MODELS.DEFAULT, // Gemini Flash for content generation
      temperature: 0.6,
      max_tokens: 1500,
    }, 'generate-dual-resume-section-ideal', user_id);

    await logAIUsage(idealMetrics);

    let idealContent = cleanCitations(idealResponse.choices?.[0]?.message?.content || '');

    // Clean up skills section to ensure comma-separated format
    if (section_type === 'skills' || section_type === 'skills_list') {
      idealContent = cleanSkillsFormat(idealContent);
    }

    // Step 2: Generate PERSONALIZED version (AI + Vault + Resume Milestones)
    console.log('Generating personalized version...');
    
    // Prepare resume milestones context (prioritize for experience/education)
    const resumeMilestonesContext = resume_milestones.length > 0
      ? resume_milestones.map((milestone: any, idx: number) => {
          if (milestone.milestone_type === 'job') {
            return `
[Job ${idx + 1}]
Company: ${milestone.company_name || 'N/A'}
Title: ${milestone.title || 'N/A'}
Dates: ${milestone.milestone_date || 'N/A'}
Accomplishments: ${milestone.accomplishments?.join('\n') || 'N/A'}
Key Achievements: ${milestone.key_achievements || 'N/A'}`;
          } else if (milestone.milestone_type === 'education') {
            return `
[Education ${idx + 1}]
Institution: ${milestone.institution_name || 'N/A'}
Degree: ${milestone.degree || 'N/A'}
Year: ${milestone.milestone_date || 'N/A'}
Details: ${milestone.details || 'N/A'}`;
          }
          return '';
        }).filter(Boolean).join('\n')
      : '';
    
    // Prepare skills context from vault
    const skillsContext = vaultSkills.length > 0
      ? vaultSkills.map((skill: any, idx: number) => {
          if (skill.source === 'confirmed') {
            return `${skill.skill} (${skill.proficiency || 'experienced'})`;
          } else if (skill.source === 'transferable') {
            return `${skill.skill} - ${skill.evidence || ''}`;
          } else {
            return skill.skill;
          }
        }).join(', ')
      : '';
    
    // Prepare vault context
    const vaultContext = vault_items.length > 0
      ? vault_items.map((item: any, idx: number) => `
[Vault Item ${idx + 1}] ${item.vaultCategory}:
${JSON.stringify(item.content, null, 2)}
Match Score: ${item.matchScore}%
Addresses: ${item.satisfiesRequirements.join(', ')}
Keywords: ${item.atsKeywords.join(', ')}
`).join('\n')
      : '';
    
    // Check if we have resume data for this section type
    const hasResumeData = resume_milestones.length > 0 && (
      experienceSections.includes(section_type) ||
      educationSections.includes(section_type) ||
      accomplishmentsSections.includes(section_type) ||
      summarySections.includes(section_type) ||
      projectSections.includes(section_type)
    );
    
    const primaryContext = hasResumeData ? resumeMilestonesContext 
                         : hasSkillsData ? skillsContext
                         : needsBothContexts ? `${skillsContext}\n\n${resumeMilestonesContext}`
                         : vaultContext;

    const personalizedPrompt = `You are an expert resume writer. Create a PERSONALIZED ${section_type} section for THIS SPECIFIC CANDIDATE.

CRITICAL CONTEXT - Real job market research:
${job_analysis_research}

SECTION GUIDANCE:
${section_guidance}

    ${workHistoryContext}
    ${educationContext}
    ${vaultMilestonesContext}

CANDIDATE'S CAREER VAULT INTELLIGENCE:
${JSON.stringify(vault_items.slice(0, 30), null, 2)}

${hasSkillsData ? `CANDIDATE'S VAULT SKILLS:
${vaultSkills.map((s: any) => s.skill).join(', ')}
` : ''}

CRITICAL ATS KEYWORDS (MUST include naturally):
${ats_keywords.critical.join(', ')}

Important keywords: ${ats_keywords.important.join(', ')}

REQUIREMENTS TO ADDRESS:
${requirements.slice(0, 10).join('\n- ')}

${skillsSections.includes(section_type) ? `
CRITICAL: For skills section, return ONLY a simple comma-separated list. NO descriptions, NO categories, NO bullet points.
Example format: "Python, JavaScript, AWS, Team Leadership, Project Management, Data Analysis, Agile"
Base the list on their ACTUAL vault skills above.
` : needsBothContexts ? `
CRITICAL: For capability groups, create 3-4 themed categories with supporting bullet points.
Format each as: 
**Category Name**
• Specific example or achievement
• Another example with quantification
` : ''}

Create a PERSONALIZED version that:
${experienceSections.includes(section_type) && workPositions.length > 0 ? `
1. Uses the EXACT companies and titles from the work history above
2. Uses ACTUAL dates from work positions (${workPositions[0]?.start_date || '?'} to ${workPositions[0]?.end_date || 'Present'})
3. Enhances the language with power verbs and ATS keywords
4. Includes quantified achievements from milestones
5. Maintains factual accuracy - NO fabricated positions
CRITICAL: Do NOT add fake jobs. Only enhance what's in the work history.`
: educationSections.includes(section_type) && education.length > 0 ? `
1. Uses EXACT institutions and degrees from education records above
2. Includes graduation years: ${education.map((e: any) => e.graduation_year).filter(Boolean).join(', ')}
3. Adds relevant coursework or honors if applicable
4. Formats professionally for ATS
CRITICAL: Do NOT add fake degrees. Only use actual education data.`
: hasSkillsData ? `
1. Starts with the candidate's ACTUAL vault skills
2. Adds critical ATS keywords from job requirements
3. Orders skills strategically (most relevant first)
4. Ensures comma-separated format
CRITICAL: Base on actual vault data.`
: `
1. Uses ACTUAL achievements and context from vault data
2. Includes ALL critical ATS keywords naturally
3. Quantifies impact where candidate has metrics
4. Demonstrates value proposition clearly
5. Maintains truthfulness to vault data
`}

Return ONLY the content, no explanations.`;

    const { response: personalizedResponse, metrics: personalizedMetrics } = await callLovableAI({
      messages: [{ role: 'user', content: personalizedPrompt }],
      model: LOVABLE_AI_MODELS.DEFAULT, // Gemini Flash for content generation
      temperature: 0.5,
      max_tokens: 1500,
    }, 'generate-dual-resume-section-personalized', user_id);

    await logAIUsage(personalizedMetrics);

    let personalizedContent = cleanCitations(personalizedResponse.choices?.[0]?.message?.content || '');

    // Clean up skills section to ensure comma-separated format
    if (section_type === 'skills' || section_type === 'skills_list') {
      personalizedContent = cleanSkillsFormat(personalizedContent);
    }

    // Step 3: Calculate quality scores for both versions
    const calculateQualityScore = (content: string) => {
      const contentLower = content.toLowerCase();
      
      // ATS keyword matching
      const criticalMatched = ats_keywords.critical.filter((kw: string) =>
        contentLower.includes(kw.toLowerCase())
      );
      const importantMatched = ats_keywords.important.filter((kw: string) =>
        contentLower.includes(kw.toLowerCase())
      );
      
      const atsScore = Math.round(
        (criticalMatched.length / Math.max(ats_keywords.critical.length, 1)) * 50 +
        (importantMatched.length / Math.max(ats_keywords.important.length, 1)) * 30 +
        20 // Base score
      );

      // Requirements coverage
      const reqsCovered = requirements.filter((req: any) => {
        if (typeof req === 'string') {
          return contentLower.includes(req.toLowerCase());
        }
        return false;
      });
      const reqScore = requirements.length > 0
        ? Math.round((reqsCovered.length / requirements.length) * 100)
        : 80;

      // Competitive strength indicators
      const hasNumbers = /\d+[%$KkMm+]/.test(content);
      const actionVerbs = ['led', 'managed', 'developed', 'achieved', 'increased', 'created', 'delivered'];
      const hasActionVerbs = actionVerbs.some(verb => contentLower.includes(verb));
      const competitiveScore = (hasNumbers ? 40 : 0) + (hasActionVerbs ? 40 : 0) + 20;

      const overallScore = Math.round(
        atsScore * 0.4 + reqScore * 0.3 + competitiveScore * 0.3
      );

      return {
        overallScore,
        atsMatchPercentage: atsScore,
        requirementsCoverage: reqScore,
        competitiveStrength: Math.min(5, Math.max(1, Math.round(competitiveScore / 20))),
        keywordsMatched: [...criticalMatched, ...importantMatched],
        requirementsAddressed: reqsCovered
      };
    };

    const idealQuality = calculateQualityScore(idealContent);
    const personalizedQuality = calculateQualityScore(personalizedContent);

    // Step 4: Generate AI-BLENDED version using PERPLEXITY (not Lovable AI)
    console.log('Generating AI-blended version...');
    let blendContent = '';
    let blendQuality = idealQuality;

    if (vault_items.length > 0 && personalizedContent) {
      const blendPrompt = `You are an expert resume writer. Create an OPTIMAL BLENDED version by intelligently combining these two versions:

INDUSTRY STANDARD VERSION:
${idealContent}

PERSONALIZED VERSION (candidate's actual experience):
${personalizedContent}

CRITICAL REQUIREMENTS:
${section_type === 'skills' ? `
You MUST return ONLY a simple comma-separated list. NO descriptions, NO categories, NO bullet points.
Example: "Python, JavaScript, AWS, Team Leadership, Project Management"
` : `
Create a cohesive section that:
1. Uses the professional structure and tone from the Industry Standard
2. Incorporates the candidate's ACTUAL achievements and metrics from the Personalized version
3. Ensures every claim is backed by real experience
4. Keeps length similar to Industry Standard (concise and impactful)
5. Includes all critical ATS keywords naturally
`}

Generate a single, cohesive result. Do NOT simply concatenate - intelligently weave together the strongest elements.`;

      const { response: blendResponse, metrics: blendMetrics } = await callLovableAI({
        messages: [{ role: 'user', content: blendPrompt }],
        model: LOVABLE_AI_MODELS.DEFAULT, // Gemini Flash for content generation
        temperature: 0.6,
        max_tokens: 1500,
      }, 'generate-dual-resume-section-blend', user_id);

      await logAIUsage(blendMetrics);

      blendContent = cleanCitations(blendResponse.choices?.[0]?.message?.content || '');
      
      // Clean up skills section to ensure comma-separated format
      if (section_type === 'skills' || section_type === 'skills_list') {
        blendContent = cleanSkillsFormat(blendContent);
      }
      
      blendQuality = calculateQualityScore(blendContent);
      console.log('Blend version generated successfully with Perplexity');
    } else {
      console.log('Skipping blend generation - insufficient vault data');
      blendContent = idealContent;
    }

    // Determine recommendation
    const vaultStrength = vault_items.length > 0
      ? Math.min(100, (vault_items.reduce((sum: number, item: any) => sum + (item.matchScore || 50), 0) / vault_items.length))
      : 0;
    const skillsStrength = vaultSkills.length > 0 ? Math.min(100, vaultSkills.length * 10) : 0;

    let recommendation: 'ideal' | 'personalized' | 'blend';
    let recommendationReason: string;

    if (hasResumeData) {
      recommendation = 'personalized';
      recommendationReason = 'Your uploaded resume provides authentic experience - enhanced for ATS';
    } else if (hasSkillsData) {
      recommendation = 'personalized';
      recommendationReason = `Your Career Vault contains ${vaultSkills.length} verified skills - optimized with ATS keywords`;
    } else if (vault_items.length === 0 || vaultStrength < 40) {
      recommendation = 'ideal';
      recommendationReason = 'Limited vault data - Industry Standard recommended';
    } else if (blendQuality.overallScore >= idealQuality.overallScore && 
               blendQuality.overallScore >= personalizedQuality.overallScore) {
      recommendation = 'blend';
      recommendationReason = 'AI Combined version optimally blends your achievements with industry best practices';
    } else if (personalizedQuality.overallScore > idealQuality.overallScore + 5) {
      recommendation = 'personalized';
      recommendationReason = 'Your vault creates a stronger, more competitive section';
    } else {
      recommendation = 'ideal';
      recommendationReason = 'Industry standard has better ATS optimization';
    }

    console.log(`Generation complete. Recommendation: ${recommendation}`);

    return new Response(
      JSON.stringify({
        success: true,
        idealVersion: {
          content: idealContent,
          quality: idealQuality
        },
        personalizedVersion: {
          content: personalizedContent,
          quality: personalizedQuality,
          vaultItemsUsed: vault_items.length
        },
        blendVersion: {
          content: blendContent,
          quality: blendQuality
        },
        comparison: {
          recommendation,
          recommendationReason,
          vaultStrength: hasSkillsData ? skillsStrength : vaultStrength,
          hasResumeData,
          hasSkillsData,
          skillsCount: vaultSkills.length
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('❌ Unexpected error in generate-dual-resume-section:', error);
    console.error('Error stack:', error.stack);
    
    // Check for specific error types
    let errorCode = 'UNKNOWN_ERROR';
    let userMessage = 'An unexpected error occurred. Please try again.';
    
    if (error.message?.includes('job_analysis_research')) {
      errorCode = 'MISSING_JOB_ANALYSIS';
      userMessage = 'Job analysis data is missing. Please ensure you have a detailed job description.';
    } else if (error.message?.includes('fetch') || error.message?.includes('network')) {
      errorCode = 'NETWORK_ERROR';
      userMessage = 'Network connection error. Please check your internet and try again.';
    } else if (error.message?.includes('timeout')) {
      errorCode = 'TIMEOUT_ERROR';
      userMessage = 'Request timed out. Please try again.';
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorCode,
        message: userMessage,
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
