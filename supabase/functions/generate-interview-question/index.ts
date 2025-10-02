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
      phaseTitle = 'Understanding Your Experience';
      phaseDescription = "Let me learn more about your background";
    } else if (responseCount < 17) {
      phase = 'skills_translation';
      phaseTitle = 'Skills Translation';
      phaseDescription = "Let's uncover equivalent skills you possess";
    } else {
      phase = 'hidden_gems';
      phaseTitle = 'Hidden Competencies';
      phaseDescription = "Discovering your untapped potential";
    }

    // Use Lovable AI to generate contextual question
    const prompt = `You are a corporate career assistant conducting an interview to build a comprehensive "War Chest" of someone's capabilities.

Resume Summary: ${JSON.stringify(warChest.initial_analysis)}

Previous Interview Responses: ${JSON.stringify(previousResponses?.slice(-3) || [])}

Current Phase: ${phase}

Generate ONE specific, insightful question that will help uncover:
${phase === 'resume_understanding' ? '- Deeper context about their work experience\n- Quantifiable achievements they may have undersold\n- Specific projects and their impact' : ''}
${phase === 'skills_translation' ? '- Skills they have but may not have listed (e.g., Salesforce experience means they can use Zoho)\n- Certifications they almost have (e.g., learned Kaizen in Japan but not Six Sigma certified)\n- Technologies or methodologies they\'ve worked with indirectly' : ''}
${phase === 'hidden_gems' ? '- AI/ML experience they don\'t call "AI" (e.g., large language models, machine learning)\n- Leadership capabilities from non-management roles\n- Cross-functional skills they take for granted' : ''}

Return ONLY the question text, no preamble.`;

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
