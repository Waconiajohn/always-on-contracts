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
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, convertInchesToTwip } from 'docx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import { 
  Copy, 
  FileText, 
  Download,
  FileDown,
  Loader2,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import type { RBProject, RBVersion } from '@/types/resume-builder';
import { 
  applyTemplateFormatting, 
  compileToPlainText, 
  getDocxStyles, 
  getPdfStyles,
  type TemplateId 
} from '@/lib/export-templates';

interface Template {
  id: TemplateId;
  name: string;
  description: string;
  pages: string;
}

const TEMPLATES: Template[] = [
  { id: 'executive', name: '1-Page Executive', description: 'Max 3 bullets per role, concise summary', pages: '1' },
  { id: 'standard', name: '2-Page Standard', description: 'Full detail with structured sections', pages: '2' },
  { id: 'ats-safe', name: 'ATS-Safe', description: 'Plain formatting, standard headings, no bullets', pages: 'Varies' },
];

export default function ExportPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<RBProject | null>(null);
  const [versions, setVersions] = useState<RBVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [plainText, setPlainText] = useState('');
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isPdfExporting, setIsPdfExporting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('standard');

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

  const compileResume = (versions: RBVersion[], template: TemplateId = 'standard') => {
    // Apply template-specific formatting
    const formattedSections = applyTemplateFormatting(versions, template);
    const text = compileToPlainText(formattedSections, template);
    setPlainText(text);
  };

  // Re-compile when template changes
  useEffect(() => {
    if (versions.length > 0) {
      compileResume(versions, selectedTemplate);
    }
  }, [selectedTemplate, versions]);

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

  const handleDownloadDocx = async () => {
    if (!versions.length) {
      toast.error('No content to export');
      return;
    }

    setIsExporting(true);
    try {
      const formattedSections = applyTemplateFormatting(versions, selectedTemplate);
      const styles = getDocxStyles(selectedTemplate);

      const children: (typeof Paragraph.prototype)[] = [];

      // Add header if project has role title
      if (project?.role_title) {
        children.push(
          new Paragraph({
            text: project.role_title,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
          })
        );
        children.push(new Paragraph({ text: '' }));
      }

      // Add each formatted section
      for (const section of formattedSections) {
        children.push(
          new Paragraph({
            text: section.title,
            heading: HeadingLevel.HEADING_1,
          })
        );

        // Split content into paragraphs/bullets
        const lines = section.content.split('\n').filter(line => line.trim());
        for (const line of lines) {
          const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-');
          children.push(
            new Paragraph({
              children: [new TextRun({ 
                text: line.replace(/^[•-]\s*/, ''),
                size: styles.body.size * 2, // docx uses half-points
              })],
              bullet: isBullet ? { level: 0 } : undefined,
            })
          );
        }

        children.push(new Paragraph({ text: '' }));
      }

      const doc = new Document({
        sections: [{
          properties: {
            page: {
              margin: {
                top: convertInchesToTwip(styles.margins.top),
                bottom: convertInchesToTwip(styles.margins.bottom),
                left: convertInchesToTwip(styles.margins.left),
                right: convertInchesToTwip(styles.margins.right),
              },
            },
          },
          children,
        }],
      });

      const blob = await Packer.toBlob(doc);
      const templateSuffix = selectedTemplate === 'executive' ? '_exec' : 
                             selectedTemplate === 'ats-safe' ? '_ats' : '';
      saveAs(blob, `${project?.role_title?.replace(/\s+/g, '_') || 'resume'}${templateSuffix}.docx`);
      toast.success('Downloaded as DOCX');
    } catch (err) {
      console.error('DOCX export error:', err);
      toast.error('Failed to generate DOCX');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!versions.length) {
      toast.error('No content to export');
      return;
    }

    setIsPdfExporting(true);
    try {
      const formattedSections = applyTemplateFormatting(versions, selectedTemplate);
      const styles = getPdfStyles(selectedTemplate);

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = styles.margins;
      const maxWidth = pageWidth - margin * 2;
      let yPosition = margin;
      const lineHeight = styles.lineHeight;
      const sectionGap = styles.sectionGap;

      // Add title if project has role title
      if (project?.role_title) {
        pdf.setFontSize(styles.title.fontSize);
        pdf.setFont('helvetica', 'bold');
        const titleWidth = pdf.getTextWidth(project.role_title);
        pdf.text(project.role_title, (pageWidth - titleWidth) / 2, yPosition);
        yPosition += 12;
      }

      // Add each formatted section
      for (const section of formattedSections) {
        // Check if we need a new page
        if (yPosition > 270) {
          pdf.addPage();
          yPosition = margin;
        }

        // Section title
        pdf.setFontSize(styles.heading.fontSize);
        pdf.setFont('helvetica', 'bold');
        pdf.text(section.title, margin, yPosition);
        yPosition += lineHeight + 2;

        // Section content
        pdf.setFontSize(styles.body.fontSize);
        pdf.setFont('helvetica', 'normal');
        
        const lines = section.content.split('\n').filter(line => line.trim());
        for (const line of lines) {
          // Check if we need a new page
          if (yPosition > 280) {
            pdf.addPage();
            yPosition = margin;
          }

          const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-');
          const cleanLine = line.replace(/^[•-]\s*/, '');
          const prefix = isBullet ? '• ' : '';
          const xOffset = isBullet ? margin + 3 : margin;
          
          // Wrap text if needed
          const wrappedLines = pdf.splitTextToSize(prefix + cleanLine, maxWidth - (isBullet ? 3 : 0));
          for (const wrappedLine of wrappedLines) {
            if (yPosition > 280) {
              pdf.addPage();
              yPosition = margin;
            }
            pdf.text(wrappedLine, xOffset, yPosition);
            yPosition += lineHeight;
          }
        }

        yPosition += sectionGap;
      }

      const templateSuffix = selectedTemplate === 'executive' ? '_exec' : 
                             selectedTemplate === 'ats-safe' ? '_ats' : '';
      pdf.save(`${project?.role_title?.replace(/\s+/g, '_') || 'resume'}${templateSuffix}.pdf`);
      toast.success('Downloaded as PDF');
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('Failed to generate PDF');
    } finally {
      setIsPdfExporting(false);
    }
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

        {/* Template Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Choose Template</CardTitle>
            <CardDescription>Select a format that fits your needs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    selectedTemplate === template.id
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{template.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {template.pages} {template.pages === '1' || template.pages === '2' ? 'page' : ''}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{template.description}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Export Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={handleCopy}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                {copied ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
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

          <Card 
            className={`cursor-pointer hover:border-primary transition-colors ${isExporting ? 'opacity-50' : ''}`} 
            onClick={!isExporting ? handleDownloadDocx : undefined}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                {isExporting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Download className="h-5 w-5" />
                )}
                Download DOCX
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                {selectedTemplate === 'executive' ? '1-page executive format' :
                 selectedTemplate === 'ats-safe' ? 'ATS-optimized Word doc' :
                 'Standard formatted Word document'}
              </CardDescription>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer hover:border-primary transition-colors ${isPdfExporting ? 'opacity-50' : ''}`} 
            onClick={!isPdfExporting ? handleDownloadPdf : undefined}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                {isPdfExporting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <FileDown className="h-5 w-5" />
                )}
                Download PDF
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                {selectedTemplate === 'executive' ? '1-page PDF format' :
                 selectedTemplate === 'ats-safe' ? 'Simple ATS-safe PDF' :
                 'Professional PDF format'}
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
