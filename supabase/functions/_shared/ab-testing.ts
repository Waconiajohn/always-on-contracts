/**
 * A/B Testing Framework for Prompt Optimization
 * Track and compare prompt performance automatically
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface ExperimentResult {
  variantId: string;
  promptContent: string;
  success: boolean;
  latencyMs: number;
  tokenCount: number;
}

export class ABTestingManager {
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor() {
    this.supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    this.supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  }

  /**
   * Get a prompt variant to test (uses weighted random selection)
   */
  async getVariant(experimentName: string): Promise<{
    variantId: string;
    promptContent: string;
  } | null> {
    const supabase = createClient(this.supabaseUrl, this.supabaseKey);

    const { data: variants, error } = await supabase
      .from('prompt_experiments')
      .select('*')
      .eq('experiment_name', experimentName)
      .eq('is_active', true);

    if (error || !variants || variants.length === 0) {
      return null;
    }

    // Weighted random selection based on success rate
    const weights = variants.map(v => {
      const successRate = v.total_count > 0 ? v.success_count / v.total_count : 0.5;
      return successRate * 0.7 + 0.3; // Ensure minimum 30% selection probability
    });

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < variants.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return {
          variantId: variants[i].id,
          promptContent: variants[i].prompt_content
        };
      }
    }

    // Fallback to first variant
    return {
      variantId: variants[0].id,
      promptContent: variants[0].prompt_content
    };
  }

  /**
   * Record experiment result
   */
  async recordResult(result: ExperimentResult): Promise<void> {
    const supabase = createClient(this.supabaseUrl, this.supabaseKey);

    const { data: variant } = await supabase
      .from('prompt_experiments')
      .select('*')
      .eq('id', result.variantId)
      .single();

    if (!variant) {
      return;
    }

    const newTotalCount = variant.total_count + 1;
    const newSuccessCount = variant.success_count + (result.success ? 1 : 0);
    
    // Calculate rolling average latency
    const newAvgLatency = Math.round(
      ((variant.avg_latency_ms * variant.total_count) + result.latencyMs) / newTotalCount
    );

    // Calculate rolling average token count
    const newAvgTokens = Math.round(
      ((variant.avg_token_count * variant.total_count) + result.tokenCount) / newTotalCount
    );

    await supabase
      .from('prompt_experiments')
      .update({
        total_count: newTotalCount,
        success_count: newSuccessCount,
        avg_latency_ms: newAvgLatency,
        avg_token_count: newAvgTokens,
        updated_at: new Date().toISOString()
      })
      .eq('id', result.variantId);
  }

  /**
   * Get experiment statistics
   */
  async getExperimentStats(experimentName: string): Promise<any[]> {
    const supabase = createClient(this.supabaseUrl, this.supabaseKey);

    const { data, error } = await supabase
      .from('prompt_experiments')
      .select('*')
      .eq('experiment_name', experimentName)
      .order('success_count', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map(variant => ({
      variantId: variant.id,
      variantName: variant.prompt_variant,
      totalTests: variant.total_count,
      successRate: variant.total_count > 0 ? variant.success_count / variant.total_count : 0,
      avgLatencyMs: variant.avg_latency_ms,
      avgTokenCount: variant.avg_token_count,
      isActive: variant.is_active
    }));
  }

  /**
   * Activate/deactivate a variant
   */
  async toggleVariant(variantId: string, isActive: boolean): Promise<void> {
    const supabase = createClient(this.supabaseUrl, this.supabaseKey);

    await supabase
      .from('prompt_experiments')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', variantId);
  }

  /**
   * Create new experiment variant
   */
  async createVariant(
    experimentName: string,
    variantName: string,
    promptContent: string
  ): Promise<string> {
    const supabase = createClient(this.supabaseUrl, this.supabaseKey);

    const { data, error } = await supabase
      .from('prompt_experiments')
      .insert({
        experiment_name: experimentName,
        prompt_variant: variantName,
        prompt_content: promptContent,
        is_active: true
      })
      .select('id')
      .single();

    if (error || !data) {
      throw new Error('Failed to create variant');
    }

    return data.id;
  }
}

export function createABTestingManager(): ABTestingManager {
  return new ABTestingManager();
}
