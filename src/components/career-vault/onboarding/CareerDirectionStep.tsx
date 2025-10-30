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
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

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
      const { data, error } = await supabase.functions.invoke('suggest-career-paths', {
        body: {
          resumeAnalysis: initialAnalysis,
          careerDirection,
          currentRole: initialAnalysis.detectedRole,
          currentIndustry: initialAnalysis.detectedIndustry,
        },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate suggestions');
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
    } catch (err: any) {
      console.error('Suggestion error:', err);
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
        })
        .eq('id', vaultId);

      if (error) throw error;

      onComplete({
        careerDirection: careerDirection!,
        targetRoles: selectedRoles,
        targetIndustries: selectedIndustries,
      });
    } catch (err: any) {
      console.error('Save error:', err);
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
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Compass className="w-6 h-6 text-purple-600" />
          What's Your Career Goal?
        </CardTitle>
        <CardDescription>
          Tell us your direction, and our AI will suggest personalized paths
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Marketing message */}
        <Alert className="border-purple-200 bg-purple-50">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <AlertDescription className="text-sm text-slate-700">
            <strong className="text-purple-700">AI-Powered Intelligence:</strong> Unlike job boards that
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
              color="blue"
            />
            <DirectionCard
              icon={TrendingUp}
              title="Pivot"
              description="Transition to a new industry or role"
              onClick={() => setCareerDirection('pivot')}
              color="purple"
            />
            <DirectionCard
              icon={Compass}
              title="Explore Options"
              description="See diverse opportunities across multiple paths"
              onClick={() => setCareerDirection('explore')}
              color="indigo"
            />
          </div>
        )}

        {/* Loading suggestions */}
        {careerDirection && isLoadingSuggestions && (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 text-purple-600 mx-auto animate-spin mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              AI Analyzing Career Paths...
            </h3>
            <p className="text-slate-600 max-w-md mx-auto">
              We're analyzing thousands of career transitions to find the best matches for your
              background and {careerDirection === 'stay' ? 'advancement goals' : careerDirection === 'pivot' ? 'pivot goals' : 'exploration goals'}...
            </p>
          </div>
        )}

        {/* Role Selection */}
        {careerDirection && !isLoadingSuggestions && suggestedRoles.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-600" />
                Select Target Roles (1-3 recommended)
              </h3>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
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
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Select Target Industries (1-3 recommended)
              </h3>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
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

            <p className="text-sm text-center text-slate-600 mt-3">
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
    blue: 'from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
    purple: 'from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800',
    indigo: 'from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800',
  };

  return (
    <button
      onClick={onClick}
      className={`bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} text-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-left`}
    >
      <Icon className="w-8 h-8 mb-3" />
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm text-white/90">{description}</p>
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

  return (
    <div
      onClick={onToggle}
      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-2">
          <Checkbox checked={isSelected} className="mt-1" />
          <div>
            <h4 className="font-semibold text-slate-900">{role.title}</h4>
            <p className="text-xs text-slate-600 mt-1">{role.reasoning}</p>
          </div>
        </div>
        <Badge
          variant={matchPercentage >= 80 ? 'default' : matchPercentage >= 60 ? 'secondary' : 'outline'}
          className="ml-2"
        >
          {matchPercentage}% match
        </Badge>
      </div>
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
          ? 'border-green-500 bg-green-50 shadow-md'
          : 'border-slate-200 hover:border-green-300 hover:bg-slate-50'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-2">
          <Checkbox checked={isSelected} className="mt-1" />
          <div>
            <h4 className="font-semibold text-slate-900">{industry.industry}</h4>
            <p className="text-xs text-slate-600 mt-1">{industry.whyYouMatch}</p>
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
