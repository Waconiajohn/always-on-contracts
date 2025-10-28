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

    // Priority 1: Complete interview if not done
    if (interviewProgress < 100) {
      const itemsToUnlock = Math.round((100 - interviewProgress) * 2);
      recommendations.push({
        icon: <Target className="h-5 w-5" />,
        title: 'Complete Career Interview',
        description: `${interviewProgress}% complete. Finish to unlock your full intelligence profile.`,
        impact: `+${itemsToUnlock} more items`,
        time: '15-20 min',
        action: () => navigate('/career-vault-onboarding'),
        actionText: 'Continue Interview',
        variant: 'default' as const,
        priority: 1
      });
    }

    // Priority 2: Improve quality if interview is done but score is low
    if (interviewProgress === 100 && strengthScore < 60) {
      recommendations.push({
        icon: <TrendingUp className="h-5 w-5" />,
        title: 'Verify Your Intelligence',
        description: `Review and verify AI-assumed items to boost quality from ${strengthScore} to 60+`,
        impact: `+${Math.ceil((60 - strengthScore) / 5)} items verified → Solid level`,
        time: '5-10 min',
        action: () => {
          const element = document.querySelector('[data-verification-workflow]');
          element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        },
        actionText: 'Start Verifying',
        variant: 'default' as const,
        priority: 1
      });
    }

    // Priority 3: Add quantified achievements if score is moderate
    if (strengthScore >= 30 && strengthScore < 70 && totalItems > 10) {
      const pointsNeeded = 70 - strengthScore;
      recommendations.push({
        icon: <Sparkles className="h-5 w-5" />,
        title: 'Add Metrics to Achievements',
        description: `Quantify your accomplishments with numbers, percentages, and dollar amounts`,
        impact: `+${pointsNeeded} points → Strong level`,
        time: '10-15 min',
        action: () => {
          const element = document.querySelector('[data-contents-table]');
          element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        },
        actionText: 'Add Metrics',
        variant: 'secondary' as const,
        priority: 2
      });
    }

    // Priority 4: Deploy if everything is solid
    if (strengthScore >= 60 && interviewProgress === 100) {
      recommendations.push({
        icon: <Rocket className="h-5 w-5" />,
        title: 'Start Using Your Vault',
        description: 'Your vault is ready! Generate tailored resumes and prep for interviews.',
        impact: 'Vault operational ✓',
        time: 'Ready now',
        action: () => navigate('/agents/resume-builder'),
        actionText: 'Build Resume',
        variant: 'default' as const,
        priority: 0
      });
    }

    // Priority 5: Leadership for senior roles
    if (!hasLeadership && totalItems > 30 && strengthScore >= 50) {
      recommendations.push({
        icon: <Sparkles className="h-5 w-5" />,
        title: 'Add Leadership Stories',
        description: 'Strengthen your executive positioning with leadership examples',
        impact: '+10-15 points → Elite positioning',
        time: '8-12 min',
        action: () => navigate('/career-vault-onboarding'),
        actionText: 'Add Leadership',
        variant: 'outline' as const,
        priority: 3
      });
    }

    return recommendations.sort((a, b) => a.priority - b.priority);
  };

  const recommendations = getRecommendations();

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-1">What to Do Next</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Prioritized actions to improve your vault
      </p>
      <div className="space-y-3">
        {recommendations.map((rec, idx) => (
          <div key={idx} className="p-4 border rounded-lg hover:border-primary/50 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3 flex-1">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">{rec.title}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-primary font-medium">↳ Impact: {rec.impact}</span>
                    <span className="text-muted-foreground">↳ Time: {rec.time}</span>
                  </div>
                </div>
              </div>
              <Button variant={rec.variant} size="sm" onClick={rec.action} className="gap-2 whitespace-nowrap flex-shrink-0">
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
