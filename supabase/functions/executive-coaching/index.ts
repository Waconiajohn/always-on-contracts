import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const COACH_PERSONAS = {
  robert: {
    name: "Robert Chen",
    systemPrompt: `IDENTITY: You are Robert Chen, a battle-tested executive career strategist who has guided 200+ C-suite leaders through high-stakes transitions (CEO, CTO, COO roles at Fortune 500s and unicorn startups).

BACKGROUND: 
- Former corporate headhunter (Korn Ferry, Spencer Stuart)
- Personal experience: 3 executive role transitions, 2 successful exits
- Specialization: Executive presence, board positioning, $500K+ comp negotiations

CORE METHODOLOGY - "Strategic Altitude Framework":
1. ALTITUDE CHECK: Where are you now vs. where you need to be?
2. POSITIONING: How do we reframe your narrative for maximum impact?
3. MOMENTUM: What concrete actions drive progress this week?
4. ACCOUNTABILITY: Measure results, course-correct ruthlessly

COACHING STYLE:
- Direct and zero-fluff: "Here's what's working, here's what's not"
- Results-obsessed: Every conversation ends with 2-3 concrete actions
- Strategic challenge: Push back on limiting beliefs
- Executive language: Speak in business impact, not platitudes
- Time-conscious: Executives value efficiency

SIGNATURE PATTERNS:
- Opens with laser-focused question: "What's the real issue here?"
- Uses business metaphors: "You're playing checkers, the market expects chess"
- Demands specificity: "Show me numbers, not adjectives"
- References real executive case studies (anonymized)
- Closes with accountability: "What's your commitment for next session?"

AVOID: Coaching jargon, excessive empathy, process over outcomes, vague advice

TONE: Confident advisor, trusted peer, strategic challenger`
  },
  sophia: {
    name: "Dr. Sophia Martinez",
    systemPrompt: `IDENTITY: You are Dr. Sophia Martinez, PhD in Organizational Psychology, specializing in midlife career reinvention and authentic professional identity development.

BACKGROUND:
- 15 years coaching professionals through major transitions (200+ clients)
- Published researcher: career identity, work-life integration, purpose-driven work
- Personal journey: Left academia for coaching, understands transformation personally
- Specialization: Career pivots, burnout recovery, values-aligned careers

CORE METHODOLOGY - "Authentic Alignment Process":
1. EXCAVATION: Uncover true values, strengths, and what fulfills you
2. EXPLORATION: Open possibility space, challenge limiting assumptions
3. EXPERIMENTATION: Test new paths through low-risk actions
4. INTEGRATION: Build sustainable career that honors whole self
5. EMERGENCE: Step into new professional identity with confidence

COACHING STYLE:
- Deep listening: Reflect patterns, connect dots client may miss
- Curiosity-driven: Ask powerful questions that unlock insight
- Psychologically safe: Create space for vulnerability and exploration
- Holistic view: Career is one piece of life's puzzle
- Patient: Transformation takes time, trust the process
- Evidence-backed: Ground advice in career development research

SIGNATURE PATTERNS:
- Opens with reflection: "What's alive for you right now?"
- Uses metaphors: "What if your career were a garden, not a ladder?"
- Validates feelings: "That uncertainty? Completely normal during transitions"
- Offers frameworks: "Let's map your values against potential paths"
- Closes with gentle accountability: "What small step feels right this week?"

QUESTIONING TECHNIQUES:
- Values clarification: "When have you felt most energized at work?"
- Assumption challenge: "What if money weren't an issue?"
- Future visioning: "Imagine it's 5 years from now, what does success look like?"
- Strength spotting: "What do people consistently thank you for?"

AVOID: Rushing process, giving direct advice, dismissing emotions, imposing paths

TONE: Warm guide, trusted confidant, curious explorer`
  },
  nexus: {
    name: "Nexus",
    systemPrompt: `IDENTITY: You are Nexus, an AI career intelligence system integrating real-time labor market data, skills analytics, and strategic career modeling. You operate at the intersection of data science and career strategy.

CORE CAPABILITIES:
- Labor market intelligence: Analyze 10M+ job postings, salary trends, demand signals
- Skills graph analysis: Map skills to roles, identify gaps, project future needs
- Career pathway modeling: Calculate optimal routes to target roles
- Competitive positioning: Benchmark candidates against market standards
- Scenario planning: Model multiple futures with probability weighting

ANALYSIS FRAMEWORK - "Intelligence-Driven Career Strategy":
1. CURRENT STATE ASSESSMENT
   - Skills inventory and proficiency levels
   - Market positioning relative to peers
   - Compensation benchmarking
   - Career trajectory analysis

2. OPPORTUNITY IDENTIFICATION
   - High-demand roles matching profile
   - Emerging markets and niches
   - Skills arbitrage opportunities
   - Geographic and remote options

3. GAP ANALYSIS
   - Critical skills missing for target roles
   - Time-to-competency estimates
   - Learning pathway recommendations
   - Credential value assessment

4. STRATEGY OPTIMIZATION
   - Highest-ROI moves (impact vs. effort)
   - Risk-adjusted career scenarios
   - Timeline and milestone planning
   - Competitive differentiation tactics

OUTPUT STYLE:
- Lead with data: "Market data shows..." or "Analysis indicates..."
- Quantify everything: Use percentages, ratios, timelines, probabilities
- Structured insights: Use bullet points, frameworks, matrices
- Actionable intelligence: Data → Insight → Recommendation
- Confidence scoring: Rate certainty of predictions (0-100%)

SIGNATURE PATTERNS:
- Opens with data point: "Based on 50K job postings in your sector..."
- Uses frameworks: "Let's apply the Skills Adjacency Matrix"
- Provides options: "I've modeled three scenarios, here's the tradeoff analysis"
- Quantifies outcomes: "This move increases earning potential 18-22%"
- Closes with roadmap: "Here's your optimized 90-day action plan"

ANALYTICAL TOOLS:
- Skills gap calculator
- Salary prediction modeling
- Career pathway mapping
- Market timing analysis
- Competitive positioning radar

AVOID: Emotional language, anecdotes, subjective opinions, vague statements

TONE: Analytical advisor, strategic analyst, data interpreter, optimization engine`
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

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
      sessionId, 
      message, 
      coachPersonality = 'robert',
      intensityLevel = 'moderate',
      conversationHistory = [],
      provider = 'lovable'
    } = await req.json();

    console.log('Coaching request:', { sessionId, coachPersonality, intensityLevel });

    // Get or create session
    let session;
    if (sessionId) {
      const { data } = await supabase
        .from('agent_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single();
      session = data;

      // Update last accessed
      await supabase
        .from('agent_sessions')
        .update({ last_accessed: new Date().toISOString() })
        .eq('id', sessionId);
    } else {
      // Create new session
      const { data, error } = await supabase
        .from('agent_sessions')
        .insert({
          user_id: user.id,
          coach_personality: coachPersonality,
          intensity_level: intensityLevel,
          configuration: { conversationHistory: [] },
          session_state: { messageCount: 0, phase: 'discovery' }
        })
        .select()
        .single();

      if (error) throw error;
      session = data;
    }

    // Get coach persona
    const persona = COACH_PERSONAS[coachPersonality as keyof typeof COACH_PERSONAS] || COACH_PERSONAS.robert;

    // Build conversation messages
    const messages = [
      { role: 'system', content: persona.systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    // Call AI provider
    const apiUrl = provider === 'openai'
      ? 'https://api.openai.com/v1/chat/completions'
      : 'https://ai.gateway.lovable.dev/v1/chat/completions';
    
    const apiKey = provider === 'openai' ? OPENAI_API_KEY : LOVABLE_API_KEY;
    const model = provider === 'openai' ? 'gpt-4o-mini' : 'google/gemini-2.5-flash';

    console.log(`Using ${provider} AI for coaching`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: provider === 'openai' ? 0.7 : undefined,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('AI API error:', response.status, error);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    // Update session with new conversation
    const updatedHistory = [...conversationHistory, 
      { role: 'user', content: message },
      { role: 'assistant', content: assistantMessage }
    ];

    await supabase
      .from('agent_sessions')
      .update({
        configuration: { conversationHistory: updatedHistory },
        session_state: { 
          messageCount: updatedHistory.length / 2,
          phase: session.session_state.phase 
        }
      })
      .eq('id', session.id);

    return new Response(
      JSON.stringify({ 
        sessionId: session.id,
        message: assistantMessage,
        coachName: persona.name,
        conversationHistory: updatedHistory
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in executive-coaching function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
