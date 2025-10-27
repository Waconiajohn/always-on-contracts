import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[DAILY-JOB-MATCHER] Starting daily matching run...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Find all Concierge Elite users with AI matching enabled
    const { data: eliteUsers, error: eliteError } = await supabase
      .from('profiles')
      .select(`
        user_id,
        subscriptions!inner (
          tier,
          status
        ),
        user_ai_preferences!left (
          enabled,
          last_match_run
        ),
        career_vault!inner (
          overall_strength_score
        ),
        opportunity_matches (
          id,
          status
        )
      `)
      .eq('subscriptions.status', 'active')
      .eq('subscriptions.tier', 'concierge_elite')
      .gte('career_vault.overall_strength_score', 50);

    if (eliteError) {
      console.error('[DAILY-JOB-MATCHER] Error fetching elite users:', eliteError);
      throw eliteError;
    }

    // 2. Find retirement access users
    const { data: retirementUsers, error: retirementError } = await supabase
      .from('retirement_access_codes')
      .select(`
        user_id,
        profiles!inner (
          user_id,
          user_ai_preferences!left (
            enabled,
            last_match_run
          ),
          career_vault!inner (
            overall_strength_score
          ),
          opportunity_matches (
            id,
            status
          )
        )
      `)
      .eq('is_active', true)
      .gte('profiles.career_vault.overall_strength_score', 50);

    if (retirementError) {
      console.error('[DAILY-JOB-MATCHER] Error fetching retirement users:', retirementError);
      throw retirementError;
    }

    // 3. Merge both user lists and normalize structure
    const normalizedRetirementUsers = (retirementUsers || []).map(r => {
      const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
      return {
        user_id: r.user_id,
        user_ai_preferences: profile?.user_ai_preferences,
        career_vault: profile?.career_vault,
        opportunity_matches: profile?.opportunity_matches,
        is_retirement: true
      };
    });

    const normalizedEliteUsers = (eliteUsers || []).map(u => ({
      ...u,
      is_retirement: false
    }));

    const users = [...normalizedEliteUsers, ...normalizedRetirementUsers];

    if (!users || users.length === 0) {
      console.log('[DAILY-JOB-MATCHER] No eligible users found');
      return new Response(
        JSON.stringify({ 
          message: 'No eligible users for matching',
          users_processed: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Filter and prioritize users
    const eligibleUsers = users.filter(u => {
      // Check if AI preferences exist and are enabled (default to true if not set)
      const prefs = Array.isArray(u.user_ai_preferences) ? u.user_ai_preferences[0] : u.user_ai_preferences;
      const aiEnabled = !prefs || prefs.enabled !== false;
      
      // Skip users with 10+ unreviewed suggestions
      const unreviewedCount = (u.opportunity_matches || []).filter((m: any) => m.status === 'new').length;
      
      return aiEnabled && unreviewedCount < 10;
    });

    // Sort by priority: 
    // 1. Users who haven't had matches run in 7+ days
    // 2. Users with higher vault completeness
    eligibleUsers.sort((a, b) => {
      const aPrefs = Array.isArray(a.user_ai_preferences) ? a.user_ai_preferences[0] : a.user_ai_preferences;
      const bPrefs = Array.isArray(b.user_ai_preferences) ? b.user_ai_preferences[0] : b.user_ai_preferences;
      
      const aLastRun = aPrefs?.last_match_run 
        ? new Date(aPrefs.last_match_run).getTime() 
        : 0;
      const bLastRun = bPrefs?.last_match_run 
        ? new Date(bPrefs.last_match_run).getTime() 
        : 0;
      
      const now = Date.now();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      
      const aNeedsUpdate = (now - aLastRun) > sevenDays;
      const bNeedsUpdate = (now - bLastRun) > sevenDays;
      
      if (aNeedsUpdate !== bNeedsUpdate) {
        return aNeedsUpdate ? -1 : 1;
      }
      
      const aVault = Array.isArray(a.career_vault) ? a.career_vault[0] : a.career_vault;
      const bVault = Array.isArray(b.career_vault) ? b.career_vault[0] : b.career_vault;
      return (bVault?.overall_strength_score || 0) - (aVault?.overall_strength_score || 0);
    });

    console.log(`[DAILY-JOB-MATCHER] Processing ${eligibleUsers.length} eligible users`);

    // 5. Process each user
    const results = {
      total_users: eligibleUsers.length,
      successful: 0,
      failed: 0,
      total_matches_found: 0,
      errors: [] as string[]
    };

    for (const user of eligibleUsers) {
      try {
        // Call ai-job-matcher function with service role key
        const { data, error } = await supabase.functions.invoke('ai-job-matcher', {
          body: { userId: user.user_id },
          headers: {
            Authorization: `Bearer ${supabaseKey}`
          }
        });

        if (error) {
          throw error;
        }

        results.successful++;
        results.total_matches_found += data.matches_found || 0;
        
        console.log(`[DAILY-JOB-MATCHER] User ${user.user_id}: ${data.matches_found} matches found`);

      } catch (error) {
        results.failed++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`User ${user.user_id}: ${errorMsg}`);
        console.error(`[DAILY-JOB-MATCHER] Error processing user ${user.user_id}:`, error);
      }
    }

    console.log('[DAILY-JOB-MATCHER] Daily run complete:', results);

    return new Response(
      JSON.stringify({
        success: true,
        summary: results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[DAILY-JOB-MATCHER] Fatal error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});