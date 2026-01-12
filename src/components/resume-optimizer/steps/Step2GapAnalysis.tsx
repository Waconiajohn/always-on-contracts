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
  ATSAlignmentCard,
  EvidenceInventoryPanel,
  BulletBankPanel,
  BenchmarkCandidatePanel,
  LiveScorePanel
} from '../components/fit-analysis';
import { FitCategory } from '../components/fit-analysis/types';
import { useScoreCalculator } from '../hooks/useScoreCalculator';

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
  const confirmedFacts = useOptimizerStore(state => state.confirmedFacts);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<FitCategory, boolean>>({
    'HIGHLY QUALIFIED': true,
    'PARTIALLY QUALIFIED': true,
    'EXPERIENCE GAP': true
  });
  const [showEvidence, setShowEvidence] = useState(false);
  const [showBulletBank, setShowBulletBank] = useState(true);
  const [isScorePanelCollapsed, setIsScorePanelCollapsed] = useState(false);

  // Score calculation hook
  const scores = useScoreCalculator({
    fitBlueprint,
    stagedBullets,
    confirmedFacts,
  });
  
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
      // Get auth session for edge function
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      
      if (!token) {
        throw new Error('Authentication required. Please sign in.');
      }
      
      const { data, error: apiError } = await supabase.functions.invoke('fit-blueprint', {
        headers: {
          Authorization: `Bearer ${token}`
        },
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
      
      // Check for application-level errors in response
      if (data?.error) {
        const isTimeout = data.errorCode === 'TIMEOUT';
        const errorMsg = isTimeout 
          ? 'Analysis timed out. Long resumes may take extra time. Please try again.'
          : data.error;
        setError(errorMsg);
        toast({
          title: isTimeout ? 'Analysis Timed Out' : 'Analysis Failed',
          description: errorMsg,
          variant: 'destructive'
        });
        return;
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
      // Detect timeout/network errors
      const errorMessage = err instanceof Error ? err.message : 'Could not build fit blueprint';
      const isNetworkError = errorMessage.includes('Load failed') || 
                             errorMessage.includes('fetch') || 
                             errorMessage.includes('network');
      
      console.error('Fit blueprint error:', err);
      
      const displayMessage = isNetworkError 
        ? 'Analysis timed out or connection lost. This can happen with long resumes. Please try again.'
        : errorMessage;
        
      setError(displayMessage);
      toast({
        title: isNetworkError ? 'Connection Issue' : 'Analysis Failed',
        description: displayMessage,
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
          <p className="text-xs text-muted-foreground mt-2">Typically 20-45 seconds. Longer resumes may take up to 90 seconds.</p>
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
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Live Score Panel - NEW: Real-time scoring feedback */}
      {fitBlueprint && (
        <LiveScorePanel
          fitScore={scores.fitScore}
          benchmarkScore={scores.benchmarkScore}
          credibilityScore={scores.credibilityScore}
          atsScore={scores.atsScore}
          overallHireability={scores.overallHireability}
          trends={scores.trends}
          details={scores.details}
          isCollapsed={isScorePanelCollapsed}
          onToggleCollapse={() => setIsScorePanelCollapsed(!isScorePanelCollapsed)}
        />
      )}

      {/* Benchmark Candidate Profile - NEW: Shows what a top candidate looks like */}
      {(fitBlueprint?.benchmarkCandidateProfile || fitBlueprint?.roleSuccessRubric) && (
        <BenchmarkCandidatePanel
          benchmarkProfile={fitBlueprint.benchmarkCandidateProfile}
          roleSuccessRubric={fitBlueprint.roleSuccessRubric}
          evidenceInventory={fitBlueprint.evidenceInventory}
        />
      )}

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
        <Card className="border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
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
                  className="flex items-start justify-between gap-2 p-3 bg-background rounded-lg border text-sm shadow-sm"
                >
                  <p className="flex-1 text-sm">{bullet.text}</p>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
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
          isOpen={showBulletBank}
          onOpenChange={setShowBulletBank}
          getEvidenceById={getEvidenceById}
        />
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
      <div className="space-y-6">
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
        <Card className="border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Lightbulb className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-lg">Missing Bullet Plan</p>
                  <p className="text-muted-foreground">
                    {fitBlueprint!.missingBulletPlan.length} prompts to strengthen your resume
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="text-base px-4 py-1.5">
                {fitBlueprint!.missingBulletPlan.length} questions
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/quick-score')} className="gap-2 h-11">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              runAnalysis();
            }} 
            className="gap-2 h-11"
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Re-analyze
          </Button>
        </div>
        <Button onClick={goToNextStep} className="gap-2 h-11 text-base px-6">
          {fitBlueprint!.missingBulletPlan.length > 0 
            ? 'Complete Your Profile' 
            : 'Continue to Customization'}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}