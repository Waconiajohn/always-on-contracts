import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, ArrowRight, Loader2, Clock, CheckCircle2, Wand2, AlertCircle, Upload } from "lucide-react";
import { format } from "date-fns";
import { ResumeBuilderShell } from "@/components/resume-builder/ResumeBuilderShell";
import type { RBProject } from "@/types/resume-builder";
import { useToast } from "@/hooks/use-toast";

// Quick Score navigation state interface
interface QuickScoreState {
  fromQuickScore: boolean;
  resumeText: string;
  jobDescription: string;
  scoreResult?: {
    overallScore: number;
    detected: {
      role: string;
      industry: string;
      level: string;
    };
  };
  identifiedGaps?: Array<{
    type: string;
    issue: string;
    recommendation: string;
    impact: string;
    priority: number;
  }>;
  keywordAnalysis?: {
    matched: Array<{ keyword: string; priority: string }>;
    missing: Array<{ keyword: string; priority: string }>;
  };
  jobTitle?: string;
  industry?: string;
  focusedAction?: {
    type: 'add_keyword' | 'fix_gap';
    keyword?: string;
    issue?: string;
    recommendation?: string;
    suggestedPhrasing?: string;
    jdContext?: string;
    category?: string;
  };
}

type StatusConfig = {
  label: string;
  icon: React.ElementType;
  color: string;
  badgeVariant: "default" | "secondary" | "destructive" | "outline";
};

const STATUS_CONFIG: Record<string, StatusConfig> = {
  upload: { 
    label: "Resume Upload", 
    icon: Upload, 
    color: "text-muted-foreground",
    badgeVariant: "outline" 
  },
  jd: { 
    label: "Add Job Description", 
    icon: FileText, 
    color: "text-muted-foreground",
    badgeVariant: "outline" 
  },
  target: { 
    label: "Confirm Target", 
    icon: Clock, 
    color: "text-amber-500",
    badgeVariant: "secondary" 
  },
  processing: { 
    label: "Processing", 
    icon: Loader2, 
    color: "text-primary animate-spin",
    badgeVariant: "default" 
  },
  report: { 
    label: "View Report", 
    icon: FileText, 
    color: "text-primary",
    badgeVariant: "default" 
  },
  fix: { 
    label: "Fix Issues", 
    icon: AlertCircle, 
    color: "text-amber-500",
    badgeVariant: "secondary" 
  },
  studio: { 
    label: "Rewrite Studio", 
    icon: Wand2, 
    color: "text-primary",
    badgeVariant: "default" 
  },
  review: { 
    label: "Final Review", 
    icon: CheckCircle2, 
    color: "text-primary",
    badgeVariant: "default" 
  },
  export: { 
    label: "Export", 
    icon: FileText, 
    color: "text-primary",
    badgeVariant: "default" 
  },
  complete: { 
    label: "Complete", 
    icon: CheckCircle2, 
    color: "text-primary",
    badgeVariant: "default" 
  },
};

function getStatusConfig(status: string): StatusConfig {
  return STATUS_CONFIG[status] || { 
    label: status, 
    icon: Clock, 
    color: "text-muted-foreground",
    badgeVariant: "outline" 
  };
}

function getScoreColor(score: number | null): string {
  if (score === null) return "text-muted-foreground";
  if (score >= 80) return "text-primary";
  if (score >= 60) return "text-amber-500";
  return "text-destructive";
}

