import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callPerplexity, cleanCitations } from '../_shared/ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { selectOptimalModel } from '../_shared/model-optimizer.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { resumeText, userId } = await req.json();

    if (!resumeText || !userId) {
      throw new Error('Missing required fields');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Call AI for quick analysis
    const prompt = `Analyze this resume and extract:
1. Count of power phrases (quantified achievements)
2. Count of identified skills
3. Count of key achievements
4. A "Career Intelligence Score" (0-100) representing how complete/strong the resume is

Return JSON format:
{
  "powerPhrases": number,
  "skills": number,
  "achievements": number,
  "intelligenceScore": number (typically 30-50 for basic resumes, 70-100 for complete Career Vaults)
}

Resume:
${resumeText.substring(0, 3000)}`;

    const { response, metrics } = await callPerplexity({
      messages: [
        { role: 'system', content: 'You are a career analysis AI. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      model: selectOptimalModel({
        taskType: 'analysis',
        complexity: 'low',
        requiresReasoning: false,
        outputLength: 'short'
      }),
      temperature: 0.2,
    }, 'quick-analyze-resume', userId);

    await logAIUsage(metrics);

    const content = cleanCitations(response.choices[0].message.content);
    
    // Parse JSON from AI response
    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback to defaults if parsing fails
        analysis = {
          powerPhrases: 8,
          skills: 12,
          achievements: 5,
          intelligenceScore: 35
        };
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      analysis = {
        powerPhrases: 8,
        skills: 12,
        achievements: 5,
        intelligenceScore: 35
      };
    }

    // Store basic analysis in database (optional - for free users)
    try {
      await supabase.from('career_vault').upsert({
        user_id: userId,
        initial_analysis: {
          quick_preview: true,
          power_phrases_count: analysis.powerPhrases,
          skills_count: analysis.skills,
          achievements_count: analysis.achievements,
          intelligence_score: analysis.intelligenceScore,
          analyzed_at: new Date().toISOString()
        }
      }, {
        onConflict: 'user_id'
      });
    } catch (dbError) {
      console.error('Database error (non-critical):', dbError);
    }

    return new Response(
      JSON.stringify(analysis),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
