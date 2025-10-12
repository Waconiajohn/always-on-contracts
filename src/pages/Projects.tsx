import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Briefcase, Plus, Clock, CheckCircle2, XCircle, AlertCircle, DollarSign, FileText, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ProjectsContent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('job_projects')
        .select(`
          *,
          job_opportunities (
            job_title,
            location,
            contract_type
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error loading projects",
        description: "Please try refreshing the page",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const statusColumns = [
    { key: "researching", label: "Researching", icon: Clock, color: "text-blue-500" },
    { key: "resume_ready", label: "Resume Ready", icon: CheckCircle2, color: "text-green-500" },
    { key: "applied", label: "Applied", icon: Briefcase, color: "text-purple-500" },
    { key: "interviewing", label: "Interviewing", icon: AlertCircle, color: "text-orange-500" },
    { key: "offer_received", label: "Offer Received", icon: DollarSign, color: "text-emerald-500" },
    { key: "accepted", label: "Accepted", icon: CheckCircle2, color: "text-green-600" },
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {statusColumns.map((column) => {
              const Icon = column.icon;
              const columnProjects = projects.filter(p => p.status === column.key);
              
              return (
                <div key={column.key} className="space-y-4">
                  <h2 className="text-lg font-semibold capitalize flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${column.color}`} />
                    {column.label} ({columnProjects.length})
                  </h2>
                  
                  {columnProjects.length === 0 ? (
                    <Card className="bg-muted/30">
                      <CardContent className="py-6 text-center text-sm text-muted-foreground">
                        No projects
                      </CardContent>
                    </Card>
                  ) : (
                    columnProjects.map((project) => (
                      <Card key={project.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base line-clamp-2">
                            {project.job_title || project.project_name}
                          </CardTitle>
                          {project.company_name && (
                            <CardDescription className="flex items-center gap-1">
                              <Briefcase className="h-3 w-3" />
                              {project.company_name}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {project.interview_date && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {new Date(project.interview_date).toLocaleDateString()}
                            </div>
                          )}
                          
                          {project.offer_amount && (
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-green-600" />
                              <span className="font-semibold text-green-600">
                                ${project.offer_amount.toLocaleString()}
                              </span>
                            </div>
                          )}

                          <Separator />

                          <div className="flex flex-col gap-2">
                            {project.status === 'offer_received' && (
                              <Button
                                size="sm"
                                variant="default"
                                className="w-full"
                                onClick={() => navigate('/salary-negotiation', { 
                                  state: { 
                                    jobTitle: project.job_title,
                                    companyName: project.company_name,
                                    offeredBase: project.offer_amount,
                                    offeredBonus: project.offer_bonus,
                                    offeredEquity: project.offer_equity
                                  } 
                                })}
                              >
                                <DollarSign className="h-4 w-4 mr-2" />
                                Negotiate Offer
                              </Button>
                            )}
                            
                            {project.resume_version_id && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full"
                                onClick={() => navigate('/agents/resume-builder')}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                View Resume
                              </Button>
                            )}
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              className="w-full text-xs"
                              onClick={() => {
                                // Navigate to project detail (to be implemented)
                                toast({ title: "Project details coming soon!" });
                              }}
                            >
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
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
