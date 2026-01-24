import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ResumeBuilderShell } from '@/components/resume-builder/ResumeBuilderShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Loader2, 
  ArrowRight,
  RefreshCw,
  FileCheck
} from 'lucide-react';
import type { RBProject } from '@/types/resume-builder';

interface CritiqueItem {
  severity: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  suggestion?: string;
}

interface CritiqueResult {
  overall_score: number;
  hiring_manager_impression: string;
  strengths: string[];
  weaknesses: string[];
  items: CritiqueItem[];
}

export default function ReviewPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<RBProject | null>(null);
  const [critique, setCritique] = useState<CritiqueResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunningCritique, setIsRunningCritique] = useState(false);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    if (!projectId) return;
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('rb_projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      setProject(data as unknown as RBProject);
    } catch (err) {
      toast.error('Failed to load project');
    } finally {
      setIsLoading(false);
    }
  };

  const runCritique = async () => {
    if (!projectId) return;
    setIsRunningCritique(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Please sign in');
      }

      const { data, error } = await supabase.functions.invoke('rb-hiring-manager-critique', {
        body: { project_id: projectId },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;
      setCritique(data as CritiqueResult);
      toast.success('Critique complete');
    } catch (err) {
      toast.error('Failed to run critique');
    } finally {
      setIsRunningCritique(false);
    }
  };

  const handleExport = () => {
    navigate(`/resume-builder/${projectId}/export`);
  };

  const getSeverityIcon = (severity: CritiqueItem['severity']) => {
    switch (severity) {
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
  };

  if (isLoading) {
    return (
      <ResumeBuilderShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </ResumeBuilderShell>
    );
  }

  return (
    <ResumeBuilderShell>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Final Review</h1>
            <p className="text-muted-foreground">
              Get AI critique before exporting
            </p>
          </div>
          <Button onClick={handleExport} className="gap-2">
            <FileCheck className="h-4 w-4" />
            Export Resume
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Current Score */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Match Score</span>
              <span className="text-3xl font-bold text-primary">
                {project?.current_score ?? project?.original_score ?? '--'}%
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress 
              value={project?.current_score ?? project?.original_score ?? 0} 
              className="h-3"
            />
            <div className="flex justify-between mt-2 text-sm text-muted-foreground">
              <span>Original: {project?.original_score ?? '--'}%</span>
              <span>Target: 85%+</span>
            </div>
          </CardContent>
        </Card>

        {/* Critique Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Hiring Manager Critique</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={runCritique}
                disabled={isRunningCritique}
              >
                {isRunningCritique ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {critique ? 'Re-run' : 'Run'} Critique
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!critique && !isRunningCritique && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Click "Run Critique" to get AI feedback on your resume</p>
                <p className="text-sm mt-1">
                  The AI will evaluate your resume from a hiring manager's perspective
                </p>
              </div>
            )}

            {isRunningCritique && (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Analyzing your resume...</p>
              </div>
            )}

            {critique && (
              <div className="space-y-6">
                {/* Overall Impression */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Overall Score</h4>
                    <Badge variant={critique.overall_score >= 80 ? 'default' : 'secondary'}>
                      {critique.overall_score}/100
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {critique.hiring_manager_impression}
                  </p>
                </div>

                {/* Strengths */}
                {critique.strengths.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-green-600">Strengths</h4>
                    <ul className="space-y-1">
                      {critique.strengths.map((s, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Weaknesses */}
                {critique.weaknesses.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-yellow-600">Areas to Improve</h4>
                    <ul className="space-y-1">
                      {critique.weaknesses.map((w, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Detailed Items */}
                {critique.items.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Detailed Feedback</h4>
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2">
                        {critique.items.map((item, i) => (
                          <div 
                            key={i} 
                            className="flex items-start gap-2 p-2 rounded-md bg-muted/50"
                          >
                            {getSeverityIcon(item.severity)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {item.category}
                                </Badge>
                              </div>
                              <p className="text-sm mt-1">{item.message}</p>
                              {item.suggestion && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  💡 {item.suggestion}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={() => navigate(`/resume-builder/${projectId}/fix`)}>
            ← Back to Fix Mode
          </Button>
          <Button onClick={handleExport} className="gap-2">
            Continue to Export
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </ResumeBuilderShell>
  );
}
