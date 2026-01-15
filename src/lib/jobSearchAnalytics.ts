import { supabase } from '@/integrations/supabase/client';

export interface SearchOriginStats {
  origin: string;
  totalSearches: number;
  totalResults: number;
  avgResultsPerSearch: number;
  savedJobsCount: number;
  conversionRate: number;
}

export interface ResumeTitlePerformance {
  title: string;
  timesUsed: number;
  totalResults: number;
  savedJobs: number;
  applications: number;
  successRate: number;
}

export async function getSearchOriginStats(
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<SearchOriginStats[]> {
  let query = supabase
    .from('job_search_sessions')
    .select('search_origin, results_count, id')
    .eq('user_id', userId)
    .eq('status', 'completed');
  
  if (startDate) {
    query = query.gte('created_at', startDate.toISOString());
  }
  if (endDate) {
    query = query.lte('created_at', endDate.toISOString());
  }
  
  const { data: sessions, error } = await query;
  
  if (error || !sessions) return [];
  
  // Group by origin
  const originMap = new Map<string, SearchOriginStats>();
  
  for (const session of sessions) {
    const origin = session.search_origin || 'typed_query';
    
    if (!originMap.has(origin)) {
      originMap.set(origin, {
        origin,
        totalSearches: 0,
        totalResults: 0,
        avgResultsPerSearch: 0,
        savedJobsCount: 0,
        conversionRate: 0
      });
    }
    
    const stats = originMap.get(origin)!;
    stats.totalSearches++;
    stats.totalResults += session.results_count || 0;
  }
  
  // Calculate averages
  for (const stats of originMap.values()) {
    stats.avgResultsPerSearch = stats.totalResults / stats.totalSearches;
  }
  
  return Array.from(originMap.values());
}

export async function getResumeTitlePerformance(
  userId: string
): Promise<ResumeTitlePerformance[]> {
  // Note: DB column is 'vault_title_used' for backward compatibility
  const { data: sessions } = await supabase
    .from('job_search_sessions')
    .select('vault_title_used, results_count, id')
    .eq('user_id', userId)
    .in('search_origin', ['vault_title', 'resume_title'])
    .not('vault_title_used', 'is', null);
  
  if (!sessions) return [];
  
  const titleMap = new Map<string, ResumeTitlePerformance>();
  
  for (const session of sessions) {
    const title = session.vault_title_used!;
    
    if (!titleMap.has(title)) {
      titleMap.set(title, {
        title,
        timesUsed: 0,
        totalResults: 0,
        savedJobs: 0,
        applications: 0,
        successRate: 0
      });
    }
    
    const perf = titleMap.get(title)!;
    perf.timesUsed++;
    perf.totalResults += session.results_count || 0;
  }
  
  // Calculate success rates
  for (const perf of titleMap.values()) {
    perf.successRate = (perf.savedJobs / perf.timesUsed) * 100;
  }
  
  return Array.from(titleMap.values())
    .sort((a, b) => b.successRate - a.successRate);
}
