import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Target, TrendingUp, Sparkles, Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SmartNextStepsProps {
  interviewProgress: number;
  strengthScore: number;
  totalItems: number;
  hasLeadership: boolean;
  hasExecutivePresence: boolean;
}

export const SmartNextSteps = ({
  interviewProgress,
  strengthScore,
  totalItems,
  hasLeadership
}: SmartNextStepsProps) => {
  const navigate = useNavigate();

  const getRecommendations = () => {
    const recommendations = [];

    if (interviewProgress < 100) {
      recommendations.push({
        icon: <Target className="h-5 w-5" />,
        title: 'Complete Your Interview',
        description: `You're ${interviewProgress}% done. Unlock more intelligence items by continuing.`,
        action: () => navigate('/career-vault/onboarding'),
        actionText: 'Continue Interview',
        variant: 'default' as const
      });
    }

    if (strengthScore < 70 && totalItems > 0) {
      recommendations.push({
        icon: <TrendingUp className="h-5 w-5" />,
        title: 'Boost Your Strength Score',
        description: `Add quantified achievements to increase from ${strengthScore} to 70+`,
        action: () => navigate('/career-vault/onboarding'),
        actionText: 'Add Achievements',
        variant: 'secondary' as const
      });
    }

    if (!hasLeadership && totalItems > 20) {
      recommendations.push({
        icon: <Sparkles className="h-5 w-5" />,
        title: 'Add Leadership Examples',
        description: 'Complete your Executive Presence category for elite positioning',
        action: () => navigate('/career-vault/onboarding'),
        actionText: 'Add Leadership',
        variant: 'outline' as const
      });
    }

    if (strengthScore >= 70 && interviewProgress === 100) {
      recommendations.push({
        icon: <Rocket className="h-5 w-5" />,
        title: 'Deploy Your Vault',
        description: 'Your vault is elite-ready! Use it in Resume Builder and Interview Prep.',
        action: () => navigate('/agents/resume-builder'),
        actionText: 'Use My Vault',
        variant: 'default' as const
      });
    }

    return recommendations;
  };

  const recommendations = getRecommendations();

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Smart Next Steps</h3>
      <div className="space-y-3">
        {recommendations.map((rec, idx) => (
          <div key={idx} className="p-4 border rounded-lg hover:border-primary/50 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3 flex-1">
                <div className="mt-1 text-primary">{rec.icon}</div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">{rec.title}</h4>
                  <p className="text-sm text-muted-foreground">{rec.description}</p>
                </div>
              </div>
              <Button variant={rec.variant} size="sm" onClick={rec.action} className="gap-2 whitespace-nowrap">
                {rec.actionText}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
