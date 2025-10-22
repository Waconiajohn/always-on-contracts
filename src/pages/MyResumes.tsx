import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Clock, TrendingUp, Copy, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const MyResumes = () => {
  const [resumes, setResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchResumes();
  }, []);
  
  const fetchResumes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      
      const { data, error } = await supabase
        .from('saved_resumes' as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('updated_at', { ascending: false });
        
      if (error) throw error;
      setResumes(data || []);
    } catch (error) {
      console.error('Error fetching resumes:', error);
      toast.error('Failed to load resumes');
    } finally {
      setLoading(false);
    }
  };
  
  const handleContinueEditing = (resumeId: string) => {
    navigate('/agents/resume-builder', { state: { resumeId } });
  };
  
  const handleDuplicate = async (resumeId: string) => {
    try {
      const { data: resume, error: fetchError } = await supabase
        .from('saved_resumes' as any)
        .select('*')
        .eq('id', resumeId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const resumeCopy = resume as any;
      const duplicateData: any = {
        job_title: `${resumeCopy.job_title} (Copy)`,
        job_company: resumeCopy.job_company,
        job_description: resumeCopy.job_description,
        job_analysis: resumeCopy.job_analysis,
        selected_format: resumeCopy.selected_format,
        contact_info: resumeCopy.contact_info,
        sections: resumeCopy.sections,
        vault_matches: resumeCopy.vault_matches,
        gap_analysis: resumeCopy.gap_analysis,
        requirement_responses: resumeCopy.requirement_responses,
        user_id: user.id
      };
      
      const { error: insertError } = await supabase
        .from('saved_resumes' as any)
        .insert(duplicateData);
      
      if (insertError) throw insertError;
      
      toast.success('Resume duplicated successfully');
      fetchResumes();
    } catch (error) {
      console.error('Error duplicating resume:', error);
      toast.error('Failed to duplicate resume');
    }
  };
  
  const handleDelete = async (resumeId: string) => {
    if (!confirm('Are you sure you want to delete this resume?')) return;
    
    try {
      const { error } = await supabase
        .from('saved_resumes' as any)
        .update({ is_active: false })
        .eq('id', resumeId);
      
      if (error) throw error;
      
      toast.success('Resume deleted successfully');
      fetchResumes();
    } catch (error) {
      console.error('Error deleting resume:', error);
      toast.error('Failed to delete resume');
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your resumes...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Resumes</h1>
            <p className="text-muted-foreground">
              {resumes.length} {resumes.length === 1 ? 'resume' : 'resumes'} saved
            </p>
          </div>
          <Button 
            onClick={() => navigate('/agents/resume-builder')} 
            size="lg" 
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Create New Resume
          </Button>
        </div>
        
        {resumes.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-2xl font-semibold mb-2">No Resumes Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create your first AI-powered, ATS-optimized resume tailored to any job description.
            </p>
            <Button 
              onClick={() => navigate('/agents/resume-builder')} 
              size="lg"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Resume
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {resumes.map(resume => (
              <Card 
                key={resume.id} 
                className="hover:border-primary transition-colors cursor-pointer"
                onClick={() => handleContinueEditing(resume.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">{resume.job_title}</h3>
                        {resume.job_company && (
                          <Badge variant="outline">{resume.job_company}</Badge>
                        )}
                        <Badge variant="secondary">{resume.selected_format || 'executive'}</Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Updated {new Date(resume.updated_at).toLocaleDateString()}
                        </span>
                        {resume.ats_score && (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {resume.ats_score}% ATS Score
                          </span>
                        )}
                        {resume.coverage_score && (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {resume.coverage_score}% Coverage
                          </span>
                        )}
                      </div>
                      
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button 
                          onClick={() => handleContinueEditing(resume.id)} 
                          variant="default"
                          size="sm"
                        >
                          Continue Editing
                        </Button>
                        <Button 
                          onClick={() => handleDuplicate(resume.id)} 
                          variant="outline"
                          size="sm"
                        >
                          <Copy className="mr-2 h-3 w-3" />
                          Duplicate
                        </Button>
                        <Button 
                          variant="outline"
                          size="sm"
                        >
                          <Download className="mr-2 h-3 w-3" />
                          Export
                        </Button>
                        <Button 
                          onClick={() => handleDelete(resume.id)} 
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
