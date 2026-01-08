import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOptimizerStore } from '@/stores/optimizerStore';
import { EvidenceUnit, AtomicRequirement } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { handleEdgeFunctionError, isRateLimitError, isPaymentError } from '@/lib/edgeFunction/errorHandler';
import { 
  Loader2, 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  Lightbulb,
  RefreshCw,
  FileText,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Import extracted sub-components
import {
  FitSummaryCard,
  FitCategorySection,
  ExecutiveSummaryCard,
  ATSAlignmentCard,
  EvidenceInventoryPanel,
  BulletBankPanel,
  BenchmarkThemeCard
} from '../components/fit-analysis';
import { FitCategory } from '../components/fit-analysis/types';

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
  const addVersionHistory = useOptimizerStore(state => state.addVersionHistory);
  const stagedBullets = useOptimizerStore(state => state.stagedBullets);
  const removeStagedBullet = useOptimizerStore(state => state.removeStagedBullet);
  
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitBlueprint, resumeText, jobDescription]);
  
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
        const handledError = handleEdgeFunctionError(apiError, 'fit-blueprint');
        if (isRateLimitError(handledError) || isPaymentError(handledError)) {
          setError(handledError.message);
          return;
        }
        throw apiError;
      }
      
      setFitBlueprint(data);
      
      // Add to version history
      addVersionHistory({
        stepCompleted: 'gap-analysis',
        resumeSnapshot: resumeText,
        changeDescription: 'Fit Blueprint analysis complete',
        fitBlueprint: data
      });
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
      <FitSummaryCard
        overallFitScore={fitBlueprint!.overallFitScore}
        requirementsCount={fitBlueprint!.requirements.length}
        evidenceCount={fitBlueprint!.evidenceInventory.length}
        highlyQualifiedCount={highlyQualified.length}
        partiallyQualifiedCount={partiallyQualified.length}
        experienceGapsCount={experienceGaps.length}
      />

      {/* Staged Bullets Indicator - Shows when user has collected bullets */}
      {stagedBullets.length > 0 && (
        <Card className="border-primary bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Resume Draft ({stagedBullets.length} bullet{stagedBullets.length !== 1 ? 's' : ''} staged)
            </CardTitle>
            <CardDescription>
              These bullets will be included in your optimized resume
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {stagedBullets.map((bullet, index) => (
                <div 
                  key={index}
                  className="flex items-start justify-between gap-2 p-2 bg-background rounded border text-sm"
                >
                  <p className="flex-1 text-xs italic">{bullet.text}</p>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => removeStagedBullet(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI-Generated Content Suggestions (Bullet Bank) - Promoted to top */}
      {fitBlueprint?.bulletBank && fitBlueprint.bulletBank.length > 0 && (
        <BulletBankPanel
          bulletBank={fitBlueprint.bulletBank}
          isOpen={true}
          onOpenChange={() => {}}
          getEvidenceById={getEvidenceById}
        />
      )}

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
              {fitBlueprint!.benchmarkThemes.map((theme, index) => (
                <BenchmarkThemeCard
                  key={index}
                  theme={theme}
                  getEvidenceById={getEvidenceById}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Executive Summary */}
      {fitBlueprint?.executiveSummary && (
        <ExecutiveSummaryCard executiveSummary={fitBlueprint.executiveSummary} />
      )}

      {/* ATS Alignment */}
      {fitBlueprint?.atsAlignment && (
        <ATSAlignmentCard atsAlignment={fitBlueprint.atsAlignment} />
      )}

      {/* Evidence Inventory (collapsible) */}
      {fitBlueprint?.evidenceInventory && (
        <EvidenceInventoryPanel
          evidenceInventory={fitBlueprint.evidenceInventory}
          isOpen={showEvidence}
          onOpenChange={setShowEvidence}
        />
      )}
      
      {/* Requirement Sections */}
      <div className="space-y-4">
        <FitCategorySection
          category="HIGHLY QUALIFIED"
          entries={highlyQualified}
          isExpanded={expandedSections['HIGHLY QUALIFIED']}
          onToggle={() => toggleSection('HIGHLY QUALIFIED')}
          getRequirementById={getRequirementById}
          getEvidenceById={getEvidenceById}
        />
        <FitCategorySection
          category="PARTIALLY QUALIFIED"
          entries={partiallyQualified}
          isExpanded={expandedSections['PARTIALLY QUALIFIED']}
          onToggle={() => toggleSection('PARTIALLY QUALIFIED')}
          getRequirementById={getRequirementById}
          getEvidenceById={getEvidenceById}
        />
        <FitCategorySection
          category="EXPERIENCE GAP"
          entries={experienceGaps}
          isExpanded={expandedSections['EXPERIENCE GAP']}
          onToggle={() => toggleSection('EXPERIENCE GAP')}
          getRequirementById={getRequirementById}
          getEvidenceById={getEvidenceById}
        />
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/quick-score')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              runAnalysis();
            }} 
            className="gap-2"
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Re-analyze
          </Button>
        </div>
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