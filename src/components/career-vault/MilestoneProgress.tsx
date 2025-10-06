import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Sparkles } from 'lucide-react';

interface Milestone {
  id: string;
  milestone_type: string;
  company_name: string;
  job_title: string;
  start_date: string;
  end_date: string;
  description: string;
  key_achievements: string[];
  completion_percentage: number;
  questions_asked: number;
  questions_answered: number;
  intelligence_extracted: number;
}

interface MilestoneProgressProps {
  milestones: Milestone[];
  currentMilestoneId?: string;
  onSelectMilestone: (milestoneId: string) => void;
  totalIntelligenceExtracted: number;
}

export const MilestoneProgress = ({ 
  milestones, 
  currentMilestoneId, 
  onSelectMilestone,
  totalIntelligenceExtracted 
}: MilestoneProgressProps) => {
  const completedMilestones = milestones.filter(m => m.completion_percentage >= 100);
  const overallProgress = milestones.length > 0 
    ? Math.round((completedMilestones.length / milestones.length) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* Overall Progress Header */}
      <Card className="p-6 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold">Resume Intelligence Extraction</h3>
            <p className="text-sm text-muted-foreground">
              Extracting from {milestones.length} career milestones
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-2xl font-bold">{totalIntelligenceExtracted}</span>
            <span className="text-sm text-muted-foreground">items extracted</span>
          </div>
        </div>
        <Progress value={overallProgress} className="h-3" />
        <div className="flex justify-between mt-2 text-sm">
          <span className="text-muted-foreground">
            {completedMilestones.length} of {milestones.length} complete
          </span>
          <span className="font-medium">{overallProgress}%</span>
        </div>
      </Card>

      {/* Milestone List */}
      <div className="space-y-3">
        {milestones.map((milestone) => {
          const isActive = milestone.id === currentMilestoneId;
          const isComplete = milestone.completion_percentage >= 100;
          const progress = (milestone.questions_answered / milestone.questions_asked) * 100;

          return (
            <Card
              key={milestone.id}
              className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                isActive ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => onSelectMilestone(milestone.id)}
            >
              <div className="flex items-start gap-3">
                {/* Status Icon */}
                <div className="mt-1">
                  {isComplete ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>

                {/* Milestone Content */}
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{milestone.job_title}</h4>
                      <p className="text-sm text-muted-foreground truncate">
                        {milestone.company_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {milestone.start_date} - {milestone.end_date}
                      </p>
                    </div>
                    <Badge variant={isComplete ? 'default' : 'secondary'}>
                      {milestone.milestone_type}
                    </Badge>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {milestone.questions_answered}/{milestone.questions_asked} questions
                      </span>
                      <span className="font-medium">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {/* Intelligence Extracted */}
                  {milestone.intelligence_extracted > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      <Sparkles className="h-3 w-3 text-primary" />
                      <span className="text-xs text-primary font-medium">
                        {milestone.intelligence_extracted} items extracted
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};