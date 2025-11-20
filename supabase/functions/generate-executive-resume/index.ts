import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { callLovableAI, LOVABLE_AI_MODELS, cleanCitations } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';

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
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { jobDescription, persona, format = 'html' } = await req.json();

    if (!jobDescription || jobDescription.length < 50) {
      throw new Error('Job description must be at least 50 characters');
    }

    console.log('[GENERATE-RESUME] Starting for user:', user.id);

    // Step 1: Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Step 2: Get career vault ID
    const { data: vaultRecord } = await supabase
      .from('career_vault')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!vaultRecord) {
      throw new Error('Career Vault not found. Please complete vault setup first.');
    }

    // Fetch work positions, education, and milestones
    const [workPositionsData, educationData, milestonesData] = await Promise.all([
      supabase.from('vault_work_positions').select('*').eq('vault_id', vaultRecord.id),
      supabase.from('vault_education').select('*').eq('vault_id', vaultRecord.id),
      supabase.from('vault_resume_milestones').select('*').eq('vault_id', vaultRecord.id)
    ]);

    const workPositions = workPositionsData.data || [];
    const education = educationData.data || [];
    const resumeMilestones = milestonesData.data || [];

    console.log(`[GENERATE-EXECUTIVE] Found ${workPositions.length} positions, ${education.length} education, ${resumeMilestones.length} milestones`);

    // Step 3: Get ALL vault intelligence (get-vault-data fetches all 10 tables)
    const { data: vaultData, error: vaultError } = await supabase.functions.invoke('get-vault-data', {
      body: { userId: user.id },
      headers: { Authorization: authHeader }
    });

    if (vaultError || !vaultData?.data?.intelligence) {
      throw new Error('Failed to fetch Career Vault data');
    }

    const intelligence = vaultData.data.intelligence;

    // Step 4: Analyze job description
    const { data: jobAnalysis, error: analysisError } = await supabase.functions.invoke('analyze-job-qualifications', {
      body: { jobDescription }
    });

    if (analysisError || !jobAnalysis?.success) {
      throw new Error('Failed to analyze job description');
    }

    console.log('[GENERATE-EXECUTIVE] Job analysis complete, starting AI generation');

    // Build structured context from work positions, education, and milestones
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

    const milestonesContext = resumeMilestones.length > 0
      ? `VERIFIED ACHIEVEMENTS WITH METRICS:
${resumeMilestones.slice(0, 20).map((m: any) => `- ${m.milestone_title || m.description}: ${m.metric_value || ''} ${m.context || ''}`).join('\n')}
`
      : '';

    // Step 5: PASS 1 - Initial Resume Generation
    const systemPrompt = `You are an elite executive resume writer specializing in $100K-$500K roles. Create powerful, ATS-optimized resumes that demonstrate strategic value and quantifiable impact. Return plain text resumes.`;
    
    const pass1Prompt = `Generate an executive resume:

**JOB REQUIREMENTS:**
Title: ${jobAnalysis.professionalTitle}
Industry: ${jobAnalysis.industry}
Required: ${jobAnalysis.standardizedQualifications.required.join(', ')}
Preferred: ${jobAnalysis.standardizedQualifications.preferred.join(', ')}
Technical: ${jobAnalysis.standardizedQualifications.technical.join(', ')}
Soft Skills: ${jobAnalysis.standardizedQualifications.soft.join(', ')}
ATS Keywords: ${jobAnalysis.atsKeywords.join(', ')}

**HIRING MANAGER PRIORITIES:**
${jobAnalysis.hiringManagerPerspective.keyPriorities.map((p: string) => `- ${p}`).join('\n')}

Ideal Candidate: ${jobAnalysis.hiringManagerPerspective.idealCandidate}

${workHistoryContext}
${educationContext}
${milestonesContext}

**CANDIDATE INTELLIGENCE (ALL 20 CATEGORIES):**

Power Phrases (${intelligence.powerPhrases.length}):
${intelligence.powerPhrases.slice(0, 15).map((p: any) => `- ${p.power_phrase} [${p.category}]`).join('\n')}

Transferable Skills (${intelligence.transferableSkills.length}):
${intelligence.transferableSkills.slice(0, 20).map((s: any) => `- ${s.stated_skill} → ${s.transferable_skill}`).join('\n')}

Hidden Competencies (${intelligence.hiddenCompetencies.length}):
${intelligence.hiddenCompetencies.slice(0, 10).map((c: any) => `- ${c.competency_area}: ${c.evidence_summary}`).join('\n')}

Soft Skills (${intelligence.softSkills.length}):
${intelligence.softSkills.slice(0, 10).map((s: any) => `- ${s.skill}: ${s.description}`).join('\n')}

Leadership Philosophy (${intelligence.leadershipPhilosophy.length}):
${intelligence.leadershipPhilosophy.slice(0, 5).map((l: any) => `- ${l.philosophy}: ${l.evidence}`).join('\n')}

Executive Presence (${intelligence.executivePresence.length}):
${intelligence.executivePresence.slice(0, 5).map((e: any) => `- ${e.trait}: ${e.manifestation}`).join('\n')}

Work Style: ${intelligence.workStyle.map((w: any) => w.style).join(', ')}
Values: ${intelligence.values.map((v: any) => v.value).join(', ')}

**PERSONA:** ${persona || 'Professional and achievement-focused'}

**RESUME STRUCTURE (5 SECTIONS):**

1. SUMMARY STATEMENT (3-4 lines)
   - Opening paragraph showcasing value proposition
   - Must address top 3 hiring manager priorities
   - Include title + years of experience

2. KEY SKILLS (2-3 columns, 10-15 skills total)
   - Use EXACT keywords from job description
   - Prioritize technical requirements
   - Mix of hard and soft skills

3. SELECTED ACCOMPLISHMENTS (3-4 bullet points)
   - Address the top 3-4 job requirements directly
   - STAR format: Situation, Action, Result with metrics
   - Use power phrases from vault
   - Include % improvements, $ amounts, team sizes

4. WORK HISTORY (Last 10-15 years, focus on last 5-8)
   - Most recent role: 5-7 detailed bullets
   - Second recent role: 3-5 bullets
   - Older roles: 2-3 bullets each
   - Each bullet must have metrics
   - Use power phrases and transferable skills

5. STRONG WORKING KNOWLEDGE OF (ATS Keywords)
   - Skills we don't have direct experience with
   - "Like kind" skills from transferable skills
   - Additional ATS keywords for coverage

**CRITICAL RULES:**
- Address EVERY job requirement (required + preferred)
- If no direct experience, use transferable skills or "strong working knowledge"
- Use EXACT keywords and phrases from job description
- All bullets must have metrics (%, $, #, time)
- Last job gets 70% of detail, previous jobs get 30%
- No generic statements - everything must be specific and quantified

Return a JSON object with this structure:
{
  "summaryStatement": "string",
  "keySkills": ["string"],
  "selectedAccomplishments": [{"achievement": "string", "metrics": "string"}],
  "workHistory": [{"title": "string", "company": "string", "dates": "string", "bullets": ["string"]}],
  "strongWorkingKnowledge": ["string"]
}`;

    const { response: pass1Response, metrics: pass1Metrics } = await callLovableAI({
      messages: [
        { role: 'system', content: 'You are an elite executive resume writer. Return only valid JSON with no markdown formatting.' },
        { role: 'user', content: pass1Prompt }
      ],
      model: LOVABLE_AI_MODELS.DEFAULT, // Gemini Flash for resume generation
      temperature: 0.3,
      response_format: { type: 'json_object' }, // Enforce JSON output
    }, 'generate-executive-resume-pass1', user.id);

    await logAIUsage(pass1Metrics);

    const pass1Text = cleanCitations(pass1Response.choices[0].message.content);
    const pass1Match = pass1Text.match(/\{[\s\S]*\}/);
    if (!pass1Match) throw new Error('Failed to parse Pass 1 resume');
    const pass1Resume = JSON.parse(pass1Match[0]);

    console.log('[GENERATE-RESUME] Pass 1 complete, starting hiring manager review');

    // Step 5: PASS 2 - Hiring Manager Critical Review
    const pass2Prompt = `You are the hiring manager for this ${jobAnalysis.professionalTitle} role.

**JOB PRIORITIES:**
${jobAnalysis.hiringManagerPerspective.keyPriorities.map((p: string) => `- ${p}`).join('\n')}

**RED FLAGS TO WATCH FOR:**
${jobAnalysis.hiringManagerPerspective.redFlags.map((f: string) => `- ${f}`).join('\n')}

**IDEAL CANDIDATE:**
${jobAnalysis.hiringManagerPerspective.idealCandidate}

**RESUME TO REVIEW:**
${JSON.stringify(pass1Resume, null, 2)}

**YOUR TASK:**
Review this resume as a critical hiring manager. Identify:
1. What's missing that I NEED to see
2. What should be reworded to better match my priorities
3. What specific keywords/phrases I want to hear
4. What metrics would make me excited
5. Any gaps in addressing the job requirements

Be brutally honest. What would make this candidate stand out?

Return JSON:
{
  "missingElements": ["string"],
  "rewordingSuggestions": [{"original": "string", "suggested": "string", "reason": "string"}],
  "keywordGaps": ["string"],
  "strengthenMetrics": ["string"],
  "overallFeedback": "string"
}`;

    const { response: pass2Response, metrics: pass2Metrics } = await callLovableAI({
      messages: [
        { role: 'system', content: 'You are a critical hiring manager. Return only valid JSON with no markdown formatting.' },
        { role: 'user', content: pass2Prompt }
      ],
      model: LOVABLE_AI_MODELS.DEFAULT, // Gemini Flash for analysis
      temperature: 0.2,
      response_format: { type: 'json_object' }, // Enforce JSON output
    }, 'generate-executive-resume-pass2', user.id);

    await logAIUsage(pass2Metrics);

    const pass2Text = cleanCitations(pass2Response.choices[0].message.content);
    const pass2Match = pass2Text.match(/\{[\s\S]*\}/);
    if (!pass2Match) throw new Error('Failed to parse Pass 2 feedback');
    const hiringManagerFeedback = JSON.parse(pass2Match[0]);

    console.log('[GENERATE-RESUME] Hiring manager review complete, refining resume');

    // Step 6: PASS 3 - Refinement
    const pass3Prompt = `Based on the hiring manager feedback, refine the resume:

**ORIGINAL RESUME:**
${JSON.stringify(pass1Resume, null, 2)}

**HIRING MANAGER FEEDBACK:**
Missing: ${hiringManagerFeedback.missingElements.join(', ')}
Keyword Gaps: ${hiringManagerFeedback.keywordGaps.join(', ')}
Feedback: ${hiringManagerFeedback.overallFeedback}

**REWORDING SUGGESTIONS:**
${hiringManagerFeedback.rewordingSuggestions.map((s: any) => 
  `- "${s.original}" → "${s.suggested}" (${s.reason})`
).join('\n')}

**YOUR TASK:**
Create the FINAL refined resume incorporating all feedback. Use the same 5-section structure but with improvements.

Return JSON:
{
  "summaryStatement": "string",
  "keySkills": ["string"],
  "selectedAccomplishments": [{"achievement": "string", "metrics": "string"}],
  "workHistory": [{"title": "string", "company": "string", "dates": "string", "bullets": ["string"]}],
  "strongWorkingKnowledge": ["string"]
}`;

    const { response: pass3Response, metrics: pass3Metrics } = await callLovableAI({
      messages: [
        { role: 'system', content: 'You are refining a resume. Return only valid JSON with no markdown formatting.' },
        { role: 'user', content: pass3Prompt }
      ],
      model: LOVABLE_AI_MODELS.DEFAULT, // Gemini Flash for refinement
      temperature: 0.3,
      response_format: { type: 'json_object' }, // Enforce JSON output
    }, 'generate-executive-resume-pass3', user.id);

    await logAIUsage(pass3Metrics);

    const pass3Text = cleanCitations(pass3Response.choices[0].message.content);
    const pass3Match = pass3Text.match(/\{[\s\S]*\}/);
    if (!pass3Match) throw new Error('Failed to parse Pass 3 resume');
    const finalResume = JSON.parse(pass3Match[0]);

    console.log('[GENERATE-RESUME] Refinement complete, generating document');

    // Step 7: Generate formatted document
    const htmlContent = generateHTML(finalResume, profile, jobAnalysis);

    // Step 8: Store in artifacts
    const { data: artifact, error: artifactError } = await supabase
      .from('artifacts')
      .insert({
        user_id: user.id,
        kind: 'executive_resume',
        content: htmlContent,
        metadata: {
          jobTitle: jobAnalysis.professionalTitle,
          company: jobAnalysis.industry,
          persona,
          format,
          hiringManagerFeedback,
          intelligenceUsed: {
            powerPhrases: intelligence.powerPhrases.length,
            skills: intelligence.transferableSkills.length,
            total: (Object.values(intelligence.counts) as number[]).reduce((a, b) => a + b, 0)
          }
        }
      })
      .select()
      .single();

    if (artifactError) {
      console.error('[GENERATE-RESUME] Artifact storage error:', artifactError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        resume: finalResume,
        htmlContent,
        artifactId: artifact?.id,
        metadata: {
          jobTitle: jobAnalysis.professionalTitle,
          passes: {
            initial: 'Generated from all 20 intelligence categories',
            review: hiringManagerFeedback.overallFeedback,
            final: 'Refined based on hiring manager priorities'
          }
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[GENERATE-RESUME] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function generateHTML(resume: any, profile: any, jobAnalysis: any): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Calibri', Arial, sans-serif; font-size: 11pt; line-height: 1.4; color: #333; max-width: 8.5in; margin: 0 auto; padding: 0.5in; }
    h1 { font-size: 20pt; font-weight: bold; color: #1a1a1a; margin: 0 0 5px 0; text-transform: uppercase; }
    h2 { font-size: 13pt; font-weight: bold; color: #2c5282; margin: 18px 0 8px 0; border-bottom: 2px solid #2c5282; padding-bottom: 3px; text-transform: uppercase; }
    h3 { font-size: 11pt; font-weight: bold; margin: 10px 0 3px 0; }
    .contact { font-size: 10pt; color: #555; margin-bottom: 15px; }
    .summary { margin-bottom: 15px; text-align: justify; }
    .skills { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 15px; }
    .skill-item { font-size: 10pt; padding: 4px 8px; background: #f0f4f8; border-radius: 3px; }
    .accomplishment { margin-bottom: 12px; page-break-inside: avoid; }
    .accomplishment strong { color: #2c5282; }
    .job { margin-bottom: 15px; page-break-inside: avoid; }
    .job-header { display: flex; justify-content: space-between; margin-bottom: 5px; }
    .job-title { font-weight: bold; font-size: 11pt; }
    .job-dates { font-style: italic; color: #666; }
    ul { margin: 5px 0; padding-left: 20px; }
    li { margin-bottom: 4px; }
    .kwl { display: flex; flex-wrap: wrap; gap: 6px; }
    .kwl-item { font-size: 9pt; padding: 3px 8px; background: #e2e8f0; border-radius: 2px; }
  </style>
</head>
<body>
  <h1>${profile?.full_name || 'Executive Professional'}</h1>
  <div class="contact">
    ${profile?.email || ''} | ${profile?.phone || ''} | ${profile?.preferred_location || ''}
  </div>

  <h2>Executive Summary</h2>
  <div class="summary">${resume.summaryStatement}</div>

  <h2>Key Skills</h2>
  <div class="skills">
    ${resume.keySkills.map((skill: string) => `<div class="skill-item">${skill}</div>`).join('')}
  </div>

  <h2>Selected Accomplishments</h2>
  ${resume.selectedAccomplishments.map((acc: any) => `
    <div class="accomplishment">
      <strong>${acc.achievement}</strong><br>
      <em>${acc.metrics}</em>
    </div>
  `).join('')}

  <h2>Professional Experience</h2>
  ${resume.workHistory.map((job: any) => `
    <div class="job">
      <div class="job-header">
        <div>
          <div class="job-title">${job.title}</div>
          <div>${job.company}</div>
        </div>
        <div class="job-dates">${job.dates}</div>
      </div>
      <ul>
        ${job.bullets.map((bullet: string) => `<li>${bullet}</li>`).join('')}
      </ul>
    </div>
  `).join('')}

  <h2>Strong Working Knowledge Of</h2>
  <div class="kwl">
    ${resume.strongWorkingKnowledge.map((item: string) => `<div class="kwl-item">${item}</div>`).join('')}
  </div>
</body>
</html>`;
}
