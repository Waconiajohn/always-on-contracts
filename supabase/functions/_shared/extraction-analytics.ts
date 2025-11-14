import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Extraction Analytics Service
 * Tracks success rates, performance metrics, and error patterns
 */

export interface ExtractionMetrics {
  totalExtractions: number;
  successfulExtractions: number;
  failedExtractions: number;
  successRate: number;
  averageDuration: number;
  averageItemsExtracted: number;
  commonErrors: Array<{
    error_code: string;
    count: number;
    lastOccurrence: string;
  }>;
  performanceByPhase: Array<{
    phase: string;
    avgDuration: number;
    successRate: number;
  }>;
}

export class ExtractionAnalytics {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Get overall extraction metrics for a time period
   */
  async getMetrics(days: number = 7): Promise<ExtractionMetrics> {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    // Get successful extractions
    const { data: vaults, error: vaultsError } = await this.supabase
      .from('career_vault')
      .select('extraction_item_count, created_at')
      .eq('auto_populated', true)
      .gte('extraction_timestamp', sinceDate.toISOString());

    if (vaultsError) {
      console.error('Error fetching vault metrics:', vaultsError);
      return this.getEmptyMetrics();
    }

    // Get errors
    const { data: errors, error: errorsError } = await this.supabase
      .from('extraction_errors')
      .select('error_code, phase, created_at')
      .gte('created_at', sinceDate.toISOString());

    if (errorsError) {
      console.error('Error fetching error metrics:', errorsError);
    }

    // Get progress data for phase analysis
    const { data: progressData, error: progressError } = await this.supabase
      .from('extraction_progress')
      .select('phase, percentage, duration_ms, updated_at')
      .gte('updated_at', sinceDate.toISOString())
      .order('updated_at', { ascending: false });

    if (progressError) {
      console.error('Error fetching progress metrics:', progressError);
    }

    // Calculate metrics
    const totalExtractions = (vaults?.length || 0) + (errors?.length || 0);
    const successfulExtractions = vaults?.length || 0;
    const failedExtractions = errors?.length || 0;
    const successRate = totalExtractions > 0 
      ? (successfulExtractions / totalExtractions) * 100 
      : 0;

    // Average items extracted
    const averageItemsExtracted = vaults?.length > 0
      ? vaults.reduce((sum, v) => sum + (v.extraction_item_count || 0), 0) / vaults.length
      : 0;

    // Common errors
    const errorCounts = new Map<string, { count: number; lastOccurrence: string }>();
    errors?.forEach(err => {
      const existing = errorCounts.get(err.error_code) || { count: 0, lastOccurrence: err.created_at };
      errorCounts.set(err.error_code, {
        count: existing.count + 1,
        lastOccurrence: err.created_at > existing.lastOccurrence ? err.created_at : existing.lastOccurrence
      });
    });

    const commonErrors = Array.from(errorCounts.entries())
      .map(([error_code, data]) => ({
        error_code,
        count: data.count,
        lastOccurrence: data.lastOccurrence
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Performance by phase
    const phaseMetrics = new Map<string, { durations: number[]; total: number; success: number }>();
    progressData?.forEach(progress => {
      if (!phaseMetrics.has(progress.phase)) {
        phaseMetrics.set(progress.phase, { durations: [], total: 0, success: 0 });
      }
      const metrics = phaseMetrics.get(progress.phase)!;
      metrics.durations.push(progress.duration_ms || 0);
      metrics.total++;
      if (progress.percentage >= 100) metrics.success++;
    });

    const performanceByPhase = Array.from(phaseMetrics.entries())
      .map(([phase, metrics]) => ({
        phase,
        avgDuration: metrics.durations.reduce((a, b) => a + b, 0) / metrics.durations.length,
        successRate: (metrics.success / metrics.total) * 100
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration);

    return {
      totalExtractions,
      successfulExtractions,
      failedExtractions,
      successRate,
      averageDuration: 0, // Would need separate tracking
      averageItemsExtracted,
      commonErrors,
      performanceByPhase
    };
  }

  /**
   * Log extraction start
   */
  async logExtractionStart(vaultId: string, metadata: Record<string, any>) {
    await this.supabase
      .from('extraction_progress')
      .upsert({
        vault_id: vaultId,
        phase: 'started',
        percentage: 0,
        message: 'Extraction started',
        metadata
      });
  }

  /**
   * Log extraction success
   */
  async logExtractionSuccess(
    vaultId: string, 
    totalItems: number, 
    durationMs: number
  ) {
    await this.supabase
      .from('extraction_progress')
      .upsert({
        vault_id: vaultId,
        phase: 'complete',
        percentage: 100,
        message: `Extracted ${totalItems} items`,
        items_extracted: totalItems,
        duration_ms: durationMs
      });
  }

  private getEmptyMetrics(): ExtractionMetrics {
    return {
      totalExtractions: 0,
      successfulExtractions: 0,
      failedExtractions: 0,
      successRate: 0,
      averageDuration: 0,
      averageItemsExtracted: 0,
      commonErrors: [],
      performanceByPhase: []
    };
  }
}

/**
 * Create an analytics instance
 */
export function createAnalytics(supabase: SupabaseClient): ExtractionAnalytics {
  return new ExtractionAnalytics(supabase);
}
