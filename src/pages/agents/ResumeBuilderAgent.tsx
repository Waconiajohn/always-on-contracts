import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Brain, History, GitCompare, Zap, Target, Plus, Upload, Sparkles, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { JobImportDialog } from "@/components/JobImportDialog";
import { PersonaSelector } from "@/components/PersonaSelector";
import { usePersonaRecommendation } from "@/hooks/usePersonaRecommendation";
import { TemplateSelector } from "@/components/resume/TemplateSelector";
import { useLocation } from "react-router-dom";
import { exportFormats } from "@/lib/resumeExportUtils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

const ResumeBuilderAgentContent = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("current");
  const [jobDescription, setJobDescription] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [vaultData, setVaultData] = useState<any>(null);
  const [selectedPhrases, setSelectedPhrases] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatedResume, setGeneratedResume] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'html' | 'docx' | 'pdf'>('html');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('modern');
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const { toast } = useToast();
  const { recommendation, loading: personaLoading, getRecommendation, resetRecommendation } = usePersonaRecommendation('resume');

  useEffect(() => {
    fetchVaultData();

    // Check if we came from job search with pre-loaded job data
    if (location.state?.fromJobSearch) {
      const { jobTitle: title, companyName: company, jobDescription: description } = location.state;
      setJobTitle(title || '');
      setCompanyName(company || '');
      setJobDescription(description || '');

      toast({
        title: "Job loaded from search",
        description: `Ready to generate resume for ${title} at ${company}`,
        duration: 5000
      });
    }
  }, []);

  const fetchVaultData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: vault } = await supabase
      .from('career_vault')
      .select('*, vault_power_phrases(*), vault_transferable_skills(*), vault_hidden_competencies(*)')
      .eq('user_id', user.id)
      .single();

    setVaultData(vault);
    setLoading(false);
  };

  const handleGetPersonaRecommendation = async () => {
    if (!jobDescription.trim()) {
      toast({ title: "Please enter a job description", variant: "destructive" });
      return;
    }
    await getRecommendation(jobDescription);
  };

  const handleGenerateResume = async () => {
    if (!jobDescription.trim()) {
      toast({ title: "Please enter a job description", variant: "destructive" });
      return;
    }

    if (!selectedPersona) {
      toast({ title: "Please select a persona", description: "Choose a writing style first", variant: "destructive" });
      return;
    }

    setGenerating(true);
    toast({ 
      title: "Generating executive resume...", 
      description: "Using all 20 Career Vault intelligence categories with 3-pass AI review" 
    });
    
    const { data, error } = await supabase.functions.invoke('generate-executive-resume', {
      body: { 
        jobDescription,
        persona: selectedPersona,
        format: selectedFormat
      }
    });

    if (error) {
      setGenerating(false);
      toast({ title: "Error generating resume", description: error.message, variant: "destructive" });
      return;
    }

    setGenerating(false);
    setGeneratedResume(data);
    setActiveTab('compare');
    
    // Save resume version to database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: templates } = await supabase
          .from('resume_templates')
          .select('id')
          .eq('template_type', selectedTemplate)
          .single();

        await supabase.from('resume_versions').insert({
          user_id: user.id,
          version_name: `${jobTitle || 'Resume'} - ${new Date().toLocaleDateString()}`,
          template_id: templates?.id || null,
          content: data,
          html_content: data.htmlContent,
          customizations: {
            persona: selectedPersona,
            selected_phrases: selectedPhrases,
            selected_skills: selectedSkills,
            job_title: jobTitle,
            company_name: companyName
          },
          match_score: data.metadata?.matchScore || null
        });
      }
    } catch (saveError) {
      console.error('Error saving resume version:', saveError);
    }
    
    toast({ 
      title: "Resume generated!", 
      description: `${data.metadata.jobTitle} resume ready with verification complete` 
    });
  };

  const handleDownload = async (format: string) => {
    if (!generatedResume) return;
    
    const fileName = `resume-${jobTitle || 'document'}-${Date.now()}`;
    
    try {
      switch(format) {
        case 'pdf':
          await exportFormats.standardPDF(generatedResume.htmlContent, fileName);
          toast({ title: "PDF downloaded successfully!" });
          break;
        case 'ats-pdf':
          await exportFormats.atsPDF(generatedResume.structuredData || {}, fileName);
          toast({ title: "ATS-optimized PDF downloaded!" });
          break;
        case 'docx':
          await exportFormats.generateDOCX(generatedResume.structuredData || {}, `${fileName}.docx`);
          toast({ title: "DOCX downloaded successfully!" });
          break;
        case 'plain':
          const text = exportFormats.plainText(generatedResume.structuredData || {});
          navigator.clipboard.writeText(text);
          toast({ title: "Plain text copied to clipboard!" });
          break;
        case 'linkedin':
          const linkedInText = exportFormats.linkedInFormat(generatedResume.structuredData || {});
          navigator.clipboard.writeText(linkedInText);
          toast({ title: "LinkedIn format copied to clipboard!" });
          break;
        default:
          // HTML download
          const blob = new Blob([generatedResume.htmlContent], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${fileName}.html`;
          a.click();
          URL.revokeObjectURL(url);
          toast({ title: "HTML downloaded successfully!" });
      }
    } catch (error: any) {
      toast({ 
        title: "Download failed", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Resume Builder Agent</h1>
          <p className="text-muted-foreground">Build custom resumes from your Career Vault</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Career Vault Explorer */}
          <Card className="lg:col-span-1 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">Your Career Vault</h2>
                <p className="text-sm text-muted-foreground">Select ammunition</p>
              </div>
            </div>

            <ScrollArea className="h-[calc(100vh-250px)]">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : !vaultData ? (
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground mb-4">No Career Vault yet</p>
                  <Button onClick={() => window.location.href = '/agents/corporate-assistant'}>
                    Build Your Career Vault
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Power Phrases ({vaultData.vault_power_phrases?.length || 0})
                    </h3>
                    <div className="space-y-2">
                      {vaultData.vault_power_phrases?.slice(0, 5).map((phrase: any) => (
                        <div key={phrase.id} className="p-2 bg-muted rounded text-xs cursor-pointer hover:bg-primary/10"
                          onClick={() => setSelectedPhrases(prev => 
                            prev.includes(phrase.id) ? prev.filter(id => id !== phrase.id) : [...prev, phrase.id]
                          )}>
                          <Badge variant={selectedPhrases.includes(phrase.id) ? "default" : "outline"} className="mb-1">
                            {phrase.category}
                          </Badge>
                          <p className="line-clamp-2">{phrase.power_phrase}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold mb-2">
                      Transferable Skills ({vaultData.vault_transferable_skills?.length || 0})
                    </h3>
                    <div className="flex flex-wrap gap-1">
                      {vaultData.vault_transferable_skills?.slice(0, 10).map((skill: any) => (
                        <Badge 
                          key={skill.id} 
                          variant={selectedSkills.includes(skill.id) ? "default" : "outline"}
                          className="cursor-pointer text-xs"
                          onClick={() => setSelectedSkills(prev => 
                            prev.includes(skill.id) ? prev.filter(id => id !== skill.id) : [...prev, skill.id]
                          )}>
                          {skill.stated_skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold mb-2">
                      Hidden Competencies ({vaultData.vault_hidden_competencies?.length || 0})
                    </h3>
                    <div className="space-y-1">
                      {vaultData.vault_hidden_competencies?.slice(0, 3).map((comp: any) => (
                        <Badge key={comp.id} variant="secondary" className="text-xs">
                          {comp.competency_area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </ScrollArea>
          </Card>

          {/* Right: Resume Builder Workspace */}
          <Card className="lg:col-span-2 p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="current" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Build
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-2">
                  <History className="h-4 w-4" />
                  Versions
                </TabsTrigger>
                <TabsTrigger value="compare" className="gap-2">
                  <GitCompare className="h-4 w-4" />
                  Preview
                </TabsTrigger>
              </TabsList>

              <TabsContent value="current" className="mt-4 space-y-4">
                {!showTemplateSelector ? (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">Job Description</label>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setImportDialogOpen(true)}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Import Job
                      </Button>
                    </div>
                
                {jobTitle && (
                  <div className="p-3 bg-muted rounded-md space-y-1">
                    <p className="text-sm font-semibold">{jobTitle}</p>
                    {companyName && <p className="text-sm text-muted-foreground">{companyName}</p>}
                  </div>
                )}
                
                <Textarea 
                  placeholder="Paste the job description here, or click 'Import Job' to upload from file/URL..."
                  className="min-h-[200px]"
                  value={jobDescription}
                  onChange={(e) => {
                    setJobDescription(e.target.value);
                    if (recommendation) resetRecommendation();
                    setSelectedPersona(null);
                  }}
                />

                {!recommendation && jobDescription.trim() && (
                  <Button onClick={handleGetPersonaRecommendation} variant="outline" className="w-full" disabled={personaLoading}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {personaLoading ? "Analyzing..." : "Get Persona Recommendation"}
                  </Button>
                )}

                    {recommendation && (
                      <PersonaSelector
                        personas={recommendation.personas}
                        recommendedPersona={recommendation.recommendedPersona}
                        reasoning={recommendation.reasoning}
                        confidence={recommendation.confidence}
                        selectedPersona={selectedPersona}
                        onSelectPersona={setSelectedPersona}
                        agentType="resume"
                      />
                    )}
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Resume Template</label>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => setShowTemplateSelector(true)}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          {selectedTemplate === 'modern' ? 'Modern Professional' : 
                           selectedTemplate === 'executive' ? 'Executive Classic' : 
                           'Technical Hybrid'} Template
                        </Button>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Output Format</label>
                        <div className="flex gap-2">
                          {(['html', 'docx', 'pdf'] as const).map((fmt) => (
                            <Button
                              key={fmt}
                              variant={selectedFormat === fmt ? "default" : "outline"}
                              size="sm"
                              onClick={() => setSelectedFormat(fmt)}
                            >
                              {fmt.toUpperCase()}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <Button onClick={handleGenerateResume} className="w-full" disabled={!selectedPersona || generating}>
                        <Plus className="h-4 w-4 mr-2" />
                        {generating ? 'Generating...' : 'Generate Executive Resume'}
                      </Button>
                  
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>✓ All 20 intelligence categories</p>
                        <p>✓ 3-pass AI generation with hiring manager review</p>
                        <p>✓ Gap coverage for unmatched requirements</p>
                        <p>✓ ATS-optimized with exact keywords</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <TemplateSelector
                      selectedTemplate={selectedTemplate}
                      onSelectTemplate={(template) => {
                        setSelectedTemplate(template);
                        setShowTemplateSelector(false);
                      }}
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => setShowTemplateSelector(false)}
                      className="w-full"
                    >
                      Back to Resume Builder
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history" className="mt-4">
                <ScrollArea className="h-[calc(100vh-300px)]">
                  <div className="text-center text-muted-foreground py-12">
                    <History className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Resume versions will appear here</p>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="compare" className="mt-4">
                <ScrollArea className="h-[calc(100vh-300px)]">
                  {!generatedResume ? (
                    <div className="text-center text-muted-foreground py-12">
                      <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p>Generate a resume to see preview</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-muted rounded">
                        <div>
                          <p className="font-semibold">{generatedResume.metadata.jobTitle}</p>
                          <p className="text-sm text-muted-foreground">
                            {generatedResume.metadata.passes.final}
                          </p>
                        </div>
                          <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button>
                              <Download className="h-4 w-4 mr-2" />
                              Download Resume
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem onClick={() => handleDownload('pdf')}>
                              📄 Standard PDF
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem onClick={() => handleDownload('ats-pdf')}>
                              🤖 ATS-Optimized PDF
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem onClick={() => handleDownload('docx')}>
                              📝 Microsoft Word (DOCX)
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem onClick={() => handleDownload('plain')}>
                              📋 Plain Text (Copy)
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem onClick={() => handleDownload('linkedin')}>
                              💼 LinkedIn Format (Copy)
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem onClick={() => handleDownload('html')}>
                              🌐 HTML File
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="border rounded p-6 bg-white" dangerouslySetInnerHTML={{ __html: generatedResume.htmlContent }} />

                      <div className="p-4 bg-muted rounded space-y-2 text-sm">
                        <p className="font-semibold">Hiring Manager Review:</p>
                        <p className="text-muted-foreground">{generatedResume.metadata.passes.review}</p>
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>

      <JobImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onJobImported={(jobData) => {
          setJobDescription(jobData.jobDescription);
          setJobTitle(jobData.jobTitle);
          setCompanyName(jobData.companyName || "");
          toast({
            title: "Job Imported",
            description: `Successfully imported: ${jobData.jobTitle}`,
          });
        }}
      />
    </div>
  );
};

export default function ResumeBuilderAgent() {
  return (
    <ProtectedRoute>
      <ResumeBuilderAgentContent />
    </ProtectedRoute>
  );
}