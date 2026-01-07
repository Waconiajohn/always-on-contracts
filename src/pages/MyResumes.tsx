import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Clock, TrendingUp, Copy, Download, Trash2, Loader2, Inbox } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/EmptyState";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ModuleGate } from "@/components/ModuleGate";
import { ExportDialog } from "@/components/resume-optimizer/components/ExportDialog";
import { exportResume } from "@/components/resume-optimizer/utils/exportHandler";
import type { ExportFormat } from "@/components/resume-optimizer/components/ExportDialog";

interface ResumeVersion {
  id: string;
  version_name: string;
  content: {
    sections?: any[];
    changelog?: any[];
    resumeText?: string;
  };
  customizations: any;
  match_score: number | null;
  template_id: string | null;
  created_at: string;
  updated_at: string;
}

export const MyResumes = () => {
  const [resumes, setResumes] = useState<ResumeVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingResumeId, setExportingResumeId] = useState<string | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [selectedResume, setSelectedResume] = useState<ResumeVersion | null>(null);
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
      
      // Query resume_versions table instead of resumes
      const { data, error } = await supabase
        .from('resume_versions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
        
      if (error) throw error;
      setResumes((data || []) as ResumeVersion[]);
    } catch (error) {
      console.error('Error fetching resumes:', error);
      toast.error('Failed to load resumes');
    } finally {
      setLoading(false);
    }
  };
  
  const handleContinueEditing = (resume: ResumeVersion) => {
    // Navigate to resume-builder with saved resume data in state
    navigate('/resume-builder', { 
      state: { 
        savedResumeId: resume.id,
        savedContent: resume.content,
        savedCustomizations: resume.customizations,
        savedTemplatId: resume.template_id
      } 
    });
  };
  
  const handleDuplicate = async (resumeId: string) => {
    try {
      const resume = resumes.find(r => r.id === resumeId);
      if (!resume) throw new Error('Resume not found');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { error: insertError } = await supabase
        .from('resume_versions')
        .insert({
          user_id: user.id,
          version_name: `${resume.version_name} (Copy)`,
          content: resume.content,
          customizations: resume.customizations,
          match_score: resume.match_score,
          template_id: resume.template_id
        });
      
      if (insertError) throw insertError;
      
      toast.success('Resume duplicated successfully');
      fetchResumes();
    } catch (error) {
      console.error('Error duplicating resume:', error);
      toast.error('Failed to duplicate resume');
    }
  };

  const handleExportClick = (resume: ResumeVersion, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedResume(resume);
    setShowExportDialog(true);
  };

  const handleExport = async (format: ExportFormat) => {
    if (!selectedResume) return;
    
    setExportingResumeId(selectedResume.id);
    try {
      // Create a BenchmarkResume-compatible object from the saved content
      const resumeData = {
        sections: selectedResume.content?.sections || [],
        changelog: selectedResume.content?.changelog || [],
        resumeText: selectedResume.content?.resumeText || '',
        followUpQuestions: []
      };
      
      await exportResume(
        format,
        resumeData,
        null,
        selectedResume.version_name,
        selectedResume.template_id || undefined
      );
      
      toast.success(`Resume exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export resume');
    } finally {
      setExportingResumeId(null);
    }
  };
  
  const handleDelete = async (resumeId: string) => {
    if (!confirm('Are you sure you want to delete this resume?')) return;
    
    try {
      const { error } = await supabase
        .from('resume_versions')
        .delete()
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (resumes.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-8 max-w-6xl">
          <EmptyState
            icon={Inbox}
            title="No resumes yet"
            description="Start building your first conversational, ATS-optimized resume"
            actionLabel="Create Resume"
            onAction={() => navigate('/resume-builder')}
          />
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
            onClick={() => navigate('/quick-score')} 
            size="lg" 
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Create New Resume
          </Button>
        </div>
        
        <div className="grid gap-4">
            {resumes.map(resume => (
              <Card 
                key={resume.id} 
                className="hover:border-primary transition-colors cursor-pointer"
                onClick={() => handleContinueEditing(resume)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">{resume.version_name}</h3>
                        {resume.customizations?.intensity && (
                          <Badge variant="secondary" className="capitalize">
                            {resume.customizations.intensity}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Updated {new Date(resume.updated_at).toLocaleDateString()}
                        </span>
                        {resume.match_score && (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {Math.round(resume.match_score)}% Match Score
                          </span>
                        )}
                      </div>
                      
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button 
                          onClick={() => handleContinueEditing(resume)} 
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
                          onClick={(e) => handleExportClick(resume, e)}
                          disabled={exportingResumeId === resume.id}
                        >
                          {exportingResumeId === resume.id ? (
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          ) : (
                            <Download className="mr-2 h-3 w-3" />
                          )}
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
      </div>

      {/* Export Dialog */}
      <ExportDialog
        open={showExportDialog}
        onClose={() => {
          setShowExportDialog(false);
          setSelectedResume(null);
        }}
        onExport={handleExport}
        resumeName={selectedResume?.version_name || 'Resume'}
      />
    </div>
  );
};

export default function MyResumesPage() {
  return (
    <ProtectedRoute>
      <ModuleGate module="resume_jobs_studio">
        <MyResumes />
      </ModuleGate>
    </ProtectedRoute>
  );
}
