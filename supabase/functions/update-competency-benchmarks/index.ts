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

    console.log('[BENCHMARK-UPDATE] Starting segmented benchmark calculation...');

    // Use new database function to calculate segmented benchmarks
    // This calculates at 4 levels: Universal, Role-specific, Industry-specific, Full segment
    const { data: result, error: calcError } = await supabase.rpc(
      'calculate_segmented_benchmarks',
      { p_min_sample_size: 10 }
    );

    if (calcError) {
      throw new Error(`Failed to calculate benchmarks: ${calcError.message}`);
    }

    console.log('[BENCHMARK-UPDATE] ✅ Segmented calculation complete');

    // Fetch stats from the database
    const { data: stats } = await supabase
      .from('competency_benchmark_stats')
      .select('*')
      .order('calculated_at', { ascending: false })
      .limit(1)
      .single();

    // Fetch top competencies
    const { data: topCompetencies } = await supabase
      .from('competency_benchmarks')
      .select('competency_name, sample_size, percentile_50, percentile_90, role, industry')
      .order('sample_size', { ascending: false })
      .limit(10);

    console.log('[BENCHMARK-UPDATE] Stats:', stats);

    return new Response(
      JSON.stringify({
        success: true,
        totalBenchmarks: result.totalBenchmarks,
        breakdown: result.breakdown,
        totalUsers: result.totalUsers,
        durationMs: result.durationMs,
        stats: stats || {},
        topCompetencies: topCompetencies || []
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
