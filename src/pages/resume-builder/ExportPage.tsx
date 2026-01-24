import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ResumeBuilderShell } from '@/components/resume-builder/ResumeBuilderShell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
   
  Copy, 
  FileText, 
  Code,
  Loader2,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import type { RBProject, RBVersion } from '@/types/resume-builder';

export default function ExportPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<RBProject | null>(null);
  const [versions, setVersions] = useState<RBVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [plainText, setPlainText] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    if (!projectId) return;
    setIsLoading(true);

    try {
      // Load project
      const { data: projectData, error: projectError } = await supabase
        .from('rb_projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;
      setProject(projectData as unknown as RBProject);

      // Load all active versions
      const { data: versionData, error: versionError } = await supabase
        .from('rb_versions')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_active', true)
        .order('section_name');

      if (versionError) throw versionError;
      setVersions((versionData as unknown as RBVersion[]) || []);

      // Compile plain text
      compileResume((versionData as unknown as RBVersion[]) || []);
    } catch (err) {
      toast.error('Failed to load resume data');
    } finally {
      setIsLoading(false);
    }
  };

  const compileResume = (versions: RBVersion[]) => {
    const sectionOrder = ['summary', 'skills', 'experience', 'education'];
    const sectionTitles: Record<string, string> = {
      summary: 'PROFESSIONAL SUMMARY',
      skills: 'SKILLS & COMPETENCIES',
      experience: 'PROFESSIONAL EXPERIENCE',
      education: 'EDUCATION & CERTIFICATIONS',
    };

    const sortedVersions = [...versions].sort((a, b) => {
      const aIndex = sectionOrder.indexOf(a.section_name);
      const bIndex = sectionOrder.indexOf(b.section_name);
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    });

    let text = '';
    for (const version of sortedVersions) {
      const title = sectionTitles[version.section_name] || version.section_name.toUpperCase();
      text += `\n${title}\n${'─'.repeat(title.length)}\n\n`;
      text += version.content.trim();
      text += '\n';
    }

    setPlainText(text.trim());
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(plainText);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([plainText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project?.role_title?.replace(/\s+/g, '_') || 'resume'}_tailored.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Downloaded as TXT');
  };

  const handleMarkComplete = async () => {
    if (!projectId) return;

    try {
      await supabase
        .from('rb_projects')
        .update({ status: 'complete' })
        .eq('id', projectId);

      toast.success('Project marked as complete!');
      navigate('/resume-builder');
    } catch (err) {
      toast.error('Failed to update project');
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
            <h1 className="text-2xl font-bold">Export Resume</h1>
            <p className="text-muted-foreground">
              Download or copy your tailored resume
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-1">
            Score: {project?.current_score ?? '--'}%
          </Badge>
        </div>

        {/* Export Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={handleCopy}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                {copied ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
                Copy to Clipboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Copy plain text to paste into any application
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={handleDownloadTxt}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-5 w-5" />
                Download TXT
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Plain text file for ATS compatibility
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="opacity-50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Code className="h-5 w-5" />
                DOCX (Coming Soon)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Formatted Word document
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Resume Preview</CardTitle>
            <CardDescription>
              {versions.length} sections compiled
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="plain">
              <TabsList>
                <TabsTrigger value="plain">Plain Text</TabsTrigger>
                <TabsTrigger value="sections">By Section</TabsTrigger>
              </TabsList>

              <TabsContent value="plain" className="mt-4">
                <ScrollArea className="h-[400px] rounded-md border bg-muted/30 p-4">
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {plainText || 'No content available'}
                  </pre>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="sections" className="mt-4">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {versions.map((version) => (
                      <div key={version.id} className="rounded-md border p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="secondary">
                            {version.section_name}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            v{version.version_number}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">
                          {version.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={() => navigate(`/resume-builder/${projectId}/review`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Review
          </Button>
          
          <Button onClick={handleMarkComplete} className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Mark Complete & Finish
          </Button>
        </div>
      </div>
    </ResumeBuilderShell>
  );
}
