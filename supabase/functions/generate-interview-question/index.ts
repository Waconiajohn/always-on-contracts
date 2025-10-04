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

    // Extract analysis data for context awareness
    const analysis = warChest.initial_analysis as any || {};
    const jobTitles = analysis.recommended_positions?.join(', ') || 'Unknown';
    const industries = analysis.industry_expertise?.join(', ') || 'Unknown';
    const yearsExp = analysis.years_experience || 'Unknown';
    const keySkills = analysis.skills?.slice(0, 5).join(', ') || 'Unknown';
    const existingAchievements = analysis.key_achievements?.slice(0, 3) || [];
    const workHistory = analysis.work_history || [];

    // Use Lovable AI to generate contextual question with structured output
    const prompt = `You are a corporate career assistant conducting a strategic interview to build a comprehensive "War Chest" that will power customized resumes and job applications.

CRITICAL CONTEXT AWARENESS:
The user already uploaded a resume. Here's what we extracted:
- Job titles/roles: ${jobTitles}
- Industries: ${industries}
- Years of experience: ${yearsExp}
- Key skills identified: ${keySkills}
- Work history: ${JSON.stringify(workHistory)}
- Existing achievements we captured: ${JSON.stringify(existingAchievements)}

**FULL RESUME TEXT FOR SPECIFIC EXTRACTION:**
${warChest.resume_raw_text || ''}

YOUR TASK:
1. Review the resume text to extract SPECIFIC details relevant to this question
2. Pre-populate known information (job title, company, dates, responsibilities)
3. Ask for MISSING or EXPANDABLE information only

DO NOT ask them to repeat information we can clearly see.
INSTEAD:
- Show what you found: "I see you were [title] at [company] from [dates]"
- Ask for what's missing: metrics, team size, specific technologies, challenges, budget scope
- Request expansion: "Can you quantify the impact?" or "What technologies did you use?"

Previous Interview Responses: ${JSON.stringify(previousResponses?.slice(-3) || [])}
Current Phase: ${phase} (Question ${responseCount + 1} of 25)

PHASE-SPECIFIC FOCUS:

${phase === 'resume_understanding' ? `PHASE 1: DEEP RESUME UNDERSTANDING (Questions 1-8)
Goal: Extract quantifiable achievements, specific projects, leadership impact, and measurable results.

Your questions should probe for:
- Specific job titles, companies, and timeframes (last 10-15 years)
- Quantified results (revenue impact, cost savings, team size, efficiency gains, customer metrics)
- Technologies, tools, and methodologies used
- Project scope and impact
- Leadership and collaboration examples

Example question:
**CONTEXT:** I see from your resume you worked as a ${jobTitles?.split(',')[0]}. I need to quantify your achievements to create powerful resume statements that stand out.

**PLEASE SHARE:**
• Your most recent role: specific title, company name, dates (month/year format)
• One major project or initiative you led with clear scope
• Specific metrics: revenue generated/saved, team size you managed/collaborated with, efficiency gains, customer impact numbers
• Key technologies or methodologies you used daily

**EXAMPLE OF A STRONG ANSWER:**
"As Senior Product Manager at TechCorp (Jan 2020 - Dec 2023), I led the mobile app launch working with a cross-functional team of 12 (5 engineers, 4 designers, 3 marketing). We acquired 50,000 users in Q1 2021, increased retention by 35%, and generated $1.2M in new revenue. I used Agile/Scrum methodology, Jira for project tracking, and collaborated daily with engineering, design, and marketing teams."` : ''}

${phase === 'skills_translation' ? `PHASE 2: SKILLS TRANSLATION (Questions 9-17)
Goal: Uncover equivalent skills, near-certifications, and transferable capabilities they haven't articulated.

Your questions should probe for:
- Tools they've used that translate to other tools (CRM experience = can use any CRM)
- Training or certifications they almost have (studied methodology but not certified)
- Skills demonstrated indirectly (led without manager title, analyzed data without "analyst" role)
- Industry-specific knowledge that applies broadly
- Technologies used in different contexts

Example question:
**CONTEXT:** I noticed you have experience with ${keySkills?.split(',')[0] || 'various tools'}. Let's identify equivalent skills and near-certifications you possess but may not have explicitly listed.

**PLEASE SHARE:**
• Any CRM, project management, analytics, or collaboration tools you've used (even if not your main job)
• Training programs, courses, or certifications you've started, partially completed, or studied informally
• Times you performed work outside your official job title (coordinated projects, analyzed data, mentored others, solved technical problems, drove initiatives)

