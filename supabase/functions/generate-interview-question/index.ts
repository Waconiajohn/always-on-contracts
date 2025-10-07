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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
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

    const { 
      phase, 
      isFirst, 
      previousResponse, 
      conversationHistory, 
      persona = 'mentor',
      generate_answer_options = false,
      confirmed_skills = [],
      milestone_id = null
    } = await req.json();
    
    // Fetch milestone context if provided
    let milestoneContext = null;
    if (milestone_id) {
      const { data: milestone } = await supabase
        .from('vault_resume_milestones')
        .select('*')
        .eq('id', milestone_id)
        .eq('user_id', user.id)
        .maybeSingle();
      
      milestoneContext = milestone;
      console.log('[GENERATE-INTERVIEW-QUESTION] Milestone context loaded:', milestone?.company_name, milestone?.job_title);
    }

    console.log('[GENERATE-INTERVIEW-QUESTION] Fetching Career Vault intelligence for user:', user.id);

    // Get full Career Vault intelligence
    const { data: intelligenceData, error: intelligenceError } = await supabase.functions.invoke(
      'get-vault-intelligence',
      { headers: { Authorization: authHeader } }
    );

    const intelligence = intelligenceError ? null : intelligenceData?.intelligence;
    const vault = intelligence ? { 
      id: 'vault_id',
      user_id: user.id,
      interview_completion_percentage: intelligence.completionPercentage || 0,
      initial_analysis: intelligence.initialAnalysis || {}
    } : null;

    if (!vault) {
      console.log('[GENERATE-INTERVIEW-QUESTION] No Career Vault found');
      return new Response(JSON.stringify({
        question: 'Please complete the Career Vault interview first.',
        error: 'No career vault found'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    console.log('[GENERATE-INTERVIEW-QUESTION] Intelligence loaded:', {
      completion: intelligence?.completionPercentage,
      existingResponses: intelligence?.interviewResponses?.length || 0,
      powerPhrases: intelligence?.counts.powerPhrases || 0,
      projects: intelligence?.counts.projects || 0
    });

    // 6-Phase Enhanced Interview Strategy
    const interviewPhases = [
      {
        name: 'foundation',
        title: 'Foundation & Overview',
        description: 'Establish core career profile and baseline capabilities',
        targetCategories: ['power_phrases', 'transferable_skills', 'career_narrative'],
        questionsCount: 8,
      },
      {
        name: 'impact_mining',
        title: 'Impact Mining & Quantification',
        description: 'Extract quantified business results and measurable achievements',
        targetCategories: ['business_impact', 'problem_solving', 'competitive_advantages'],
        questionsCount: 10,
      },
      {
        name: 'leadership_depth',
        title: 'Leadership & Influence',
        description: 'Explore leadership experience, team management, and stakeholder influence',
        targetCategories: ['leadership_evidence', 'stakeholder_mgmt', 'communication'],
        questionsCount: 8,
      },
      {
        name: 'technical_mastery',
        title: 'Technical Depth & Expertise',
        description: 'Document technical skills, tools, methodologies, and industry knowledge',
        targetCategories: ['technical_depth', 'industry_expertise', 'hidden_competencies'],
        questionsCount: 8,
      },
      {
        name: 'project_showcase',
        title: 'Project Portfolio & Problem-Solving',
        description: 'Capture detailed project experiences and complex problem-solving examples',
        targetCategories: ['projects', 'problem_solving', 'technical_depth'],
        questionsCount: 10,
      },
      {
        name: 'future_positioning',
        title: 'Strategic Positioning & Future',
        description: 'Define career trajectory, competitive advantages, and market positioning',
        targetCategories: ['competitive_advantages', 'career_narrative', 'industry_expertise'],
        questionsCount: 6,
      },
    ];

    // Calculate which phase we're in based on completion percentage
    let currentPhase = interviewPhases[0];
    let completionPercentage = 0;
    
    if (vault) {
      const totalQuestions = interviewPhases.reduce((sum, phase) => sum + phase.questionsCount, 0);
      const responsesCount = Math.floor(totalQuestions * (vault.interview_completion_percentage || 0) / 100);
      
      let cumulativeQuestions = 0;
      for (const phase of interviewPhases) {
        cumulativeQuestions += phase.questionsCount;
        if (responsesCount < cumulativeQuestions) {
          currentPhase = phase;
          break;
        }
        if (phase === interviewPhases[interviewPhases.length - 1]) {
          currentPhase = phase;
        }
      }
      
      completionPercentage = vault.interview_completion_percentage || 0;
    }

    // Persona-specific coaching styles
    const personaStyles = {
      mentor: `You are THE MENTOR - warm, encouraging, and supportive. You ask questions with empathy and make the candidate feel safe to share. Use phrases like "That's wonderful," "I can see how that would be challenging," and "Tell me more about..." Your tone is nurturing but professional.`,
      challenger: `You are THE CHALLENGER - direct, demanding, and no-nonsense. You push for specifics and don't accept vague answers. Use phrases like "Give me the exact numbers," "What specifically did YOU do?" and "That's not clear enough." Your tone is professional but tough.`,
      strategist: `You are THE STRATEGIST - analytical, precise, and forward-thinking. You ask probing questions about decision-making and long-term impact. Use phrases like "Walk me through your thinking," "What were the strategic implications?" and "How did this position you for future opportunities?" Your tone is intellectual and methodical.`
    };

    // Build Career Vault context
    let vaultContext = '';
    if (intelligence && intelligence.interviewResponses?.length > 0) {
      const askedTopics = intelligence.interviewResponses.map((r: any) => r.question_category).filter(Boolean);
      const recentResponses = intelligence.interviewResponses.slice(-3).map((r: any) => 
        `Q: ${r.question_text}\nA: ${r.response_text?.substring(0, 150)}...`
      ).join('\n\n');

      vaultContext = `
EXISTING CAREER VAULT INTELLIGENCE:
- Power Phrases: ${intelligence.counts.powerPhrases}
- Business Impacts: ${intelligence.counts.businessImpacts}
- Projects: ${intelligence.counts.projects}
- Topics Covered: ${askedTopics.join(', ')}

RECENT RESPONSES:
${recentResponses}

**PROGRESSIVE DEEPENING:** Build on existing intelligence - reference projects/achievements already mentioned and dig deeper.
`;
    }
    
    // Add milestone-specific context if provided
    let milestonePromptSection = '';
    if (milestoneContext) {
      milestonePromptSection = `

📍 RESUME-GROUNDED CONTEXT - Expand on this specific experience:
Company: ${milestoneContext.company_name || 'N/A'}
Role: ${milestoneContext.job_title || 'N/A'}
Period: ${milestoneContext.start_date || '?'} to ${milestoneContext.end_date || '?'}
Summary: ${milestoneContext.description || 'N/A'}
Known Achievements: ${milestoneContext.key_achievements?.join(', ') || 'None listed'}

Progress: ${milestoneContext.questions_answered}/${milestoneContext.questions_asked} questions answered
Intelligence extracted: ${milestoneContext.intelligence_extracted || 0} items

**YOUR TASK:** Generate a targeted question to extract MORE intelligence from this specific role/project:
1. PRE-FILL known context from the resume
2. Ask the user to expand with STAR details (Situation, Task, Action, Result)
3. Focus on quantifiable outcomes and specific examples
4. If this is an early question, ask about the biggest achievement
5. If later questions, dig into specific aspects (leadership, technical, stakeholder mgmt)

Make the question SPECIFIC to this role, not generic.`;
    }

    const systemPrompt = `${personaStyles[persona as keyof typeof personaStyles] || personaStyles.mentor}

You are conducting an in-depth career intelligence interview.

CURRENT INTERVIEW PHASE: ${currentPhase.title} (${currentPhase.name})
PHASE DESCRIPTION: ${currentPhase.description}
TARGET INTELLIGENCE CATEGORIES: ${currentPhase.targetCategories.join(', ')}
OVERALL COMPLETION: ${completionPercentage}%

${vaultContext}

Your goal is to extract SPECIFIC, QUANTIFIED, and COMPELLING career intelligence across 13 categories:

**Core Intelligence (Original 3):**
1. Power Phrases: Action-packed statements showcasing accomplishments with strong verbs
2. Transferable Skills: Core competencies applicable across roles/industries
3. Hidden Competencies: Unique capabilities the candidate may undervalue or overlook

**Expanded Intelligence (New 10):**
4. Business Impact: Quantified results (revenue, cost savings, efficiency gains, growth metrics)
5. Leadership Evidence: Team management, people development, organizational influence
6. Technical Depth: Tools, technologies, methodologies, certifications, technical achievements
7. Project Portfolio: Detailed project experiences (scope, budget, timeline, outcomes)
8. Industry Expertise: Domain knowledge, regulatory understanding, market insights
9. Problem-Solving: Complex challenges overcome using structured approaches (STAR format)
10. Stakeholder Management: Relationship building, negotiation, conflict resolution, influence
11. Career Narrative: Career progression logic, strategic transitions, growth trajectory
12. Competitive Advantages: Unique combinations of skills, rare experiences, differentiators
13. Communication Excellence: Presentation skills, writing abilities, cross-functional collaboration

RESPONSE FORMAT (ALWAYS RETURN THIS STRUCTURE):
${generate_answer_options ? `{
  "question": {
    "context": "Why I'm asking this - explain the strategic value",
    "knownData": [...],
    "questionsToExpand": [
      {
        "prompt": "Your question here",
        "placeholder": "Type or select below...",
        "hint": "Include specific metrics",
        "question_type": "multiple_choice_with_custom",
        "answer_options": [
          "Led teams of 10-50 people",
          "Managed budgets over $1M",
          "Drove cross-functional initiatives",
          "Mentored junior team members"
        ],
        "custom_input_prompt": "Add other experiences:"
      }
    ],
    "exampleAnswer": "CRITICAL: Base this example on ACTUAL resume data: ${JSON.stringify(vault?.initial_analysis || {})}. Reference specific achievements, companies, or projects from their resume. Use their actual career story, not generic examples."
  },
  "phase": "${currentPhase.name}",
  "completionPercentage": ${completionPercentage},
  "isComplete": false
}` : `{
  "question": {
    "context": "Why I'm asking this - explain the strategic value",
    "knownData": [
      {
        "label": "Current Role",
        "value": "Senior Product Manager",
        "source": "resume"
      }
    ],
    "questionsToExpand": [
      {
        "prompt": "Walk me through your biggest success",
        "placeholder": "Describe the situation, your actions, and the results...",
        "hint": "Include specific metrics and numbers"
      }
    ],
    "exampleAnswer": "MUST use resume data: ${JSON.stringify(vault?.initial_analysis || {})}. Show a STAR example using their actual job titles, companies, and achievements. Reference specific projects or metrics from their resume."
  },
  "phase": "${currentPhase.name}",
  "completionPercentage": ${completionPercentage},
  "isComplete": false
}`}

CRITICAL INSTRUCTIONS:
1. Pull specific data from resume: ${JSON.stringify(vault?.initial_analysis || {})}
2. Reference existing Career Vault intelligence when building questions
3. Ask follow-up questions that build on previous responses
4. Use the phase context to focus on relevant intelligence categories
5. Keep questions conversational and natural
6. Push for specifics and quantified results
7. Help user articulate their unique value${generate_answer_options ? `
8. Add question_type: "multiple_choice_with_custom" for checkbox questions
9. Include realistic answer_options based on:
   - Resume content: ${JSON.stringify(vault?.initial_analysis || {})}
   - Confirmed skills: ${JSON.stringify(confirmed_skills)}
   - Target role requirements
10. Include custom_input_prompt for freeform additions` : ''}

Current Phase Focus: ${currentPhase.name}
${isFirst ? 'This is the FIRST question - focus on career overview' : ''}

Return ONLY valid JSON in the format above.`;

    const userPrompt = isFirst 
      ? `Start the Career Vault interview. Resume analysis: ${JSON.stringify(vault?.initial_analysis || {})}`
      : `Continue the interview. Conversation so far: ${JSON.stringify(conversationHistory || [])}`;

    // Use Gemini 2.5 Flash for conversational questions (fast)
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI optimization failed: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    let parsedResult;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      parsedResult = JSON.parse(jsonMatch ? jsonMatch[0] : aiResponse);
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      parsedResult = {
        question: aiResponse,
        phase: currentPhase.name,
        completionPercentage,
        isComplete: false
      };
    }

    // Store response in Career Vault
    if (previousResponse && vault) {
      await supabase
        .from('vault_interview_responses')
        .insert({
          vault_id: vault.id,
          user_id: user.id,
          phase: currentPhase.name,
          question: conversationHistory?.[conversationHistory.length - 2]?.content || '',
          response: previousResponse
        });

      // Update completion percentage
      await supabase
        .from('career_vault')
        .update({
          interview_completion_percentage: parsedResult.completionPercentage,
          last_updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
    }

    return new Response(JSON.stringify(parsedResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-interview-question:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
