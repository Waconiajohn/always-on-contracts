import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Lock, ChevronRight, type LucideIcon } from "lucide-react";

interface V3SectionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  percentage: number;
  current: number;
  target: number;
  isLocked: boolean;
  onClick: () => void;
}

export function V3SectionCard({
  title,
  description,
  icon: Icon,
  percentage,
  current,
  target,
  isLocked,
  onClick
}: V3SectionCardProps) {
  const remaining = target - current;

  return (
    <Card 
      className={`${isLocked ? 'opacity-60' : 'cursor-pointer hover:shadow-lg hover:border-primary/50'} transition-all group`}
      onClick={!isLocked ? onClick : undefined}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className={`p-2 rounded-lg ${isLocked ? 'bg-muted' : 'bg-primary/10'}`}>
            {isLocked ? (
              <Lock className="h-6 w-6 text-muted-foreground" />
            ) : (
              <Icon className="h-6 w-6 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        
        {!isLocked && (
          <>
            <div className="mb-4">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold">{Math.round(percentage)}%</span>
                <span className="text-base text-muted-foreground">
                  ({current} of {target} items)
                </span>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>
            
            <div className="flex items-center justify-between">
              <p className="text-base text-muted-foreground">
                {percentage >= 100 
                  ? '✓ Section complete'
                  : `Add ${remaining} more item${remaining !== 1 ? 's' : ''}`}
              </p>
              <Button 
                variant="ghost" 
                size="sm"
                className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
              >
                {percentage >= 100 ? 'View' : 'Add Items'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </>
        )}
        
        {isLocked && (
          <>
            <p className="text-base text-muted-foreground mb-4">
              Complete foundation sections to unlock
            </p>
            <Button variant="outline" size="sm" disabled className="w-full">
              <Lock className="h-4 w-4 mr-2" />
              Unlock at 60%
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
