/**
 * Elite Resume Generation Edge Function
 * Generates complete resume in one AI call with confidence tagging
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { callLovableAI, LOVABLE_AI_MODELS, cleanCitations } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';

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

    console.log('🚀 Generating elite resume', { userId, jobTitle, industry });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch vault data if userId provided
    let vaultContent = '';
    if (userId) {
      const { data: vault } = await supabase
        .from('career_vault')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (vault) {
        // Fetch all vault items in parallel
        const [milestones, skills, positions, education] = await Promise.all([
          supabase.from('vault_resume_milestones').select('*').eq('vault_id', vault.id).limit(20),
          supabase.from('vault_confirmed_skills').select('*').eq('user_id', userId).limit(30),
          supabase.from('vault_work_positions').select('*').eq('vault_id', vault.id).limit(10),
          supabase.from('vault_education').select('*').eq('vault_id', vault.id).limit(5)
        ]);

        vaultContent = `
CAREER VAULT DATA:

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

    // Main AI prompt for complete resume generation
    const prompt = `You are an elite resume architect. Generate a COMPLETE, professionally formatted resume that will get this candidate an interview.

JOB TARGET:
Title: ${jobTitle || 'Not specified'}
Industry: ${industry || 'Not specified'}

JOB DESCRIPTION:
${jobDescription}

${resumeText ? `CANDIDATE'S EXISTING RESUME (for reference):
${resumeText.substring(0, 3000)}
` : ''}

${vaultContent}

CRITICAL INSTRUCTIONS:
1. Generate a COMPLETE resume with all standard sections
2. For each bullet/content item, tag it with confidence level:
   - "exact" = directly from their resume/vault (verified)
   - "enhanced" = AI improved their original content
   - "invented" = AI created to fill a gap (must be realistic and verifiable)

3. Use this EXACT JSON format for your response:

{
  "contactInfo": {
    "name": "Candidate Name",
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
      "paragraph": "3-4 sentence powerful summary...",
      "bullets": []
    },
    {
      "id": "experience",
      "type": "experience",
      "title": "Professional Experience",
      "bullets": [
        {
          "id": "bullet-1",
          "text": "Led team of 12 developers...",
          "confidence": "exact",
          "source": {
            "type": "resume",
            "originalText": "Managed developers"
          },
          "atsKeywords": ["leadership", "team management"]
        }
      ],
      "roleInfo": {
        "company": "Company Name",
        "title": "Job Title",
        "dates": "Jan 2020 - Present"
      }
    }
  ],
  "overallScore": 85,
  "tier": {
    "tier": "HOT",
    "emoji": "🔥",
    "color": "orange",
    "message": "Strong candidate"
  }
}

CRITICAL RULES:
- If you create "invented" content, it MUST be realistic and verifiable
- Mark anything stretched or enhanced honestly
- Include quantified achievements
- Use ATS-friendly keywords from job description
- Keep bullet points concise and impactful
- For experience sections, group bullets by role

Return ONLY the JSON, no markdown formatting.`;

    // Call AI
    const { response, metrics } = await callLovableAI({
      messages: [{ role: 'user', content: prompt }],
      model: LOVABLE_AI_MODELS.DEFAULT,
      temperature: 0.5,
      max_tokens: 3000,
    }, 'generate-elite-resume', userId);

    await logAIUsage(metrics);

    let rawContent = cleanCitations(response.choices?.[0]?.message?.content || '');
    
    // Remove markdown code fences if present
    rawContent = rawContent.replace(/^```json\n?/i, '').replace(/\n?```$/i, '').trim();

    console.log('📝 Raw AI response (first 500 chars):', rawContent.substring(0, 500));

    // Parse JSON response
    let resumeData;
    try {
      resumeData = JSON.parse(rawContent);
    } catch (parseError) {
      console.error('❌ Failed to parse AI response as JSON:', parseError);
      console.error('Raw content:', rawContent);
      throw new Error('AI returned invalid JSON format');
    }

    // Validate structure
    if (!resumeData.sections || !Array.isArray(resumeData.sections)) {
      throw new Error('Invalid resume structure returned by AI');
    }

    console.log('✅ Elite resume generated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        resumeData,
        analysis: {
          totalBullets: resumeData.sections.reduce((sum: number, s: any) => sum + (s.bullets?.length || 0), 0),
          inventedCount: resumeData.sections.reduce(
            (sum: number, s: any) => sum + (s.bullets?.filter((b: any) => b.confidence === 'invented').length || 0),
            0
          )
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
