import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { extractJSON } from '../_shared/json-parser.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Parse resume text into bullet points
 * Smart extraction of accomplishments from raw resume text
 */
function parseResumeBullets(resumeText: string): { id: string; content: string; source: any }[] {
  const bullets: { id: string; content: string; source: any }[] = [];
  
  if (!resumeText || typeof resumeText !== 'string') return bullets;
  
  // Split by common resume line formats
  const lines = resumeText.split(/[\n\r]+/).map(l => l.trim()).filter(Boolean);
  
  let currentCompany = '';
  let currentTitle = '';
  
  lines.forEach((line, index) => {
    // Skip very short lines or headers
    if (line.length < 20) return;
    
    // Detect company/title patterns (simplified)
    if (line.match(/^(Company|Employer|Organization):/i)) {
      currentCompany = line.replace(/^(Company|Employer|Organization):\s*/i, '');
      return;
    }
    if (line.match(/^(Title|Position|Role):/i)) {
      currentTitle = line.replace(/^(Title|Position|Role):\s*/i, '');
      return;
    }
    
    // Extract bullet points (lines starting with -, •, *, or containing action verbs)
    const isBullet = line.match(/^[-•*]\s*/) || line.match(/^(Led|Managed|Developed|Created|Implemented|Reduced|Increased|Achieved|Delivered|Built|Designed|Launched|Streamlined|Optimized|Transformed)/i);
    
    if (isBullet || line.length > 50) {
      const cleanLine = line.replace(/^[-•*]\s*/, '').trim();
      if (cleanLine.length > 15) {
        bullets.push({
          id: `resume-bullet-${index}`,
          content: cleanLine,
          source: {
            type: 'uploaded_resume',
            company: currentCompany || 'From Resume',
            jobTitle: currentTitle || 'Uploaded Resume',
            dateRange: 'From uploaded resume'
          }
        });
      }
    }
  });
  
  return bullets;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body - now accepts resumeText as fallback
    const { userId, jobRequirements, atsKeywords, resumeText } = await req.json();
    
    // Filter out null/empty requirements
    const validRequirements = (jobRequirements || []).filter((r: any) => 
      r && r.text && typeof r.text === 'string' && r.text.trim().length > 0
    );
    
    if (validRequirements.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true,
          error: 'No valid requirements provided',
          evidenceMatrix: [],
          stats: { totalRequirements: 0, matchedRequirements: 0, coverageScore: 0 }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`[MATCH-REQ-TO-BULLETS] Filtered ${jobRequirements?.length || 0} requirements down to ${validRequirements.length} valid ones`);

    if (!userId) throw new Error('userId is required');
    if (!jobRequirements) throw new Error('jobRequirements is required');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ========================
    // BUILD BULLETS FROM ALL SOURCES
    // ========================
    const bullets: any[] = [];

    // 1. Fetch Master Resume Data - First get resume_id
    const { data: resumeData, error: resumeError } = await supabase
      .from('career_vault')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (resumeError) {
      console.error('[MATCH-REQ-TO-BULLETS] Master Resume fetch error:', resumeError);
      // Don't throw - continue with resume text fallback
    }

    if (resumeData) {
      console.log('[MATCH-REQ-TO-BULLETS] Found resume_id:', resumeData.id);

      // SOURCE A: Resume Milestones (original)
      const { data: milestonesWithPositions, error: milestoneError } = await supabase
        .from('vault_resume_milestones')
        .select(`
          *,
          work_position:vault_work_positions!work_position_id (
            id,
            company_name,
            job_title,
            start_date,
            end_date,
            is_current,
            description
          )
        `)
        .eq('vault_id', resumeData.id);

      if (!milestoneError && milestonesWithPositions) {
        console.log('[MATCH-REQ-TO-BULLETS] Found', milestonesWithPositions.length, 'milestones');
        milestonesWithPositions.forEach((m: any) => {
          if (m.description && m.work_position) {
            bullets.push({
              id: m.id,
              content: m.description,
              source: {
                type: 'milestone',
                milestoneId: m.id,
                workPositionId: m.work_position.id,
                company: m.work_position.company_name || 'Unknown',
                jobTitle: m.work_position.job_title || 'Unknown',
                dateRange: `${m.work_position.start_date || ''} - ${m.work_position.end_date || 'Present'}`
              }
            });
          }
        });
      }

      // SOURCE B: Work Position Descriptions
      const { data: workPositions, error: wpError } = await supabase
        .from('vault_work_positions')
        .select('id, company_name, job_title, description, start_date, end_date, is_current')
        .eq('vault_id', resumeData.id);

      if (!wpError && workPositions) {
        console.log('[MATCH-REQ-TO-BULLETS] Found', workPositions.length, 'work positions');
        workPositions.forEach((wp: any) => {
          if (wp.description) {
            // Parse description into individual bullets if it contains line breaks
            const descBullets = wp.description.split(/[\n\r]+/).filter((l: string) => l.trim().length > 10);
            descBullets.forEach((bullet: string, idx: number) => {
              const cleanBullet = bullet.replace(/^[-•*]\s*/, '').trim();
              if (cleanBullet.length > 8) {
                bullets.push({
                  id: `wp-${wp.id}-${idx}`,
                  content: cleanBullet,
                  source: {
                    type: 'work_position',
                    workPositionId: wp.id,
                    company: wp.company_name || 'Unknown',
                    jobTitle: wp.job_title || 'Unknown',
                    dateRange: `${wp.start_date || ''} - ${wp.is_current ? 'Present' : wp.end_date || ''}`
                  }
                });
              }
            });
          }
        });
      }

      // SOURCE C: Power Phrases
      const { data: powerPhrases, error: ppError } = await supabase
        .from('vault_power_phrases')
        .select('id, power_phrase, impact_metrics, category')
        .eq('vault_id', resumeData.id);

      if (!ppError && powerPhrases) {
        console.log('[MATCH-REQ-TO-BULLETS] Found', powerPhrases.length, 'power phrases');
        powerPhrases.forEach((pp: any) => {
          if (pp.power_phrase) {
            let content = pp.power_phrase;
            // Append metrics if available
            if (pp.impact_metrics?.metric) {
              content += ` (${pp.impact_metrics.metric}: ${pp.impact_metrics.result || 'improvement'})`;
            }
            bullets.push({
              id: pp.id,
              content,
              source: {
                type: 'power_phrase',
                category: pp.category || 'Achievement',
                company: 'Master Resume',
                jobTitle: 'Power Phrase',
                dateRange: ''
              }
            });
          }
        });
      }

      // SOURCE D: Transferable Skills with Evidence
      const { data: skills, error: skillError } = await supabase
        .from('vault_transferable_skills')
        .select('id, stated_skill, evidence, skill_category')
        .eq('vault_id', resumeData.id);

      if (!skillError && skills) {
        console.log('[MATCH-REQ-TO-BULLETS] Found', skills.length, 'transferable skills');
        skills.forEach((skill: any) => {
          if (skill.stated_skill && skill.evidence) {
            bullets.push({
              id: skill.id,
              content: `${skill.stated_skill}: ${skill.evidence}`,
              source: {
                type: 'transferable_skill',
                category: skill.skill_category || 'Skill',
                company: 'Master Resume',
                jobTitle: 'Transferable Skill',
                dateRange: ''
              }
            });
          }
        });
      }
    }

    // SOURCE E: Education
    const { data: education, error: eduError } = await supabase
      .from('vault_education')
      .select('id, institution_name, degree_type, degree_name, field_of_study, graduation_year, honors, relevant_coursework')
      .eq('vault_id', resumeData!.id);

    if (!eduError && education) {
      console.log('[MATCH-REQ-TO-BULLETS] Found', education.length, 'education records');
      education.forEach((edu: any) => {
        // Build a comprehensive education statement
        const degreeStatement = [
          edu.degree_type,
          edu.degree_name,
          edu.field_of_study ? `in ${edu.field_of_study}` : '',
          edu.institution_name ? `from ${edu.institution_name}` : '',
          edu.graduation_year ? `(${edu.graduation_year})` : ''
        ].filter(Boolean).join(' ');

        if (degreeStatement.length > 10) {
          bullets.push({
            id: `edu-${edu.id}`,
            content: degreeStatement,
            source: {
              type: 'education',
              institution: edu.institution_name || 'Unknown',
              company: edu.institution_name || 'Education',
              jobTitle: edu.degree_type || 'Degree',
              dateRange: edu.graduation_year ? `Graduated ${edu.graduation_year}` : ''
            }
          });
        }

        // Also add honors as separate evidence if available
        if (edu.honors) {
          bullets.push({
            id: `edu-${edu.id}-honors`,
            content: `${edu.honors} - ${edu.degree_type} from ${edu.institution_name}`,
            source: {
              type: 'education',
              company: edu.institution_name || 'Education',
              jobTitle: 'Academic Achievement',
              dateRange: ''
            }
          });
        }

        // Add relevant coursework if available
        if (edu.relevant_coursework && edu.relevant_coursework.length > 0) {
          const coursework = Array.isArray(edu.relevant_coursework) 
            ? edu.relevant_coursework.join(', ')
            : edu.relevant_coursework;
          bullets.push({
            id: `edu-${edu.id}-coursework`,
            content: `Relevant coursework: ${coursework} (${edu.degree_type} - ${edu.institution_name})`,
            source: {
              type: 'education',
              company: edu.institution_name || 'Education',
              jobTitle: 'Coursework',
              dateRange: ''
            }
          });
        }
      });
    }

    console.log('[MATCH-REQ-TO-BULLETS] Total resume bullets:', bullets.length);
    console.log('[MATCH-REQ-TO-BULLETS] Bullet sources breakdown:', {
      milestones: bullets.filter((b: any) => b.source.type === 'milestone').length,
      workPositions: bullets.filter((b: any) => b.source.type === 'work_position').length,
      powerPhrases: bullets.filter((b: any) => b.source.type === 'power_phrase').length,
      skills: bullets.filter((b: any) => b.source.type === 'transferable_skill').length,
      education: bullets.filter((b: any) => b.source.type === 'education').length
    });

    // ========================
    // FALLBACK: Parse from uploaded resume text if vault is empty
    // ========================
    if (bullets.length === 0 && resumeText) {
      console.log('[MATCH-REQ-TO-BULLETS] Master Resume empty, parsing bullets from uploaded resume text');
      const resumeBullets = parseResumeBullets(resumeText);
      bullets.push(...resumeBullets);
      console.log('[MATCH-REQ-TO-BULLETS] Extracted', resumeBullets.length, 'bullets from resume text');
    }

    // If still no bullets, return helpful message
    if (bullets.length === 0) {
      console.error('[MATCH-REQ-TO-BULLETS] WARNING: No bullets extracted! Returning empty result.');
      return new Response(
        JSON.stringify({ 
          success: true, 
          evidenceMatrix: [],
          stats: { 
            totalRequirements: validRequirements.length, 
            matchedRequirements: 0, 
            coverageScore: 0 
          },
          message: 'No career evidence found. Please upload a resume or build your Master Resume to get started.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========================
    // AI MATCHING
    // ========================
    // Cap bullets to prevent token overflow
    const bulletsForAI = bullets.slice(0, 100);
    console.log(`[MATCH-REQ-TO-BULLETS] Sending ${bulletsForAI.length} of ${bullets.length} bullets to AI`);

    const prompt = `You are analyzing a candidate's actual work history to find the BEST evidence for job requirements.

JOB REQUIREMENTS (${validRequirements.length} valid):
${JSON.stringify(validRequirements.slice(0, 15), null, 2)}

ATS KEYWORDS (Include these if possible):
Critical: ${(atsKeywords?.critical || []).join(', ')}
Important: ${(atsKeywords?.important || []).join(', ')}

CANDIDATE'S EVIDENCE FROM CAREER HISTORY (${bulletsForAI.length} items):
${JSON.stringify(bulletsForAI.map((b: any, i: number) => `[${i}] ${b.content} (Source: ${b.source.jobTitle} at ${b.source.company})`), null, 2)}

TASK:
For each JOB REQUIREMENT, find the SINGLE BEST bullet from the candidate's history that proves they meet it.
If no good match exists (score < 40), mark as unmatched.

Return JSON:
{
  "matches": [
    {
      "requirementIndex": 0, // Index in the requirements array provided
      "bestBulletIndex": 2, // Index in the bullets array provided
      "matchScore": 95, // 0-100
      "matchReasons": ["Direct experience", "Quantified result"],
      "enhancedBullet": "Rewrite the bullet to specifically address the requirement and include ATS keywords. Keep it factual.",
      "atsKeywordsAdded": ["keyword1", "keyword2"]
    }
  ]
}`;

    const { response, metrics } = await callLovableAI({
      messages: [{ role: 'user', content: prompt }],
      model: LOVABLE_AI_MODELS.DEFAULT,
      temperature: 0.3,
      max_tokens: 4000,
      response_mime_type: "application/json"
    }, 'match-requirements-to-bullets', userId);

    await logAIUsage(metrics);

    const content = response.choices[0].message.content;
    console.log('[MATCH-REQ-TO-BULLETS] Raw AI response length:', content?.length);
    console.log('[MATCH-REQ-TO-BULLETS] Raw AI response preview:', content?.substring(0, 500));
    
    const parseResult = extractJSON(content);

    if (!parseResult.success) {
      console.error('[MATCH-REQ-TO-BULLETS] Parse error:', parseResult.error);
      console.error('[MATCH-REQ-TO-BULLETS] Full response:', content);
      throw new Error(`Failed to parse AI response: ${parseResult.error}`);
    }

    if (!parseResult.data) {
      console.error('[MATCH-REQ-TO-BULLETS] No data in parse result');
      throw new Error('Failed to parse AI response: No data returned');
    }
    
    console.log('[MATCH-REQ-TO-BULLETS] Successfully parsed response with', parseResult.data.matches?.length || 0, 'matches');

    // ========================
    // CONSTRUCT EVIDENCE MATRIX
    // ========================
    const evidenceMatrix = (parseResult.data.matches || []).map((match: any) => {
      const req = validRequirements[match.requirementIndex];
      const bullet = bullets[match.bestBulletIndex];
      
      if (!req || !bullet) return null;

      const matchScore = match.matchScore || 0;
      let qualityScore = 'weak';
      if (matchScore >= 80) qualityScore = 'strong';
      else if (matchScore >= 60) qualityScore = 'good';

      return {
        requirementId: req.id || `req-${match.requirementIndex}`,
        requirementText: req.text || req,
        requirementCategory: req.priority || 'required',
        
        milestoneId: bullet.id,
        originalBullet: bullet.content,
        originalSource: bullet.source,
        
        matchScore: matchScore,
        matchReasons: match.matchReasons,
        qualityScore,
        
        enhancedBullet: match.enhancedBullet,
        atsKeywords: match.atsKeywordsAdded
      };
    }).filter(Boolean);

    return new Response(
      JSON.stringify({
        success: true,
        evidenceMatrix,
        stats: {
          totalRequirements: validRequirements.length,
          matchedRequirements: evidenceMatrix.length,
          coverageScore: Math.round((evidenceMatrix.length / validRequirements.length) * 100),
          bulletSources: {
            milestones: bullets.filter((b: any) => b.source.type === 'milestone').length,
            workPositions: bullets.filter((b: any) => b.source.type === 'work_position').length,
            powerPhrases: bullets.filter((b: any) => b.source.type === 'power_phrase').length,
            skills: bullets.filter((b: any) => b.source.type === 'transferable_skill').length,
            resumeText: bullets.filter((b: any) => b.source.type === 'uploaded_resume').length
          }
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in match-requirements-to-bullets:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
