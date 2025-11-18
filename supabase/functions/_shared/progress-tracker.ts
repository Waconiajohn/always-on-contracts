import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

/**
 * Real-time progress tracker for extraction operations
 * Enables streaming progress updates to the frontend
 */
export class ProgressTracker {
  private vaultId: string;
  private supabase: SupabaseClient;
  private startTime: number;

  constructor(vaultId: string, supabase: SupabaseClient<any, any, any>) {
    this.vaultId = vaultId;
    this.supabase = supabase;
    this.startTime = Date.now();
  }

  /**
   * Update progress in database (triggers realtime notification)
   */
  async updateProgress(
    phase: string,
    percentage: number,
    message: string,
    itemsExtracted?: number
  ): Promise<void> {
    try {
      const durationMs = Date.now() - this.startTime;
      
      await this.supabase
        .from('extraction_progress')
        .upsert({
          vault_id: this.vaultId,
          phase,
          percentage: Math.min(100, Math.max(0, percentage)),
          message,
          items_extracted: itemsExtracted || 0,
          duration_ms: durationMs,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'vault_id',
          ignoreDuplicates: false
        });

      console.log(JSON.stringify({
        event: 'progress_update',
        vault_id: this.vaultId,
        phase,
        percentage,
        message,
        duration_ms: durationMs
      }));
    } catch (error) {
      console.error('Failed to update progress:', error);
      // Don't throw - progress tracking shouldn't break extraction
    }
  }

  /**
   * Save checkpoint for recovery
   */
  async saveCheckpoint(phase: string, data: Record<string, any>): Promise<void> {
    try {
      await this.supabase
        .from('extraction_checkpoints')
        .insert({
          vault_id: this.vaultId,
          phase,
          checkpoint_data: data
        });
      
      console.log(`Checkpoint saved: ${phase}`);
    } catch (error) {
      console.error('Failed to save checkpoint:', error);
    }
  }

  /**
   * Load latest checkpoint for recovery
   */
  async loadCheckpoint(phase: string): Promise<Record<string, any> | null> {
    try {
      const { data, error } = await this.supabase
        .from('extraction_checkpoints')
        .select('checkpoint_data')
        .eq('vault_id', this.vaultId)
        .eq('phase', phase)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return null;
      
      return data.checkpoint_data as Record<string, any>;
    } catch (error) {
      console.error('Failed to load checkpoint:', error);
      return null;
    }
  }

  /**
   * Mark extraction as complete
   */
  async complete(totalItems: number): Promise<void> {
    await this.updateProgress('complete', 100, `Extraction complete! Extracted ${totalItems} items`, totalItems);
  }

  /**
   * Log error for debugging
   */
  async logError(
    phase: string,
    error: Error,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await this.supabase
        .from('extraction_errors')
        .insert({
          vault_id: this.vaultId,
          phase,
          error_code: error.name,
          error_message: error.message,
          error_stack: error.stack,
          metadata: metadata || {}
        });

      console.error(JSON.stringify({
        event: 'extraction_error',
        vault_id: this.vaultId,
        phase,
        error: error.message,
        metadata
      }));
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }
}
