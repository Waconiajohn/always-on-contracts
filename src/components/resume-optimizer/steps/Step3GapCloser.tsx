import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useOptimizerStore } from '@/stores/optimizerStore';
import { GapCloserCard, LiveScorePanel } from '../components/fit-analysis';
import { useScoreCalculator } from '../hooks/useScoreCalculator';
import { 
  ArrowRight, 
  ArrowLeft, 
  SkipForward, 
  Target,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  FileText
} from 'lucide-react';
import { GapTaxonomy } from '../types';
import { toast } from 'sonner';

const GAP_TYPE_PRIORITY: GapTaxonomy[] = ['Ownership', 'Domain', 'Scope', 'Tooling', 'Metric', 'Recency'];



export function Step3GapCloser() {
  const fitBlueprint = useOptimizerStore(state => state.fitBlueprint);
  const confirmedFacts = useOptimizerStore(state => state.confirmedFacts);
  const setConfirmedFact = useOptimizerStore(state => state.setConfirmedFact);
  const addStagedBullet = useOptimizerStore(state => state.addStagedBullet);
  const stagedBullets = useOptimizerStore(state => state.stagedBullets);
  const goToNextStep = useOptimizerStore(state => state.goToNextStep);
  const goToPrevStep = useOptimizerStore(state => state.goToPrevStep);
  const jobDescription = useOptimizerStore(state => state.jobDescription);
  
  const [activeGapType, setActiveGapType] = useState<string>('all');
  const [isScorePanelCollapsed, setIsScorePanelCollapsed] = useState(false);

  // Score calculation hook
  const scores = useScoreCalculator({
    fitBlueprint,
    stagedBullets,
    confirmedFacts,
  });

  // Get gap closer strategies from fit blueprint
  const gapCloserStrategies = fitBlueprint?.gapCloserStrategies || [];
  
  // Get requirements that have gaps
  const gapRequirements = useMemo(() => {
    if (!fitBlueprint?.fitMap) return [];
    return fitBlueprint.fitMap.filter(r => 
      r.category === 'PARTIALLY QUALIFIED' || r.category === 'EXPERIENCE GAP'
    );
  }, [fitBlueprint?.fitMap]);

  // Map strategies to requirements
  const strategiesWithRequirements = useMemo(() => {
    return gapCloserStrategies.map(strategy => {
      const requirement = gapRequirements.find(r => r.requirementId === strategy.requirementId);
      return {
        strategy,
        requirement,
        requirementText: requirement?.resumeLanguage || 'Unknown requirement'
      };
    });
  }, [gapCloserStrategies, gapRequirements]);

  // Group by gap type
  const strategiesByGapType = useMemo(() => {
    const grouped: Record<string, typeof strategiesWithRequirements> = {};
    
    strategiesWithRequirements.forEach(item => {
      const gapType = item.strategy.gapType;
      if (!grouped[gapType]) {
        grouped[gapType] = [];
      }
      grouped[gapType].push(item);
    });
    
    return grouped;
  }, [strategiesWithRequirements]);

  const gapTypes = Object.keys(strategiesByGapType);
  
  // Calculate stats
  const totalGaps = strategiesWithRequirements.length;
  const resolvedGaps = strategiesWithRequirements.filter(s => 
    stagedBullets.some(b => b.requirementId === s.strategy.requirementId)
  ).length;
  const progress = totalGaps > 0 ? (resolvedGaps / totalGaps) * 100 : 0;

  const handleAddBullet = (bullet: string, requirementId: string) => {
    addStagedBullet({
      text: bullet,
      requirementId,
      sectionHint: 'experience'
    });
    toast.success('Bullet added to your resume draft');
  };

  const handleAnswerQuestion = (fieldKey: string, value: string) => {
    setConfirmedFact(fieldKey, value);
  };

  // Filter strategies based on active tab
  const filteredStrategies = activeGapType === 'all'
    ? strategiesWithRequirements
    : strategiesByGapType[activeGapType] || [];

  // If no gaps, show success message
  if (gapRequirements.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CheckCircle2 className="h-12 w-12 text-emerald-600 mb-4" />
            <h3 className="font-medium text-lg">No Gaps to Address!</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mt-2">
              You're highly qualified for all requirements. Let's proceed to customize your resume.
            </p>
            <Button onClick={goToNextStep} className="mt-6 gap-2">
              Continue to Customization
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Live Score Panel */}
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

      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Gap Closer Wizard
              </CardTitle>
              <CardDescription className="mt-1">
                Strategic approaches to address experience gaps and strengthen your candidacy
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{resolvedGaps}/{totalGaps}</div>
              <div className="text-xs text-muted-foreground">gaps addressed</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {gapTypes.length} gap types identified
              </span>
              <span className="font-medium">{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardContent className="pt-6">
              <Tabs value={activeGapType} onValueChange={setActiveGapType}>
                <TabsList className="flex flex-wrap h-auto gap-1 mb-6 bg-muted/50 p-1">
                  <TabsTrigger value="all" className="text-xs gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    All Gaps ({totalGaps})
                  </TabsTrigger>
                  {GAP_TYPE_PRIORITY.filter(type => strategiesByGapType[type]).map(type => (
                    <TabsTrigger 
                      key={type} 
                      value={type}
                      className="text-xs"
                    >
                      {type} ({strategiesByGapType[type]?.length || 0})
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                <TabsContent value={activeGapType} className="mt-0">
                  <div className="space-y-4">
                    {filteredStrategies.length > 0 ? (
                      filteredStrategies.map((item, idx) => (
                        <GapCloserCard
                          key={`${item.strategy.requirementId}-${idx}`}
                          strategy={item.strategy}
                          requirementText={item.requirementText}
                          jobDescription={jobDescription}
                          onAddBullet={handleAddBullet}
                          onAnswerQuestion={handleAnswerQuestion}
                          confirmedFacts={confirmedFacts as Record<string, string | number | string[]>}
                        />
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No gaps in this category</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Live Draft Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Resume Draft
              </CardTitle>
              <CardDescription className="text-xs">
                Bullets added from gap closing
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stagedBullets.length > 0 ? (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {stagedBullets.map((bullet, idx) => (
                      <div 
                        key={idx}
                        className="p-2 rounded bg-emerald-50 border border-emerald-200 text-xs"
                      >
                        <div className="flex items-center gap-1 mb-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          <Badge variant="secondary" className="text-[10px] px-1">
                            {bullet.sectionHint || 'experience'}
                          </Badge>
                        </div>
                        <p className="text-emerald-900 line-clamp-3">{bullet.text}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-6">
                  <Sparkles className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">
                    Add bullets from gap strategies to build your draft
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Gap Strategy Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>• <strong>Adjacent Proof:</strong> Similar experience counts</p>
              <p>• <strong>Equivalent:</strong> What HMs accept as equal</p>
              <p>• <strong>Extraction:</strong> Uncover hidden achievements</p>
              <p>• <strong>Narrative:</strong> Interview talking points</p>
              <p className="pt-2 border-t">
                Focus on high-impact gaps first: Ownership and Domain
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={goToPrevStep} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Fit Analysis
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={goToNextStep} className="gap-2">
            <SkipForward className="h-4 w-4" />
            Skip Gaps
          </Button>
          <Button onClick={goToNextStep} className="gap-2">
            Continue to Customization
            <ArrowRight className="h-4 w-4" />
            {stagedBullets.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {stagedBullets.length} bullets
              </Badge>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
