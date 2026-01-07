import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useOptimizerStore } from '@/stores/optimizerStore';
import { FitMapEntry, EvidenceUnit, AtomicRequirement, BenchmarkTheme } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  ChevronDown, 
  ChevronRight, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2, 
  AlertCircle, 
  XCircle,
  Sparkles,
  Target,
  FileText,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';

type FitCategory = 'HIGHLY QUALIFIED' | 'PARTIALLY QUALIFIED' | 'EXPERIENCE GAP';

const CATEGORY_CONFIG: Record<FitCategory, {
  title: string;
  description: string;
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}> = {
  'HIGHLY QUALIFIED': {
    title: 'Highly Qualified',
    description: 'Strong evidence supporting your fit',
    icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
    colorClass: 'text-emerald-700',
    bgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-200'
  },
  'PARTIALLY QUALIFIED': {
    title: 'Partially Qualified',
    description: 'Areas needing strategic positioning',
    icon: <AlertCircle className="h-5 w-5 text-amber-600" />,
    colorClass: 'text-amber-700',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200'
  },
  'EXPERIENCE GAP': {
    title: 'Experience Gaps',
    description: 'Missing qualifications requiring creative addressing',
    icon: <XCircle className="h-5 w-5 text-red-600" />,
    colorClass: 'text-red-700',
    bgClass: 'bg-red-50',
    borderClass: 'border-red-200'
  }
};

const RISK_COLORS = {
  'Low': 'bg-emerald-100 text-emerald-700',
  'Medium': 'bg-amber-100 text-amber-700',
  'High': 'bg-red-100 text-red-700'
};

const STRENGTH_COLORS = {
  'strong': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'moderate': 'bg-blue-100 text-blue-700 border-blue-200',
  'weak': 'bg-amber-100 text-amber-700 border-amber-200',
  'inference': 'bg-gray-100 text-gray-600 border-gray-200'
};

