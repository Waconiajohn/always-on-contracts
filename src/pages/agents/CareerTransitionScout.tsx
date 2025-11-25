import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useVaultData } from '@/hooks/useVaultData';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Target, 
  Sparkles, 
  ArrowRight,
  Briefcase,
  DollarSign,
  Users,
  Clock,
  CheckCircle2,
  Award,
  Search
} from 'lucide-react';

interface TransitionOpportunity {
  targetIndustry: string;
  targetRoles: string[];
  skillArbitrage: {
    premiumSkills: string[];
    valueMultiplier: string;
    reasoning: string;
  };
  salaryRange: string;
  demandTrend: string;
  competitionLevel: string;
  transitionDifficulty: string;
  timeToTransition: string;
  actionableSteps: string[];
  certifications?: string[];
  networkingTargets?: string[];
  sources: string[];
}

interface ResearchResult {
  currentIndustryOutlook: {
    status: string;
    aiThreatLevel: string;
    timeHorizon: string;
    reasoning: string;
    sources: string[];
  };
  transitionOpportunities: TransitionOpportunity[];
  hiddenAdvantages: string[];
  immediateActions: string[];
  researchSources: string[];
  lastUpdated: string;
}

const CareerTransitionScout = () => {
  const { user } = useAuth();
  const { data: vaultData, isLoading: vaultLoading } = useVaultData(user?.id);
  const [isResearching, setIsResearching] = useState(false);
  const [research, setResearch] = useState<ResearchResult | null>(null);
  const navigate = useNavigate();

  const handleAnalyze = async () => {
    if (!user) {
      toast.error('Please sign in to analyze your career transitions');
      return;
    }

    if (!vaultData?.vault?.id) {
      toast.error('Please complete your career vault first');
      navigate('/career-vault');
      return;
    }

    setIsResearching(true);

    try {
      const { data, error } = await supabase.functions.invoke('career-transition-research', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data.success && data.research) {
        setResearch(data.research);
        toast.success('Career transition analysis complete!');
      } else {
        throw new Error('No research results returned');
      }
    } catch (error) {
      console.error('Research error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to analyze transitions');
    } finally {
      setIsResearching(false);
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'growing') return <TrendingUp className="h-5 w-5 text-green-500" />;
    if (status === 'declining') return <TrendingDown className="h-5 w-5 text-red-500" />;
    return <TrendingUp className="h-5 w-5 text-yellow-500" />;
  };

  const getThreatColor = (level: string) => {
    if (level === 'critical') return 'bg-red-500';
    if (level === 'high') return 'bg-orange-500';
    if (level === 'medium') return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getDifficultyColor = (difficulty: string) => {
    if (difficulty === 'easy') return 'success';
    if (difficulty === 'hard') return 'destructive';
    return 'secondary';
  };

  const handleSearchRoles = (roles: string[]) => {
    const searchQuery = roles.join(' OR ');
    navigate(`/job-search?q=${encodeURIComponent(searchQuery)}`);
  };

  if (vaultLoading) {
    return (
      <div className="container max-w-7xl mx-auto p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-primary" />
          Career Transition Scout
        </h1>
        <p className="text-muted-foreground">
          Discover high-value career opportunities across industries using your vault data and real-time market intelligence
        </p>
      </div>

      {/* Vault Status Card */}
      {!research && (
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Your Career Vault</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{vaultData?.powerPhrases?.length || 0} achievements</span>
                  <span>{vaultData?.transferableSkills?.length || 0} skills</span>
                  <span>{vaultData?.hiddenCompetencies?.length || 0} competencies</span>
                </div>
              </div>
              <Button 
                onClick={handleAnalyze} 
                disabled={isResearching}
                size="lg"
                className="gap-2"
              >
                {isResearching ? (
                  <>Analyzing Your Opportunities...</>
                ) : (
                  <>
                    <Target className="h-4 w-4" />
                    Analyze My Transition Options
                  </>
                )}
              </Button>
            </div>
            
            {vaultData?.vault?.overall_strength_score && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Vault Strength</span>
                  <span>{vaultData.vault.overall_strength_score}%</span>
                </div>
                <Progress value={vaultData.vault.overall_strength_score} className="h-2" />
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Research Results */}
      {research && (
        <div className="space-y-6">
          {/* Current Industry Outlook */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  {getStatusIcon(research.currentIndustryOutlook.status)}
                  Current Industry Outlook
                </h2>
                <Badge variant="outline">
                  {research.currentIndustryOutlook.timeHorizon}
                </Badge>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Industry Status</p>
                  <Badge variant={research.currentIndustryOutlook.status === 'growing' ? 'default' : 'secondary'}>
                    {research.currentIndustryOutlook.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">AI Threat Level</p>
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${getThreatColor(research.currentIndustryOutlook.aiThreatLevel)}`} />
                    <span className="font-medium capitalize">{research.currentIndustryOutlook.aiThreatLevel}</span>
                  </div>
                </div>
              </div>
              
              <p className="text-sm">{research.currentIndustryOutlook.reasoning}</p>
            </div>
          </Card>

          {/* Transition Opportunities */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              High-Value Transition Opportunities
            </h2>
            
            {research.transitionOpportunities.map((opportunity, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">{opportunity.targetIndustry}</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {opportunity.targetRoles.map((role, idx) => (
                          <Badge key={idx} variant="outline" className="font-normal">
                            <Briefcase className="h-3 w-3 mr-1" />
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleSearchRoles(opportunity.targetRoles)}
                      className="gap-2"
                    >
                      <Search className="h-4 w-4" />
                      Search Jobs
                    </Button>
                  </div>

                  {/* Skill Arbitrage */}
                  <div className="bg-primary/5 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <span className="font-semibold">Skill Arbitrage: {opportunity.skillArbitrage.valueMultiplier}</span>
                    </div>
                    <p className="text-sm">{opportunity.skillArbitrage.reasoning}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {opportunity.skillArbitrage.premiumSkills.map((skill, idx) => (
                        <Badge key={idx} className="bg-primary/20 text-primary">
                          <Award className="h-3 w-3 mr-1" />
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Salary Range</p>
                      <p className="font-semibold flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {opportunity.salaryRange}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Demand</p>
                      <Badge variant={opportunity.demandTrend.includes('high') ? 'default' : 'secondary'}>
                        {opportunity.demandTrend}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Competition</p>
                      <Badge variant="outline">
                        <Users className="h-3 w-3 mr-1" />
                        {opportunity.competitionLevel}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Timeline</p>
                      <p className="font-semibold flex items-center gap-1 text-sm">
                        <Clock className="h-4 w-4" />
                        {opportunity.timeToTransition}
                      </p>
                    </div>
                  </div>

                  {/* Transition Difficulty */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Transition Difficulty:</span>
                    <Badge variant={getDifficultyColor(opportunity.transitionDifficulty) as any}>
                      {opportunity.transitionDifficulty}
                    </Badge>
                  </div>

                  {/* Action Steps */}
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Action Steps
                    </h4>
                    <ul className="space-y-1">
                      {opportunity.actionableSteps.map((step, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Certifications & Networking */}
                  {(opportunity.certifications?.length || opportunity.networkingTargets?.length) && (
                    <div className="grid md:grid-cols-2 gap-4">
                      {opportunity.certifications && opportunity.certifications.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Recommended Certifications</h4>
                          <div className="flex flex-wrap gap-2">
                            {opportunity.certifications.map((cert, idx) => (
                              <Badge key={idx} variant="secondary">{cert}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {opportunity.networkingTargets && opportunity.networkingTargets.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Networking Targets</h4>
                          <div className="flex flex-wrap gap-2">
                            {opportunity.networkingTargets.map((target, idx) => (
                              <Badge key={idx} variant="outline">{target}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Hidden Advantages */}
          {research.hiddenAdvantages && research.hiddenAdvantages.length > 0 && (
            <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Your Hidden Advantages
              </h3>
              <ul className="space-y-2">
                {research.hiddenAdvantages.map((advantage, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{advantage}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Immediate Actions */}
          {research.immediateActions && research.immediateActions.length > 0 && (
            <Card className="p-6 border-primary">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                Immediate Actions
              </h3>
              <ul className="space-y-2">
                {research.immediateActions.map((action, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="font-medium">{action}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Research Again Button */}
          <div className="flex justify-center">
            <Button 
              onClick={handleAnalyze} 
              disabled={isResearching}
              variant="outline"
              size="lg"
            >
              {isResearching ? 'Analyzing...' : 'Run New Analysis'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CareerTransitionScout;