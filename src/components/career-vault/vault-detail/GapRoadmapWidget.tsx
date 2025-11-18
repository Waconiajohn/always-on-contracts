import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Target, Loader2, ChevronRight, Sparkles } from 'lucide-react';

interface GapRoadmapWidgetProps {
  sectionKey: string;
  vaultId: string;
  benchmarkData: any;
  currentItems: any[];
  onItemsAdded: () => void;
}

interface RoadmapItem {
  priority: number;
  title: string;
  description: string;
  goal: string;
  impact: string;
  estimatedTime: string;
  current: number;
  target: number;
  suggestedActions: string[];
}

export function GapRoadmapWidget({
  sectionKey,
  vaultId,
  benchmarkData,
  currentItems
}: GapRoadmapWidgetProps) {
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadRoadmap();
  }, [sectionKey, vaultId]);

  const loadRoadmap = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-gap-roadmap', {
        body: {
          vaultId,
          sectionKey,
          benchmarkData,
          currentItems
        }
      });

      if (error) throw error;

      if (data?.success && data.roadmap) {
        setRoadmap(data.roadmap);
      }
    } catch (error) {
      console.error('Error loading roadmap:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-sm text-muted-foreground">Generating your personalized roadmap...</p>
        </CardContent>
      </Card>
    );
  }

  if (roadmap.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            Your Roadmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={loadRoadmap} className="w-full" variant="outline">
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Personalized Roadmap
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5" />
          Your Personalized Roadmap
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          AI-generated action plan based on your benchmark analysis
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {roadmap.map((item, idx) => (
          <div key={idx} className="space-y-3 p-4 border rounded-lg bg-gradient-to-br from-background to-muted/30">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={item.priority === 1 ? 'destructive' : item.priority === 2 ? 'default' : 'secondary'}>
                    Priority {item.priority}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{item.estimatedTime}</span>
                </div>
                <h4 className="font-semibold text-sm">{item.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{item.current}/{item.target}</span>
              </div>
              <Progress value={(item.current / item.target) * 100} className="h-1" />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium">Suggested Actions:</p>
              {item.suggestedActions.map((action, actionIdx) => (
                <div key={actionIdx} className="flex items-start gap-2 text-xs">
                  <ChevronRight className="h-3 w-3 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{action}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t">
              <p className="text-xs">
                <span className="font-medium">Impact: </span>
                <span className="text-muted-foreground">{item.impact}</span>
              </p>
            </div>

            <Button size="sm" className="w-full" variant="outline">
              Start Working on This
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
