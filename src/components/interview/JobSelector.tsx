import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Briefcase, FileText, Calendar } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface JobSelectorProps {
  onJobSelected: (job: any) => void;
}

export const JobSelector = ({ onJobSelected }: JobSelectorProps) => {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [interviewStage, setInterviewStage] = useState<string>("hr");

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('application_queue')
      .select(`
        *,
        job_opportunities (
          id,
          job_title,
          agency_id,
          location,
          contract_type,
          job_description,
          required_skills,
          external_url,
          posted_date,
          hourly_rate_min,
          hourly_rate_max,
          contract_duration_months,
          contract_confidence_score,
          quality_score
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Transform data to match expected format
    const transformedData = (data || []).map(item => ({
      id: item.id,
      job_title: item.job_opportunities?.job_title || 'Unknown Position',
      company_name: item.job_opportunities?.location || 'Various Companies',
      created_at: item.created_at,
      application_status: item.application_status,
      opportunity_id: item.opportunity_id,
      job_description: item.job_opportunities?.job_description,
      required_skills: item.job_opportunities?.required_skills,
      location: item.job_opportunities?.location,
      match_score: item.match_score
    }));

    setProjects(transformedData);
  };

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
    const project = projects.find(p => p.id === projectId);
    setSelectedProject(project);
  };

  const handleContinue = () => {
    if (selectedProject) {
      onJobSelected({
        ...selectedProject,
        interviewStage
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Job from Your Pipeline</CardTitle>
        <CardDescription>
          Choose the job you're interviewing for to generate tailored prep materials
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Your Active Applications</label>
          <Select value={selectedProjectId} onValueChange={handleProjectSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select a job..." />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    <span>{project.job_title} - {project.company_name}</span>
                    {project.match_score && (
                      <Badge variant="secondary" className="ml-2">{project.match_score}%</Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedProject && (
          <>
            <Separator />
            
            <div className="space-y-3 bg-muted p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <Briefcase className="h-4 w-4 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">{selectedProject.job_title}</p>
                  <p className="text-xs text-muted-foreground">{selectedProject.company_name}</p>
                </div>
              </div>
              
              {selectedProject.resume_version_id && (
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 mt-0.5" />
                  <div>
                    <p className="text-sm">Resume on file</p>
                    <Badge variant="outline" className="text-xs mt-1">Will be used for prep</Badge>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 mt-0.5" />
                <div>
                  <p className="text-sm">Added: {new Date(selectedProject.created_at).toLocaleDateString()}</p>
                  <Badge variant="secondary" className="text-xs mt-1">
                    {selectedProject.application_status === 'applied' ? 'Applied' : 
                     selectedProject.application_status === 'interviewing' ? 'Interviewing' :
                     'In Queue'}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <label className="text-sm font-medium mb-2 block">Interview Stage</label>
              <Select value={interviewStage} onValueChange={setInterviewStage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hr">HR Screening (30 min)</SelectItem>
                  <SelectItem value="manager">Hiring Manager (60 min)</SelectItem>
                  <SelectItem value="panel">Panel Interview (90 min)</SelectItem>
                  <SelectItem value="technical">Technical/Case Study</SelectItem>
                  <SelectItem value="executive">Executive/C-Suite</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleContinue} className="w-full">
              Generate Prep Materials
            </Button>
          </>
        )}

        {projects.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No jobs in your application queue</p>
            <p className="text-xs mt-2">Add jobs to your application queue to prep for interviews</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
