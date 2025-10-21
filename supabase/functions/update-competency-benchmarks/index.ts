import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Nightly Cron Job: Update Competency Benchmarks
 *
 * Aggregates competency profile data to calculate percentiles.
 * Run via: POST https://[project].supabase.co/functions/v1/update-competency-benchmarks
 * With header: Authorization: Bearer [service_role_key]
 *
 * Or configure as Supabase cron job:
 * https://supabase.com/docs/guides/functions/schedule-functions
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[BENCHMARK-UPDATE] Starting nightly benchmark calculation...');

    // Get all competency profiles with proficiency levels
    const { data: profiles, error: profileError } = await supabase
      .from('user_competency_profile')
      .select(`
        competency_name,
        category,
        proficiency_level,
        has_experience,
        quality_tier
      `)
      .eq('has_experience', true)
      .not('proficiency_level', 'is', null);

    if (profileError) {
      throw new Error(`Failed to fetch profiles: ${profileError.message}`);
    }

    console.log(`[BENCHMARK-UPDATE] Processing ${profiles?.length || 0} competency records`);

    // Group by competency name
    const competencyGroups = new Map<string, any[]>();
    (profiles || []).forEach(profile => {
      const key = profile.competency_name;
      if (!competencyGroups.has(key)) {
        competencyGroups.set(key, []);
      }
      competencyGroups.get(key)!.push(profile);
    });

    console.log(`[BENCHMARK-UPDATE] Found ${competencyGroups.size} unique competencies`);

    // Calculate benchmarks for each competency
    const benchmarks = [];
    for (const [competencyName, records] of competencyGroups.entries()) {
      // Skip if too few data points
      if (records.length < 5) {
        console.log(`[BENCHMARK-UPDATE] Skipping ${competencyName} (only ${records.length} records)`);
        continue;
      }

      // Extract proficiency levels and sort
      const proficiencies = records
        .map(r => r.proficiency_level)
        .filter(p => p !== null && p !== undefined)
        .sort((a, b) => a - b);

      if (proficiencies.length < 5) {
        continue;
      }

      // Calculate percentiles
      const percentile25 = proficiencies[Math.floor(proficiencies.length * 0.25)];
      const percentile50 = proficiencies[Math.floor(proficiencies.length * 0.50)];
      const percentile75 = proficiencies[Math.floor(proficiencies.length * 0.75)];
      const percentile90 = proficiencies[Math.floor(proficiencies.length * 0.90)];

      // Get category from first record
      const category = records[0].category;

      // Count how many users have this competency
      const totalUsers = new Set(records.map(r => r.user_id)).size;

      benchmarks.push({
        competency_name: competencyName,
        category: category,
        role: 'all', // Universal benchmark across all roles
        industry: 'all', // Universal benchmark across all industries
        percentile_25: percentile25,
        percentile_50: percentile50,
        percentile_75: percentile75,
        percentile_90: percentile90,
        sample_size: proficiencies.length,
        total_users: totalUsers,
        last_updated: new Date().toISOString()
      });

      console.log(`[BENCHMARK-UPDATE] ✓ ${competencyName}: p25=${percentile25}, p50=${percentile50}, p75=${percentile75}, p90=${percentile90} (n=${proficiencies.length})`);
    }

    if (benchmarks.length === 0) {
      console.log('[BENCHMARK-UPDATE] No benchmarks to update (insufficient data)');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No benchmarks updated (insufficient data)',
          benchmarksUpdated: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Upsert benchmarks into database
    const { error: upsertError } = await supabase
      .from('competency_benchmarks')
      .upsert(benchmarks, {
        onConflict: 'competency_name,role,industry'
      });

    if (upsertError) {
      throw new Error(`Failed to upsert benchmarks: ${upsertError.message}`);
    }

    console.log(`[BENCHMARK-UPDATE] ✅ Successfully updated ${benchmarks.length} benchmarks`);

    // Calculate some aggregate stats
    const avgSampleSize = benchmarks.reduce((sum, b) => sum + b.sample_size, 0) / benchmarks.length;
    const minSampleSize = Math.min(...benchmarks.map(b => b.sample_size));
    const maxSampleSize = Math.max(...benchmarks.map(b => b.sample_size));

    const stats = {
      totalBenchmarks: benchmarks.length,
      avgSampleSize: Math.round(avgSampleSize),
      minSampleSize,
      maxSampleSize,
      totalDataPoints: benchmarks.reduce((sum, b) => sum + b.sample_size, 0)
    };

    console.log('[BENCHMARK-UPDATE] Stats:', stats);

    return new Response(
      JSON.stringify({
        success: true,
        benchmarksUpdated: benchmarks.length,
        stats,
        topCompetencies: benchmarks
          .sort((a, b) => b.sample_size - a.sample_size)
          .slice(0, 10)
          .map(b => ({
            competency: b.competency_name,
            sampleSize: b.sample_size,
            p50: b.percentile_50,
            p90: b.percentile_90
          }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[BENCHMARK-UPDATE] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
