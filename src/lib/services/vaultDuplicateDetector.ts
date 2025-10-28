import { supabase } from '@/integrations/supabase/client';
import { VAULT_TABLE_NAMES, getTableConfig } from '@/lib/constants/vaultTables';

export interface DuplicateGroup {
  items: Array<{
    id: string;
    content: string;
    item_type: string;
    similarity: number;
  }>;
}

// Simple Levenshtein distance algorithm
const levenshteinDistance = (str1: string, str2: string): number => {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j - 1] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j] + 1
        );
      }
    }
  }

  return dp[m][n];
};

const calculateSimilarity = (str1: string, str2: string): number => {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 100;
  
  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);
  const similarity = ((maxLength - distance) / maxLength) * 100;
  
  return Math.round(similarity);
};

export const findDuplicates = async (vaultId: string, similarityThreshold: number = 85): Promise<DuplicateGroup[]> => {
  try {
    // Fetch items from all 10 vault tables dynamically
    const fetchPromises = VAULT_TABLE_NAMES.map(async (tableName) => {
      const config = getTableConfig(tableName);
      if (!config) return [];
      
      const idFieldValue = config.idField === 'user_id' ? vaultId : vaultId;
      
      const { data } = await supabase
        .from(config.name)
        .select(`id, ${config.contentField}`)
        .eq(config.idField, idFieldValue);

      return (data || []).map((item: any) => ({
        id: item.id,
        content: item[config.contentField] || '',
        type: tableName,
      }));
    });

    const results = await Promise.all(fetchPromises);
    const allItems = results.flat();

    const duplicateGroups: DuplicateGroup[] = [];
    const processed = new Set<string>();

    for (let i = 0; i < allItems.length; i++) {
      if (processed.has(allItems[i].id)) continue;

      const group: DuplicateGroup = { items: [] };
      
      for (let j = i + 1; j < allItems.length; j++) {
        if (processed.has(allItems[j].id)) continue;

        const similarity = calculateSimilarity(allItems[i].content, allItems[j].content);
        
        if (similarity >= similarityThreshold) {
          if (group.items.length === 0) {
            group.items.push({
              id: allItems[i].id,
              content: allItems[i].content,
              item_type: allItems[i].type,
              similarity: 100
            });
            processed.add(allItems[i].id);
          }
          
          group.items.push({
            id: allItems[j].id,
            content: allItems[j].content,
            item_type: allItems[j].type,
            similarity
          });
          processed.add(allItems[j].id);
        }
      }

      if (group.items.length > 1) {
        duplicateGroups.push(group);
      }
    }

    return duplicateGroups;
  } catch (error) {
    console.error('Error finding duplicates:', error);
    return [];
  }
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
