import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, AlertCircle, XCircle, Target, TrendingUp, Award, Zap } from "lucide-react";

interface JobRequirement {
  category: 'required' | 'preferred' | 'nice-to-have';
  type: string;
  requirement: string;
  keywords: string[];
  importance: number;
  atsKeyword: boolean;
  matched?: boolean;
  partiallyMatched?: boolean;
}

interface IndustryStandard {
  standard: string;
  category: string;
  expectedLevel: string;
  commonInTopPerformers: boolean;
  source: string;
  matched?: boolean;
}

interface JobAnalysisPanelProps {
  jobRequirements?: {
    required: JobRequirement[];
    preferred: JobRequirement[];
    niceToHave: JobRequirement[];
  };
  industryStandards?: IndustryStandard[];
  professionBenchmarks?: IndustryStandard[];
  atsKeywords?: {
    critical: string[];
    important: string[];
    bonus: string[];
  };
  roleProfile?: {
    title: string;
    level: string;
    industry: string;
    function: string;
  };
  gapAnalysis?: {
    commonlyMissing: string[];
    differentiators: string[];
    riskAreas: string[];
  };
  currentKeywordCoverage?: {
    [keyword: string]: { current: number; needed: number };
  };
  loading?: boolean;
}

export const JobAnalysisPanel = ({
  jobRequirements,
  industryStandards = [],
  professionBenchmarks = [],
  atsKeywords,
  roleProfile,
  gapAnalysis,
  currentKeywordCoverage = {},
  loading = false
}: JobAnalysisPanelProps) => {
  if (loading) {
    return (
      <Card className="h-full p-6">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Zap className="h-12 w-12 mx-auto mb-4 animate-pulse text-primary" />
            <p className="text-sm text-muted-foreground">Analyzing job requirements...</p>
            <p className="text-xs text-muted-foreground mt-2">Consulting industry standards & benchmarks</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!jobRequirements && !roleProfile) {
    return (
      <Card className="h-full p-6">
        <div className="text-center py-12">
          <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm font-medium mb-2">No Job Analysis Yet</p>
          <p className="text-xs text-muted-foreground">
            Paste a job description to see intelligent requirement analysis
          </p>
        </div>
      </Card>
    );
  }

  const allRequirements = [
    ...(jobRequirements?.required || []),
    ...(jobRequirements?.preferred || []),
    ...(jobRequirements?.niceToHave || [])
  ];

  const matchedCount = allRequirements.filter(r => r.matched).length;
  const partialCount = allRequirements.filter(r => r.partiallyMatched && !r.matched).length;
  const unmatchedCount = allRequirements.length - matchedCount - partialCount;
  const coveragePercent = allRequirements.length > 0
    ? Math.round((matchedCount + partialCount * 0.5) / allRequirements.length * 100)
    : 0;

  const RequirementItem = ({ req }: { req: JobRequirement }) => {
    const icon = req.matched ? (
      <CheckCircle2 className="h-4 w-4 text-green-600" />
    ) : req.partiallyMatched ? (
      <AlertCircle className="h-4 w-4 text-yellow-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );

    const bgColor = req.matched
      ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
      : req.partiallyMatched
      ? 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800'
      : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800';

    return (
      <div className={`p-3 rounded-md border ${bgColor} space-y-2`}>
        <div className="flex items-start gap-2">
          {icon}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{req.requirement}</p>
            {req.keywords && req.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {req.keywords.map((kw, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {kw}
                    {req.atsKeyword && <span className="ml-1 text-primary">★</span>}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <Badge variant={req.category === 'required' ? 'destructive' : 'secondary'} className="text-xs">
            {req.category}
          </Badge>
        </div>
      </div>
    );
  };

  const StandardItem = ({ standard }: { standard: IndustryStandard }) => (
    <div className={`p-3 rounded-md border ${standard.matched ? 'bg-green-50 border-green-200' : 'bg-muted'}`}>
      <div className="flex items-start gap-2">
        {standard.matched && <CheckCircle2 className="h-4 w-4 text-green-600" />}
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">{standard.standard}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">{standard.category}</Badge>
            <Badge variant="outline" className="text-xs">{standard.expectedLevel}</Badge>
            {standard.commonInTopPerformers && (
              <Badge className="text-xs bg-purple-100 text-purple-800">Top 10%</Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-muted/50">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-lg text-foreground">{roleProfile?.title || 'Job Analysis'}</h3>
            <p className="text-sm text-muted-foreground">
              {roleProfile?.level && <span className="capitalize">{roleProfile.level}</span>}
              {roleProfile?.level && roleProfile?.industry && ' • '}
              {roleProfile?.industry}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{coveragePercent}%</div>
            <div className="text-xs text-muted-foreground">Coverage</div>
          </div>
        </div>

        <Progress value={coveragePercent} className="h-2" />

        <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-600" />
            <span className="text-foreground font-medium">{matchedCount} Matched</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3 text-yellow-600" />
            <span className="text-foreground font-medium">{partialCount} Partial</span>
          </div>
          <div className="flex items-center gap-1">
            <XCircle className="h-3 w-3 text-red-600" />
            <span className="text-foreground font-medium">{unmatchedCount} Missing</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="requirements" className="flex-1 flex flex-col">
        <TabsList className="w-full grid grid-cols-4 mx-4 mt-4">
          <TabsTrigger value="requirements" className="text-xs">
            <Target className="h-3 w-3 mr-1" />
            Job Reqs
          </TabsTrigger>
          <TabsTrigger value="industry" className="text-xs">
            <TrendingUp className="h-3 w-3 mr-1" />
            Industry
          </TabsTrigger>
          <TabsTrigger value="benchmark" className="text-xs">
            <Award className="h-3 w-3 mr-1" />
            Top 10%
          </TabsTrigger>
          <TabsTrigger value="ats" className="text-xs">
            <Zap className="h-3 w-3 mr-1" />
            ATS
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="requirements" className="h-full mt-4 px-4">
            <ScrollArea className="h-[calc(100vh-400px)]">
              <div className="space-y-3 pr-4">
                {jobRequirements?.required && jobRequirements.required.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-red-600 dark:text-red-400 mb-2 uppercase tracking-wider">Required ({jobRequirements.required.length})</h4>
                    <div className="space-y-2">
                      {jobRequirements.required.map((req, i) => (
                        <RequirementItem key={i} req={req} />
                      ))}
                    </div>
                  </div>
                )}

                {jobRequirements?.preferred && jobRequirements.preferred.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-xs font-bold text-orange-600 dark:text-orange-400 mb-2 uppercase tracking-wider">Preferred ({jobRequirements.preferred.length})</h4>
                    <div className="space-y-2">
                      {jobRequirements.preferred.map((req, i) => (
                        <RequirementItem key={i} req={req} />
                      ))}
                    </div>
                  </div>
                )}

                {jobRequirements?.niceToHave && jobRequirements.niceToHave.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wider">Nice to Have ({jobRequirements.niceToHave.length})</h4>
                    <div className="space-y-2">
                      {jobRequirements.niceToHave.map((req, i) => (
                        <RequirementItem key={i} req={req} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="industry" className="h-full mt-4 px-4">
            <ScrollArea className="h-[calc(100vh-400px)]">
              <div className="space-y-3 pr-4">
                <div className="p-3 bg-muted rounded-md border mb-4">
                  <p className="text-xs text-foreground">
                    <strong>Industry Standards</strong> for {roleProfile?.industry || 'this field'} -
                    What employers in this industry typically expect from candidates.
                  </p>
                </div>

                {industryStandards.map((std, i) => (
                  <StandardItem key={i} standard={std} />
                ))}

                {industryStandards.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No industry standards available
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="benchmark" className="h-full mt-4 px-4">
            <ScrollArea className="h-[calc(100vh-400px)]">
              <div className="space-y-3 pr-4">
                <div className="p-3 bg-muted rounded-md border mb-4">
                  <p className="text-xs text-foreground">
                    <strong>Top 10% Benchmarks</strong> - Differentiators that separate elite candidates from the rest.
                    These give you competitive advantage.
                  </p>
                </div>

                {professionBenchmarks.map((bench, i) => (
                  <StandardItem key={i} standard={bench} />
                ))}

                {gapAnalysis?.differentiators && gapAnalysis.differentiators.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-xs font-semibold text-purple-600 mb-2 uppercase">Key Differentiators</h4>
                    {gapAnalysis.differentiators.map((diff, i) => (
                      <div key={i} className="p-2 bg-purple-50 rounded text-xs mb-2 border border-purple-200">
                        <Award className="h-3 w-3 inline mr-1 text-purple-600" />
                        {diff}
                      </div>
                    ))}
                  </div>
                )}

                {professionBenchmarks.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No profession benchmarks available
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="ats" className="h-full mt-4 px-4">
            <ScrollArea className="h-[calc(100vh-400px)]">
              <div className="space-y-3 pr-4">
                <div className="p-3 bg-muted rounded-md border mb-4">
                  <p className="text-xs text-foreground">
                    <strong>ATS Keywords</strong> - Critical keywords that Applicant Tracking Systems scan for.
                    ★ = High priority for ATS scoring.
                  </p>
                </div>

                {atsKeywords?.critical && atsKeywords.critical.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-red-600 dark:text-red-400 mb-2 uppercase flex items-center tracking-wider">
                      <Zap className="h-3 w-3 mr-1" />
                      Critical Keywords ({atsKeywords.critical.length})
                    </h4>
                    <div className="space-y-2">
                      {atsKeywords.critical.map((kw, i) => {
                        const coverage = currentKeywordCoverage[kw] || { current: 0, needed: 2 };
                        const percent = Math.min((coverage.current / coverage.needed) * 100, 100);
                        return (
                          <div key={i} className="p-3 bg-red-50 dark:bg-red-950 rounded border border-red-200 dark:border-red-800">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-foreground">{kw}</span>
                              <span className="text-xs text-foreground font-medium">
                                {coverage.current} / {coverage.needed} mentions
                              </span>
                            </div>
                            <Progress value={percent} className="h-1" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {atsKeywords?.important && atsKeywords.important.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-xs font-bold text-orange-600 dark:text-orange-400 mb-2 uppercase tracking-wider">Important Keywords ({atsKeywords.important.length})</h4>
                    <div className="flex flex-wrap gap-2">
                      {atsKeywords.important.map((kw, i) => {
                        const coverage = currentKeywordCoverage[kw] || { current: 0, needed: 1 };
                        const hasCoverage = coverage.current >= coverage.needed;
                        return (
                          <Badge
                            key={i}
                            variant={hasCoverage ? "default" : "outline"}
                            className={hasCoverage ? "bg-green-600" : ""}
                          >
                            {kw} {hasCoverage ? '✓' : `(${coverage.current}/${coverage.needed})`}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                {atsKeywords?.bonus && atsKeywords.bonus.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wider">Bonus Keywords ({atsKeywords.bonus.length})</h4>
                    <div className="flex flex-wrap gap-2">
                      {atsKeywords.bonus.map((kw, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>
    </Card>
  );
};
