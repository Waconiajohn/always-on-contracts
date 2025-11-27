// =====================================================
// CAREER DIRECTION STEP - Career Vault 2.0
// =====================================================
// AI-POWERED CAREER PATH DISCOVERY
//
// Unlike job boards that only match keywords, we identify
// career opportunities based on TRANSFERABLE SKILLS and
// market demand—including paths you never considered.
//
// MARKETING MESSAGE:
// "Our AI analyzes 1000s of career transitions to suggest
// paths with high success rates. Match scores show exactly
// how well your background aligns."
// =====================================================

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Target,
  TrendingUp,
  Compass,
  Sparkles,
  Plus,
  X,
  Loader2,
  ArrowRight,
  Zap,
  Quote
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseClient } from '@/hooks/useAuth';
import { AIProgressIndicator } from './AIProgressIndicator';
import { validateInput, invokeEdgeFunction, SuggestCareerPathsSchema } from '@/lib/edgeFunction';
import { logger } from '@/lib/logger';

interface CareerDirectionStepProps {
  onComplete: (data: {
    careerDirection: 'stay' | 'pivot' | 'explore';
    targetRoles: string[];
    targetIndustries: string[];
  }) => void;
  initialAnalysis: any;
  vaultId: string;
}

export default function CareerDirectionStep({
  onComplete,
  initialAnalysis,
  vaultId,
}: CareerDirectionStepProps) {
  const [careerDirection, setCareerDirection] = useState<'stay' | 'pivot' | 'explore' | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestedRoles, setSuggestedRoles] = useState<any[]>([]);
  const [suggestedIndustries, setSuggestedIndustries] = useState<any[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [customRole, setCustomRole] = useState('');
  const [customIndustry, setCustomIndustry] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const supabase = useSupabaseClient();
  const { toast } = useToast();

  // Load AI suggestions when direction is selected
  useEffect(() => {
    if (careerDirection && suggestedRoles.length === 0) {
      loadCareerSuggestions();
    }
  }, [careerDirection]);

  const loadCareerSuggestions = async () => {
    setIsLoadingSuggestions(true);

    try {
      const validated = validateInput(SuggestCareerPathsSchema, {
        resumeAnalysis: initialAnalysis,
        careerDirection,
        currentRole: initialAnalysis.detectedRole,
        currentIndustry: initialAnalysis.detectedIndustry
      });

      const { data, error } = await invokeEdgeFunction(
        'suggest-career-paths',
        validated
      );

      if (error || !data?.success) {
        throw new Error(error?.message || data?.error || 'Failed to generate suggestions');
      }

      setSuggestedRoles(data.data.suggestedRoles || []);
      setSuggestedIndustries(data.data.suggestedIndustries || []);

      // Auto-select current role/industry if "stay" direction
      if (careerDirection === 'stay') {
        setSelectedRoles([initialAnalysis.detectedRole]);
        setSelectedIndustries([initialAnalysis.detectedIndustry]);
      }

      toast({
        title: '🎯 AI Suggestions Ready',
        description: data.meta?.message || 'Career path suggestions generated',
      });

      // Show marketing message if available
      if (data.meta?.uniqueValue) {
        setTimeout(() => {
          toast({
            title: '✨ What Makes Us Different',
            description: data.meta.uniqueValue,
            duration: 5000,
          });
        }, 2000);
      }
    } catch (err: any) {
      logger.error('Suggestion error', err);
      toast({
        title: 'Suggestion Failed',
        description: err.message || 'Could not generate suggestions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleContinue = async () => {
    if (selectedRoles.length === 0) {
      toast({
        title: 'Selection Required',
        description: 'Please select at least one target role',
        variant: 'destructive',
      });
      return;
    }

    if (selectedIndustries.length === 0) {
      toast({
        title: 'Selection Required',
        description: 'Please select at least one target industry',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      // Update vault with career direction and targets
      const { error } = await supabase
        .from('career_vault')
        .update({
          career_direction: careerDirection,
          target_roles: selectedRoles,
          target_industries: selectedIndustries,
          onboarding_step: 'targets_set',
        } as any)
        .eq('id', vaultId);

      if (error) throw error;

      onComplete({
        careerDirection: careerDirection!,
        targetRoles: selectedRoles,
        targetIndustries: selectedIndustries,
      });
    } catch (err: any) {
      logger.error('Save error', err);
      toast({
        title: 'Save Failed',
        description: err.message,
        variant: 'destructive',
      });
      setIsSaving(false);
    }
  };

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const toggleIndustry = (industry: string) => {
    setSelectedIndustries((prev) =>
      prev.includes(industry) ? prev.filter((i) => i !== industry) : [...prev, industry]
    );
  };

  const addCustomRole = () => {
    if (customRole.trim() && !selectedRoles.includes(customRole.trim())) {
      setSelectedRoles([...selectedRoles, customRole.trim()]);
      setCustomRole('');
    }
  };

  const addCustomIndustry = () => {
    if (customIndustry.trim() && !selectedIndustries.includes(customIndustry.trim())) {
      setSelectedIndustries([...selectedIndustries, customIndustry.trim()]);
      setCustomIndustry('');
    }
  };

  return (
    <Card className="bg-background/80 backdrop-blur-sm border-border shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Compass className="w-6 h-6 text-accent" />
          What's Your Career Goal?
        </CardTitle>
        <CardDescription>
          Tell us your direction, and our AI will suggest personalized paths
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Marketing message */}
        <Alert className="border-accent/20 bg-accent/5">
          <Sparkles className="w-4 h-4 text-accent" />
          <AlertDescription className="text-sm text-muted-foreground">
            <strong className="text-accent">AI-Powered Intelligence:</strong> Unlike job boards that
            just match keywords, we analyze your transferable skills and market trends to suggest
            careers with <strong>quantified match scores</strong>—including opportunities you never considered.
          </AlertDescription>
        </Alert>

        {/* Direction Selection */}
        {!careerDirection && (
          <div className="grid md:grid-cols-3 gap-4">
            <DirectionCard
              icon={Target}
              title="Stay in My Field"
              description="Advance within your current industry and role"
              onClick={() => setCareerDirection('stay')}
              color="info"
            />
            <DirectionCard
              icon={TrendingUp}
              title="Pivot"
              description="Transition to a new industry or role"
              onClick={() => setCareerDirection('pivot')}
              color="accent"
            />
            <DirectionCard
              icon={Compass}
              title="Explore Options"
              description="See diverse opportunities across multiple paths"
              onClick={() => setCareerDirection('explore')}
              color="warning"
            />
          </div>
        )}

        {/* Loading suggestions with progress indicator */}
        {careerDirection && isLoadingSuggestions && (
          <div className="py-8">
            <AIProgressIndicator
              stages={[
                { id: 'extract', label: 'Extracting your key achievements and skills', duration: 2000 },
                { id: 'analyze', label: 'Analyzing 10,000+ career transitions', duration: 2500 },
                { id: 'match', label: 'Matching your background to opportunities', duration: 2000 },
                { id: 'score', label: 'Calculating match scores and evidence', duration: 1500 },
              ]}
            />
          </div>
        )}

        {/* Role Selection */}
        {careerDirection && !isLoadingSuggestions && suggestedRoles.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Zap className="w-5 h-5 text-warning" />
                Select Target Roles (1-3 recommended)
              </h3>
              <Badge variant="outline" className="bg-info/5 text-info border-info/20">
                {selectedRoles.length} selected
              </Badge>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              {suggestedRoles.map((role, index) => (
                <RoleSuggestionCard
                  key={index}
                  role={role}
                  isSelected={selectedRoles.includes(role.title)}
                  onToggle={() => toggleRole(role.title)}
                />
              ))}
            </div>

            {/* Custom role input */}
            <div className="flex gap-2">
              <Input
                placeholder="Add custom role (e.g., VP of Product)"
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCustomRole()}
              />
              <Button onClick={addCustomRole} variant="outline" size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Selected roles */}
            {selectedRoles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedRoles.map((role) => (
                  <Badge key={role} variant="secondary" className="gap-2 py-1.5 px-3">
                    {role}
                    <button
                      onClick={() => toggleRole(role)}
                      className="hover:bg-slate-200 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Industry Selection */}
        {careerDirection && !isLoadingSuggestions && suggestedIndustries.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-success" />
                Select Target Industries (1-3 recommended)
              </h3>
              <Badge variant="outline" className="bg-success/5 text-success border-success/20">
                {selectedIndustries.length} selected
              </Badge>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              {suggestedIndustries.map((industry, index) => (
                <IndustrySuggestionCard
                  key={index}
                  industry={industry}
                  isSelected={selectedIndustries.includes(industry.industry)}
                  onToggle={() => toggleIndustry(industry.industry)}
                />
              ))}
            </div>

            {/* Custom industry input */}
            <div className="flex gap-2">
              <Input
                placeholder="Add custom industry (e.g., Clean Energy)"
                value={customIndustry}
                onChange={(e) => setCustomIndustry(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCustomIndustry()}
              />
              <Button onClick={addCustomIndustry} variant="outline" size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Selected industries */}
            {selectedIndustries.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedIndustries.map((industry) => (
                  <Badge key={industry} variant="secondary" className="gap-2 py-1.5 px-3">
                    {industry}
                    <button
                      onClick={() => toggleIndustry(industry)}
                      className="hover:bg-slate-200 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Continue button */}
        {selectedRoles.length > 0 && selectedIndustries.length > 0 && (
          <div className="pt-4">
            <Button
              onClick={handleContinue}
              disabled={isSaving}
              className="w-full"
              size="lg"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Continue to Market Research
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>

            <p className="text-sm text-center text-muted-foreground mt-3">
              Next: We'll research live industry standards for your selected paths
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Direction Card Component
function DirectionCard({
  icon: Icon,
  title,
  description,
  onClick,
  color,
}: {
  icon: any;
  title: string;
  description: string;
  onClick: () => void;
  color: string;
}) {
  const colorClasses = {
    info: 'bg-info hover:bg-info/90',
    accent: 'bg-accent hover:bg-accent/90',
    warning: 'bg-warning hover:bg-warning/90',
  };

  return (
    <button
      onClick={onClick}
      className={`${colorClasses[color as keyof typeof colorClasses]} text-primary-foreground p-6 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-left`}
    >
      <Icon className="w-8 h-8 mb-3" />
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm opacity-90">{description}</p>
    </button>
  );
}

// Role Suggestion Card
function RoleSuggestionCard({
  role,
  isSelected,
  onToggle,
}: {
  role: any;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const matchPercentage = Math.round(role.matchScore * 100);
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div
      className={`border-2 rounded-lg transition-all ${
        isSelected
          ? 'border-info bg-info/5 shadow-md'
          : 'border-border hover:border-info/50 hover:bg-accent/5'
      }`}
    >
      <div onClick={onToggle} className="p-4 cursor-pointer">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-start gap-2">
            <Checkbox checked={isSelected} className="mt-1" />
            <div className="flex-1">
              <h4 className="font-semibold text-foreground">{role.title}</h4>
              <p className="text-xs text-muted-foreground mt-1">{role.reasoning}</p>
            </div>
          </div>
          <Badge
            variant={matchPercentage >= 80 ? 'default' : matchPercentage >= 60 ? 'secondary' : 'outline'}
            className="ml-2 flex-shrink-0"
          >
            {matchPercentage}% match
          </Badge>
        </div>

        {/* Match Score Breakdown */}
        {role.matchBreakdown && (
          <div className="mt-3 pt-3 border-t border-border space-y-2">
            <p className="text-xs font-medium text-foreground">Match Breakdown:</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <div className="text-lg font-bold text-info">
                  {Math.round(role.matchBreakdown.technicalSkills * 100)}%
                </div>
                <div className="text-xs text-muted-foreground">Technical</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-accent">
                  {Math.round(role.matchBreakdown.leadership * 100)}%
                </div>
                <div className="text-xs text-muted-foreground">Leadership</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-success">
                  {Math.round(role.matchBreakdown.industryAlignment * 100)}%
                </div>
                <div className="text-xs text-muted-foreground">Industry</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Evidence Section */}
      {role.resumeEvidence && role.resumeEvidence.length > 0 && (
        <div className="px-4 pb-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDetails(!showDetails);
            }}
            className="text-xs text-accent hover:text-accent/80 font-medium flex items-center gap-1"
          >
            <Quote className="w-3 h-3" />
            {showDetails ? 'Hide' : 'Show'} AI Evidence from Your Resume
          </button>

          {showDetails && (
            <div className="mt-2 space-y-1.5 bg-accent/5 rounded-lg p-3 border border-accent/20">
              {role.resumeEvidence.map((evidence: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground italic">"{evidence}"</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Industry Suggestion Card
function IndustrySuggestionCard({
  industry,
  isSelected,
  onToggle,
}: {
  industry: any;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const transferPercentage = Math.round(industry.transferability * 100);

  return (
    <div
      onClick={onToggle}
      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
        isSelected
          ? 'border-success bg-success/5 shadow-md'
          : 'border-border hover:border-success/50 hover:bg-accent/5'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-2">
          <Checkbox checked={isSelected} className="mt-1" />
          <div>
            <h4 className="font-semibold text-foreground">{industry.industry}</h4>
            <p className="text-xs text-muted-foreground mt-1">{industry.whyYouMatch}</p>
          </div>
        </div>
        <Badge
          variant={industry.growthTrend === 'growing' ? 'default' : 'secondary'}
          className="ml-2"
        >
          {transferPercentage}%
        </Badge>
      </div>
    </div>
  );
}
