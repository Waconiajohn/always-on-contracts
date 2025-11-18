/**
 * Intelligent Caching Layer for AI Responses
 * Reduces costs and latency through smart caching
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

interface CacheOptions {
  ttlMinutes?: number;
  forceRefresh?: boolean;
}

export class CacheManager {
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor() {
    this.supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    this.supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  }

  /**
   * Generate cache key from input parameters
   */
  private generateCacheKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {} as Record<string, any>);

    const hash = btoa(JSON.stringify(sortedParams)).substring(0, 32);
    return `${prefix}:${hash}`;
  }

  /**
   * Get cached data
   */
  async get<T>(
    prefix: string,
    params: Record<string, any>,
    options: CacheOptions = {}
  ): Promise<T | null> {
    if (options.forceRefresh) {
      return null;
    }

    const supabase = createClient(this.supabaseUrl, this.supabaseKey);
    const cacheKey = this.generateCacheKey(prefix, params);

    const { data, error } = await supabase
      .from('resume_cache')
      .select('cache_data, expires_at, hit_count')
      .eq('cache_key', cacheKey)
      .single();

    if (error || !data) {
      return null;
    }

    // Check if cache is expired
    if (new Date(data.expires_at) < new Date()) {
      // Clean up expired entry
      await supabase.from('resume_cache').delete().eq('cache_key', cacheKey);
      return null;
    }

    // Increment hit count
    await supabase
      .from('resume_cache')
      .update({ hit_count: data.hit_count + 1 })
      .eq('cache_key', cacheKey);

    return data.cache_data as T;
  }

  /**
   * Set cached data
   */
  async set<T>(
    prefix: string,
    params: Record<string, any>,
    data: T,
    options: CacheOptions = {}
  ): Promise<void> {
    const supabase = createClient(this.supabaseUrl, this.supabaseKey);
    const cacheKey = this.generateCacheKey(prefix, params);
    const ttlMinutes = options.ttlMinutes || 60; // Default 1 hour

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + ttlMinutes);

    await supabase
      .from('resume_cache')
      .upsert({
        cache_key: cacheKey,
        cache_data: data,
        expires_at: expiresAt.toISOString(),
        hit_count: 0
      }, {
        onConflict: 'cache_key'
      });
  }

  /**
   * Invalidate cache entry
   */
  async invalidate(prefix: string, params: Record<string, any>): Promise<void> {
    const supabase = createClient(this.supabaseUrl, this.supabaseKey);
    const cacheKey = this.generateCacheKey(prefix, params);

    await supabase.from('resume_cache').delete().eq('cache_key', cacheKey);
  }

  /**
   * Clear all cache for a prefix
   */
  async clearPrefix(prefix: string): Promise<void> {
    const supabase = createClient(this.supabaseUrl, this.supabaseKey);

    await supabase
      .from('resume_cache')
      .delete()
      .like('cache_key', `${prefix}:%`);
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalEntries: number;
    totalHits: number;
    expiredCount: number;
  }> {
    const supabase = createClient(this.supabaseUrl, this.supabaseKey);

    const { count: totalEntries } = await supabase
      .from('resume_cache')
      .select('*', { count: 'exact', head: true });

    const { data: hitData } = await supabase
      .from('resume_cache')
      .select('hit_count');

    const totalHits = hitData?.reduce((sum, entry) => sum + entry.hit_count, 0) || 0;

    const { count: expiredCount } = await supabase
      .from('resume_cache')
      .select('*', { count: 'exact', head: true })
      .lt('expires_at', new Date().toISOString());

    return {
      totalEntries: totalEntries || 0,
      totalHits,
      expiredCount: expiredCount || 0
    };
  }
}

/**
 * Create cache manager instance
 */
export function createCacheManager(): CacheManager {
  return new CacheManager();
}
