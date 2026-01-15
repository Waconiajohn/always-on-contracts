/**
 * Elite Resume Generation Edge Function V2
 * Sophisticated parsing with multi-role detection and accurate confidence tagging
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { callLovableAI, LOVABLE_AI_MODELS, cleanCitations } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { extractJSON } from '../_shared/json-parser.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      jobDescription,
      jobTitle,
      industry,
      resumeText,
      vaultData,
      userId
    } = await req.json();

    console.log('🚀 Generating elite resume v2', { userId, jobTitle, industry });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch Master Resume data if userId provided
    let resumeContent = '';
    let resume: any = null;
    
    if (userId) {
      const { data: resumeData } = await supabase
        .from('career_vault')
        .select('id, resume_raw_text')
        .eq('user_id', userId)
        .maybeSingle();
      
      resume = resumeData;

      if (resume) {
        const [milestones, skills, positions, education] = await Promise.all([
          supabase.from('vault_resume_milestones').select('*').eq('vault_id', resume.id).limit(20),
          supabase.from('vault_confirmed_skills').select('*').eq('user_id', userId).limit(30),
          supabase.from('vault_work_positions').select('*').eq('vault_id', resume.id).limit(10),
          supabase.from('vault_education').select('*').eq('vault_id', resume.id).limit(5)
        ]);

        resumeContent = `
MASTER RESUME DATA:

Work Positions:
${(positions.data || []).map(p => `- ${p.job_title} at ${p.company_name} (${p.start_date} - ${p.end_date || 'Present'})`).join('\n')}

Education:
${(education.data || []).map(e => `- ${e.degree_type} in ${e.field_of_study} from ${e.institution_name} (${e.graduation_year})`).join('\n')}

Key Achievements:
${(milestones.data || []).map(m => `- ${m.description || m.milestone_title}`).join('\n')}

Skills:
${(skills.data || []).map(s => s.skill_name).join(', ')}
`;
      }
    }

    // Determine actual resume text to use (prioritize parameter, then Master Resume)
    const actualResumeText = resumeText || resume?.resume_raw_text || '';
    console.log('📄 Resume text source:', resumeText ? 'parameter' : resume?.resume_raw_text ? 'master_resume' : 'none');
    console.log('📄 Resume text length:', actualResumeText.length);
    console.log('📄 Resume preview:', actualResumeText.substring(0, 200));

    const prompt = `You are an elite resume architect with expertise in ATS optimization and precise data mapping.

JOB TARGET:
Title: ${jobTitle || 'Not specified'}
Industry: ${industry || 'Not specified'}

JOB DESCRIPTION:
${jobDescription}

${actualResumeText ? `CANDIDATE'S EXISTING RESUME:
${actualResumeText}
` : ''}

${resumeContent}

CRITICAL MULTI-STEP PROCESS:

STEP 1: PRE-PROCESS THE RESUME
- Extract ALL work positions (detect multiple roles at same company by looking for same employer with different titles)
- Extract education with DEGREE TYPES (BS, MS, MBA, PhD, etc.) and graduation years
- Extract certifications (PMP, AWS, CISSP, etc.) - these are NOT job bullets
- Extract technical skills as individual 1-4 word items (Python, React, SQL, etc.)
- Extract quantified achievements per role

STEP 2: MAP TO SECTIONS CORRECTLY
- Professional Summary: 3-4 sentence paragraph highlighting fit for THIS job
- Professional Experience: Each role with company, title, dates, and role-specific bullets
  * CRITICAL: If same company appears multiple times with different titles, create separate role entries under same company
  * Group bullets by the role they belong to
- Education: Institution, degree type, field, graduation year (NO work bullets here)
- Certifications: Actual certifications only (e.g., "PMP Certified", "AWS Solutions Architect")
- Technical Skills: Individual skill keywords separated by commas or as pills

STEP 3: CONFIDENCE TAGGING (BE HONEST)
- "exact": Direct quote from resume (95%+ verbatim match) - THESE SHOULD APPEAR AS GREEN
- "enhanced": Modified/improved version of their content (e.g., added metrics, better phrasing)
- "invented": AI-generated to fill gaps (MUST be realistic and verifiable based on their background)

STEP 4: DETECT MULTIPLE ROLES AT SAME COMPANY
Example input: "Acme Corp, Senior Manager 2022-Present" and "Acme Corp, Manager 2020-2022"
Output format:
{
  "company": "Acme Corp",
  "positions": [
    { "title": "Senior Manager", "dates": "2022 - Present", "bullets": [...] },
    { "title": "Manager", "dates": "2020 - 2022", "bullets": [...] }
  ]
}

EXACT JSON STRUCTURE TO RETURN:

{
  "contactInfo": {
    "name": "Full Name",
    "email": "email@example.com",
    "phone": "(555) 123-4567",
    "location": "City, State",
    "linkedin": "linkedin.com/in/profile"
  },
  "sections": [
    {
      "id": "summary",
      "type": "summary",
      "title": "Professional Summary",
      "paragraph": "A results-driven professional with X years of experience...",
      "bullets": []
    },
    {
      "id": "experience-1",
      "type": "experience",
      "title": "Professional Experience",
      "company": "Company Name",
      "positions": [
        {
          "title": "Senior Role Title",
          "dates": "Jan 2022 - Present",
          "bullets": [
            {
              "id": "exp-1-1",
              "text": "Led team of 12 developers resulting in 40% faster delivery",
              "confidence": "enhanced",
              "source": {
                "type": "resume",
                "originalText": "Managed team of developers"
              },
              "atsKeywords": ["leadership", "team management", "delivery"]
            }
          ]
        },
        {
          "title": "Previous Role Title",
          "dates": "Mar 2020 - Dec 2021",
          "bullets": [
            {
              "id": "exp-1-2",
              "text": "Implemented new CRM system saving $200K annually",
              "confidence": "exact",
              "source": {
                "type": "resume",
                "originalText": "Implemented new CRM system saving $200K annually"
              },
              "atsKeywords": ["CRM", "cost savings", "implementation"]
            }
          ]
        }
      ]
    },
    {
      "id": "education",
      "type": "education",
      "title": "Education",
      "entries": [
        {
          "institution": "University Name",
          "degree": "Master of Business Administration (MBA)",
          "field": "Business Administration",
          "graduationYear": "2019",
          "gpa": "3.8"
        }
      ]
    },
    {
      "id": "certifications",
      "type": "certifications",
      "title": "Certifications",
      "entries": [
        { "name": "Project Management Professional (PMP)", "issuer": "PMI", "year": "2021" },
        { "name": "AWS Solutions Architect", "issuer": "Amazon", "year": "2020" }
      ]
    },
    {
      "id": "skills",
      "type": "skills",
      "title": "Technical Skills",
      "skills": ["Python", "JavaScript", "React", "Node.js", "AWS", "Docker", "SQL", "MongoDB"]
    }
  ],
  "overallScore": 85,
  "tier": {
    "tier": "HOT",
    "emoji": "🔥",
    "color": "orange",
    "message": "Strong candidate - ready to apply!"
  }
}

VALIDATION RULES:
1. Education section: ONLY degrees, no job bullets
2. Certifications: ONLY certifications (PMP, AWS, etc.), not job achievements
3. Skills: Individual 1-4 word items, NOT full sentences
4. Experience bullets: Quantified achievements with metrics when possible
5. Multiple roles at same company: Group under company but show each title separately
6. Confidence tagging: "exact" items should be 95%+ verbatim from resume

Return ONLY the JSON, no markdown.`;

    const { response, metrics } = await callLovableAI({
      messages: [{ role: 'user', content: prompt }],
      model: LOVABLE_AI_MODELS.DEFAULT,
      temperature: 0.3,
      max_tokens: 8000,
    }, 'generate-elite-resume', userId);

    await logAIUsage(metrics);

    const rawContent = cleanCitations(response.choices?.[0]?.message?.content || '');
    console.log('📝 Raw AI response length:', rawContent.length);

    // Use robust JSON extraction to handle markdown code blocks and other formatting
    const parseResult = extractJSON(rawContent);
    
    if (!parseResult.success || !parseResult.data) {
      console.error('❌ Failed to parse AI response:', parseResult.error);
      console.error('First 1000 chars:', rawContent.substring(0, 1000));
      
      if (response.choices?.[0]?.finish_reason === 'length') {
        throw new Error('AI response truncated. Please try with a shorter job description.');
      }
      
      throw new Error('AI returned invalid JSON format. Please try again.');
    }

    const resumeData = parseResult.data;

    if (!resumeData.sections || !Array.isArray(resumeData.sections)) {
      throw new Error('Invalid resume structure returned by AI');
    }

    console.log('✅ Elite resume v2 generated successfully');
    console.log(`📊 Stats: ${resumeData.sections.length} sections`);

    return new Response(
      JSON.stringify({
        success: true,
        resumeData,
        analysis: {
          totalSections: resumeData.sections.length,
          hasEducation: resumeData.sections.some((s: any) => s.type === 'education'),
          hasCertifications: resumeData.sections.some((s: any) => s.type === 'certifications'),
          hasSkills: resumeData.sections.some((s: any) => s.type === 'skills'),
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in generate-elite-resume:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
