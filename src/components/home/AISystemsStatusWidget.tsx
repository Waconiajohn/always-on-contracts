import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Zap, CheckCircle2 } from "lucide-react";

export const AISystemsStatusWidget = () => {
  const aiAgents = [
    { name: "Job Search Agent", active: true },
    { name: "Resume Optimizer", active: true },
    { name: "Interview Prep", active: true },
    { name: "LinkedIn Builder", active: true },
    { name: "Networking Agent", active: true },
    { name: "Auto-Apply Agent", active: true },
    { name: "Career Trends Scout", active: true },
    { name: "Market Intelligence", active: true },
    { name: "Agency Matcher", active: true },
    { name: "Financial Planning", active: true },
    { name: "Corporate Assistant", active: true },
    { name: "Resume Builder", active: true },
  ];

  return (
    <Card className="glass border-ai-primary/30">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Bot className="h-4 w-4 text-ai-primary animate-pulse-subtle" />
            AI Systems
          </h3>
          <Badge variant="secondary" className="text-[10px] bg-ai-primary/10 text-ai-primary border-ai-primary/20">
            <Zap className="h-2.5 w-2.5 mr-1" />
            All Active
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 rounded-lg bg-ai-primary/5 border border-ai-primary/10">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-ai-active" />
              <span className="text-xs font-medium">{aiAgents.length} Agents Active</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-2 rounded-lg bg-ai-secondary/5 border border-ai-secondary/10">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-ai-active" />
              <span className="text-xs font-medium">Dual Verification ON</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-ai-active" />
              <span className="text-xs font-medium">Multi-AI Powered</span>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-border/50">
          <p className="text-[10px] text-muted-foreground mb-2">Live Agent Status</p>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {aiAgents.slice(0, 6).map((agent, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-ai-active animate-pulse" />
                <span className="text-muted-foreground">{agent.name}</span>
              </div>
            ))}
            {aiAgents.length > 6 && (
              <div className="text-[10px] text-muted-foreground pt-1">
                ... + {aiAgents.length - 6} more
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
