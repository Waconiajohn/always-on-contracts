import { invokeEdgeFunction } from "@/lib/edgeFunction";
import { supabase } from "@/integrations/supabase/client";

// Simple client-side cache with 5-minute TTL
const auditCache = new Map<string, { data: StrategicAuditResult; expires: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export interface SmartQuestion {
  question: string;
  category: string;
  reasoning: string;
  impact: "high" | "medium" | "low";
  targetTable: string;
}

export interface StrategicGap {
  gapType: string;
  description: string;
  impact: string;
  suggestedEnhancement?: string;
}

export interface StrategicEnhancement {
  table: string;
  data: Record<string, any>;
  reasoning: string;
  strategicValue: string;
  confidence: number;
}

export interface StrategicAuditResult {
  success: boolean;
  smartQuestions: SmartQuestion[];
  strategicGaps: StrategicGap[];
  enhancements: StrategicEnhancement[];
  vaultStrengthBefore: number;
  vaultStrengthAfter: number;
  executiveSummary: string;
  error?: string;
}

/**
 * Runs a strategic audit on a user's career vault to identify gaps and generate smart questions
 * Results are cached for 5 minutes to avoid expensive AI calls on every page load
 */
export async function runVaultStrategicAudit(
  vaultId: string,
  options?: { forceRefresh?: boolean }
): Promise<StrategicAuditResult> {
  // Check cache first (unless force refresh)
  if (!options?.forceRefresh) {
    const cached = auditCache.get(vaultId);
    if (cached && cached.expires > Date.now()) {
      console.log('[vaultStrategicAudit] Using cached result');
      return cached.data;
    }
  }

  console.log('[vaultStrategicAudit] Fetching fresh audit from edge function');
  
  const { data, error } = await invokeEdgeFunction<StrategicAuditResult>(
    'vault-strategic-audit',
    { vaultId }
  );

  if (error || !data) {
    throw new Error(
      error?.message || 'Failed to run strategic audit. Please try again.'
    );
  }

  // Cache the result
  auditCache.set(vaultId, {
    data,
    expires: Date.now() + CACHE_TTL_MS
  });

  return data;
}

/**
 * Submits an answer to a smart question by inserting data into the appropriate vault table
 */
export async function submitSmartQuestionAnswer(
  vaultId: string,
  targetTable: string,
  answer: string,
  question: SmartQuestion
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Map the answer to the appropriate table structure
    let insertData: Record<string, any> = {
      vault_id: vaultId,
      user_id: user.id,
    };

    // Add the answer based on the target table
    // This is a simplified mapping - you may need to adjust based on actual table schemas
    switch (targetTable) {
      case 'vault_power_phrases':
        insertData = {
          ...insertData,
          phrase_text: answer,
          category: question.category,
        };
        break;
      case 'vault_confirmed_skills':
        insertData = {
          ...insertData,
          skill_name: answer,
          proficiency_level: 'advanced',
        };
        break;
      case 'vault_quantified_achievements':
        insertData = {
          ...insertData,
          achievement_text: answer,
        };
        break;
      case 'vault_thought_leadership':
        insertData = {
          ...insertData,
          title: answer.substring(0, 100),
          content_type: 'article',
        };
        break;
      default:
        // Generic fallback for other tables
        insertData = {
          ...insertData,
          content: answer,
        };
    }

    const { error } = await supabase
      .from(targetTable as any)
      .insert(insertData);

    if (error) {
      console.error('Error inserting answer:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Error submitting answer:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error' 
    };
  }
}
