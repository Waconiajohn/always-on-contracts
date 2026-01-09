import { useModuleAccess } from "@/hooks/useModuleAccess";
import { MODULES, ModuleId } from "@/config/modules";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Crown, Sparkles, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ModuleGateProps {
  module: ModuleId;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ModuleGate = ({ module, children, fallback }: ModuleGateProps) => {
  const { hasModule, loading } = useModuleAccess();
  const navigate = useNavigate();

  const moduleInfo = MODULES[module];

  // Show a neutral loading state while checking access
  // This prevents flashing the subscription/pricing card before access is determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Only show the locked state AFTER loading is complete and access is denied
  if (!hasModule(module)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    const ModuleIcon = moduleInfo.icon;

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-2xl mx-auto border-2">
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className={`p-4 rounded-full bg-muted`}>
                <Lock className="h-8 w-8 text-muted-foreground absolute" />
                <ModuleIcon className={`h-12 w-12 ${moduleInfo.color}`} />
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">
                Unlock {moduleInfo.name}
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                {moduleInfo.description}
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 text-left max-w-md mx-auto">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                What you'll get:
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {moduleInfo.features.slice(0, 5).map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    {feature}
                  </li>
                ))}
                {moduleInfo.features.length > 5 && (
                  <li className="text-primary font-medium">
                    + {moduleInfo.features.length - 5} more features
                  </li>
                )}
              </ul>
            </div>

            {moduleInfo.price && (
              <div className="text-sm text-muted-foreground">
                Starting at <span className="font-bold text-foreground">${moduleInfo.price}/month</span>
              </div>
            )}

            <div className="flex gap-4 justify-center pt-2">
              <Button onClick={() => navigate('/pricing')} size="lg">
                <Crown className="mr-2 h-5 w-5" />
                View Pricing
              </Button>
              <Button onClick={() => navigate('/home')} variant="outline" size="lg">
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};