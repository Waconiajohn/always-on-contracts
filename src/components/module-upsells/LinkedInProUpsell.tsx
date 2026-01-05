import { MODULES } from "@/config/modules";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, Linkedin, Users, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const LinkedInProUpsell = () => {
  const navigate = useNavigate();
  const module = MODULES.linkedin_pro;

  return (
    <Card className="border-2 border-sky-500/20 bg-gradient-to-br from-sky-500/5 to-transparent">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-sky-500/10">
            <Linkedin className="h-6 w-6 text-sky-500" />
          </div>
          <div>
            <h3 className="font-semibold">{module.name}</h3>
            <p className="text-sm text-muted-foreground">{module.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="p-2 rounded bg-muted/50">
            <Linkedin className="h-4 w-4 mx-auto mb-1 text-sky-500" />
            <span className="text-xs">Profile Builder</span>
          </div>
          <div className="p-2 rounded bg-muted/50">
            <Users className="h-4 w-4 mx-auto mb-1 text-sky-500" />
            <span className="text-xs">Networking</span>
          </div>
          <div className="p-2 rounded bg-muted/50">
            <MessageSquare className="h-4 w-4 mx-auto mb-1 text-sky-500" />
            <span className="text-xs">Content</span>
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
