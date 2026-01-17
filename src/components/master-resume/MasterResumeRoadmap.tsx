import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Map, Sparkles, Clock, CheckCircle2, Circle, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  goal: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: string;
  impact: number;
  current: number;
  target: number;
  sectionKey: string;
  suggestedActions: string[];
  isComplete: boolean;
}

interface MasterResumeRoadmapProps {
  resumeContent: string;
  vaultId?: string;
}

export function MasterResumeRoadmap({ resumeContent, vaultId }: MasterResumeRoadmapProps) {
  const navigate = useNavigate();
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());

  const { data: roadmap, isLoading, refetch } = useQuery({
    queryKey: ['master-resume-roadmap', vaultId],
    queryFn: async (): Promise<RoadmapItem[]> => {
      if (!resumeContent || resumeContent.length < 100) {
        return [];
      }

      try {
        const { data, error } = await supabase.functions.invoke('generate-gap-roadmap', {
          body: { 
            resumeText: resumeContent,
            vaultId 
          }
        });

        if (error) throw error;
        
        return transformRoadmapResponse(data);
      } catch (err) {
        console.error('Roadmap generation error:', err);
        toast.error('Failed to generate improvement roadmap');
        return [];
      }
    },
    enabled: !!resumeContent && resumeContent.length >= 100,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });

  const transformRoadmapResponse = (data: any): RoadmapItem[] => {
    const items: RoadmapItem[] = [];
    
    if (data?.roadmap) {
      data.roadmap.forEach((item: any, idx: number) => {
        items.push({
          id: item.id || `roadmap-${idx}`,
          title: item.title || item.goal || 'Improvement Item',
          description: item.description || '',
          goal: item.goal || item.title || '',
          priority: item.priority || (idx < 2 ? 'high' : idx < 5 ? 'medium' : 'low'),
          estimatedTime: item.estimatedTime || item.timeEstimate || '30 min',
          impact: item.impact || item.potentialPoints || 5,
          current: item.current || 0,
          target: item.target || 5,
          sectionKey: item.sectionKey || 'general',
          suggestedActions: item.suggestedActions || item.actions || [],
          isComplete: false
        });
      });
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return items.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleStartItem = (item: RoadmapItem) => {
    // Navigate to resume builder with context
    navigate(`/resume-builder?roadmapItem=${encodeURIComponent(item.sectionKey)}`);
  };

  const toggleComplete = (itemId: string) => {
    setCompletedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Creating your personalized improvement roadmap...</p>
          <p className="text-sm text-muted-foreground mt-2">This may take 20-30 seconds</p>
        </CardContent>
      </Card>
    );
  }

  if (!roadmap || roadmap.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Map className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Roadmap Available</h3>
          <p className="text-muted-foreground text-center max-w-md mb-4">
            Add more content to your Master Resume to generate a personalized improvement roadmap.
          </p>
          <Button onClick={() => refetch()} variant="outline">
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Roadmap
          </Button>
        </CardContent>
      </Card>
    );
  }

  const completedCount = completedItems.size;
  const totalItems = roadmap.length;
  const progressPercent = Math.round((completedCount / totalItems) * 100);

  const highPriority = roadmap.filter(i => i.priority === 'high' && !completedItems.has(i.id));
  const mediumPriority = roadmap.filter(i => i.priority === 'medium' && !completedItems.has(i.id));
  const lowPriority = roadmap.filter(i => i.priority === 'low' && !completedItems.has(i.id));
  const completed = roadmap.filter(i => completedItems.has(i.id));

  const renderRoadmapItem = (item: RoadmapItem) => {
    const isComplete = completedItems.has(item.id);
    
    return (
      <Card key={item.id} className={`transition-all ${isComplete ? 'opacity-60' : 'hover:border-primary/30'}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <button 
              onClick={() => toggleComplete(item.id)}
              className="mt-1 shrink-0"
            >
              {isComplete ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
              )}
            </button>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge className={getPriorityColor(item.priority)} variant="secondary">
                  {item.priority}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {item.estimatedTime}
                </span>
                <span className="text-xs text-muted-foreground">
                  +{item.impact} pts
                </span>
              </div>
              
              <h4 className={`font-medium ${isComplete ? 'line-through' : ''}`}>
                {item.title}
              </h4>
              
              {item.description && (
                <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
              )}
              
              {item.suggestedActions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {item.suggestedActions.slice(0, 3).map((action, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {action}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Progress bar for items with current/target */}
              {item.target > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress</span>
                    <span>{item.current} / {item.target}</span>
                  </div>
                  <Progress value={(item.current / item.target) * 100} className="h-2" />
                </div>
              )}
            </div>

            {!isComplete && (
              <Button 
                size="sm" 
                onClick={() => handleStartItem(item)}
                className="shrink-0"
              >
                <Play className="h-3 w-3 mr-1" />
                Start
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5 text-primary" />
            Your Improvement Roadmap
          </CardTitle>
          <CardDescription>Prioritized steps to reach benchmark level</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{completedCount} of {totalItems} completed</span>
              </div>
              <Progress value={progressPercent} className="h-3" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{progressPercent}%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* High Priority */}
      {highPriority.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Badge className="bg-orange-500">High Priority</Badge>
            <span className="text-muted-foreground text-sm">({highPriority.length} items)</span>
          </h3>
          <div className="space-y-3">
            {highPriority.map(renderRoadmapItem)}
          </div>
        </div>
      )}

      {/* Medium Priority */}
      {mediumPriority.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Badge className="bg-yellow-500 text-black">Medium Priority</Badge>
            <span className="text-muted-foreground text-sm">({mediumPriority.length} items)</span>
          </h3>
          <div className="space-y-3">
            {mediumPriority.map(renderRoadmapItem)}
          </div>
        </div>
      )}

      {/* Low Priority */}
      {lowPriority.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Badge variant="secondary">Nice to Have</Badge>
            <span className="text-muted-foreground text-sm">({lowPriority.length} items)</span>
          </h3>
          <div className="space-y-3">
            {lowPriority.map(renderRoadmapItem)}
          </div>
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            Completed
            <span className="text-muted-foreground text-sm">({completed.length} items)</span>
          </h3>
          <div className="space-y-3">
            {completed.map(renderRoadmapItem)}
          </div>
        </div>
      )}

      {/* Refresh */}
      <div className="flex justify-center">
        <Button variant="outline" onClick={() => refetch()}>
          <Sparkles className="h-4 w-4 mr-2" />
          Refresh Roadmap
        </Button>
      </div>
    </div>
  );
}
