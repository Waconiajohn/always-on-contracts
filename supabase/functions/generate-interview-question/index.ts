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
    const { warChestId, previousResponses } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get war chest data
    const { data: warChest } = await supabase
      .from('career_war_chest')
      .select('*')
      .eq('id', warChestId)
      .single();

    if (!warChest) {
      throw new Error('War chest not found');
    }

    // Determine which phase we're in based on response count
    const responseCount = previousResponses?.length || 0;
    let phase: string;
    let phaseTitle: string;
    let phaseDescription: string;

    if (responseCount < 8) {
      phase = 'resume_understanding';
      phaseTitle = 'Deep Dive Into Your Experience';
      phaseDescription = "Let's extract the quantifiable achievements and specific impact from your career";
    } else if (responseCount < 17) {
      phase = 'skills_translation';
      phaseTitle = 'Uncovering Transferable Skills';
      phaseDescription = "Discovering skills and capabilities you have but may not have explicitly listed";
    } else {
      phase = 'hidden_gems';
      phaseTitle = 'Hidden Competencies';
      phaseDescription = "Identifying expertise you possess but might not call by its modern industry name";
    }

    // Use Lovable AI to generate contextual question
    const prompt = `You are a corporate career assistant conducting a strategic interview to build a comprehensive "War Chest" that will power customized resumes and job applications.

Resume Summary: ${JSON.stringify(warChest.initial_analysis)}
Previous Interview Responses: ${JSON.stringify(previousResponses?.slice(-3) || [])}
Current Phase: ${phase} (Question ${responseCount + 1} of 25)

CRITICAL INSTRUCTIONS FOR GENERATING QUESTIONS:
Your questions MUST include three elements:
1. CONTEXT - A brief paragraph explaining WHY you're asking this specific question and what you'll do with the information
2. SPECIFIC GUIDANCE - Clear instructions on what to include (timeframes, format, metrics, depth expected)
3. CONCRETE EXAMPLE - Show them exactly what a strong answer looks like

Format your question like this:
[Context paragraph]

Please share:
• [Specific element 1]
• [Specific element 2]
• [Specific element 3]

Example: [Concrete example showing the level of detail expected]

PHASE-SPECIFIC FOCUS:

${phase === 'resume_understanding' ? `PHASE 1: DEEP RESUME UNDERSTANDING (Questions 1-8)
Goal: Extract quantifiable achievements, specific projects, leadership impact, and measurable results.

Your questions should probe for:
- Specific job titles, companies, and timeframes (last 10-15 years)
- Quantified results (revenue impact, cost savings, team size, efficiency gains, customer metrics)
- Technologies, tools, and methodologies used
- Project scope and impact
- Leadership and collaboration examples

Example question structure:
"I need to build a complete picture of your professional journey to identify your strongest achievements. This will help me craft powerful, quantified statements for your resume.

Please share:
• Your last 2-3 roles with job titles, companies, and dates
• For each role, describe 1-2 major projects or initiatives you led
• Include specific metrics: budget size, team size, revenue impact, cost savings, customer numbers, efficiency improvements, or other measurable outcomes
• Mention key technologies, tools, or methodologies you used

Example: 'As Senior Product Manager at TechCorp (2020-2023), I led a cross-functional team of 12 to launch our mobile app. We acquired 50K users in the first quarter, increased retention by 35%, and generated $1.2M in new revenue. I used Agile/Scrum, Jira, and collaborated with engineering, design, and marketing teams.'"` : ''}

${phase === 'skills_translation' ? `PHASE 2: SKILLS TRANSLATION (Questions 9-17)
Goal: Uncover equivalent skills, near-certifications, and transferable capabilities they haven't articulated.

Your questions should probe for:
- Tools they've used that translate to other tools (CRM experience = can use any CRM)
- Training or certifications they almost have (studied methodology but not certified)
- Skills demonstrated indirectly (led without manager title, analyzed data without "analyst" role)
- Industry-specific knowledge that applies broadly
- Technologies used in different contexts

Example question structure:
"Now I want to discover skills you have but may not have listed on your resume. Often people have capabilities they don't realize are valuable or transferable.

Please share:
• Any CRM, project management, or analytics tools you've used (even if not your main job)
• Training programs, courses, or certifications you've started or almost completed
• Times you've done work outside your official job title (coordinated projects, analyzed data, mentored others, solved technical problems)

Example: 'I used Salesforce daily even though I wasn't in sales—I created custom reports and dashboards. I took a Six Sigma Green Belt course but never finished the certification project. I regularly trained new hires even though I wasn't officially a trainer.'"` : ''}

${phase === 'hidden_gems' ? `PHASE 3: HIDDEN COMPETENCIES (Questions 18-25)
Goal: Identify modern, high-value skills they possess but don't call by current industry terminology.

Your questions should probe for:
- AI/ML work they don't call "AI" (predictive models, recommendation engines, automation, natural language processing)
- Leadership without the title (influenced decisions, drove change, mentored, coordinated teams)
- Modern tech skills they describe in old terms (data science work called "Excel analysis")
- Cross-functional expertise they take for granted
- Innovation and problem-solving examples

Example question structure:
"Let's uncover hidden strengths you might not realize are highly valuable in today's market. Many people have done AI, data science, or leadership work without using those exact words.

Please share:
• Have you built or worked with any automated systems, predictive models, recommendation engines, chatbots, or data-driven decision tools?
• Have you influenced company direction, driven process improvements, or led initiatives without having 'manager' in your title?
• Have you worked with large datasets, built dashboards, or created reports that drove business decisions?

Example: 'I built an Excel model that predicted customer churn by analyzing purchase patterns—it was 80% accurate and we used it to target retention campaigns. I wasn't officially a manager but I coordinated our team's sprint planning and mentored 3 junior developers.'"` : ''}

Generate ONE question following the format above. Make it conversational but extremely specific about what information you need. Return ONLY the complete question text with context, guidance, and example included.`;

    const response = await fetch('https://lovable.app/api/ai/completion', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-mini',
        messages: [
          { role: 'system', content: 'You are an expert career counselor conducting interviews.' },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 150
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate question');
    }

    const aiResponse = await response.json();
    const question = aiResponse.choices[0].message.content.trim();

    return new Response(
      JSON.stringify({
        question,
        phase,
        phaseTitle,
        phaseDescription
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error generating question:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
