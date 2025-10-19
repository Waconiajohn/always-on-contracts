import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

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

    // Step 2: Get ALL vault intelligence
    const { data: vaultData, error: vaultError } = await supabase.functions.invoke('get-vault-intelligence', {
      body: { jobDescription },
      headers: { Authorization: authHeader }
    });

    if (vaultError || !vaultData?.intelligence) {
      throw new Error('Failed to fetch Career Vault data');
    }

    const intelligence = vaultData.intelligence;

    // Step 3: Analyze job description
    const { data: jobAnalysis, error: analysisError } = await supabase.functions.invoke('analyze-job-qualifications', {
      body: { jobDescription }
    });

    if (analysisError || !jobAnalysis?.success) {
      throw new Error('Failed to analyze job description');
    }

    console.log('[GENERATE-RESUME] Job analysis complete, starting AI generation');

    // Step 4: PASS 1 - Initial Resume Generation
    const pass1Prompt = `You are an elite executive resume writer specializing in $100K-$500K roles.

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
- No generic statements - everything must be specific and quantified`;

    const pass1Response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an elite executive resume writer. Use the generate_resume tool to create a structured resume.' },
          { role: 'user', content: pass1Prompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_resume",
            description: "Generate a structured executive resume",
            parameters: {
              type: "object",
              properties: {
                summaryStatement: { type: "string" },
                keySkills: { type: "array", items: { type: "string" } },
                selectedAccomplishments: { 
                  type: "array", 
                  items: { 
                    type: "object",
                    properties: {
                      achievement: { type: "string" },
                      metrics: { type: "string" }
                    }
                  } 
                },
                workHistory: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      company: { type: "string" },
                      dates: { type: "string" },
                      bullets: { type: "array", items: { type: "string" } }
                    }
                  }
                },
                strongWorkingKnowledge: { type: "array", items: { type: "string" } }
              },
              required: ["summaryStatement", "keySkills", "selectedAccomplishments", "workHistory", "strongWorkingKnowledge"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "generate_resume" } }
      }),
    });

    if (!pass1Response.ok) {
      throw new Error(`AI error in Pass 1: ${pass1Response.status}`);
    }

    const pass1Data = await pass1Response.json();
    const pass1Resume = JSON.parse(pass1Data.choices[0].message.tool_calls[0].function.arguments);

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

Be brutally honest. What would make this candidate stand out?`;

    const pass2Response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a critical hiring manager reviewing a resume. Use the review_resume tool.' },
          { role: 'user', content: pass2Prompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "review_resume",
            description: "Provide critical feedback on resume",
            parameters: {
              type: "object",
              properties: {
                missingElements: { type: "array", items: { type: "string" } },
                rewordingSuggestions: { 
                  type: "array", 
                  items: { 
                    type: "object",
                    properties: {
                      original: { type: "string" },
                      suggested: { type: "string" },
                      reason: { type: "string" }
                    }
                  }
                },
                keywordGaps: { type: "array", items: { type: "string" } },
                strengthenMetrics: { type: "array", items: { type: "string" } },
                overallFeedback: { type: "string" }
              },
              required: ["missingElements", "rewordingSuggestions", "keywordGaps", "strengthenMetrics", "overallFeedback"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "review_resume" } }
      }),
    });

    if (!pass2Response.ok) {
      throw new Error(`AI error in Pass 2: ${pass2Response.status}`);
    }

    const pass2Data = await pass2Response.json();
    const hiringManagerFeedback = JSON.parse(pass2Data.choices[0].message.tool_calls[0].function.arguments);

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
Create the FINAL refined resume incorporating all feedback. Use the same 5-section structure but with improvements.`;

    const pass3Response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are refining a resume based on hiring manager feedback. Use the generate_resume tool.' },
          { role: 'user', content: pass3Prompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_resume",
            description: "Generate refined executive resume",
            parameters: {
              type: "object",
              properties: {
                summaryStatement: { type: "string" },
                keySkills: { type: "array", items: { type: "string" } },
                selectedAccomplishments: { 
                  type: "array", 
                  items: { 
                    type: "object",
                    properties: {
                      achievement: { type: "string" },
                      metrics: { type: "string" }
                    }
                  } 
                },
                workHistory: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      company: { type: "string" },
                      dates: { type: "string" },
                      bullets: { type: "array", items: { type: "string" } }
                    }
                  }
                },
                strongWorkingKnowledge: { type: "array", items: { type: "string" } }
              },
              required: ["summaryStatement", "keySkills", "selectedAccomplishments", "workHistory", "strongWorkingKnowledge"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "generate_resume" } }
      }),
    });

    if (!pass3Response.ok) {
      throw new Error(`AI error in Pass 3: ${pass3Response.status}`);
    }

    const pass3Data = await pass3Response.json();
    const finalResume = JSON.parse(pass3Data.choices[0].message.tool_calls[0].function.arguments);

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
