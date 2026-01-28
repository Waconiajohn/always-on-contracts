import { Badge } from "@/components/ui/badge";
import { Lock, Sparkles } from "lucide-react";
import { LaunchpadCard } from "./LaunchpadCard";

interface LaunchpadCardData {
  id: string;
  title: string;
  description: string;
  icon: any;
  path: string;
  progress?: number;
  isLocked?: boolean;
  lockReason?: string;
  isDualAI?: boolean;
  isPlatinum?: boolean;
}

interface JourneyPhaseSectionProps {
  title: string;
  subtitle: string;
  cards: LaunchpadCardData[];
  status: 'active' | 'unlocked' | 'locked';
  
}

export const JourneyPhaseSection = ({
  title,
  subtitle,
  cards,
  status,
  
}: JourneyPhaseSectionProps) => {
  const isActive = status === 'active';
  const isLocked = status === 'locked';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold">{title}</h2>
            {isActive && (
              <Badge variant="default" className="gap-1">
                <Sparkles className="h-3 w-3" />
                Current Phase
              </Badge>
            )}
            {isLocked && (
              <Badge variant="outline" className="gap-1">
                <Lock className="h-3 w-3" />
                Unlocks at 100%
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      <div className={`grid gap-3 sm:gap-4 ${
        isActive
          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2'
          : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
      }`}>
        {cards.map((card) => (
          <LaunchpadCard
            key={card.id}
            {...card}
            variant={isActive ? 'active' : isLocked ? 'preview' : 'unlocked'}
            
          />
        ))}
      </div>
    </div>
  );
};
