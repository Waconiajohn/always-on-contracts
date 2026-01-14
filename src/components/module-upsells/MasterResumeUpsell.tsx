import { MODULES } from "@/config/modules";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, FileText, Brain, History } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const MasterResumeUpsell = () => {
  const navigate = useNavigate();
  const module = MODULES.master_resume;

  return (
    <Card className="border-2 border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <FileText className="h-6 w-6 text-purple-500" />
          </div>
          <div>
            <h3 className="font-semibold">{module.name}</h3>
            <p className="text-sm text-muted-foreground">{module.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="p-2 rounded bg-muted/50">
            <FileText className="h-4 w-4 mx-auto mb-1 text-purple-500" />
            <span className="text-xs">Master Resume</span>
          </div>
          <div className="p-2 rounded bg-muted/50">
            <Brain className="h-4 w-4 mx-auto mb-1 text-purple-500" />
            <span className="text-xs">AI Coach</span>
          </div>
          <div className="p-2 rounded bg-muted/50">
            <History className="h-4 w-4 mx-auto mb-1 text-purple-500" />
            <span className="text-xs">Version History</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Starting at <span className="font-bold text-foreground">${module.price}/mo</span>
          </span>
          <Button size="sm" onClick={() => navigate('/pricing')}>
            <Crown className="h-4 w-4 mr-1" />
            Unlock
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
