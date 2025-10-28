import { supabase } from '@/integrations/supabase/client';

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
    const { data: powerPhrases } = await supabase
      .from('vault_power_phrases')
      .select('id, power_phrase')
      .eq('vault_id', vaultId);

    const { data: skills } = await supabase
      .from('vault_confirmed_skills')
      .select('id, skill_name')
      .eq('user_id', vaultId);

    const { data: competencies } = await supabase
      .from('vault_hidden_competencies')
      .select('id, inferred_capability')
      .eq('vault_id', vaultId);

    const allItems = [
      ...(powerPhrases?.map(p => ({ id: p.id, content: p.power_phrase, type: 'power_phrase' })) || []),
      ...(skills?.map(s => ({ id: s.id, content: s.skill_name, type: 'skill' })) || []),
      ...(competencies?.map(c => ({ id: c.id, content: c.inferred_capability, type: 'competency' })) || [])
    ];

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
    const tableName = 
      itemType === 'power_phrase' ? 'vault_power_phrases' :
      itemType === 'skill' ? 'vault_confirmed_skills' :
      'vault_hidden_competencies';

    const { error } = await supabase
      .from(tableName)
      .delete()
      .in('id', deleteItemIds);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error merging items:', error);
    return false;
  }
};
