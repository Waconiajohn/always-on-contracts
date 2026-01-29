import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Wrench, Wand2, AlertTriangle, CheckCircle2, TrendingUp, XCircle, AlertCircle, SplitSquareVertical } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ResumeBuilderShell } from "@/components/resume-builder/ResumeBuilderShell";
import { runATSAnalysis, getATSScoreBadge, type ATSAnalysis } from "@/lib/ats-checks";
import { KeywordComparisonTable, type KeywordRowData } from "@/components/quick-score/KeywordComparisonTable";
import type { RBProject, RBJDRequirement, RBKeywordDecision } from "@/types/resume-builder";

interface ReportStats {
  totalKeywords: number;
  missingKeywords: number;
  pendingKeywords: number;
  approvedKeywords: number;
  totalRequirements: number;
  matchedRequirements: number;
  criticalGaps: number;
  seniorityMatch: number;
  userLevel: string | null;
  targetLevel: string | null;
}

// Seniority ladder for comparing levels
const SENIORITY_ORDER = [
  'IC', 'Senior IC', 'Manager', 'Senior Manager', 
  'Director', 'Senior Director', 'VP', 'SVP', 'C-Level'
];

function calculateSeniorityMatch(
  userLevel: string | null, 
  targetLevel: string | null
): number {
  if (!userLevel || !targetLevel) return 50; // Unknown

  const userIndex = SENIORITY_ORDER.indexOf(userLevel);
  const targetIndex = SENIORITY_ORDER.indexOf(targetLevel);
  
  if (userIndex === -1 || targetIndex === -1) return 50;
  
  const diff = userIndex - targetIndex;
  
  if (diff === 0) return 100; // Perfect match
  if (diff === -1) return 75; // 1 level under
  if (diff === 1) return 85; // 1 level over
  if (diff < -1) return Math.max(30, 70 + diff * 15); // Underqualified
  return Math.max(60, 100 - diff * 10); // Overqualified
}

