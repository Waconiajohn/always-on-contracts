import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Wrench, Wand2 } from "lucide-react";
import { ResumeBuilderShell } from "@/components/resume-builder/ResumeBuilderShell";
import type { RBProject } from "@/types/resume-builder";

export default function ReportPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<RBProject | null>(null);

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const loadProject = async () => {
    if (!projectId) return;
    try {
      const { data, error } = await supabase
        .from("rb_projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (error) throw error;
      setProject(data as unknown as RBProject);
    } catch (err) {
      console.error("Failed to load project:", err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-primary";
    if (score >= 60) return "text-accent-foreground";
    return "text-destructive";
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
            <div className="text-center space-y-2">
              <div className={`text-6xl font-semibold tabular-nums tracking-tight ${getScoreColor(project.current_score || 0)}`}>
                {project.current_score ?? 0}
              </div>
              <p className="text-sm text-muted-foreground">
                Match Score
              </p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Based on job requirements analysis and role benchmarking
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Category Cards - Placeholder */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Missing Keywords (JD)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Keywords from the job description not found in your resume
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="px-2 py-1 rounded bg-muted text-xs">Coming soon</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Seniority Alignment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                How well your experience level matches the role
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="px-2 py-1 rounded bg-muted text-xs">Coming soon</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Impact & Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Quantified achievements and measurable results
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="px-2 py-1 rounded bg-muted text-xs">Coming soon</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">ATS Compatibility</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Format checks for applicant tracking systems
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="px-2 py-1 rounded bg-muted text-xs">Coming soon</span>
              </div>
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