export function Step2GapAnalysis() {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Zustand store
  const resumeText = useOptimizerStore(state => state.resumeText);
  const jobDescription = useOptimizerStore(state => state.jobDescription);
  const fitBlueprint = useOptimizerStore(state => state.fitBlueprint);
  const setFitBlueprint = useOptimizerStore(state => state.setFitBlueprint);
  const setProcessing = useOptimizerStore(state => state.setProcessing);
  const goToNextStep = useOptimizerStore(state => state.goToNextStep);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<FitCategory, boolean>>({
    'HIGHLY QUALIFIED': true,
    'PARTIALLY QUALIFIED': true,
    'EXPERIENCE GAP': true
  });
  const [showEvidence, setShowEvidence] = useState(false);
  
  
  useEffect(() => {
    if (!fitBlueprint && resumeText && jobDescription) {
      runAnalysis();
    }
  }, []);
  
  const runAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    setProcessing(true, 'Building Fit Blueprint...');
    
    try {
      const { data, error: apiError } = await supabase.functions.invoke('fit-blueprint', {
        body: {
          resumeText,
          jobDescription
        }
      });
      
      if (apiError) {
        if (apiError.message?.includes('429') || apiError.message?.includes('rate limit')) {
          setError('You\'ve reached your usage limit. Please try again later.');
          toast({
            title: 'Rate Limit Reached',
            description: 'Please wait a moment before trying again.',
            variant: 'destructive'
          });
          return;
        }
        if (apiError.message?.includes('402') || apiError.message?.includes('payment')) {
          setError('This feature requires an active subscription.');
          toast({
            title: 'Subscription Required',
            description: 'Please upgrade to access this feature.',
            variant: 'destructive'
          });
          return;
        }
        throw apiError;
      }
      
      setFitBlueprint(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Could not build fit blueprint';
      console.error('Fit blueprint error:', err);
      setError(errorMessage);
      toast({
        title: 'Analysis Failed',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
      setProcessing(false);
    }
  };
  
  const toggleSection = (category: FitCategory) => {
    setExpandedSections(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const getEvidenceById = (evidenceId: string): EvidenceUnit | undefined => {
    return fitBlueprint?.evidenceInventory.find(e => e.id === evidenceId);
  };

  const getRequirementById = (reqId: string): AtomicRequirement | undefined => {
    return fitBlueprint?.requirements.find(r => r.id === reqId);
  };

  const renderEvidenceTag = (evidenceId: string) => {
    const evidence = getEvidenceById(evidenceId);
    if (!evidence) return <Badge variant="outline" className="text-xs">{evidenceId}</Badge>;
    
    return (
      <TooltipProvider key={evidenceId}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className={cn("text-xs cursor-help", STRENGTH_COLORS[evidence.strength])}
            >
              {evidenceId}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-sm">
            <div className="space-y-1">
              <p className="font-medium text-xs">{evidence.sourceRole}</p>
              <p className="text-xs">{evidence.text}</p>
              <Badge variant="secondary" className="text-xs mt-1">{evidence.strength}</Badge>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const renderRequirementCard = (entry: FitMapEntry) => {
    const requirement = getRequirementById(entry.requirementId);
    if (!requirement) return null;
    
    return (
      <Card key={entry.requirementId} className="overflow-hidden">
        <CardContent className="p-4 space-y-3">
          {/* Requirement header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs font-mono">{requirement.id}</Badge>
                <Badge variant="secondary" className="text-xs">{requirement.type}</Badge>
                <Badge variant="outline" className="text-xs">{requirement.senioritySignal}</Badge>
              </div>
              <h4 className="font-medium text-sm">{requirement.requirement}</h4>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge className={cn("text-xs", RISK_COLORS[entry.riskLevel])}>
                {entry.riskLevel} Risk
              </Badge>
              <span className="text-xs text-muted-foreground">{entry.confidence}</span>
            </div>
          </div>
          
          {/* Rationale */}
          <p className="text-xs text-muted-foreground">{entry.rationale}</p>
          
          {/* Gap Taxonomy (for partial/gaps) */}
          {entry.gapTaxonomy && entry.gapTaxonomy.length > 0 && (
            <div className="flex flex-wrap gap-1">
              <span className="text-xs text-muted-foreground mr-1">Gap Type:</span>
              {entry.gapTaxonomy.map((gap, idx) => (
                <Badge key={idx} variant="destructive" className="text-xs">
                  {gap}
                </Badge>
              ))}
            </div>
          )}
          
          {/* Evidence Citations */}
          {entry.evidenceIds && entry.evidenceIds.length > 0 && (
            <div className="flex flex-wrap gap-1 items-center">
              <span className="text-xs text-muted-foreground mr-1">Evidence:</span>
              {entry.evidenceIds.map(renderEvidenceTag)}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };
  
  const renderSection = (category: FitCategory, entries: FitMapEntry[]) => {
    const config = CATEGORY_CONFIG[category];
    const isExpanded = expandedSections[category];
    
    if (entries.length === 0) return null;
    
    return (
      <Collapsible
        key={category}
        open={isExpanded}
        onOpenChange={() => toggleSection(category)}
        className={cn('rounded-lg border', config.borderClass, config.bgClass)}
      >
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-background/50 transition-colors">
            <div className="flex items-center gap-3">
              {config.icon}
              <div>
                <h3 className={cn('font-semibold', config.colorClass)}>{config.title}</h3>
                <p className="text-xs text-muted-foreground">{config.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">{entries.length}</Badge>
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-4 pt-0 space-y-3">
            {entries.map(renderRequirementCard)}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  const renderBenchmarkTheme = (theme: BenchmarkTheme, index: number) => (
    <Card key={index} className="border-primary/20 bg-primary/5">
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-primary mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium">{theme.theme}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {theme.evidenceIds.map(renderEvidenceTag)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderExecutiveSummary = () => {
    if (!fitBlueprint?.executiveSummary) return null;
    const { hireSignal, likelyObjections, mitigationStrategy, bestPositioningAngle } = fitBlueprint.executiveSummary;
    
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-medium flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              Hire Signal
            </h4>
            <p className="text-sm text-muted-foreground">{hireSignal}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium flex items-center gap-2 mb-1">
              <Lightbulb className="h-4 w-4 text-primary" />
              Best Positioning Angle
            </h4>
            <p className="text-sm text-muted-foreground">{bestPositioningAngle}</p>
          </div>
          
          {likelyObjections.length > 0 && (
            <div>
              <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Likely Objections & Mitigations
              </h4>
              <div className="space-y-2">
                {likelyObjections.map((objection, idx) => (
                  <div key={idx} className="text-sm p-2 rounded bg-muted/50">
                    <p className="text-amber-700 font-medium">⚠️ {objection}</p>
                    {mitigationStrategy[idx] && (
                      <p className="text-emerald-700 mt-1">✓ {mitigationStrategy[idx]}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderATSAlignment = () => {
    if (!fitBlueprint?.atsAlignment) return null;
    const { covered, missingButAddable, missingRequiresExperience } = fitBlueprint.atsAlignment;
    
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            ATS Keyword Alignment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {covered.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-emerald-700 mb-2">✓ Keywords Covered ({covered.length})</h4>
              <div className="flex flex-wrap gap-1">
                {covered.map((item, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs bg-emerald-50 border-emerald-200 text-emerald-700">
                    {item.keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {missingButAddable.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-amber-700 mb-2">⚡ Can Be Added ({missingButAddable.length})</h4>
              <div className="flex flex-wrap gap-1">
                {missingButAddable.map((item, idx) => (
                  <TooltipProvider key={idx}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="text-xs bg-amber-50 border-amber-200 text-amber-700 cursor-help">
                          {item.keyword}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Add to: {item.whereToAdd}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          )}
          
          {missingRequiresExperience.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-red-700 mb-2">✗ Requires Experience ({missingRequiresExperience.length})</h4>
              <div className="flex flex-wrap gap-1">
                {missingRequiresExperience.map((item, idx) => (
                  <TooltipProvider key={idx}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="text-xs bg-red-50 border-red-200 text-red-700 cursor-help">
                          {item.keyword}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">{item.whyGap}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderEvidenceInventory = () => {
    if (!fitBlueprint?.evidenceInventory) return null;
    
    return (
      <Collapsible open={showEvidence} onOpenChange={setShowEvidence}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Evidence Inventory ({fitBlueprint.evidenceInventory.length} items)
                </CardTitle>
                {showEvidence ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {fitBlueprint.evidenceInventory.map((evidence) => (
                    <div 
                      key={evidence.id} 
                      className={cn(
                        "p-3 rounded-lg border",
                        STRENGTH_COLORS[evidence.strength]
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs font-mono">{evidence.id}</Badge>
                            <span className="text-xs text-muted-foreground">{evidence.sourceRole}</span>
                          </div>
                          <p className="text-sm">{evidence.text}</p>
                        </div>
                        <Badge variant="secondary" className="text-xs">{evidence.strength}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  };
  
  // Loading state
  if (isLoading || (!fitBlueprint && !error)) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Building your Fit Blueprint...</p>
          <p className="text-xs text-muted-foreground mt-2">This thorough analysis may take 30-60 seconds</p>
        </CardContent>
      </Card>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-destructive mb-4">{error}</p>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/quick-score')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button onClick={runAnalysis}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group fit map entries by category
  const highlyQualified = fitBlueprint!.fitMap.filter(e => e.category === 'HIGHLY QUALIFIED');
  const partiallyQualified = fitBlueprint!.fitMap.filter(e => e.category === 'PARTIALLY QUALIFIED');
  const experienceGaps = fitBlueprint!.fitMap.filter(e => e.category === 'EXPERIENCE GAP');
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Fit Blueprint Complete</CardTitle>
              <CardDescription>
                Analyzed {fitBlueprint!.requirements.length} requirements against {fitBlueprint!.evidenceInventory.length} evidence points
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">{fitBlueprint!.overallFitScore}%</div>
              <div className="text-xs text-muted-foreground">Overall Fit</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Fit Score</span>
              <span>{fitBlueprint!.overallFitScore}%</span>
            </div>
            <Progress value={fitBlueprint!.overallFitScore} className="h-2" />
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <div className="text-2xl font-bold text-emerald-700">{highlyQualified.length}</div>
              <div className="text-xs text-emerald-600">Highly Qualified</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-amber-50 border border-amber-200">
              <div className="text-2xl font-bold text-amber-700">{partiallyQualified.length}</div>
              <div className="text-xs text-amber-600">Partially Qualified</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-red-50 border border-red-200">
              <div className="text-2xl font-bold text-red-700">{experienceGaps.length}</div>
              <div className="text-xs text-red-600">Experience Gaps</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Benchmark Themes */}
      {fitBlueprint!.benchmarkThemes.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Benchmark Candidate Themes
            </CardTitle>
            <CardDescription>
              These themes position you as the reference standard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {fitBlueprint!.benchmarkThemes.map(renderBenchmarkTheme)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Executive Summary */}
      {renderExecutiveSummary()}

      {/* ATS Alignment */}
      {renderATSAlignment()}

      {/* Evidence Inventory (collapsible) */}
      {renderEvidenceInventory()}
      
      {/* Requirement Sections */}
      <div className="space-y-4">
        {renderSection('HIGHLY QUALIFIED', highlyQualified)}
        {renderSection('PARTIALLY QUALIFIED', partiallyQualified)}
        {renderSection('EXPERIENCE GAP', experienceGaps)}
      </div>
      
      {/* Missing Bullet Plan Preview */}
      {fitBlueprint!.missingBulletPlan.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Missing Bullet Plan</p>
                  <p className="text-sm text-muted-foreground">
                    {fitBlueprint!.missingBulletPlan.length} prompts to strengthen your resume
                  </p>
                </div>
              </div>
              <Badge variant="secondary">{fitBlueprint!.missingBulletPlan.length} questions</Badge>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => navigate('/quick-score')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button onClick={goToNextStep} className="gap-2">
          {fitBlueprint!.missingBulletPlan.length > 0 
            ? 'Complete Your Profile' 
            : 'Continue to Customization'}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
