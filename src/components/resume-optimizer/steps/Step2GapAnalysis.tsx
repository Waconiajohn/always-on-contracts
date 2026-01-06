import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useOptimizer } from '../context/OptimizerContext';
import { ConfidenceIndicator } from '../components/ConfidenceIndicator';
import { AnalyzedRequirement, RequirementCategory } from '../types';
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
  Copy,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORY_CONFIG: Record<RequirementCategory, {
  title: string;
  description: string;
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}> = {
  'highly-qualified': {
    title: 'Highly Qualified',
    description: 'Clear strengths to emphasize',
    icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
    colorClass: 'text-emerald-700',
    bgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-200'
  },
  'partially-qualified': {
    title: 'Partially Qualified',
    description: 'Areas needing strategic positioning',
    icon: <AlertCircle className="h-5 w-5 text-amber-600" />,
    colorClass: 'text-amber-700',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200'
  },
  'experience-gap': {
    title: 'Experience Gaps',
    description: 'Missing qualifications requiring creative addressing',
    icon: <XCircle className="h-5 w-5 text-red-600" />,
    colorClass: 'text-red-700',
    bgClass: 'bg-red-50',
    borderClass: 'border-red-200'
  }
};

export function Step2GapAnalysis() {
  const { state, dispatch, goToNextStep, goToPrevStep } = useOptimizer();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<RequirementCategory, boolean>>({
    'highly-qualified': true,
    'partially-qualified': true,
    'experience-gap': true
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  useEffect(() => {
    if (!state.gapAnalysis && state.resumeText && state.jobDescription) {
      runAnalysis();
    }
  }, []);
  
  const runAnalysis = async () => {
    setIsLoading(true);
    dispatch({ type: 'SET_PROCESSING', isProcessing: true, message: 'Performing deep fit analysis...' });
    
    try {
      const { data, error } = await supabase.functions.invoke('deep-fit-analysis', {
        body: {
          resumeText: state.resumeText,
          jobDescription: state.jobDescription,
          careerProfile: state.careerProfile
        }
      });
      
      if (error) throw error;
      
      dispatch({ type: 'SET_GAP_ANALYSIS', analysis: data });
    } catch (error: any) {
      console.error('Gap analysis error:', error);
      toast({
        title: 'Analysis Failed',
        description: error.message || 'Could not perform gap analysis',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
      dispatch({ type: 'SET_PROCESSING', isProcessing: false });
    }
  };
  
  const handleCopyLanguage = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: 'Copied to clipboard' });
  };
  
  const toggleSection = (category: RequirementCategory) => {
    setExpandedSections(prev => ({ ...prev, [category]: !prev[category] }));
  };
  
  const renderRequirementCard = (req: AnalyzedRequirement) => {
    const isCopied = copiedId === req.id;
    
    return (
      <Card key={req.id} className="overflow-hidden">
        <CardContent className="p-4 space-y-4">
          {/* Requirement header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h4 className="font-medium text-sm">{req.requirement}</h4>
              <p className="text-xs text-muted-foreground mt-1">{req.explanation}</p>
            </div>
            <ConfidenceIndicator level={req.confidence} />
          </div>
          
          {/* Your Experience (for partial/gaps) */}
          {req.yourExperience && (
            <div className="text-xs space-y-1">
              <span className="font-medium text-muted-foreground">Your Experience:</span>
              <p className="text-foreground">{req.yourExperience}</p>
            </div>
          )}
          
          {/* What's Missing (for partial/gaps) */}
          {req.whatsGap && (
            <div className="text-xs space-y-1">
              <span className="font-medium text-amber-700">What's Missing:</span>
              <p className="text-foreground">{req.whatsGap}</p>
            </div>
          )}
          
          {/* Suggested Language */}
          <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-primary" />
                Suggested Language
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopyLanguage(req.id, req.suggestedLanguage)}
                className="h-7 text-xs"
              >
                {isCopied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                {isCopied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <p className="text-sm italic">"{req.suggestedLanguage}"</p>
          </div>
          
          {/* Resume Evidence */}
          {req.resumeEvidence && req.resumeEvidence.length > 0 && (
            <div className="text-xs space-y-1">
              <span className="font-medium text-muted-foreground">Evidence from resume:</span>
              <ul className="list-disc pl-4 space-y-1">
                {req.resumeEvidence.map((evidence, idx) => (
                  <li key={idx} className="text-muted-foreground">{evidence}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Alternative Positioning */}
          {req.alternatives && req.alternatives.length > 0 && (
            <div className="text-xs">
              <span className="font-medium text-muted-foreground">Alternative Positioning:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {req.alternatives.map((alt, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs cursor-pointer hover:bg-muted">
                    {alt.tone}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };
  
  const renderSection = (category: RequirementCategory, requirements: AnalyzedRequirement[]) => {
    const config = CATEGORY_CONFIG[category];
    const isExpanded = expandedSections[category];
    
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
              <Badge variant="secondary">{requirements.length}</Badge>
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-4 pt-0 space-y-3">
            {requirements.map(renderRequirementCard)}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };
  
  if (isLoading || !state.gapAnalysis) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Performing deep fit analysis...</p>
          <p className="text-xs text-muted-foreground mt-2">This may take a moment</p>
        </CardContent>
      </Card>
    );
  }
  
  const { highlyQualified, partiallyQualified, experienceGaps, overallFitScore, summary } = state.gapAnalysis;
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gap Analysis Complete</CardTitle>
              <CardDescription>{summary}</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">{overallFitScore}%</div>
              <div className="text-xs text-muted-foreground">Overall Fit</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Fit Score</span>
              <span>{overallFitScore}%</span>
            </div>
            <Progress value={overallFitScore} className="h-2" />
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
      
      {/* Requirement Sections */}
      <div className="space-y-4">
        {renderSection('highly-qualified', highlyQualified)}
        {renderSection('partially-qualified', partiallyQualified)}
        {renderSection('experience-gap', experienceGaps)}
      </div>
      
      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={goToPrevStep} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button onClick={goToNextStep} className="gap-2">
          Continue to AI Assistant
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
