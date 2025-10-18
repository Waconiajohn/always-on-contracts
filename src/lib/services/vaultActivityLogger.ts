import { supabase } from '@/integrations/supabase/client';

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