**EXAMPLE OF A STRONG ANSWER:**
"I used Salesforce daily for 3 years even though I wasn't in sales—I created 15+ custom reports and automated 5 workflows that the sales team still uses. I took a Six Sigma Green Belt course in 2019, completed all modules but never submitted the final certification project. I regularly trained 5-7 new hires each year even though I wasn't officially a trainer or people manager."` : ''}

${phase === 'hidden_gems' ? `PHASE 3: HIDDEN COMPETENCIES (Questions 18-25)
Goal: Identify modern, high-value skills they possess but don't call by current industry terminology.

Your questions should probe for:
- AI/ML work they don't call "AI" (predictive models, recommendation engines, automation, natural language processing)
- Leadership without the title (influenced decisions, drove change, mentored, coordinated teams)
- Modern tech skills they describe in old terms (data science work called "Excel analysis")
- Cross-functional expertise they take for granted
- Innovation and problem-solving examples

Example question:
**CONTEXT:** Many executives have done AI, data science, or leadership work without using those exact words. I want to reframe your experience using modern industry terminology that will resonate with today's employers.

**PLEASE SHARE:**
• Any automated systems, predictive models, recommendation engines, chatbots, or data-driven decision tools you've built or worked with (even in Excel, Access, or older tools)
• Times you influenced company direction, drove process improvements, or led initiatives without having 'manager' in your title
• Work with large datasets, dashboards, or reports that drove business decisions (what data, what decisions, what impact?)

**EXAMPLE OF A STRONG ANSWER:**
"I built an Excel model in 2018 that predicted customer churn by analyzing 18 months of purchase patterns across 10,000+ customers—it was 82% accurate and our retention team used it to target high-risk accounts, saving an estimated $400K annually. I wasn't officially a manager but I coordinated our team's sprint planning for 2 years and mentored 3 junior developers who all got promoted. I also created a Power BI dashboard that tracked 15 KPIs and was used by the executive team for quarterly strategy sessions."` : ''}

Generate ONE structured question. Extract actual data from the resume text provided.

CRITICAL REQUIREMENT: The exampleAnswer field MUST be completely unique and specifically tailored to answer the exact questions you're asking. Look at the resume data and craft an example that demonstrates how to answer YOUR specific questions with appropriate detail. Never reuse generic examples.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an expert career counselor who extracts resume data and creates pre-filled interview questions. CRITICAL: Each example answer MUST be unique and specifically address the exact questions you are asking. Never reuse examples.' },
          { role: 'user', content: prompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_prefilled_question",
            description: "Create a pre-filled interview question with known resume data",
            parameters: {
              type: "object",
              properties: {
                context: { 
                  type: "string",
                  description: "1-2 sentences explaining why you're asking and what you already know"
                },
                knownData: {
                  type: "array",
                  description: "Information already extracted from resume",
                  items: {
                    type: "object",
                    properties: {
                      label: { type: "string" },
                      value: { 
                        description: "Can be string or array of strings",
                        oneOf: [
                          { type: "string" },
                          { type: "array", items: { type: "string" } }
                        ]
                      },
                      source: { type: "string", enum: ["resume", "previous_answer"] }
                    },
                    required: ["label", "value", "source"]
                  }
                },
                questionsToExpand: {
                  type: "array",
                  description: "Questions to expand on known data",
                  items: {
                    type: "object",
                    properties: {
                      prompt: { type: "string" },
                      placeholder: { type: "string" },
                      hint: { type: "string" }
                    },
                    required: ["prompt", "placeholder"]
                  }
                },
                exampleAnswer: { 
                  type: "string",
                  description: "Concrete example that SPECIFICALLY answers ALL the questions in questionsToExpand with the appropriate level of detail. Must be unique and contextually relevant to these exact questions. DO NOT reuse examples from other questions."
                }
              },
              required: ["context", "knownData", "questionsToExpand", "exampleAnswer"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "create_prefilled_question" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`Failed to generate question: ${response.status}`);
    }

    const aiResponse = await response.json();
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    
    let questionData;
    if (toolCall) {
      // Structured format from tool calling
      questionData = JSON.parse(toolCall.function.arguments);
      console.log('Generated structured question:', questionData);
    } else {
      // Fallback to old text format
      const question = aiResponse.choices[0].message.content.trim();
      questionData = { question };
      console.log('Generated text question (fallback):', question);
    }

    return new Response(
      JSON.stringify({
        question: questionData,
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
