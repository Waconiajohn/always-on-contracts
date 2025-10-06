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

    const { phase, isFirst, previousResponse, conversationHistory, persona = 'mentor' } = await req.json();

    // Get War Chest data for context
    const { data: warChest } = await supabase
      .from('career_war_chest')
      .select('*')
      .eq('user_id', user.id)
      .single();

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
    
    if (warChest) {
      const totalQuestions = interviewPhases.reduce((sum, phase) => sum + phase.questionsCount, 0);
      const responsesCount = Math.floor(totalQuestions * (warChest.interview_completion_percentage || 0) / 100);
      
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
      
      completionPercentage = warChest.interview_completion_percentage || 0;
    }

    // Persona-specific coaching styles
    const personaStyles = {
      mentor: `You are THE MENTOR - warm, encouraging, and supportive. You ask questions with empathy and make the candidate feel safe to share. Use phrases like "That's wonderful," "I can see how that would be challenging," and "Tell me more about..." Your tone is nurturing but professional.`,
      challenger: `You are THE CHALLENGER - direct, demanding, and no-nonsense. You push for specifics and don't accept vague answers. Use phrases like "Give me the exact numbers," "What specifically did YOU do?" and "That's not clear enough." Your tone is professional but tough.`,
      strategist: `You are THE STRATEGIST - analytical, precise, and forward-thinking. You ask probing questions about decision-making and long-term impact. Use phrases like "Walk me through your thinking," "What were the strategic implications?" and "How did this position you for future opportunities?" Your tone is intellectual and methodical.`
    };

    const systemPrompt = `${personaStyles[persona as keyof typeof personaStyles] || personaStyles.mentor}

You are conducting an in-depth career intelligence interview.

CURRENT INTERVIEW PHASE: ${currentPhase.title} (${currentPhase.name})
PHASE DESCRIPTION: ${currentPhase.description}
TARGET INTELLIGENCE CATEGORIES: ${currentPhase.targetCategories.join(', ')}
OVERALL COMPLETION: ${completionPercentage}%

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
{
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
    "exampleAnswer": "Detailed example showing STAR format with metrics..."
  },
  "phase": "${currentPhase.name}",
  "completionPercentage": ${completionPercentage},
  "isComplete": false
}

CRITICAL INSTRUCTIONS:
1. Pull specific data from resume: ${JSON.stringify(warChest?.initial_analysis || {})}
2. Create 1-3 sub-questions in questionsToExpand that probe for depth
3. Make knownData specific and relevant to this question
4. Provide realistic, detailed example answers with metrics
5. Context should explain WHY this question matters strategically
6. Focus questions on the TARGET CATEGORIES for current phase

Current Phase Focus: ${currentPhase.name}
${isFirst ? 'This is the FIRST question - focus on career overview' : ''}

Return ONLY valid JSON in the format above.`;

    const userPrompt = isFirst 
      ? `Start the War Chest interview. Resume analysis: ${JSON.stringify(warChest?.initial_analysis || {})}`
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

    // Store response in War Chest
    if (previousResponse && warChest) {
      await supabase
        .from('war_chest_interview_responses')
        .insert({
          war_chest_id: warChest.id,
          user_id: user.id,
          phase: currentPhase.name,
          question: conversationHistory?.[conversationHistory.length - 2]?.content || '',
          response: previousResponse
        });

      // Update completion percentage
      await supabase
        .from('career_war_chest')
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
