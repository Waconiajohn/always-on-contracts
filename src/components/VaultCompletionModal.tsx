import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Award, ArrowRight, Check, Lock, Unlock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface VaultCompletionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  completionPercentage: number;
  stats: {
    powerPhrases: number;
    transferableSkills: number;
    hiddenCompetencies: number;
    totalIntelligence: number;
  };
  strengthScore: number;
}

export const VaultCompletionModal = ({
  open,
  onOpenChange,
  completionPercentage,
  stats,
  strengthScore
}: VaultCompletionModalProps) => {
  const navigate = useNavigate();
  
  const getMilestoneInfo = (percentage: number) => {
    if (percentage >= 100) {
      return {
        title: "🎉 Career Vault Complete!",
        description: "You've unlocked the full power of CareerIQ",
        features: [
          { name: "Elite Resume Optimization", unlocked: true },
          { name: "Advanced Job Matching", unlocked: true },
          { name: "Full AI Coaching", unlocked: true },
          { name: "Interview Prep & Follow-up", unlocked: true },
          { name: "Priority Support", unlocked: true }
        ],
        color: "text-green-500",
        badgeVariant: "default" as const
      };
    } else if (percentage >= 75) {
      return {
        title: "🌟 75% Complete - Advanced Level!",
        description: "Full AI coaching and interview prep now available",
        features: [
          { name: "Elite Resume Optimization", unlocked: true },
          { name: "Advanced Job Matching", unlocked: true },
          { name: "Full AI Coaching", unlocked: true },
          { name: "Interview Prep & Follow-up", unlocked: true },
          { name: "Priority Support", unlocked: false }
        ],
        color: "text-blue-500",
        badgeVariant: "default" as const
      };
    } else if (percentage >= 50) {
      return {
        title: "🚀 50% Complete - Intermediate!",
        description: "Advanced features and job matching unlocked",
        features: [
          { name: "Advanced Resume Optimization", unlocked: true },
          { name: "AI Job Matching", unlocked: true },
          { name: "Basic AI Coaching", unlocked: true },
          { name: "Interview Prep & Follow-up", unlocked: false },
          { name: "Priority Support", unlocked: false }
        ],
        color: "text-purple-500",
        badgeVariant: "secondary" as const
      };
    } else {
      return {
        title: "✨ 25% Complete - Great Start!",
        description: "Basic resume optimization now available",
        features: [
          { name: "Basic Resume Optimization", unlocked: true },
          { name: "Resume Keyword Analysis", unlocked: true },
          { name: "Job Opportunity Browsing", unlocked: true },
          { name: "AI Job Matching", unlocked: false },
          { name: "Advanced Features", unlocked: false }
        ],
        color: "text-primary",
        badgeVariant: "outline" as const
      };
    }
  };

  const milestoneInfo = getMilestoneInfo(completionPercentage);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-3xl flex items-center gap-3">
            <Award className={`h-8 w-8 ${milestoneInfo.color}`} />
            {milestoneInfo.title}
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            {milestoneInfo.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Career Vault Progress</span>
              <Badge variant={milestoneInfo.badgeVariant} className="text-base">
                {completionPercentage}%
              </Badge>
            </div>
            <Progress value={completionPercentage} className="h-3" />
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Intelligence Extracted</p>
              <p className="text-2xl font-bold">{stats.totalIntelligence}</p>
              <p className="text-xs text-muted-foreground">
                {stats.powerPhrases} phrases • {stats.transferableSkills} skills
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Strength Score</p>
              <p className="text-2xl font-bold">{strengthScore}/100</p>
              <p className="text-xs text-muted-foreground">
                {strengthScore >= 80 ? 'Elite' : strengthScore >= 60 ? 'Strong' : 'Growing'}
              </p>
            </div>
          </div>

          {/* Features Unlocked */}
          <div>
            <h3 className="font-semibold mb-3">What's Available Now</h3>
            <div className="space-y-2">
              {milestoneInfo.features.map((feature, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    feature.unlocked
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-muted bg-muted/20 opacity-60'
                  }`}
                >
                  {feature.unlocked ? (
                    <Unlock className="h-5 w-5 text-primary" />
                  ) : (
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className={feature.unlocked ? 'font-medium' : 'text-muted-foreground'}>
                    {feature.name}
                  </span>
                  {feature.unlocked && (
                    <Check className="h-4 w-4 text-primary ml-auto" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              size="lg"
              className="flex-1"
              onClick={() => {
                onOpenChange(false);
                navigate('/agents/resume-builder');
              }}
            >
              Start Using My Vault
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Keep Building
            </Button>
          </div>

          {completionPercentage < 100 && (
            <p className="text-sm text-center text-muted-foreground">
              Continue the interview to unlock more features and strengthen your career intelligence
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
