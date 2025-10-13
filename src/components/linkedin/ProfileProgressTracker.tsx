import { CheckCircle2, Circle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ProfileProgressTrackerProps {
  targetRole: string;
  industry: string;
  headline: string;
  about: string;
  skills: string[];
}

export function ProfileProgressTracker({
  targetRole,
  industry,
  headline,
  about,
  skills
}: ProfileProgressTrackerProps) {
  const sections = [
    { 
      label: "Target Role & Industry", 
      completed: targetRole.trim().length > 0 && industry.trim().length > 0,
      required: true 
    },
    { 
      label: "Headline", 
      completed: headline.trim().length >= 20,
      required: false 
    },
    { 
      label: "About Section", 
      completed: about.trim().length >= 100,
      required: false 
    },
    { 
      label: "Skills", 
      completed: skills.length >= 3,
      required: false 
    },
  ];

  const completedCount = sections.filter(s => s.completed).length;
  const totalCount = sections.length;
  const progressPercentage = (completedCount / totalCount) * 100;

  return (
    <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Profile Completion</h3>
        <span className="text-xs text-muted-foreground">
          {completedCount} of {totalCount} sections
        </span>
      </div>
      
      <Progress value={progressPercentage} className="h-2" />
      
      <div className="space-y-2">
        {sections.map((section, idx) => (
          <div key={idx} className="flex items-center gap-2">
            {section.completed ? (
              <CheckCircle2 className="h-4 w-4 text-primary" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground" />
            )}
            <span className={cn(
              "text-xs",
              section.completed ? "text-foreground" : "text-muted-foreground"
            )}>
              {section.label}
              {section.required && <span className="text-destructive ml-1">*</span>}
            </span>
          </div>
        ))}
      </div>
      
      {!sections[0].completed && (
        <p className="text-xs text-muted-foreground pt-2 border-t">
          💡 Complete required fields to enable optimization
        </p>
      )}
    </div>
  );
}
