import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp } from 'lucide-react';
import { getSearchOriginStats, type SearchOriginStats } from '@/lib/jobSearchAnalytics';

interface SearchAnalyticsWidgetProps {
  userId: string | null;
}

export const SearchAnalyticsWidget = ({ userId }: SearchAnalyticsWidgetProps) => {
  const [stats, setStats] = useState<SearchOriginStats[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!userId) return;
    
    const loadStats = async () => {
      try {
        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 30);
        
        const data = await getSearchOriginStats(userId, last30Days);
        setStats(data);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadStats();
  }, [userId]);
  
  if (!userId || loading) return null;
  
  // Note: DB stores 'vault_title' for backward compatibility, but UI shows "Master Resume"
  const resumeStats = stats.find(s => s.origin === 'vault_title' || s.origin === 'resume_title');
  const typedStats = stats.find(s => s.origin === 'typed_query');
  
  if (!resumeStats && !typedStats) return null;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Search Performance (Last 30 Days)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {resumeStats && (
          <div className="flex items-center justify-between text-xs">
            <span>Master Resume-powered searches:</span>
            <span className="font-semibold">{resumeStats.totalSearches}</span>
          </div>
        )}
        {typedStats && (
          <div className="flex items-center justify-between text-xs">
            <span>Manual searches:</span>
            <span className="font-semibold">{typedStats.totalSearches}</span>
          </div>
        )}
        {resumeStats && typedStats && resumeStats.avgResultsPerSearch > typedStats.avgResultsPerSearch && (
          <div className="flex items-center gap-2 text-xs text-green-600">
            <TrendingUp className="h-3 w-3" />
            <span>Master Resume searches find {Math.round(resumeStats.avgResultsPerSearch - typedStats.avgResultsPerSearch)} more jobs on average</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
