/**
 * Cost Tracking Utilities
 * 
 * Logs AI usage metrics to the database for observability and cost analysis
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { AIUsageMetrics } from './ai-config.ts';

/**
 * Log AI usage metrics to the database
 */
export async function logAIUsage(metrics: AIUsageMetrics): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase
      .from('ai_usage_metrics')
      .insert({
        function_name: metrics.function_name,
        provider: 'perplexity',
        model: metrics.model,
        input_tokens: metrics.input_tokens,
        output_tokens: metrics.output_tokens,
        cost_usd: metrics.cost_usd,
        request_id: metrics.request_id,
        user_id: metrics.user_id,
        created_at: metrics.created_at,
      });

    if (error) {
      console.error('[cost-tracking] Failed to log AI usage:', error);
    } else {
      console.log('[cost-tracking] Logged AI usage:', {
        function: metrics.function_name,
        cost: `$${metrics.cost_usd.toFixed(6)}`,
      });
    }
  } catch (error) {
    console.error('[cost-tracking] Error logging AI usage:', error);
    // Don't throw - logging failures shouldn't break the function
  }
}
