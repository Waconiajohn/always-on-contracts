/**
 * AI Usage Logger
 * Logs AI API calls for cost tracking and analytics
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface AIUsageMetrics {
  model: string;
  provider: string;
  function_name: string;
  input_tokens: number;
  output_tokens: number;
  execution_time_ms: number;
  user_id?: string;
}

/**
 * Log AI usage to database for cost tracking
 */
export async function logAIUsage(metrics: AIUsageMetrics): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      console.warn("[aiUsageLogger] Supabase credentials not found, skipping log");
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase.from("ai_usage_metrics").insert({
      model: metrics.model,
      provider: metrics.provider,
      function_name: metrics.function_name,
      input_tokens: metrics.input_tokens,
      output_tokens: metrics.output_tokens,
      execution_time_ms: metrics.execution_time_ms,
      user_id: metrics.user_id,
    });

    if (error) {
      console.error("[aiUsageLogger] Failed to log AI usage:", error);
    } else {
      console.log(`[aiUsageLogger] Logged: ${metrics.function_name} - ${metrics.model} - ${metrics.input_tokens + metrics.output_tokens} tokens`);
    }
  } catch (err) {
    console.error("[aiUsageLogger] Error logging AI usage:", err);
  }
}
