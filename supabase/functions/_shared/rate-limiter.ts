/**
 * Rate Limiting & Quota Management
 * Enforces per-user rate limits and subscription quotas
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { AIError } from './error-handling.ts';

interface QuotaLimits {
  tier: 'free' | 'pro' | 'enterprise';
  monthlyRequestLimit: number;
  dailyRequestLimit: number;
  monthlyCostLimitUsd: number;
}

const TIER_LIMITS: Record<string, QuotaLimits> = {
  free: {
    tier: 'free',
    monthlyRequestLimit: 100,
    dailyRequestLimit: 20,
    monthlyCostLimitUsd: 5.00
  },
  pro: {
    tier: 'pro',
    monthlyRequestLimit: 1000,
    dailyRequestLimit: 200,
    monthlyCostLimitUsd: 50.00
  },
  enterprise: {
    tier: 'enterprise',
    monthlyRequestLimit: 10000,
    dailyRequestLimit: 2000,
    monthlyCostLimitUsd: 500.00
  }
};

export class RateLimiter {
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor() {
    this.supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    this.supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  }

  /**
   * Check if user can make a request
   */
  async checkLimit(userId: string, functionName: string): Promise<{ allowed: boolean; reason?: string; retryAfter?: number }> {
    const supabase = createClient(this.supabaseUrl, this.supabaseKey);

    // Get user quota
    const { data: quota, error: quotaError } = await supabase
      .from('user_quotas')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (quotaError || !quota) {
      // No quota found, create default
      const { error: createError } = await supabase
        .from('user_quotas')
        .insert({
          user_id: userId,
          tier: 'free',
          monthly_request_limit: 100,
          daily_request_limit: 20
        });

      if (createError) {
        console.error('Failed to create quota:', createError);
        return { allowed: true }; // Allow on error
      }

      return { allowed: true };
    }

    // Check monthly quota
    if (quota.monthly_request_count >= quota.monthly_request_limit) {
      const daysUntilReset = Math.ceil((new Date(quota.reset_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return {
        allowed: false,
        reason: `Monthly quota exceeded (${quota.monthly_request_limit} requests). Resets in ${daysUntilReset} days.`,
        retryAfter: daysUntilReset * 24 * 60 * 60
      };
    }

    // Check cost limit
    if (quota.monthly_cost_limit_usd && quota.monthly_cost_spent_usd >= quota.monthly_cost_limit_usd) {
      return {
        allowed: false,
        reason: `Monthly budget exceeded ($${quota.monthly_cost_limit_usd}). Please upgrade or add credits.`,
      };
    }

    // Check daily rate limit (rolling 24h window)
    const { count } = await supabase
      .from('api_rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (count && count >= quota.daily_request_limit) {
      return {
        allowed: false,
        reason: `Daily rate limit exceeded (${quota.daily_request_limit} requests per 24h).`,
        retryAfter: 3600 // 1 hour
      };
    }

    return { allowed: true };
  }

  /**
   * Record a request
   */
  async recordRequest(userId: string, functionName: string): Promise<void> {
    const supabase = createClient(this.supabaseUrl, this.supabaseKey);

    // Record in rate limits table
    await supabase
      .from('api_rate_limits')
      .insert({
        user_id: userId,
        function_name: functionName,
        request_count: 1
      });

    // Increment quota counter
    const { error: rpcError } = await supabase.rpc('increment_user_quota', { 
      p_user_id: userId 
    });
    
    if (rpcError) {
      // Fallback: manual update if RPC doesn't exist
      console.warn('RPC increment_user_quota failed, skipping quota update:', rpcError);
    }
  }

  /**
   * Record cost (call after successful AI request)
   */
  async recordCost(userId: string, costUsd: number): Promise<void> {
    const supabase = createClient(this.supabaseUrl, this.supabaseKey);

    // Get current cost and add to it
    const { data: currentQuota } = await supabase
      .from('user_quotas')
      .select('monthly_cost_spent_usd')
      .eq('user_id', userId)
      .single();

    const newCost = (currentQuota?.monthly_cost_spent_usd || 0) + costUsd;

    await supabase
      .from('user_quotas')
      .update({ monthly_cost_spent_usd: newCost })
      .eq('user_id', userId);
  }

  /**
   * Get user quota status
   */
  async getQuotaStatus(userId: string): Promise<any> {
    const supabase = createClient(this.supabaseUrl, this.supabaseKey);

    const { data, error } = await supabase
      .from('user_quota_status')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Failed to get quota status:', error);
      return null;
    }

    return data;
  }
}

/**
 * Middleware to enforce rate limits
 */
export async function enforceRateLimit(
  userId: string,
  functionName: string
): Promise<void> {
  const rateLimiter = new RateLimiter();
  const check = await rateLimiter.checkLimit(userId, functionName);

  if (!check.allowed) {
    throw new AIError(
      check.reason || 'Rate limit exceeded',
      'RATE_LIMIT',
      429,
      false,
      check.reason,
      check.retryAfter
    );
  }

  await rateLimiter.recordRequest(userId, functionName);
}

/**
 * Simple rate limit check (compatible with ai-function-wrapper)
 */
export async function checkRateLimit(
  userId: string,
  functionName: string,
  maxPerMinute: number = 10
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const rateLimiter = new RateLimiter();
  const check = await rateLimiter.checkLimit(userId, functionName);

  return {
    allowed: check.allowed,
    retryAfter: check.retryAfter
  };
}

export { TIER_LIMITS };
