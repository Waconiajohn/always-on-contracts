import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target, TrendingUp, Compass, ChevronRight, Loader2, Clock, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CareerFocusClarifierProps {
  onComplete: (data: {
    careerDirection: 'stay' | 'pivot' | 'explore';
    targetRoles: string[];
    targetIndustries: string[];
    excludedIndustries: string[];
  }) => void;
  detectedRole: string;
  detectedIndustry: string;
  resumeText: string;
}

export const CareerFocusClarifier = ({ 
  onComplete, 
  detectedRole,
  detectedIndustry,
  resumeText
}: CareerFocusClarifierProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [careerDirection, setCareerDirection] = useState<'stay' | 'pivot' | 'explore' | null>(null);
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [targetIndustries, setTargetIndustries] = useState<string[]>([]);
  const [excludedIndustries, setExcludedIndustries] = useState<string[]>([]);
  const [customRoles, setCustomRoles] = useState<string>("");
  const [customIndustries, setCustomIndustries] = useState<string>("");
  
  // AI suggestions for pivot
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestedRoles, setSuggestedRoles] = useState<string[]>([]);
  const [suggestedIndustries, setSuggestedIndustries] = useState<string[]>([]);

  const handleDirectionSelect = async (direction: 'stay' | 'pivot' | 'explore') => {
    setCareerDirection(direction);
    
    // Pre-populate based on direction
    if (direction === 'stay') {
      setTargetRoles([detectedRole]);
      setTargetIndustries([detectedIndustry]);
    } else if (direction === 'pivot') {
      // Load AI suggestions for adjacent roles/industries
      setIsLoadingSuggestions(true);
      try {
        const { data, error } = await supabase.functions.invoke('suggest-adjacent-roles', {
          body: {
            resumeText,
            currentRole: detectedRole,
            currentIndustry: detectedIndustry
          }
        });

        if (error) throw error;
        
        if (data?.suggestedRoles) {
          setSuggestedRoles(data.suggestedRoles);
        }
        if (data?.suggestedIndustries) {
          setSuggestedIndustries(data.suggestedIndustries);
        }
      } catch (error) {
        console.error('Error loading suggestions:', error);
        toast({
          title: 'Could not load suggestions',
          description: 'You can still manually select roles and industries.',
          variant: 'destructive'
        });
      } finally {
        setIsLoadingSuggestions(false);
      }
    }
    
    setStep(2);
  };

  const handleComplete = () => {
    // Parse custom inputs
    const customRolesList = customRoles
      .split(',')
      .map(r => r.trim())
      .filter(r => r.length > 0);
    const customIndustriesList = customIndustries
      .split(',')
      .map(i => i.trim())
      .filter(i => i.length > 0);

    const finalRoles = [...new Set([...targetRoles, ...customRolesList])];
    const finalIndustries = [...new Set([...targetIndustries, ...customIndustriesList])];

    if (!careerDirection || finalRoles.length === 0 || finalIndustries.length === 0) {
      toast({
        title: 'Incomplete Selection',
        description: 'Please select at least one role and one industry.',
        variant: 'destructive'
      });
      return;
    }
    
    onComplete({
      careerDirection,
      targetRoles: finalRoles,
      targetIndustries: finalIndustries,
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

  // Step 1: Career Direction with Realistic Messaging
  if (step === 1) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="text-sm">
              Detected: {detectedRole} in {detectedIndustry}
            </Badge>
          </div>
          <CardTitle className="text-2xl">Choose Your Career Path</CardTitle>
          <CardDescription>
            This determines how we'll focus your Career Vault. Staying in your field is the fastest path to re-employment.
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
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold">Stay in My Lane</h3>
                  <Badge variant="outline" className="text-xs bg-primary/5">Recommended</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Continue in {detectedRole} roles within {detectedIndustry}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Fastest re-employment</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Your experience translates directly</span>
                  </div>
                </div>
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
                <h3 className="text-lg font-semibold mb-1">Strategic Pivot</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Transition to adjacent roles or industries using transferable skills
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>2-4 month timeline</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>AI will suggest adjacent paths</span>
                  </div>
                </div>
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
                <h3 className="text-lg font-semibold mb-1">Full Exploration</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Open to opportunities across different roles and industries
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Timeline varies widely</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Compass className="w-3 h-3" />
                    <span>Maximum flexibility</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </button>
        </CardContent>
      </Card>
    );
  }

  // Step 2: Focus Refinement with Smart Defaults
  if (step === 2) {
    // Always start with detected role/industry from resume
    const baseRoles = detectedRole ? [detectedRole] : [];
    const baseIndustries = detectedIndustry ? [detectedIndustry] : [];

    // For pivot, use AI suggestions OR detected + similar variations
    // For explore, start with detected only (user adds more via custom input)
    // For stay, just detected role/industry (already pre-populated)
    const displayRoles = careerDirection === 'pivot' && suggestedRoles.length > 0 
      ? suggestedRoles 
      : baseRoles;
    const displayIndustries = careerDirection === 'pivot' && suggestedIndustries.length > 0
      ? suggestedIndustries
      : baseIndustries;

    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">
            {careerDirection === 'stay' && 'Confirm Your Target Focus'}
            {careerDirection === 'pivot' && 'AI-Suggested Adjacent Paths'}
            {careerDirection === 'explore' && 'Define Your Target Focus'}
          </CardTitle>
          <CardDescription>
            {careerDirection === 'stay' && 'Your detected role and industry are pre-filled. Add similar roles using the custom input below.'}
            {careerDirection === 'pivot' && 'Based on your transferable skills, these adjacent paths might be a good fit.'}
            {careerDirection === 'explore' && 'Your current role/industry is shown below. Add any other roles and industries you want to explore using the custom inputs.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoadingSuggestions && (
            <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Analyzing your transferable skills...</span>
            </div>
          )}

          {!isLoadingSuggestions && (
            <>
              <div>
                <h3 className="font-semibold mb-3">Target Roles</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {displayRoles.map(role => (
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
                <div>
                  <Label htmlFor="customRoles">Add More Roles (comma-separated)</Label>
                  <Input
                    id="customRoles"
                    placeholder="e.g., Senior Manager, Director of Engineering"
                    value={customRoles}
                    onChange={(e) => setCustomRoles(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Target Industries</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {displayIndustries.map(industry => (
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
                <div>
                  <Label htmlFor="customIndustries">Add More Industries (comma-separated)</Label>
                  <Input
                    id="customIndustries"
                    placeholder="e.g., Healthcare, Financial Services"
                    value={customIndustries}
                    onChange={(e) => setCustomIndustries(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setStep(1)} disabled={isLoadingSuggestions}>
              Back
            </Button>
            <Button 
              onClick={() => setStep(3)}
              disabled={isLoadingSuggestions || (targetRoles.length === 0 && !customRoles) || (targetIndustries.length === 0 && !customIndustries)}
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
          Optional: Select industries you don't want to pursue. This helps us avoid asking irrelevant questions.
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