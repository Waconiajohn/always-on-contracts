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
      const itemsToUnlock = Math.round((100 - interviewProgress) * 2); // Rough estimate
      recommendations.push({
        icon: <Target className="h-5 w-5" />,
        title: 'Complete Your Interview',
        description: `You're ${interviewProgress}% done. Unlock ~${itemsToUnlock} more intelligence items.`,
        impact: `Unlock ${itemsToUnlock} items`,
        time: '~15 min',
        action: () => navigate('/career-vault/onboarding'),
        actionText: 'Continue Interview',
        variant: 'default' as const,
        priority: 1
      });
    }

    if (strengthScore < 70 && totalItems > 0) {
      const pointsToGain = 70 - strengthScore;
      recommendations.push({
        icon: <TrendingUp className="h-5 w-5" />,
        title: 'Boost Your Strength Score',
        description: `Add quantified achievements to reach Strong (70/100)`,
        impact: `+${pointsToGain} points → Strong level`,
        time: '~10 min',
        action: () => navigate('/career-vault/onboarding'),
        actionText: 'Add Achievements',
        variant: 'secondary' as const,
        priority: 2
      });
    }

    if (!hasLeadership && totalItems > 20) {
      recommendations.push({
        icon: <Sparkles className="h-5 w-5" />,
        title: 'Add Leadership Examples',
        description: 'Complete Executive Presence for elite interview positioning',
        impact: '+8 points → Better interviews',
        time: '~8 min',
        action: () => navigate('/career-vault/onboarding'),
        actionText: 'Add Leadership',
        variant: 'outline' as const,
        priority: 3
      });
    }

    if (strengthScore >= 70 && interviewProgress === 100) {
      recommendations.push({
        icon: <Rocket className="h-5 w-5" />,
        title: 'Deploy Your Vault',
        description: 'Generate tailored resumes and interview prep for specific jobs',
        impact: 'Your vault is ready for production use',
        time: 'Start now',
        action: () => navigate('/agents/resume-builder'),
        actionText: 'Use My Vault',
        variant: 'default' as const,
        priority: 1
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
