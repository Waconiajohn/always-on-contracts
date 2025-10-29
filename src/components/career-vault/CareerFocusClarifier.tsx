import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, Compass, ChevronRight } from "lucide-react";

interface CareerFocusClarifierProps {
  onComplete: (data: {
    careerDirection: 'stay' | 'pivot' | 'explore';
    targetRoles: string[];
    targetIndustries: string[];
    excludedIndustries: string[];
  }) => void;
  detectedRole?: string;
  detectedIndustry?: string;
}

export const CareerFocusClarifier = ({ 
  onComplete, 
  detectedRole,
  detectedIndustry 
}: CareerFocusClarifierProps) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [careerDirection, setCareerDirection] = useState<'stay' | 'pivot' | 'explore' | null>(null);
  const [targetRoles, setTargetRoles] = useState<string[]>(detectedRole ? [detectedRole] : []);
  const [targetIndustries, setTargetIndustries] = useState<string[]>(detectedIndustry ? [detectedIndustry] : []);
  const [excludedIndustries, setExcludedIndustries] = useState<string[]>([]);

  const handleDirectionSelect = (direction: 'stay' | 'pivot' | 'explore') => {
    setCareerDirection(direction);
    setStep(2);
  };

  const handleComplete = () => {
    if (!careerDirection || targetRoles.length === 0 || targetIndustries.length === 0) {
      return;
    }
    
    onComplete({
      careerDirection,
      targetRoles,
      targetIndustries,
      excludedIndustries
    });
  };

  const toggleRole = (role: string) => {
    setTargetRoles(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const toggleIndustry = (industry: string) => {
    setTargetIndustries(prev => 
      prev.includes(industry) ? prev.filter(i => i !== industry) : [...prev, industry]
    );
  };

  const toggleExcludedIndustry = (industry: string) => {
    setExcludedIndustries(prev => 
      prev.includes(industry) ? prev.filter(i => i !== industry) : [...prev, industry]
    );
  };

  // Step 1: Career Direction
  if (step === 1) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">What's Your Career Goal?</CardTitle>
          <CardDescription>
            This helps us ask the right questions and avoid wasting your time on irrelevant areas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <button
            onClick={() => handleDirectionSelect('stay')}
            className="w-full p-6 text-left border-2 rounded-lg hover:border-primary hover:bg-accent transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Target className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">Stay in My Current Field</h3>
                <p className="text-sm text-muted-foreground">
                  Continue advancing in my current role and industry
                </p>
                {detectedRole && detectedIndustry && (
                  <Badge variant="secondary" className="mt-2">
                    Detected: {detectedRole} in {detectedIndustry}
                  </Badge>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </button>

          <button
            onClick={() => handleDirectionSelect('pivot')}
            className="w-full p-6 text-left border-2 rounded-lg hover:border-primary hover:bg-accent transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">Pivot to a New Industry or Role</h3>
                <p className="text-sm text-muted-foreground">
                  I'm looking to transition into something different
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </button>

          <button
            onClick={() => handleDirectionSelect('explore')}
            className="w-full p-6 text-left border-2 rounded-lg hover:border-primary hover:bg-accent transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Compass className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">Exploring Multiple Paths</h3>
                <p className="text-sm text-muted-foreground">
                  I'm open to opportunities across different roles and industries
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </button>
        </CardContent>
      </Card>
    );
  }

  // Step 2: Focus Areas
  if (step === 2) {
    const commonRoles = [
      "VP Engineering", "CTO", "Engineering Director",
      "VP Product", "Product Director", "Head of Product",
      "VP Operations", "COO", "Operations Director",
      "VP Marketing", "CMO", "Marketing Director",
      "VP Sales", "CRO", "Sales Director"
    ];

    const commonIndustries = [
      "FinTech", "Healthcare Tech", "SaaS", "E-commerce",
      "Enterprise Software", "Consulting", "Manufacturing",
      "Retail", "Education", "Media & Entertainment"
    ];

    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Define Your Target Focus</CardTitle>
          <CardDescription>
            Select the roles and industries you're targeting. We'll focus our questions on these areas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3">Target Roles</h3>
            <div className="flex flex-wrap gap-2">
              {commonRoles.map(role => (
                <Badge
                  key={role}
                  variant={targetRoles.includes(role) ? "default" : "outline"}
                  className="cursor-pointer px-4 py-2 text-sm"
                  onClick={() => toggleRole(role)}
                >
                  {role}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Target Industries</h3>
            <div className="flex flex-wrap gap-2">
              {commonIndustries.map(industry => (
                <Badge
                  key={industry}
                  variant={targetIndustries.includes(industry) ? "default" : "outline"}
                  className="cursor-pointer px-4 py-2 text-sm"
                  onClick={() => toggleIndustry(industry)}
                >
                  {industry}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button 
              onClick={() => setStep(3)}
              disabled={targetRoles.length === 0 || targetIndustries.length === 0}
              className="flex-1"
            >
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Step 3: Exclusions (Optional)
  const commonExclusions = [
    "Oil & Gas", "Tobacco", "Gambling", "Weapons",
    "Retail", "Fast Food", "Call Centers", "Insurance"
  ];

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Any Industries to Avoid?</CardTitle>
        <CardDescription>
          Optional: Select industries you don't want to pursue. This prevents us from asking irrelevant questions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-semibold mb-3">Exclude These Industries</h3>
          <div className="flex flex-wrap gap-2">
            {commonExclusions.map(industry => (
              <Badge
                key={industry}
                variant={excludedIndustries.includes(industry) ? "destructive" : "outline"}
                className="cursor-pointer px-4 py-2 text-sm"
                onClick={() => toggleExcludedIndustry(industry)}
              >
                {industry}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={() => setStep(2)}>
            Back
          </Button>
          <Button 
            onClick={handleComplete}
            className="flex-1"
          >
            Start Building My Vault
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
