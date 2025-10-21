import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
      job_title,
      industry,
      seniority = 'mid-level',
      ats_keywords = { critical: [], important: [], nice_to_have: [] },
      requirements = []
    } = await req.json();

    console.log(`Generating dual versions for ${section_type}`);

    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

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

    const idealResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: idealPrompt }],
        temperature: 0.6,
        max_tokens: 1500
      })
    });

    if (!idealResponse.ok) {
      throw new Error(`Ideal generation failed: ${idealResponse.status}`);
    }

    const idealData = await idealResponse.json();
    let idealContent = idealData.choices?.[0]?.message?.content || '';

    // Clean up skills section to ensure comma-separated format
    if (section_type === 'skills' || section_type === 'skills_list') {
      idealContent = cleanSkillsFormat(idealContent);
    }

    // Step 2: Generate PERSONALIZED version (AI + Vault + Resume Milestones)
    console.log('Generating personalized version...');
    
    // Prepare resume milestones context (prioritize for experience/education)
    const milestonesContext = resume_milestones.length > 0
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
    
    // Determine primary data source
    const hasResumeData = resume_milestones.length > 0 && 
                          (section_type === 'experience' || section_type === 'education');
    const primaryContext = hasResumeData ? milestonesContext : vaultContext;

    const personalizedPrompt = `You are an expert resume writer. Create a PERSONALIZED ${section_type} section for THIS SPECIFIC CANDIDATE.

CRITICAL CONTEXT - Real job market research:
${job_analysis_research}

SECTION GUIDANCE:
${section_guidance}

${hasResumeData ? `CANDIDATE'S ACTUAL ${section_type.toUpperCase()} FROM UPLOADED RESUME:
${milestonesContext}

CRITICAL: Use the ACTUAL experiences above. Enhance the language and formatting, but do NOT fabricate new jobs or education.` : `CANDIDATE'S CAREER VAULT DATA:
${primaryContext}`}

CRITICAL ATS KEYWORDS (MUST include naturally):
${ats_keywords.critical.join(', ')}

Important keywords: ${ats_keywords.important.join(', ')}

REQUIREMENTS TO ADDRESS:
${requirements.slice(0, 10).join('\n- ')}

${section_type === 'skills' ? `
CRITICAL: For skills section, return ONLY a simple comma-separated list. NO descriptions, NO categories, NO bullet points.
Example format: "Python, JavaScript, AWS, Team Leadership, Project Management, Data Analysis, Agile"
` : ''}

Create a PERSONALIZED version that:
${hasResumeData ? `
1. Uses the EXACT companies, titles, dates, and schools from the resume milestones above
2. Enhances the language and bullet points for ATS optimization
3. Includes ALL critical ATS keywords naturally in the descriptions
4. Adds quantification and impact where possible (but stay truthful to the original)
5. Improves formatting and action verbs
CRITICAL: Do NOT add fake jobs, fake degrees, or fake experience. Only enhance what's already there.` : `
1. Uses ACTUAL achievements from the candidate's vault
2. Includes ALL critical ATS keywords naturally
3. Leverages candidate's unique strengths and metrics
4. Addresses the core problem from research
5. Demonstrates competitive advantage through real accomplishments
${vault_items.length === 0 && !hasResumeData ? 'NOTE: No candidate data available. Create based on industry standards.' : 'Use ONLY information from the data provided. Do not fabricate.'}`}

Return ONLY the content, no explanations.`;

    const personalizedResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: personalizedPrompt }],
        temperature: 0.5,
        max_tokens: 1500
      })
    });

    if (!personalizedResponse.ok) {
      throw new Error(`Personalized generation failed: ${personalizedResponse.status}`);
    }

    const personalizedData = await personalizedResponse.json();
    let personalizedContent = personalizedData.choices?.[0]?.message?.content || '';

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

    // Step 4: Generate AI-BLENDED version
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

      const blendResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{ role: 'user', content: blendPrompt }],
          temperature: 0.6,
          max_tokens: 1500
        })
      });

      if (blendResponse.ok) {
        const blendData = await blendResponse.json();
        blendContent = blendData.choices?.[0]?.message?.content || '';
        
        // Clean up skills section to ensure comma-separated format
        if (section_type === 'skills' || section_type === 'skills_list') {
          blendContent = cleanSkillsFormat(blendContent);
        }
        
        blendQuality = calculateQualityScore(blendContent);
        console.log('Blend version generated successfully');
      } else {
        console.error('Blend generation failed, falling back to ideal version');
        blendContent = idealContent;
      }
    } else {
      console.log('Skipping blend generation - insufficient vault data');
      blendContent = idealContent;
    }

    // Determine recommendation
    const vaultStrength = vault_items.length > 0
      ? Math.min(100, (vault_items.reduce((sum: number, item: any) => sum + (item.matchScore || 50), 0) / vault_items.length))
      : 0;
    
    const hasResumeData = resume_milestones.length > 0 && 
                          (section_type === 'experience' || section_type === 'education');

    let recommendation: 'ideal' | 'personalized' | 'blend';
    let recommendationReason: string;

    if (hasResumeData) {
      recommendation = 'personalized';
      recommendationReason = 'Your uploaded resume provides authentic experience - enhanced for ATS';
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
          vaultStrength,
          hasResumeData
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error in generate-dual-resume-section:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to generate dual versions'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
