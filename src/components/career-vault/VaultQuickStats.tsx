import { Card } from '@/components/ui/card';
import { Brain, Target, Award, Clock, Briefcase, GraduationCap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface VaultQuickStatsProps {
  totalItems: number;
  interviewProgress: number;
  strengthScore: number;
  lastUpdated: string | null;
  workPositionsCount?: number;
  educationCount?: number;
}

export const VaultQuickStats = ({
  totalItems,
  interviewProgress,
  strengthScore,
  lastUpdated,
  workPositionsCount = 0,
  educationCount = 0
}: VaultQuickStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{totalItems}</p>
            <p className="text-sm text-muted-foreground">Intelligence Items</p>
          </div>
        </div>
      </Card>
      
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-secondary/10 rounded-lg">
            <Target className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{interviewProgress}%</p>
            <p className="text-sm text-muted-foreground">Interview Progress</p>
          </div>
        </div>
      </Card>
      
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/10 rounded-lg">
            <Award className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="text-2xl font-bold">{strengthScore}</p>
            <p className="text-sm text-muted-foreground">Strength Score</p>
          </div>
        </div>
      </Card>
      
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Briefcase className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{workPositionsCount}</p>
            <p className="text-sm text-muted-foreground">Work Positions</p>
          </div>
        </div>
      </Card>
      
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <GraduationCap className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{educationCount}</p>
            <p className="text-sm text-muted-foreground">Education</p>
          </div>
        </div>
      </Card>
      
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded-lg">
            <Clock className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold">
              {lastUpdated ? formatDistanceToNow(new Date(lastUpdated), { addSuffix: true }) : 'Never'}
            </p>
            <p className="text-sm text-muted-foreground">Last Updated</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
