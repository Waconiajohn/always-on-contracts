import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileText, ArrowRight, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ResumeBuilderShell } from "@/components/resume-builder/ResumeBuilderShell";
import type { RBProject } from "@/types/resume-builder";

export default function ResumeBuilderIndex() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<RBProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

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

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      upload: "Resume Upload",
      jd: "Job Description",
      target: "Target Confirmation",
      processing: "Processing",
      report: "Match Report",
      fix: "Fix Issues",
      studio: "Rewrite Studio",
      review: "Final Review",
      export: "Export",
      complete: "Complete",
    };
    return labels[status] || status;
  };

  const getNextRoute = (project: RBProject) => {
    return `/resume-builder/${project.id}/${project.status}`;
  };

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
            {projects.map((project) => (
              <Card 
                key={project.id} 
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => navigate(getNextRoute(project))}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base">
                        {project.role_title || "Untitled Project"}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {project.industry && project.seniority_level
                          ? `${project.seniority_level} • ${project.industry}`
                          : "No target set"}
                      </CardDescription>
                    </div>
                    {project.current_score !== null && (
                      <div className="text-2xl font-semibold tabular-nums text-primary">
                        {project.current_score}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {format(new Date(project.updated_at), "MMM d, yyyy")}
                    </span>
                    <span className="flex items-center gap-1 text-primary font-medium">
                      {getStatusLabel(project.status)}
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ResumeBuilderShell>
  );
}
