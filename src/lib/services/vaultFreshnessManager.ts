import { supabase } from '@/integrations/supabase/client';
import { logActivity } from './vaultTracking';
import { VAULT_TABLE_NAMES, getTableConfig } from '@/lib/constants/vaultTables';

export interface StaleItem {
  id: string;
  content: string;
  item_type: string;
  last_updated_at: string;
  age_days: number;
}

export const getStaleItems = async (vaultId: string, daysThreshold: number = 180): Promise<StaleItem[]> => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);

    // Fetch items from all 10 vault tables dynamically
    const fetchPromises = VAULT_TABLE_NAMES.map(async (tableName) => {
      const config = getTableConfig(tableName);
      if (!config) return [];
      
      const idFieldValue = config.idField === 'user_id' ? vaultId : vaultId;
      
      const { data, error } = await supabase
        .from(config.name)
        .select(`id, ${config.contentField}, ${config.timestampField}`)
        .eq(config.idField, idFieldValue);

      if (error) {
        console.error(`Error fetching ${tableName}:`, error);
        return [];
      }

      return (data || [])
        .filter((item: any) => {
          const timestamp = item[config.timestampField];
          if (!timestamp) return false;
          const lastUpdated = new Date(timestamp);
          return lastUpdated < cutoffDate;
        })
        .map((item: any) => {
          const timestamp = item[config.timestampField];
          const lastUpdated = new Date(timestamp);
          const ageDays = Math.floor((Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
          
          return {
            id: item.id,
            content: item[config.contentField] || '',
            item_type: tableName,
            last_updated_at: timestamp,
            age_days: ageDays,
          };
        });
    });

    const results = await Promise.all(fetchPromises);
    const allItems = results.flat();

    return allItems.sort((a, b) => b.age_days - a.age_days);
  } catch (error) {
    console.error('Error getting stale items:', error);
    return [];
  }
};

export const refreshItem = async (itemId: string, itemType: string, vaultId: string) => {
  try {
    const config = getTableConfig(itemType);
    if (!config) {
      throw new Error(`Unknown item type: ${itemType}`);
    }

    // Only update if the table has a last_updated_at field (not all do)
    if (config.timestampField === 'last_updated_at') {
      const { error } = await supabase
        .from(config.name)
        .update({ last_updated_at: new Date().toISOString() })
        .eq('id', itemId);

      if (error) throw error;
    }

    await logActivity({
      vaultId,
      activityType: 'strength_score_change',
      description: `Refreshed ${config.displayName}`,
      metadata: { item_id: itemId }
    });

    return true;
  } catch (error) {
    console.error('Error refreshing item:', error);
    return false;
  }
};
