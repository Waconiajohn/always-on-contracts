import { Zap, Clock, TrendingUp, Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface MicroWin {
  id: string;
  action: string;
  impact: string;
  timeEstimate: string;
  aiModel: string;
  path: string;
  icon: any;
}

interface V3MicroWinsProps {
  resumeCompletion: number;
}

export function V3MicroWins({ resumeCompletion }: V3MicroWinsProps) {
  const navigate = useNavigate();

  // Generate context-aware micro-wins
  const getMicroWins = (): MicroWin[] => {
    const wins: MicroWin[] = [];

    if (resumeCompletion < 50) {
      wins.push({
        id: 'add-skills',
        action: 'Add 3 more skills to reach competitive tier',
        impact: '+5% resume score',
        timeEstimate: '3 min',
        aiModel: 'Gemini 2.5 Flash',
        path: '/resume-builder',
        icon: TrendingUp
      });
    }

    if (resumeCompletion < 70) {
      wins.push({
        id: 'enhance-achievement',
        action: 'Enhance 1 achievement with AI',
        impact: '+2% resume score',
        timeEstimate: '5 min',
        aiModel: 'Gemini 3.0 Pro',
        path: '/resume-builder',
        icon: Sparkles
      });
    }

    wins.push({
      id: 'review-insights',
      action: 'Review and approve AI-generated leadership insights',
      impact: '+3% resume quality',
      timeEstimate: '4 min',
      aiModel: 'GPT-5',
      path: '/resume-builder',
      icon: Zap
    });

    if (resumeCompletion >= 60) {
      wins.push({
        id: 'generate-resume',
        action: 'Generate your first AI-powered resume',
        impact: 'Unlock job matching',
        timeEstimate: '2 min',
        aiModel: 'GPT-5',
        path: '/resume-builder',
        icon: Sparkles
      });
    }

    return wins.slice(0, 3); // Max 3 quick wins
  };

  const microWins = getMicroWins();

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <Zap className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">⚡ Quick Wins (5 min each)</h2>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Small improvements compound: Users who complete 3 quick wins weekly see 40% faster job search success
      </p>

      <div className="grid md:grid-cols-3 gap-4">
        {microWins.map(win => {
          const Icon = win.icon;
          
          return (
            <div
              key={win.id}
              className="border border-border rounded-lg p-4 bg-card hover:border-primary/30 transition-all cursor-pointer group"
              onClick={() => navigate(win.path)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
              </div>

              <p className="text-sm font-medium mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                {win.action}
              </p>

              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <TrendingUp className="h-3 w-3" />
                    Impact
                  </span>
                  <span className="font-medium text-green-600">{win.impact}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Time
                  </span>
                  <span className="font-medium">{win.timeEstimate}</span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
              >
                Start Now
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