export default function ReportPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<RBProject | null>(null);
  const [stats, setStats] = useState<ReportStats>({
    totalKeywords: 0,
    missingKeywords: 0,
    pendingKeywords: 0,
    approvedKeywords: 0,
    totalRequirements: 0,
    matchedRequirements: 0,
    criticalGaps: 0,
    seniorityMatch: 0,
    userLevel: null,
    targetLevel: null,
  });
  const [keywordTableData, setKeywordTableData] = useState<KeywordRowData[]>([]);
  const [atsAnalysis, setAtsAnalysis] = useState<ATSAnalysis | null>(null);

  const loadData = useCallback(async () => {
    if (!projectId) return;
    try {
      // Load project, keywords, and requirements in parallel
      const [projectRes, keywordsRes, requirementsRes] = await Promise.all([
        supabase
          .from("rb_projects")
          .select("*")
          .eq("id", projectId)
          .single(),
        supabase
          .from("rb_keyword_decisions")
          .select("*")
          .eq("project_id", projectId),
        supabase
          .from("rb_jd_requirements")
          .select("*")
          .eq("project_id", projectId),
      ]);

      if (projectRes.error) throw projectRes.error;
      setProject(projectRes.data as unknown as RBProject);

      const keywords = (keywordsRes.data as unknown as RBKeywordDecision[]) || [];
      const requirements = (requirementsRes.data as unknown as RBJDRequirement[]) || [];

      // Calculate stats based on actual KeywordDecision values: 'add' | 'ignore' | 'not_true' | 'ask_me'
      const pending = keywords.filter(k => k.decision === 'ask_me');
      const toAdd = keywords.filter(k => k.decision === 'add');
      const ignored = keywords.filter(k => k.decision === 'ignore');
      
      // Transform keywords into KeywordRowData for the comparison table
      const tableData: KeywordRowData[] = keywords.map(k => {
        // Find matching requirement for weight/priority
        const matchingReq = requirements.find(r => 
          r.text.toLowerCase().includes(k.keyword.toLowerCase()) ||
          k.keyword.toLowerCase().includes(r.text.toLowerCase().slice(0, 20))
        );
        
        const weight = matchingReq?.weight ?? 3;
        let priority: 'critical' | 'high' | 'medium' = 'medium';
        if (weight >= 4) priority = 'critical';
        else if (weight >= 3) priority = 'high';
        
        return {
          keyword: k.keyword,
          priority,
          isMatched: k.decision === 'ignore', // 'ignore' means already in resume
          jdContext: matchingReq?.exact_phrases?.slice(0, 2).join(', ') || '',
          resumeContext: k.decision === 'ignore' ? 'Found in resume' : undefined,
        };
      });
      
      setKeywordTableData(tableData);

      // RBJDRequirement has weight field - higher weight = more important
      const criticalReqs = requirements.filter(r => r.weight > 0.8);
      const totalReqs = requirements.length;

      // Calculate seniority match
      const projectData = projectRes.data as unknown as RBProject;
      const targetLevel = projectData.seniority_level || null;
      const projectDataAny = projectData as unknown as Record<string, unknown>;
      const userLevel = (projectDataAny.user_seniority_level as string | null)
        || (projectDataAny.detected_level as string | null)
        || null;
      const seniorityScore = calculateSeniorityMatch(userLevel, targetLevel);

      // Estimate matched requirements based on ignored keywords (already in resume)
      const matchedCount = totalReqs > 0 ? Math.min(ignored.length, totalReqs) : 0;
      const criticalGapsCount = Math.max(0, criticalReqs.length - Math.floor(ignored.length * 0.5));

      setStats({
        totalKeywords: keywords.length,
        missingKeywords: toAdd.length,
        pendingKeywords: pending.length,
        approvedKeywords: toAdd.length,
        totalRequirements: totalReqs,
        matchedRequirements: matchedCount,
        criticalGaps: criticalGapsCount,
        seniorityMatch: seniorityScore,
        userLevel,
        targetLevel,
      });

      // Load resume text and run ATS analysis
      const { data: docData } = await supabase
        .from("rb_documents")
        .select("raw_text")
        .eq("project_id", projectId)
        .eq("doc_type", "resume")
        .maybeSingle();

      if (docData?.raw_text) {
        const ats = runATSAnalysis(docData.raw_text);
        setAtsAnalysis(ats);
      }

    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-primary";
    if (score >= 60) return "text-amber-500";
    return "text-destructive";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { label: "Strong Match", variant: "default" as const };
    if (score >= 60) return { label: "Good Potential", variant: "secondary" as const };
    return { label: "Needs Work", variant: "destructive" as const };
  };

  const handleAddKeyword = useCallback(() => {
    navigate(`/resume-builder/${projectId}/fix`);
  }, [navigate, projectId]);

  if (loading) {
    return (
      <ResumeBuilderShell>
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header skeleton */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>

          {/* Score card skeleton */}
          <Card>
            <CardContent className="py-8">
              <div className="text-center space-y-3">
                <Skeleton className="h-16 w-20 mx-auto" />
                <Skeleton className="h-6 w-28 mx-auto" />
              </div>
            </CardContent>
          </Card>

          {/* Table skeleton */}
          <Skeleton className="h-64 w-full" />

          {/* Metrics skeleton */}
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-2 w-full mb-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </ResumeBuilderShell>
    );
  }

  if (!project) {
    return (
      <ResumeBuilderShell>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Project not found</p>
        </div>
      </ResumeBuilderShell>
    );
  }

  const scoreBadge = getScoreBadge(project.current_score || 0);
  const requirementCoverage = stats.totalRequirements > 0
    ? Math.round((stats.matchedRequirements / stats.totalRequirements) * 100)
    : 0;

  return (
    <ResumeBuilderShell
      breadcrumbs={[
        { label: "Projects", href: "/resume-builder" },
        { label: "Match Report" },
      ]}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Match Report</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {project.role_title} • {project.seniority_level}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate(`/resume-builder/${projectId}/fix`)}
            >
              <Wrench className="h-4 w-4 mr-2" />
              Fix Issues
            </Button>
            <Button onClick={() => navigate(`/resume-builder/${projectId}/studio/summary`)}>
              <Wand2 className="h-4 w-4 mr-2" />
              Start Rewrite
            </Button>
          </div>
        </div>

        {/* Score Card - Prominent at top */}
        <Card>
          <CardContent className="py-8">
            <div className="text-center space-y-3">
              <div className={`text-7xl font-light tabular-nums tracking-tight ${getScoreColor(project.current_score || 0)}`}>
                {project.current_score ?? 0}
              </div>
              <Badge variant={scoreBadge.variant} className="text-sm px-3 py-1">
                {scoreBadge.label}
              </Badge>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Based on {stats.totalRequirements > 0 ? `${stats.totalRequirements} job requirements and ` : ''}{stats.totalKeywords} keywords analyzed
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Keyword Comparison Table - Full width */}
        {keywordTableData.length > 0 && (
          <KeywordComparisonTable 
            keywords={keywordTableData}
            onAddKeyword={handleAddKeyword}
          />
        )}

        {/* Metrics Row - 3 cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Seniority Alignment */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  Seniority
                </CardTitle>
                <Badge 
                  variant={stats.seniorityMatch >= 70 ? "default" : stats.seniorityMatch >= 50 ? "secondary" : "destructive"}
                  className="text-xs"
                >
                  {stats.seniorityMatch}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={stats.seniorityMatch} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {stats.seniorityMatch >= 70 
                  ? "Strong alignment"
                  : stats.seniorityMatch >= 50
                  ? "Partial alignment"
                  : "Gap detected"}
              </p>
            </CardContent>
          </Card>

          {/* Requirement Coverage */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  Requirements
                </CardTitle>
                {stats.totalRequirements > 0 ? (
                  <Badge 
                    variant={requirementCoverage >= 70 ? "default" : requirementCoverage >= 50 ? "secondary" : "destructive"}
                    className="text-xs"
                  >
                    {stats.matchedRequirements}/{stats.totalRequirements}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">—</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {stats.totalRequirements > 0 ? (
                <>
                  <Progress value={requirementCoverage} className="h-2" />
                  {stats.criticalGaps > 0 && (
                    <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {stats.criticalGaps} critical gap{stats.criticalGaps > 1 ? 's' : ''}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  Run analysis for breakdown
                </p>
              )}
            </CardContent>
          </Card>

          {/* ATS Compatibility */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  ATS Score
                </CardTitle>
                {atsAnalysis && (
                  <Badge variant={getATSScoreBadge(atsAnalysis.score).variant} className="text-xs">
                    {getATSScoreBadge(atsAnalysis.score).label}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-xs">
                {atsAnalysis?.passedChecks.slice(0, 2).map((check, i) => (
                  <div key={i} className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-primary flex-shrink-0" />
                    <span className="truncate">{check}</span>
                  </div>
                ))}
                {atsAnalysis?.issues.slice(0, 1).map((issue, i) => (
                  <div key={`issue-${i}`} className="flex items-center gap-2">
                    {issue.type === 'error' ? (
                      <XCircle className="h-3 w-3 text-destructive flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className={`truncate text-xs ${issue.type === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {issue.issue}
                    </span>
                  </div>
                ))}
                {!atsAnalysis && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                    Standard format
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Single Action Card - Compare Resume & JD */}
        <Card
          className="cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => navigate(`/resume-builder/${projectId}/fix?tab=comparison`)}
        >
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SplitSquareVertical className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Compare Resume & JD</p>
                  <p className="text-xs text-muted-foreground">
                    See your resume side-by-side with job requirements
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                View →
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="text-center pt-4">
          <Button
            variant="ghost"
            onClick={() => navigate(`/resume-builder/${projectId}/target`)}
          >
            ← Back to Target Settings
          </Button>
        </div>
      </div>
    </ResumeBuilderShell>
  );
}
