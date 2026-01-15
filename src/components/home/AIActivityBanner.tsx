import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";

interface AIActivity {
  id: string;
  system: string;
  message: string;
  status: 'processing' | 'complete';
}

export const AIActivityBanner = () => {
  const [activities] = useState<AIActivity[]>([
    {
      id: '1',
      system: 'AI Analysis',
      message: 'Master Resume analysis complete',
      status: 'complete'
    },
    {
      id: '2',
      system: 'AI Verification',
      message: 'Market data verified',
      status: 'complete'
    }
  ]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-dismiss after all activities are complete
    const allComplete = activities.every(a => a.status === 'complete');
    if (allComplete && activities.length > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [activities]);

  if (!isVisible || activities.length === 0) return null;

  return (
    <Card className="glass border-ai-primary/30 mb-6 animate-fade-in">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 flex-shrink-0">
            <Sparkles className="h-4 w-4 text-ai-primary animate-pulse-subtle" />
            <span className="text-sm font-semibold">AI System Active</span>
          </div>
          
          <div className="flex-1 flex items-center gap-3 overflow-x-auto">
            {activities.map((activity) => (
              <Badge
                key={activity.id}
                variant="secondary"
                className={`text-xs whitespace-nowrap ${
                  activity.status === 'processing'
                    ? 'bg-ai-processing/10 text-ai-processing border-ai-processing/20'
                    : 'bg-ai-active/10 text-ai-active border-ai-active/20'
                }`}
              >
                {activity.status === 'processing' ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                )}
                <span className="font-medium">{activity.system}:</span>
                <span className="ml-1">{activity.message}</span>
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
