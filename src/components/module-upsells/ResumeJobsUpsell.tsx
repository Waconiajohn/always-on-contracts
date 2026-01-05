import { MODULES } from "@/config/modules";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, FileText, Search, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const ResumeJobsUpsell = () => {
  const navigate = useNavigate();
  const module = MODULES.resume_jobs_studio;

  return (
    <Card className="border-2 border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <FileText className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <h3 className="font-semibold">{module.name}</h3>
            <p className="text-sm text-muted-foreground">{module.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="p-2 rounded bg-muted/50">
            <FileText className="h-4 w-4 mx-auto mb-1 text-blue-500" />
            <span className="text-xs">Resume Builder</span>
          </div>
          <div className="p-2 rounded bg-muted/50">
            <Search className="h-4 w-4 mx-auto mb-1 text-blue-500" />
            <span className="text-xs">Job Search</span>
          </div>
          <div className="p-2 rounded bg-muted/50">
            <Briefcase className="h-4 w-4 mx-auto mb-1 text-blue-500" />
            <span className="text-xs">Applications</span>
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
