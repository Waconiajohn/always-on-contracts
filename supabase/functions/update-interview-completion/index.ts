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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) throw new Error('Unauthorized');

    // Get user's career vault
    const { data: vault } = await supabase
      .from('career_vault')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!vault) throw new Error('No career vault found');

    // Count total responses
    const { count: totalResponses } = await supabase
      .from('vault_interview_responses')
      .select('*', { count: 'exact', head: true })
      .eq('vault_id', vault.id);

    // Count unique topics covered
    const { data: responses } = await supabase
      .from('vault_interview_responses')
      .select('topic_focus')
      .eq('vault_id', vault.id)
      .not('topic_focus', 'is', null);

    const uniqueTopics = new Set(responses?.map(r => r.topic_focus).filter(Boolean));

    // Expected milestones and topics for a comprehensive interview
    // We expect around 50-60 responses covering:
    // - Each milestone (role) with 5-7 questions
    // - Each of the 20 intelligence categories touched at least once
    // - Deep dives into key areas (leadership, achievements, challenges)
    
    const expectedResponses = 50;
    const expectedTopics = 20;

    // Calculate completion percentage
    const responseProgress = Math.min((totalResponses || 0) / expectedResponses, 1) * 60; // 60% weight
    const topicProgress = Math.min(uniqueTopics.size / expectedTopics, 1) * 40; // 40% weight
    
    const completionPercentage = Math.round(responseProgress + topicProgress);

    // Update career vault
    await supabase
      .from('career_vault')
      .update({ interview_completion_percentage: completionPercentage })
      .eq('id', vault.id);

    console.log(`[UPDATE-COMPLETION] User ${user.id}: ${totalResponses} responses, ${uniqueTopics.size} topics = ${completionPercentage}%`);

    return new Response(
      JSON.stringify({ 
        success: true,
        completionPercentage,
        totalResponses,
        uniqueTopics: uniqueTopics.size
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[UPDATE-COMPLETION] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});