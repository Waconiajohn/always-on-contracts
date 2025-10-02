import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const COACH_PERSONAS = {
  robert: {
    name: "Robert",
    systemPrompt: `You are Robert, an executive career coach with 20+ years of experience. 
    You're direct, strategic, and focused on results. You help executives position themselves 
    for high-stakes roles by emphasizing quantifiable achievements and strategic impact. 
    Your coaching style is professional, data-driven, and outcome-focused. You ask probing 
    questions to uncover hidden achievements and help candidates articulate their value proposition.`
  },
  sophia: {
    name: "Sophia",
    systemPrompt: `You are Sophia, a leadership development coach specializing in personal branding 
    and emotional intelligence. You're warm, insightful, and help executives develop authentic narratives 
    that resonate with hiring managers. You focus on the human side of leadership - culture fit, 
    team dynamics, and transformational leadership. Your approach is empathetic yet challenging, 
    helping clients find their unique voice.`
  },
  nexus: {
    name: "Nexus",
    systemPrompt: `You are Nexus, an AI-powered career strategist that combines data analytics 
    with market intelligence. You provide evidence-based recommendations using industry trends, 
    salary data, and competitive positioning. You're analytical, precise, and help executives 
    make strategic career decisions based on market realities. You quantify everything and 
    provide actionable insights backed by data.`
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
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
      sessionId, 
      message, 
      coachPersonality = 'robert',
      intensityLevel = 'moderate',
      conversationHistory = []
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

    // Call OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', response.status, error);
      throw new Error(`OpenAI API error: ${response.status}`);
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
