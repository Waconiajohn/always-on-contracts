import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Eye, MessageSquare, Share2, Target } from "lucide-react";

interface SeriesStats {
  seriesTitle: string;
  totalPosts: number;
  avgEngagement: number;
  topPerformingPost: any;
  vaultItemsUsed: number;
  nextTopicSuggestion: string;
}

interface SeriesPerformanceTrackerProps {
  seriesId?: string;
}

export function SeriesPerformanceTracker({ seriesId }: SeriesPerformanceTrackerProps) {
  const [stats, setStats] = useState<SeriesStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (seriesId) {
      fetchSeriesStats();
    }
  }, [seriesId]);

  const fetchSeriesStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch series and posts
      const { data: series } = await supabase
        .from('linkedin_series')
        .select('*')
        .eq('id', seriesId!)
        .single();

      const { data: posts } = await supabase
        .from('linkedin_posts')
        .select('*')
        .eq('series_id', seriesId!)
        .eq('user_id', user.id);

      if (!series || !posts) return;

      // Calculate engagement (mock for now, would use actual metrics later)
      const avgEngagement = Math.round(Math.random() * 500 + 100);
      
      // Find top post
      const topPost = posts.reduce((max: any, post: any) => {
        const postScore = Math.random() * 1000; // Mock score
        return postScore > (max?.score || 0) ? { ...post, score: postScore } : max;
      }, null);

      // Count vault items used
      const { data: vaultUsage } = await supabase
        .from('feature_vault_usage')
        .select('*')
        .eq('user_id', user.id)
        .eq('feature_name', 'blog_post')
        .in('feature_record_id', posts.map(p => p.id));

      setStats({
        seriesTitle: series.series_title,
        totalPosts: posts.length,
        avgEngagement,
        topPerformingPost: topPost,
        vaultItemsUsed: vaultUsage?.length || 0,
        nextTopicSuggestion: "Based on engagement, consider diving deeper into [topic]"
      });
    } catch (error) {
      console.error('Error fetching series stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;
  if (!stats) return (
    <Card>
      <CardContent className="py-8 text-center text-muted-foreground">
        No series selected
      </CardContent>
    </Card>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Series Performance
        </CardTitle>
        <CardDescription>{stats.seriesTitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-primary/5 rounded-lg text-center">
            <p className="text-2xl font-bold">{stats.totalPosts}</p>
            <p className="text-xs text-muted-foreground">Posts Published</p>
          </div>
          <div className="p-3 bg-green-500/5 rounded-lg text-center">
            <p className="text-2xl font-bold">{stats.avgEngagement}</p>
            <p className="text-xs text-muted-foreground">Avg. Engagement</p>
          </div>
        </div>

        {stats.topPerformingPost && (
          <div className="p-3 border rounded-lg">
            <div className="flex items-start justify-between mb-2">
              <Badge variant="secondary">Top Performer</Badge>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {Math.round(Math.random() * 1000)}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {Math.round(Math.random() * 50)}
                </span>
                <span className="flex items-center gap-1">
                  <Share2 className="h-3 w-3" />
                  {Math.round(Math.random() * 20)}
                </span>
              </div>
            </div>
            <p className="text-sm line-clamp-2">
              {stats.topPerformingPost.content?.slice(0, 100)}...
            </p>
          </div>
        )}

        <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <div className="flex gap-2">
            <Target className="h-4 w-4 text-blue-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Career Vault Integration</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.vaultItemsUsed} vault items used across series
              </p>
            </div>
          </div>
        </div>

        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-1">💡 Next Topic Suggestion</p>
          <p className="text-xs text-muted-foreground">
            {stats.nextTopicSuggestion}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
