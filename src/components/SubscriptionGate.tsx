import { useSubscription } from "@/hooks/useSubscription";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SubscriptionGateProps {
  featureName: string;
  children: React.ReactNode;
  requiredTier?: string;
}

export const SubscriptionGate = ({ 
  featureName, 
  children,
  requiredTier
}: SubscriptionGateProps) => {
  const { subscription, loading } = useSubscription();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Check tier-specific requirements
  const hasAccess = requiredTier === 'concierge_elite'
    ? subscription?.tier === 'concierge_elite' || subscription?.is_retirement_client
    : subscription?.subscribed;

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-primary/10 rounded-full">
                <Lock className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-bold">
              {requiredTier === 'concierge_elite' ? 'Concierge Elite Exclusive' : `Upgrade to Access ${featureName}`}
            </h2>
            <p className="text-muted-foreground">
              {requiredTier === 'concierge_elite' 
                ? 'AI Job Matching is exclusive to Concierge Elite subscribers. Upgrade to have our AI automatically discover and recommend opportunities tailored to your Career Vault.'
                : 'This feature requires a paid subscription. Unlock all career intelligence tools and accelerate your job search.'}
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate('/pricing')} size="lg">
                <Crown className="mr-2 h-5 w-5" />
                View Pricing
              </Button>
              <Button onClick={() => navigate('/command-center')} variant="outline" size="lg">
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
