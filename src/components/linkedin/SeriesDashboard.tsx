import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSeriesManagement } from "@/hooks/useSeriesManagement";
import { Loader2, Trash2, Plus, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { format } from "date-fns";

export function SeriesDashboard({ onGeneratePost }: { onGeneratePost?: (seriesId: string, partNumber: number) => void }) {
  const { series, loading, deleteSeries, getSeriesPostsCount } = useSeriesManagement();
  const [postsCount, setPostsCount] = useState<Record<string, number>>({});

  useEffect(() => {
    const loadPostsCounts = async () => {
      const counts: Record<string, number> = {};
      for (const s of series) {
        counts[s.id] = await getSeriesPostsCount(s.id);
      }
      setPostsCount(counts);
    };

    if (series.length > 0) {
      loadPostsCounts();
    }
  }, [series, getSeriesPostsCount]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (series.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Series Yet</CardTitle>
          <CardDescription>Create your first blog series to get started</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {series.map((s) => {
        const completed = postsCount[s.id] || 0;
        const progress = (completed / s.series_length) * 100;
        const nextPart = completed + 1;
        const canGenerateNext = nextPart <= s.series_length;

        return (
          <Card key={s.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{s.series_title}</CardTitle>
                  <CardDescription className="mt-1">
                    {s.series_topic}
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteSeries(s.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline">{s.series_length} parts</Badge>
                {s.industry && <Badge variant="secondary">{s.industry}</Badge>}
                {s.user_role && <Badge variant="secondary">{s.user_role}</Badge>}
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">
                    {completed}/{s.series_length} posts
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Created {format(new Date(s.created_at), 'MMM d, yyyy')}</span>
              </div>

              {canGenerateNext && (
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => onGeneratePost?.(s.id, nextPart)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Generate Part {nextPart}
                </Button>
              )}

              {!canGenerateNext && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2 text-center">
                  <span className="text-sm font-medium text-green-700 dark:text-green-600">
                    Series Complete! 🎉
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}