export default function ResumeBuilderIndex() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [projects, setProjects] = useState<RBProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [processingQuickScore, setProcessingQuickScore] = useState(false);
  const quickScoreHandled = useRef(false);

  // Handle Quick Score navigation state
  const quickScoreState = location.state as QuickScoreState | null;

  useEffect(() => {
    loadProjects();
  }, []);

  // Handle incoming Quick Score data - auto-create project with pre-filled data
  useEffect(() => {
    if (quickScoreState?.fromQuickScore && !quickScoreHandled.current) {
      quickScoreHandled.current = true;
      handleQuickScoreTransition(quickScoreState);
    }
  }, [quickScoreState]);

  const handleQuickScoreTransition = async (state: QuickScoreState) => {
    setProcessingQuickScore(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create project with pre-filled data from Quick Score
      const { data: project, error } = await supabase
        .from("rb_projects")
        .insert({
          user_id: user.id,
          status: "processing", // Skip upload/JD steps since we have the data
          role_title: state.jobTitle || state.scoreResult?.detected?.role || null,
          industry: state.industry || state.scoreResult?.detected?.industry || null,
          seniority_level: state.scoreResult?.detected?.level || null,
          jd_text: state.jobDescription,
          current_score: state.scoreResult?.overallScore || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Store the resume text as a document (rb_documents uses raw_text and file_name)
      if (state.resumeText) {
        await supabase
          .from("rb_documents")
          .insert({
            project_id: project.id,
            file_name: "quick-score-import.txt",
            raw_text: state.resumeText,
          });
      }

      // Store keyword analysis if available (rb_keyword_decisions uses decision without priority)
      if (state.keywordAnalysis) {
        const keywordDecisions = [
          ...state.keywordAnalysis.matched.map((k) => ({
            project_id: project.id,
            keyword: k.keyword,
            decision: "add" as const, // "keep" is not valid, use "add" for matched keywords too
          })),
          ...state.keywordAnalysis.missing.map((k) => ({
            project_id: project.id,
            keyword: k.keyword,
            decision: "add" as const,
          })),
        ];

        if (keywordDecisions.length > 0) {
          await supabase.from("rb_keyword_decisions").insert(keywordDecisions);
        }
      }

      toast({
        title: "Analysis imported!",
        description: "Your Quick Score data has been loaded. Let's optimize your resume.",
      });

      // Navigate to the report step with the pre-analyzed data
      navigate(`/resume-builder/${project.id}/report`, {
        state: {
          fromQuickScore: true,
          identifiedGaps: state.identifiedGaps,
          focusedAction: state.focusedAction,
        },
        replace: true,
      });
    } catch (err) {
      console.error("Failed to create project from Quick Score:", err);
      toast({
        title: "Import failed",
        description: "Could not import Quick Score data. Please try again.",
        variant: "destructive",
      });
      setProcessingQuickScore(false);
    }
  };

  const loadProjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("rb_projects")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setProjects((data as unknown as RBProject[]) || []);
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setLoading(false);
    }
  };

  const createNewProject = async () => {
    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("rb_projects")
        .insert({ user_id: user.id, status: "upload" })
        .select()
        .single();

      if (error) throw error;
      navigate(`/resume-builder/${data.id}/upload`);
    } catch (err) {
      console.error("Failed to create project:", err);
    } finally {
      setCreating(false);
    }
  };

  const getNextRoute = (project: RBProject) => {
    return `/resume-builder/${project.id}/${project.status}`;
  };

  // Show loading state when processing Quick Score data
  if (processingQuickScore) {
    return (
      <ResumeBuilderShell>
        <div className="flex flex-col items-center justify-center py-20 space-y-6">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="text-center">
            <h2 className="text-xl font-medium mb-2">Importing Your Analysis...</h2>
            <p className="text-sm text-muted-foreground">Setting up your project with Quick Score data</p>
          </div>
        </div>
      </ResumeBuilderShell>
    );
  }

  return (
    <ResumeBuilderShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Resume Builder</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Create job-targeted resumes with AI-powered optimization
            </p>
          </div>
          <Button onClick={createNewProject} disabled={creating}>
            {creating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            New Project
          </Button>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : projects.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No projects yet</h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
                Start by creating a new project to optimize your resume for a specific job.
              </p>
              <Button onClick={createNewProject} disabled={creating}>
                {creating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Create First Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const statusConfig = getStatusConfig(project.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <Card 
                  key={project.id} 
                  className="cursor-pointer hover:border-primary/50 transition-colors group"
                  onClick={() => navigate(getNextRoute(project))}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0 flex-1">
                        <CardTitle className="text-base truncate">
                          {project.role_title || "Untitled Project"}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {project.industry && project.seniority_level
                            ? `${project.seniority_level} • ${project.industry}`
                            : "No target set"}
                        </CardDescription>
                      </div>
                      {project.current_score !== null && (
                        <div className={`text-2xl font-semibold tabular-nums ${getScoreColor(project.current_score)}`}>
                          {project.current_score}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(project.updated_at), "MMM d, yyyy")}
                      </span>
                      <Badge 
                        variant={statusConfig.badgeVariant}
                        className="flex items-center gap-1.5 text-xs"
                      >
                        <StatusIcon className={`h-3 w-3 ${statusConfig.color}`} />
                        {statusConfig.label}
                        <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </ResumeBuilderShell>
  );
}
