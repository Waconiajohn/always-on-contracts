import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/response-helpers.ts';

/**
 * System Health Check Endpoint
 * Phase 5: Production Readiness
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const healthChecks: Record<string, any> = {};

    // Database connectivity check
    const dbStart = Date.now();
    const { error: dbError } = await supabase.from('profiles').select('count').limit(1);
    healthChecks.database = {
      status: dbError ? 'unhealthy' : 'healthy',
      latencyMs: Date.now() - dbStart,
      error: dbError?.message
    };

    // Cache health check
    const { count: cacheCount } = await supabase
      .from('resume_cache')
      .select('*', { count: 'exact', head: true });
    
    const { count: expiredCount } = await supabase
      .from('resume_cache')
      .select('*', { count: 'exact', head: true })
      .lt('expires_at', new Date().toISOString());

    healthChecks.cache = {
      status: 'healthy',
      totalEntries: cacheCount || 0,
      expiredEntries: expiredCount || 0
    };

    // AI metrics check (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentMetrics, error: metricsError } = await supabase
      .from('ai_usage_metrics')
      .select('*')
      .gte('created_at', oneDayAgo)
      .order('created_at', { ascending: false })
      .limit(100);

    if (recentMetrics && recentMetrics.length > 0) {
      const avgLatency = recentMetrics.reduce((sum, m) => sum + (m.execution_time_ms || 0), 0) / recentMetrics.length;
      const errorCount = recentMetrics.filter(m => m.error_code).length;
      const errorRate = errorCount / recentMetrics.length;

      healthChecks.ai_operations = {
        status: errorRate > 0.1 ? 'warning' : 'healthy',
        last24hRequests: recentMetrics.length,
        avgLatencyMs: Math.round(avgLatency),
        errorRate: Math.round(errorRate * 100) / 100,
        warningThreshold: 0.1
      };
    } else {
      healthChecks.ai_operations = {
        status: 'healthy',
        last24hRequests: 0
      };
    }

    // Rate limiting check
    const { count: rateLimitCount } = await supabase
      .from('api_rate_limits')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneDayAgo);

    healthChecks.rate_limiting = {
      status: 'healthy',
      last24hRequests: rateLimitCount || 0
    };

    // Overall system status
    const unhealthyServices = Object.values(healthChecks).filter(
      (check: any) => check.status === 'unhealthy'
    ).length;
    
    const warningServices = Object.values(healthChecks).filter(
      (check: any) => check.status === 'warning'
    ).length;

    const overallStatus = unhealthyServices > 0 ? 'unhealthy' :
                         warningServices > 0 ? 'warning' : 'healthy';

    // Record health metrics
    const healthScore = unhealthyServices === 0 && warningServices === 0 ? 100 :
                       unhealthyServices === 0 ? 75 : 50;

    await supabase.from('system_health_metrics').insert({
      metric_name: 'overall_health_score',
      metric_value: healthScore,
      metric_unit: 'percent',
      threshold_warning: 75,
      threshold_critical: 50,
      status: overallStatus
    });

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        status: overallStatus,
        healthScore,
        checks: healthChecks,
        version: '1.0.0'
      }),
      {
        status: overallStatus === 'unhealthy' ? 503 : 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Health check error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
