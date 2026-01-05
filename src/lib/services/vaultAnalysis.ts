import { supabase } from '@/integrations/supabase/client';
import { invokeEdgeFunction } from "@/lib/edgeFunction";

// =============================================================================
// VAULT ANALYSIS SERVICE
// Consolidated from vaultRecommendations.ts + vaultStrategicAudit.ts
// =============================================================================

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface VaultRecommendation {
  id: string;
  title: string;
  description: string;
  action: string;
  impact: 'high' | 'medium' | 'low';
  timeEstimate: string;
  scoreBoost: number;
  icon: string;
  category: 'verification' | 'metrics' | 'freshness' | 'consolidation';
}

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

// -----------------------------------------------------------------------------
// Cache for Strategic Audit (5-minute TTL)
// -----------------------------------------------------------------------------

const auditCache = new Map<string, { data: StrategicAuditResult; expires: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// -----------------------------------------------------------------------------
// Vault Recommendations (heuristic-based)
// -----------------------------------------------------------------------------

export const getVaultRecommendations = async (vaultId: string): Promise<VaultRecommendation[]> => {
  const recommendations: VaultRecommendation[] = [];

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Count assumed items
    const { data: powerPhrases } = await supabase
      .from('vault_power_phrases')
      .select('id, quality_tier')
      .eq('vault_id', vaultId);

    const { data: skills } = await supabase
      .from('vault_transferable_skills')
      .select('id, quality_tier')
      .eq('vault_id', vaultId);

    const { data: competencies } = await supabase
      .from('vault_hidden_competencies')
      .select('id, quality_tier')
      .eq('vault_id', vaultId);

    const assumedCount = 
      (powerPhrases?.filter(p => !p.quality_tier || p.quality_tier === 'assumed').length || 0) +
      (skills?.filter(s => !s.quality_tier || s.quality_tier === 'assumed').length || 0) +
      (competencies?.filter(c => !c.quality_tier || c.quality_tier === 'assumed').length || 0);

    if (assumedCount > 0) {
      recommendations.push({
        id: 'verify-assumed',
        title: `Verify ${assumedCount} AI-Assumed Items`,
        description: 'Quick quiz to upgrade quality from "Assumed" to "Gold"',
        action: 'Start Verification Quiz',
        impact: 'high',
        timeEstimate: '5 minutes',
        scoreBoost: Math.min(assumedCount * 2, 25),
        icon: '🎯',
        category: 'verification'
      });
    }

    // Check for items without metrics
    const phrasesWithoutMetrics = powerPhrases?.filter(p => 
      !p.quality_tier || 
      !(p as any).impact_metrics || 
      Object.keys((p as any).impact_metrics || {}).length === 0
    ).length || 0;

    if (phrasesWithoutMetrics > 5) {
      recommendations.push({
        id: 'add-metrics',
        title: `Add Metrics to ${phrasesWithoutMetrics} Achievements`,
        description: 'Quantify your impact with numbers and percentages',
        action: 'Add Metrics',
        impact: 'high',
        timeEstimate: '10 minutes',
        scoreBoost: Math.min(phrasesWithoutMetrics, 15),
        icon: '📊',
        category: 'metrics'
      });
    }

    // Check for stale items (>6 months old)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const staleItems = [
      ...(powerPhrases?.filter(p => 
        !(p as any).last_updated_at || 
        new Date((p as any).last_updated_at) < sixMonthsAgo
      ) || []),
      ...(skills?.filter(s => 
        !(s as any).last_updated_at || 
        new Date((s as any).last_updated_at) < sixMonthsAgo
      ) || []),
    ];

    if (staleItems.length > 10) {
      recommendations.push({
        id: 'refresh-stale',
        title: `Update ${staleItems.length} Stale Items`,
        description: 'Review and modernize items older than 6 months',
        action: 'Refresh Items',
        impact: 'medium',
        timeEstimate: '15 minutes',
        scoreBoost: Math.min(staleItems.length, 12),
        icon: '🔄',
        category: 'freshness'
      });
    }

    // Check for potential duplicates (basic check)
    const allContent = [
      ...(powerPhrases?.map(p => (p as any).power_phrase?.toLowerCase()) || []),
      ...(skills?.map(s => (s as any).stated_skill?.toLowerCase()) || []),
    ].filter(Boolean);

    const uniqueContent = new Set(allContent);
    const duplicateCount = allContent.length - uniqueContent.size;

    if (duplicateCount > 3) {
      recommendations.push({
        id: 'consolidate-duplicates',
        title: `Merge ${duplicateCount} Duplicate Items`,
        description: 'Consolidate similar entries to maintain quality',
        action: 'Review Duplicates',
        impact: 'low',
        timeEstimate: '5 minutes',
        scoreBoost: duplicateCount,
        icon: '🔗',
        category: 'consolidation'
      });
    }

    // Sort by impact and score boost
    const impactOrder = { high: 3, medium: 2, low: 1 };
    recommendations.sort((a, b) => {
      const impactDiff = impactOrder[b.impact] - impactOrder[a.impact];
      return impactDiff !== 0 ? impactDiff : b.scoreBoost - a.scoreBoost;
    });

    return recommendations;
  } catch (error) {
    console.error('Error generating vault recommendations:', error);
    return [];
  }
};

// -----------------------------------------------------------------------------
// Strategic Audit (AI-powered via edge function)
// -----------------------------------------------------------------------------

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
    { vaultId, forceRefresh: options?.forceRefresh }
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

// -----------------------------------------------------------------------------
// Comprehensive Analysis (combines both)
// -----------------------------------------------------------------------------

export async function getComprehensiveVaultAnalysis(vaultId: string) {
  const [recommendations, audit] = await Promise.all([
    getVaultRecommendations(vaultId),
    runVaultStrategicAudit(vaultId).catch(() => null)
  ]);
  
  return { recommendations, audit };
}
