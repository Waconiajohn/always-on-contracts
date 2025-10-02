import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Plus, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ProjectsContent = () => {
  const navigate = useNavigate();

  // Placeholder for now - will be connected to actual data once types are regenerated
  const projects: any[] = [];
  const isLoading = false;

  const statusColumns = [
    { key: "researching", label: "Researching", icon: Clock, color: "text-blue-500" },
    { key: "resume_ready", label: "Resume Ready", icon: CheckCircle2, color: "text-green-500" },
    { key: "applied", label: "Applied", icon: Briefcase, color: "text-purple-500" },
    { key: "interviewing", label: "Interviewing", icon: AlertCircle, color: "text-orange-500" },
    { key: "offer", label: "Offer", icon: CheckCircle2, color: "text-emerald-500" },
    { key: "rejected", label: "Rejected", icon: XCircle, color: "text-red-500" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Active Projects</h1>
            <p className="text-muted-foreground">Track and manage your job applications</p>
          </div>
          <Button onClick={() => navigate("/job-search")}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Loading projects...</div>
        ) : projects.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="space-y-4">
              <Briefcase className="h-16 w-16 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start by searching for jobs and creating your first project
                </p>
                <Button onClick={() => navigate("/job-search")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Find Jobs
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {statusColumns.map((column) => {
              const Icon = column.icon;
              const columnProjects = projects.filter(p => p.status === column.key);
              
              return (
                <div key={column.key} className="space-y-4">
                  <h2 className="text-lg font-semibold capitalize flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${column.color}`} />
                    {column.label} ({columnProjects.length})
                  </h2>
                  {columnProjects.length === 0 && (
                    <Card className="bg-muted/30">
                      <CardContent className="py-6 text-center text-sm text-muted-foreground">
                        No projects in this stage
                      </CardContent>
                    </Card>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default function Projects() {
  return (
    <ProtectedRoute>
      <ProjectsContent />
    </ProtectedRoute>
  );
}
