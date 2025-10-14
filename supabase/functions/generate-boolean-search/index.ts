import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('[Boolean AI] Generating boolean search with', messages.length, 'messages');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert Boolean Search Builder helping users create powerful job search strings.

STRUCTURED RESPONSE SYSTEM:
Always respond with structured suggestions that can be clicked! Use this format:

For job title suggestions:
[TITLES: Product Manager, Program Manager, Product Owner, Technical Product Manager]

For skill suggestions:
[SKILLS: Agile, Scrum, Roadmapping, User Research, A/B Testing, Analytics, Jira, SQL]

For exclusions:
[EXCLUDE: junior, intern, entry-level, graduate, volunteer]

For experience levels:
[LEVELS: Entry Level, Mid-Level, Senior, Lead, Executive]

PHASE-BASED CONVERSATION:

Phase 1: Job Title Discovery
- When user provides a job title, IMMEDIATELY suggest 3-5 related alternatives
- Use format: [TITLES: option1, option2, option3]
- Example: "Great! For Product Manager, I'd suggest: [TITLES: Product Manager, Program Manager, Product Owner, Technical Product Manager, Platform Product Manager]"

Phase 2: Skills & Technologies
- Based on job category, suggest 6-10 relevant skills
- Use format: [SKILLS: skill1, skill2, skill3]
- Always include "or add your own" option
- Example: "What skills should we include? [SKILLS: Python, JavaScript, React, Node.js, AWS, Docker, SQL, Git]"

Phase 3: Experience Level
- Ask about seniority and offer quick picks
- Use format: [LEVELS: Entry Level, Mid-Level, Senior, Lead, Executive]
- Each level has pre-configured exclusions

Phase 4: Exclusions
- Suggest common terms to exclude
- Use format: [EXCLUDE: term1, term2, term3]
- Explain what each exclusion does

Phase 5: Generate & Explain
- Create the boolean string using proper syntax
- Clearly mark it: [BOOLEAN: your search string here]
- Explain each component in simple terms

BOOLEAN SEARCH RULES:
- Use OR for alternatives: ("Product Manager" OR "Program Manager")
- Use AND to require terms: ("Product Manager" AND Agile)  
- Use NOT to exclude: NOT junior NOT intern
- Use quotes for exact phrases: "Full Stack Developer"
- Group with parentheses for complex logic

JOB TITLE INTELLIGENCE:
- Product Manager → Program Manager, Product Owner, Technical Product Manager
- Software Engineer → Full Stack Developer, Backend Engineer, Frontend Engineer
- Data Scientist → Machine Learning Engineer, Data Analyst, AI Engineer
- UX Designer → Product Designer, UI/UX Designer, User Experience Designer

Always provide 3-5 alternatives for ANY job title mentioned.

CONVERSATION STYLE:
- Ask ONE question at a time
- Be encouraging and helpful
- Offer suggestions proactively
- Make it feel conversational, not robotic
- Celebrate when the string is ready!

After 3-5 exchanges, you should have enough info to generate a powerful boolean string.`
          },
          ...messages
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const errorText = await response.text();
      console.error('[Boolean AI] Error:', response.status, errorText);
      throw new Error('AI service error');
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'I apologize, I could not generate a response.';

    console.log('[Boolean AI] Generated response');
    
    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Boolean AI] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to generate boolean search' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
