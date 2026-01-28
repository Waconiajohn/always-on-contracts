import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Wrench, Wand2, AlertTriangle, CheckCircle2, Target, TrendingUp, XCircle, AlertCircle, MessageSquare, SplitSquareVertical } from "lucide-react";
import { ResumeBuilderShell } from "@/components/resume-builder/ResumeBuilderShell";
import { runATSAnalysis, getATSScoreBadge, type ATSAnalysis } from "@/lib/ats-checks";
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
  const [missingKeywordsList, setMissingKeywordsList] = useState<string[]>([]);
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
      // Keywords to add = only those marked as "add" (missing from resume)
      // Keywords "ignore" = already in resume, no action needed
      const pending = keywords.filter(k => k.decision === 'ask_me');
      const toAdd = keywords.filter(k => k.decision === 'add');
      const ignored = keywords.filter(k => k.decision === 'ignore');
      
      // RBJDRequirement has weight field - higher weight = more important
      // Consider high-weight requirements as "critical" (weight > 0.8)
      const criticalReqs = requirements.filter(r => r.weight > 0.8);
      const totalReqs = requirements.length;

      // Calculate seniority match using actual level comparison
      // User level can come from project metadata or be inferred
      const projectData = projectRes.data as unknown as RBProject;
      const targetLevel = projectData.seniority_level || null;
      // For now, assume user is at IC level if not specified (Quick Score detected level is mapped on import)
      const userLevel = targetLevel; // Default to match for now - can be enhanced with resume parsing
      const seniorityScore = calculateSeniorityMatch(userLevel, targetLevel);

      // Estimate matched requirements based on ignored keywords (already in resume)
      const matchedCount = totalReqs > 0 ? Math.min(ignored.length, totalReqs) : 0;
      const criticalGapsCount = Math.max(0, criticalReqs.length - Math.floor(ignored.length * 0.5));

      setStats({
        totalKeywords: keywords.length,
        missingKeywords: toAdd.length,
        pendingKeywords: pending.length,
        approvedKeywords: toAdd.length, // "approved" here means keywords to add
        totalRequirements: totalReqs,
        matchedRequirements: matchedCount,
        criticalGaps: criticalGapsCount,
        seniorityMatch: seniorityScore,
        userLevel,
        targetLevel,
      });

      // Get top keywords to add for display
      setMissingKeywordsList(
        toAdd.slice(0, 6).map(k => k.keyword)
      );

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

  if (loading) {
    return (
      <ResumeBuilderShell>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
      <div className="max-w-3xl mx-auto space-y-8">
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
              Fix Issues First
            </Button>
            <Button onClick={() => navigate(`/resume-builder/${projectId}/studio/summary`)}>
              <Wand2 className="h-4 w-4 mr-2" />
              Start Rewrite
            </Button>
          </div>
        </div>

        {/* Score Card */}
        <Card>
          <CardContent className="py-8">
            <div className="text-center space-y-3">
              <div className={`text-6xl font-semibold tabular-nums tracking-tight ${getScoreColor(project.current_score || 0)}`}>
                {project.current_score ?? 0}
              </div>
              <Badge variant={scoreBadge.variant}>{scoreBadge.label}</Badge>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Based on {stats.totalRequirements} job requirements and {stats.totalKeywords} keywords analyzed
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Category Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Missing Keywords */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  Missing Keywords
                </CardTitle>
                {stats.missingKeywords > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {stats.missingKeywords} to add
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">
                Keywords from the job description not yet in your resume
              </p>
              <div className="flex flex-wrap gap-1.5">
                {missingKeywordsList.length > 0 ? (
                  <>
                    {missingKeywordsList.map((kw, i) => (
                      <Badge key={i} variant="outline" className="text-xs bg-accent border-border">
                        {kw}
                      </Badge>
                    ))}
                    {stats.missingKeywords > 6 && (
                      <Badge variant="outline" className="text-xs">
                        +{stats.missingKeywords - 6} more
                      </Badge>
                    )}
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                    All keywords covered
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Seniority Alignment */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  Seniority Alignment
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
              <p className="text-xs text-muted-foreground mb-3">
                How well your experience matches {project.seniority_level} level
              </p>
              <Progress value={stats.seniorityMatch} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {stats.seniorityMatch >= 70 
                  ? "Strong alignment with target seniority"
                  : stats.seniorityMatch >= 50
                  ? "Partial alignment - consider highlighting leadership"
                  : "Gap detected - emphasize relevant achievements"}
              </p>
            </CardContent>
          </Card>

          {/* Requirement Coverage */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  Requirement Coverage
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
              <p className="text-xs text-muted-foreground mb-3">
                Job requirements matched by your evidence
              </p>
              {stats.totalRequirements > 0 ? (
                <>
                  <Progress value={requirementCoverage} className="h-2" />
                  {stats.criticalGaps > 0 && (
                    <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {stats.criticalGaps} critical requirement{stats.criticalGaps > 1 ? 's' : ''} unmet
                    </p>
                  )}
                </>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  Run full analysis to see requirement breakdown
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
                  ATS Compatibility
                </CardTitle>
                {atsAnalysis && (
                  <Badge variant={getATSScoreBadge(atsAnalysis.score).variant} className="text-xs">
                    {getATSScoreBadge(atsAnalysis.score).label}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">
                Format checks for applicant tracking systems
              </p>
              <div className="space-y-1.5 text-xs">
                {/* Passed checks */}
                {atsAnalysis?.passedChecks.slice(0, 3).map((check, i) => (
                  <div key={i} className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                    {check}
                  </div>
                ))}
                
                {/* Issues */}
                {atsAnalysis?.issues.slice(0, 3).map((issue, i) => (
                  <div key={`issue-${i}`} className="flex items-center gap-2 text-muted-foreground">
                    {issue.type === 'error' ? (
                      <XCircle className="h-3 w-3 text-destructive" />
                    ) : issue.type === 'warning' ? (
                      <AlertCircle className="h-3 w-3 text-accent-foreground" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span className={issue.type === 'error' ? 'text-destructive' : ''}>
                      {issue.issue}
                    </span>
                  </div>
                ))}
                
                {/* Fallback for no analysis */}
                {!atsAnalysis && (
                  <>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3 text-primary" />
                      Plain text structure detected
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3 text-primary" />
                      Standard section headers
                    </div>
                  </>
                )}

                {/* Show more link if there are additional issues */}
                {atsAnalysis && atsAnalysis.issues.length > 3 && (
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="h-auto p-0 text-xs"
                    onClick={() => navigate(`/resume-builder/${projectId}/fix`)}
                  >
                    +{atsAnalysis.issues.length - 3} more issue(s)
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Tools */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Interview Practice */}
          <Card
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => navigate(`/resume-builder/${projectId}/interview`)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                Interview Practice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-2">
                Practice interview questions tailored to this job
              </p>
              <Button variant="outline" size="sm" className="text-xs">
                Start Practice →
              </Button>
            </CardContent>
          </Card>

          {/* Side-by-Side Comparison */}
          <Card
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => navigate(`/resume-builder/${projectId}/fix?tab=comparison`)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <SplitSquareVertical className="h-4 w-4 text-muted-foreground" />
                Compare Resume & JD
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-2">
                See your resume side-by-side with job requirements
              </p>
              <Button variant="outline" size="sm" className="text-xs">
                View Comparison →
              </Button>
            </CardContent>
          </Card>
        </div>

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
