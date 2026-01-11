import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  ChevronUp, 
  Target, 
  CheckCircle2, 
  XCircle, 
  Award,
  TrendingUp,
  FileText,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BenchmarkCandidateProfile, RoleSuccessRubric, EvidenceUnit } from '../../types';

interface BenchmarkCandidatePanelProps {
  benchmarkProfile?: BenchmarkCandidateProfile;
  roleSuccessRubric?: RoleSuccessRubric;
  evidenceInventory: EvidenceUnit[];
  className?: string;
}

export function BenchmarkCandidatePanel({
  benchmarkProfile,
  roleSuccessRubric,
  evidenceInventory,
  className
}: BenchmarkCandidatePanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'competencies' | 'metrics' | 'artifacts' | 'pitfalls'>('competencies');

  // Combine data from both sources
  const competencies = benchmarkProfile?.topCompetencies || 
    roleSuccessRubric?.topCompetencies?.map(c => ({
      name: c.name,
      definition: c.definition,
      proofExamples: c.proofExamples,
      weight: c.weight || 'important' as const
    })) || [];

  const metrics = benchmarkProfile?.typicalMetrics || 
    roleSuccessRubric?.metricsNorms?.map(m => ({
      metric: m.metric,
      range: m.typicalRange,
      context: m.context || ''
    })) || [];

  const artifacts = benchmarkProfile?.commonArtifacts || [];
  const pitfalls = benchmarkProfile?.weakResumePitfalls || roleSuccessRubric?.commonPitfalls || [];
  const proofPoints = benchmarkProfile?.expectedProofPoints || roleSuccessRubric?.benchmarkProofPoints || [];

  // Check which competencies the candidate has evidence for
  const getCompetencyStatus = (competencyName: string): 'present' | 'partial' | 'missing' => {
    const evidenceText = evidenceInventory.map(e => e.text.toLowerCase()).join(' ');
    const keywords = competencyName.toLowerCase().split(' ');
    const matchCount = keywords.filter(kw => evidenceText.includes(kw)).length;
    
    if (matchCount >= keywords.length * 0.7) return 'present';
    if (matchCount > 0) return 'partial';
    return 'missing';
  };

  const presentCount = competencies.filter(c => getCompetencyStatus(c.name) === 'present').length;
  const benchmarkPercentage = competencies.length > 0 
    ? Math.round((presentCount / competencies.length) * 100) 
    : 0;

  if (!benchmarkProfile && !roleSuccessRubric) {
    return null;
  }

  const tabs = [
    { id: 'competencies', label: 'Competencies', icon: Award, count: competencies.length },
    { id: 'metrics', label: 'Metrics', icon: TrendingUp, count: metrics.length },
    { id: 'artifacts', label: 'Artifacts', icon: FileText, count: artifacts.length },
    { id: 'pitfalls', label: 'Pitfalls', icon: AlertTriangle, count: pitfalls.length },
  ];

  return (
    <Card className={cn("overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5", className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Benchmark Candidate Profile</CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    What a top candidate looks like for this role
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{benchmarkPercentage}%</p>
                  <p className="text-xs text-muted-foreground">of benchmark</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Role Context */}
            {roleSuccessRubric?.roleArchetype && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{roleSuccessRubric.roleArchetype}</span>
                {roleSuccessRubric.industryContext && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-sm text-muted-foreground">{roleSuccessRubric.industryContext}</span>
                  </>
                )}
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 border-b pb-2">
              {tabs.filter(t => t.count > 0).map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-1.5 h-8"
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                  <Badge variant="outline" className="ml-1 text-xs h-5 px-1.5">
                    {tab.count}
                  </Badge>
                </Button>
              ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'competencies' && (
                  <div className="grid gap-2">
                    {competencies.map((comp, idx) => {
                      const status = getCompetencyStatus(comp.name);
                      return (
                        <div
                          key={idx}
                          className={cn(
                            "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                            status === 'present' && "bg-primary/5 border-primary/30",
                            status === 'partial' && "bg-muted/50 border-muted-foreground/30",
                            status === 'missing' && "bg-background border-border"
                          )}
                        >
                          {status === 'present' ? (
                            <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          ) : status === 'partial' ? (
                            <CheckCircle2 className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="h-5 w-5 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{comp.name}</span>
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-xs",
                                  comp.weight === 'critical' && "border-destructive/50 text-destructive",
                                  comp.weight === 'important' && "border-primary/50 text-primary",
                                  comp.weight === 'nice-to-have' && "border-muted-foreground/50 text-muted-foreground"
                                )}
                              >
                                {comp.weight}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{comp.definition}</p>
                            {comp.proofExamples?.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {comp.proofExamples.slice(0, 3).map((ex, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs font-normal">
                                    {ex}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {activeTab === 'metrics' && (
                  <div className="grid gap-2">
                    {metrics.map((metric, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border">
                        <TrendingUp className="h-4 w-4 text-primary flex-shrink-0" />
                        <div className="flex-1">
                          <span className="font-medium text-sm">{metric.metric}</span>
                          <span className="text-muted-foreground mx-2">•</span>
                          <span className="text-sm text-primary">{metric.range}</span>
                        </div>
                        {metric.context && (
                          <span className="text-xs text-muted-foreground">{metric.context}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'artifacts' && (
                  <div className="flex flex-wrap gap-2">
                    {artifacts.map((artifact, idx) => (
                      <Badge key={idx} variant="secondary" className="text-sm py-1.5 px-3">
                        <FileText className="h-3.5 w-3.5 mr-1.5" />
                        {artifact}
                      </Badge>
                    ))}
                  </div>
                )}

                {activeTab === 'pitfalls' && (
                  <div className="space-y-2">
                    {pitfalls.map((pitfall, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                        <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{pitfall}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Expected Proof Points */}
            {proofPoints.length > 0 && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Expected Proof Points
                </p>
                <div className="grid gap-1.5">
                  {proofPoints.slice(0, 5).map((point, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                      {point}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
