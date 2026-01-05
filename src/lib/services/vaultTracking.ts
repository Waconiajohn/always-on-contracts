import { supabase } from '@/integrations/supabase/client';

// =============================================================================
// VAULT TRACKING SERVICE
// Consolidated from vaultActivityLogger.ts + vaultTelemetry.ts
// =============================================================================

// -----------------------------------------------------------------------------
// Activity Logging (vault_activity_log table)
// -----------------------------------------------------------------------------

export type ActivityType = 
  | 'document_upload' 
  | 'intelligence_extracted' 
  | 'interview_progress' 
  | 'strength_score_change'
  | 'milestone_reached';

interface LogActivityParams {
  vaultId: string;
  activityType: ActivityType;
  description: string;
  metadata?: Record<string, any>;
}

export const logActivity = async ({
  vaultId,
  activityType,
  description,
  metadata = {}
}: LogActivityParams) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('vault_activity_log')
      .insert({
        user_id: user.id,
        vault_id: vaultId,
        activity_type: activityType,
        description,
        metadata
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error logging vault activity:', error);
  }
};

export const getRecentActivities = async (vaultId: string, limit: number = 7) => {
  try {
    const { data, error } = await supabase
      .from('vault_activity_log')
      .select('*')
      .eq('vault_id', vaultId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching vault activities:', error);
    return [];
  }
};

// -----------------------------------------------------------------------------
// Telemetry Tracking (linkedin_usage_telemetry table)
// -----------------------------------------------------------------------------

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
