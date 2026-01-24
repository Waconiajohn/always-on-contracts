import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ResumeBuilderShell } from '@/components/resume-builder/ResumeBuilderShell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Loader2, 
  ArrowRight,
  RefreshCw,
  FileCheck,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import type { RBProject, RBVersion, RBEvidence } from '@/types/resume-builder';

interface CritiqueItem {
  severity: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  suggestion?: string;
}

interface CritiqueResult {
  overall_score: number;
  hiring_manager_impression: string;
  would_interview: boolean;
  interview_reasoning: string;
  strengths: string[];
  weaknesses: string[];
  items: CritiqueItem[];
  missing_for_role: string[];
  red_flags: string[];
}

interface ValidationIssue {
  type: 'hallucination' | 'exaggeration' | 'unsupported_claim' | 'missing_evidence';
  severity: 'critical' | 'warning' | 'info';
  description: string;
  original_text?: string;
  problematic_text: string;
  suggestion: string;
}

interface ValidationResult {
  is_valid: boolean;
  confidence_score: number;
  issues: ValidationIssue[];
  summary: string;
  recommendation: 'approve' | 'revise' | 'reject';
}

export default function ReviewPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<RBProject | null>(null);
  const [versions, setVersions] = useState<RBVersion[]>([]);
  const [critique, setCritique] = useState<CritiqueResult | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunningCritique, setIsRunningCritique] = useState(false);
  const [isRunningValidation, setIsRunningValidation] = useState(false);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    if (!projectId) return;
    setIsLoading(true);
    
    try {
      const [projectRes, versionsRes] = await Promise.all([
        supabase
          .from('rb_projects')
          .select('*')
          .eq('id', projectId)
          .single(),
        supabase
          .from('rb_versions')
          .select('*')
          .eq('project_id', projectId)
          .eq('is_active', true)
      ]);

      if (projectRes.error) throw projectRes.error;
      setProject(projectRes.data as unknown as RBProject);
      setVersions((versionsRes.data as unknown as RBVersion[]) || []);
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

  const runValidation = async () => {
    if (!projectId || versions.length === 0) return;
    setIsRunningValidation(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Please sign in');
      }

      // Get original document
      const { data: docData } = await supabase
        .from('rb_documents')
        .select('raw_text')
        .eq('project_id', projectId)
        .maybeSingle();

      // Get evidence claims
      const { data: evidenceData } = await supabase
        .from('rb_evidence')
        .select('*')
        .eq('project_id', projectId);

      const evidenceClaims = ((evidenceData as unknown as RBEvidence[]) || []).map(e => ({
        claim: e.claim_text,
        source: e.source,
        confidence: e.confidence
      }));

      // Compile all rewritten content
      const rewrittenContent = versions
        .map(v => `[${v.section_name.toUpperCase()}]\n${v.content}`)
        .join('\n\n');

      const { data, error } = await supabase.functions.invoke('rb-validate-rewrite', {
        body: { 
          original_content: docData?.raw_text || '',
          rewritten_content: rewrittenContent,
          section_name: 'all',
          evidence_claims: evidenceClaims
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;
      setValidation(data as ValidationResult);
      toast.success('Validation complete');
    } catch (err) {
      console.error('Validation error:', err);
      toast.error('Failed to run validation');
    } finally {
      setIsRunningValidation(false);
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
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default:
        return <CheckCircle2 className="h-4 w-4 text-primary" />;
    }
  };

  const getValidationSeverityIcon = (severity: ValidationIssue['severity']) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default:
        return <CheckCircle2 className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTypeLabel = (type: ValidationIssue['type']) => {
    switch (type) {
      case 'hallucination':
        return { label: 'Hallucination', className: 'bg-destructive/10 text-destructive' };
      case 'exaggeration':
        return { label: 'Exaggeration', className: 'bg-amber-500/10 text-amber-600' };
      case 'unsupported_claim':
        return { label: 'Unsupported', className: 'bg-amber-500/10 text-amber-600' };
      case 'missing_evidence':
        return { label: 'Missing Evidence', className: 'bg-muted text-muted-foreground' };
      default:
        return { label: type, className: '' };
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
              Validate your resume before exporting
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

        {/* Review Tabs */}
        <Tabs defaultValue="validation" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="validation" className="gap-2">
              <ShieldCheck className="h-4 w-4" />
              Integrity Check
            </TabsTrigger>
            <TabsTrigger value="critique" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Hiring Manager
            </TabsTrigger>
          </TabsList>

          {/* Validation Tab */}
          <TabsContent value="validation">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Anti-Hallucination Check</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={runValidation}
                    disabled={isRunningValidation || versions.length === 0}
                  >
                    {isRunningValidation ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ShieldCheck className="h-4 w-4 mr-2" />
                    )}
                    {validation ? 'Re-validate' : 'Validate'}
                  </Button>
                </CardTitle>
                <CardDescription>
                  Verify all claims in your resume are supported by evidence
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!validation && !isRunningValidation && (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShieldAlert className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Click "Validate" to check for unsupported claims</p>
                    <p className="text-sm mt-1">
                      This ensures your resume only contains verifiable information
                    </p>
                  </div>
                )}

                {isRunningValidation && (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Checking for hallucinations...</p>
                  </div>
                )}

                {validation && (
                  <div className="space-y-6">
                    {/* Validation Status */}
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                      <div className={`p-3 rounded-full ${validation.is_valid ? 'bg-primary/20' : 'bg-destructive/20'}`}>
                        {validation.is_valid ? (
                          <ShieldCheck className="h-6 w-6 text-primary" />
                        ) : (
                          <ShieldAlert className="h-6 w-6 text-destructive" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {validation.is_valid ? 'All Claims Verified' : 'Issues Found'}
                          </p>
                          <Badge variant={
                            validation.recommendation === 'approve' ? 'default' :
                            validation.recommendation === 'reject' ? 'destructive' : 'secondary'
                          }>
                            {validation.recommendation}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Confidence: {validation.confidence_score}%
                        </p>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="p-3 rounded-md border bg-muted/30">
                      <p className="text-sm">{validation.summary}</p>
                    </div>

                    {/* Issues List */}
                    {validation.issues.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium">
                          Issues ({validation.issues.length})
                        </h4>
                        <ScrollArea className="h-[300px]">
                          <div className="space-y-3">
                            {validation.issues.map((issue, i) => {
                              const typeInfo = getTypeLabel(issue.type);
                              return (
                                <div 
                                  key={i} 
                                  className="p-3 rounded-md border bg-card"
                                >
                                  <div className="flex items-start gap-2">
                                    {getValidationSeverityIcon(issue.severity)}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <Badge 
                                          variant="secondary" 
                                          className={typeInfo.className}
                                        >
                                          {typeInfo.label}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs">
                                          {issue.severity}
                                        </Badge>
                                      </div>
                                      <p className="text-sm mt-2">{issue.description}</p>
                                      
                                      {issue.problematic_text && (
                                        <div className="mt-2 p-2 rounded bg-destructive/10 text-sm">
                                          <span className="text-xs text-muted-foreground block mb-1">
                                            Problematic text:
                                          </span>
                                          "{issue.problematic_text}"
                                        </div>
                                      )}
                                      
                                      {issue.original_text && (
                                        <div className="mt-2 p-2 rounded bg-muted text-sm">
                                          <span className="text-xs text-muted-foreground block mb-1">
                                            Original:
                                          </span>
                                          "{issue.original_text}"
                                        </div>
                                      )}
                                      
                                      <p className="text-xs text-primary mt-2">
                                        💡 {issue.suggestion}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      </div>
                    )}

                    {validation.issues.length === 0 && (
                      <div className="text-center py-4 text-primary">
                        <CheckCircle2 className="h-8 w-8 mx-auto mb-2" />
                        <p className="font-medium">No issues found!</p>
                        <p className="text-sm text-muted-foreground">
                          All claims appear to be properly supported
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Critique Tab */}
          <TabsContent value="critique">
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
                    {/* Interview Decision */}
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                      <div className={`p-3 rounded-full ${critique.would_interview ? 'bg-primary/20' : 'bg-destructive/20'}`}>
                        {critique.would_interview ? (
                          <CheckCircle2 className="h-6 w-6 text-primary" />
                        ) : (
                          <XCircle className="h-6 w-6 text-destructive" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {critique.would_interview ? 'Would Interview' : 'Would Not Interview'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {critique.interview_reasoning}
                        </p>
                      </div>
                    </div>

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
                        <h4 className="font-medium text-primary">Strengths</h4>
                        <ul className="space-y-1">
                          {critique.strengths.map((s, i) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Weaknesses */}
                    {critique.weaknesses.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-amber-600 dark:text-amber-500">Areas to Improve</h4>
                        <ul className="space-y-1">
                          {critique.weaknesses.map((w, i) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                              {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Red Flags */}
                    {critique.red_flags && critique.red_flags.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-destructive">Red Flags</h4>
                        <ul className="space-y-1">
                          {critique.red_flags.map((flag, i) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                              <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                              {flag}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Missing for Role */}
                    {critique.missing_for_role && critique.missing_for_role.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Missing for This Role</h4>
                        <div className="flex flex-wrap gap-2">
                          {critique.missing_for_role.map((item, i) => (
                            <Badge key={i} variant="outline">{item}</Badge>
                          ))}
                        </div>
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
          </TabsContent>
        </Tabs>

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
