import { MODULES } from "@/config/modules";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, Mic, DollarSign, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const InterviewMasteryUpsell = () => {
  const navigate = useNavigate();
  const module = MODULES.interview_mastery;

  return (
    <Card className="border-2 border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/10">
            <Mic className="h-6 w-6 text-green-500" />
          </div>
          <div>
            <h3 className="font-semibold">{module.name}</h3>
            <p className="text-sm text-muted-foreground">{module.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="p-2 rounded bg-muted/50">
            <Mic className="h-4 w-4 mx-auto mb-1 text-green-500" />
            <span className="text-xs">Interview Prep</span>
          </div>
          <div className="p-2 rounded bg-muted/50">
            <Target className="h-4 w-4 mx-auto mb-1 text-green-500" />
            <span className="text-xs">STAR Stories</span>
          </div>
          <div className="p-2 rounded bg-muted/50">
            <DollarSign className="h-4 w-4 mx-auto mb-1 text-green-500" />
            <span className="text-xs">Negotiation</span>
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
