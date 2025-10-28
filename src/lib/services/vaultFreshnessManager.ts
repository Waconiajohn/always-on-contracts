import { supabase } from '@/integrations/supabase/client';
import { logActivity } from './vaultActivityLogger';

export interface StaleItem {
  id: string;
  content: string;
  item_type: string;
  last_updated_at: string;
  age_days: number;
}

export const getStaleItems = async (vaultId: string, daysThreshold: number = 180): Promise<StaleItem[]> => {
  try {
    const { data: powerPhrases, error: ppError } = await supabase
      .from('vault_power_phrases')
      .select('id, power_phrase, last_updated_at')
      .eq('vault_id', vaultId);

    const { data: skills, error: skillsError } = await supabase
      .from('vault_confirmed_skills')
      .select('id, skill_name, last_updated_at')
      .eq('user_id', vaultId);

    const { data: competencies, error: compError } = await supabase
      .from('vault_hidden_competencies')
      .select('id, inferred_capability, last_updated_at')
      .eq('vault_id', vaultId);

    if (ppError || skillsError || compError) {
      throw new Error('Error fetching vault items');
    }

    const allItems: StaleItem[] = [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);

    // Process power phrases
    powerPhrases?.forEach(item => {
      const lastUpdated = new Date(item.last_updated_at);
      if (lastUpdated < cutoffDate) {
        const ageDays = Math.floor((Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
        allItems.push({
          id: item.id,
          content: item.power_phrase,
          item_type: 'power_phrase',
          last_updated_at: item.last_updated_at,
          age_days: ageDays
        });
      }
    });

    // Process skills
    skills?.forEach(item => {
      const lastUpdated = new Date(item.last_updated_at);
      if (lastUpdated < cutoffDate) {
        const ageDays = Math.floor((Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
        allItems.push({
          id: item.id,
          content: item.skill_name,
          item_type: 'skill',
          last_updated_at: item.last_updated_at,
          age_days: ageDays
        });
      }
    });

    // Process competencies
    competencies?.forEach(item => {
      const lastUpdated = new Date(item.last_updated_at);
      if (lastUpdated < cutoffDate) {
        const ageDays = Math.floor((Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
        allItems.push({
          id: item.id,
          content: item.inferred_capability,
          item_type: 'competency',
          last_updated_at: item.last_updated_at,
          age_days: ageDays
        });
      }
    });

    return allItems.sort((a, b) => b.age_days - a.age_days);
  } catch (error) {
    console.error('Error getting stale items:', error);
    return [];
  }
};

export const refreshItem = async (itemId: string, itemType: string, vaultId: string) => {
  try {
    const tableName = 
      itemType === 'power_phrase' ? 'vault_power_phrases' :
      itemType === 'skill' ? 'vault_confirmed_skills' :
      'vault_hidden_competencies';

    const { error } = await supabase
      .from(tableName)
      .update({ last_updated_at: new Date().toISOString() })
      .eq('id', itemId);

    if (error) throw error;

    await logActivity({
      vaultId,
      activityType: 'strength_score_change',
      description: `Refreshed ${itemType}`,
      metadata: { item_id: itemId }
    });

    return true;
  } catch (error) {
    console.error('Error refreshing item:', error);
    return false;
  }
};
