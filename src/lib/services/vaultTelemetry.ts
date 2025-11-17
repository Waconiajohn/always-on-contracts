import { supabase } from "@/integrations/supabase/client";

/**
 * Track Career Vault feature usage and interactions for analytics
 */
export async function trackVaultTelemetry(params: {
  featureName: string;
  action: string;
  metadata?: Record<string, any>;
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('linkedin_usage_telemetry').insert({
      user_id: user.id,
      action_type: params.action,
      content_type: params.featureName,
      metadata: params.metadata || {}
    });
  } catch (error) {
    // Silent fail - telemetry shouldn't break user experience
    console.warn('[Telemetry] Failed to track:', error);
  }
}

/**
 * Track Smart Question interactions
 */
export async function trackSmartQuestion(params: {
  action: 'answered' | 'skipped' | 'snoozed' | 'viewed';
  questionCategory: string;
  questionImpact: string;
  vaultId?: string;
}) {
  await trackVaultTelemetry({
    featureName: 'smart_questions',
    action: params.action,
    metadata: {
      category: params.questionCategory,
      impact: params.questionImpact,
      vault_id: params.vaultId
    }
  });
}
