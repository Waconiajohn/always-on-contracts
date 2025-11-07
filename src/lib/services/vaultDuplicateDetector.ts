import { supabase } from '@/integrations/supabase/client';
import { getTableConfig } from '@/lib/constants/vaultTables';

export interface DuplicateGroup {
  items: Array<{
    id: string;
    content: string;
    item_type: string;
    similarity: number;
  }>;
}

// Deprecated: Use cleanup_vault_duplicates RPC function instead
export const findDuplicates = async (): Promise<DuplicateGroup[]> => {
  console.warn('findDuplicates is deprecated. Use cleanup_vault_duplicates RPC instead.');
  return [];
};

export const mergeItems = async (_keepItemId: string, deleteItemIds: string[], itemType: string) => {
  try {
    // Use the centralized table config to get the correct table name
    const config = getTableConfig(itemType);
    if (!config) {
      throw new Error(`Unknown item type: ${itemType}`);
    }

    const { error } = await supabase
      .from(config.name)
      .delete()
      .in('id', deleteItemIds);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error merging items:', error);
    return false;
  }
};
