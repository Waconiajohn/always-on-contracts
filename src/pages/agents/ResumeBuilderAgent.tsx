import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Brain, History, GitCompare, Plus, Upload, Sparkles, Download, Palette } from "lucide-react";
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
import { SmartVaultPanel } from "@/components/resume/SmartVaultPanel";
import { VerificationResults } from "@/components/resume/VerificationResults";
import { ATSScoreCard } from "@/components/resume/ATSScoreCard";
import { EditableResumePreview } from "@/components/resume/EditableResumePreview";
import { ResumePreviewToggle } from "@/components/resume/ResumePreviewToggle";
import { VersionHistory } from "@/components/resume/VersionHistory";
import { VersionComparison } from "@/components/resume/VersionComparison";
import { TemplateCustomizer, TemplateCustomization, defaultPresets } from "@/components/resume/TemplateCustomizer";
import { applyCustomizationToHTML } from "@/lib/templateCustomizationUtils";

const ResumeBuilderAgentContent = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("current");
  const [jobDescription, setJobDescription] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [vaultData, setVaultData] = useState<any>(null);
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatedResume, setGeneratedResume] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'html' | 'docx' | 'pdf'>('html');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('modern');
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);
  const [atsScore, setAtsScore] = useState<any>(null);
  const [analyzingATS, setAnalyzingATS] = useState(false);
  const [previewMode, setPreviewMode] = useState<'preview' | 'edit'>('preview');
  const [vaultSuggestions, setVaultSuggestions] = useState<any[]>([]);
  const [loadingVault, setLoadingVault] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [comparingVersions, setComparingVersions] = useState<{ versionA: any; versionB: any } | null>(null);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [customization, setCustomization] = useState<TemplateCustomization>(defaultPresets.professional);
  const { toast } = useToast();
  const { recommendation, loading: personaLoading, getRecommendation, resetRecommendation } = usePersonaRecommendation('resume');

  useEffect(() => {
    fetchVaultData();
    fetchVersionHistory();

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

  const fetchVersionHistory = async () => {
    setLoadingVersions(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('resume_versions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching versions:', error);
      toast({
        title: "Couldn't load version history",
        variant: "destructive"
      });
    } else {
      setVersions(data || []);
    }
    setLoadingVersions(false);
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
    
    // Apply customization to generated resume
    const customizedHtml = applyCustomizationToHTML(data.htmlContent, customization);
    setGeneratedResume({
      ...data,
      htmlContent: customizedHtml
    });
    setActiveTab('compare');
    
    // Verify resume claims with Perplexity
    handleVerifyResume(data.htmlContent, jobDescription);
    
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
      description: `${data.metadata.jobTitle} resume ready. Verification in progress...` 
    });
  };

  const handleVerifyResume = async (resumeContent: string, jobDescription: string) => {
    setVerifying(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('verify-resume-claims', {
        body: { 
          resumeContent,
          jobDescription
        }
      });

      if (error) {
        console.error('Verification error:', error);
        toast({ 
          title: "Verification incomplete", 
          description: "Resume generated but verification unavailable",
          variant: "destructive"
        });
        setVerifying(false);
        return;
      }

      setVerificationResult(data);
      setVerifying(false);
      
      if (data.confidence >= 80) {
        toast({ 
          title: "High confidence verification ✓", 
          description: `${data.confidence}% confidence in resume claims`
        });
      } else if (data.confidence >= 60) {
        toast({ 
          title: "Verification complete", 
          description: `${data.confidence}% confidence. Review flagged items.`
        });
      } else {
        toast({ 
          title: "Low confidence", 
          description: "Please review flagged claims carefully",
          variant: "destructive"
        });
      }
    } catch (verifyError) {
      console.error('Error verifying resume:', verifyError);
      setVerifying(false);
    }

    // Analyze ATS score
    setAnalyzingATS(true);
    try {
      const { data: atsData, error: atsError } = await supabase.functions.invoke('analyze-ats-score', {
        body: {
          resumeContent,
          jobDescription
        }
      });

      if (atsError) {
        console.error('ATS analysis error:', atsError);
        toast({
          title: "ATS Analysis Warning",
          description: "Resume generated but ATS analysis unavailable",
          variant: "destructive"
        });
      } else if (atsData) {
        setAtsScore(atsData);
        toast({
          title: "ATS Analysis Complete",
          description: `Overall ATS compatibility: ${atsData.overallScore}%`
        });
      }
    } catch (atsError) {
      console.error('Error analyzing ATS score:', atsError);
    } finally {
      setAnalyzingATS(false);
    }
  };

  const fetchVaultSuggestions = async (jobDesc: string) => {
    if (!jobDesc || jobDesc.length < 100) return;
    
    setLoadingVault(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-vault-intelligence', {
        body: { jobDescription: jobDesc }
      });

      if (error) throw error;

      if (data.success) {
        setVaultSuggestions(data.suggestions.map((s: any) => ({
          ...s,
          used: false
        })));
      }
    } catch (error) {
      console.error('Error fetching vault suggestions:', error);
      toast({
        title: "Couldn't load vault suggestions",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    } finally {
      setLoadingVault(false);
    }
  };

  const handleUseVaultItem = (item: any) => {
    setVaultSuggestions(prev =>
      prev.map(s => s.id === item.id ? { ...s, used: true } : s)
    );

    toast({
      title: "Vault content added",
      description: "This content has been marked for inclusion in your resume",
    });
  };

  const handleApplyCustomization = () => {
    if (generatedResume) {
      const customizedHtml = applyCustomizationToHTML(generatedResume.htmlContent, customization);
      setGeneratedResume({
        ...generatedResume,
        htmlContent: customizedHtml
      });
      toast({
        title: "Customization applied",
        description: "Your resume styling has been updated"
      });
    }
  };

  const handleResetCustomization = () => {
    setCustomization(defaultPresets.professional);
    toast({
      title: "Customization reset",
      description: "Restored to professional preset"
    });
  };

  const handleApplyPreset = (preset: string) => {
    const presetConfig = defaultPresets[preset as keyof typeof defaultPresets];
    if (presetConfig) {
      setCustomization(presetConfig);
      toast({
        title: `${preset.charAt(0).toUpperCase() + preset.slice(1)} preset applied`,
        description: "Customization updated"
      });
    }
  };

  const handlePreviewVersion = (version: any) => {
    setGeneratedResume(version.content);
    setActiveTab('compare');
    toast({
      title: "Version loaded",
      description: version.version_name
    });
  };

  const handleCompareVersions = (versionA: any, versionB: any) => {
    setComparingVersions({ versionA, versionB });
  };

  const handleDownloadVersion = async (version: any) => {
    const fileName = `${version.version_name}-${Date.now()}`;
    try {
      await exportFormats.standardPDF(version.html_content, fileName);
      toast({ title: "Resume downloaded!" });
    } catch (error: any) {
      toast({
        title: "Download failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteVersion = async (versionId: string) => {
    const { error } = await supabase
      .from('resume_versions')
      .delete()
      .eq('id', versionId);

    if (error) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({ title: "Version deleted" });
      fetchVersionHistory();
    }
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
            {loading ? (
              <div className="flex items-center justify-center h-[calc(100vh-250px)]">
                <p className="text-sm text-muted-foreground">Loading vault...</p>
              </div>
            ) : !vaultData ? (
              <div className="text-center py-8">
                <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground mb-4">No Career Vault yet</p>
                <Button onClick={() => window.location.href = '/agents/corporate-assistant'}>
                  Build Your Career Vault
                </Button>
              </div>
            ) : (
              <SmartVaultPanel
                vaultSuggestions={vaultSuggestions}
                onUseItem={handleUseVaultItem}
                isLoading={loadingVault}
              />
            )}
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
                    const value = e.target.value;
                    setJobDescription(value);
                    if (recommendation) resetRecommendation();
                    setSelectedPersona(null);
                    
                    // Fetch vault suggestions when job description is substantial
                    if (value.length > 100) {
                      fetchVaultSuggestions(value);
                    }
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
                         <div className="flex gap-2">
                           <Button 
                             variant="outline" 
                             className="flex-1"
                             onClick={() => setShowTemplateSelector(true)}
                           >
                             <FileText className="h-4 w-4 mr-2" />
                             {selectedTemplate === 'modern' ? 'Modern Professional' : 
                              selectedTemplate === 'executive' ? 'Executive Classic' : 
                              'Technical Hybrid'} Template
                           </Button>
                           <Button
                             variant="outline"
                             onClick={() => setShowCustomizer(!showCustomizer)}
                           >
                             <Palette className="h-4 w-4" />
                           </Button>
                         </div>
                       </div>

                       {showCustomizer && (
                         <TemplateCustomizer
                           customization={customization}
                           onChange={setCustomization}
                           onReset={handleResetCustomization}
                           onApplyPreset={handleApplyPreset}
                         />
                       )}

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
                {comparingVersions ? (
                  <VersionComparison
                    versionA={comparingVersions.versionA}
                    versionB={comparingVersions.versionB}
                    onClose={() => setComparingVersions(null)}
                    onDownload={(versionId: string, _format: string) => {
                      const version = versions.find(v => v.id === versionId);
                      if (version) handleDownloadVersion(version);
                    }}
                  />
                ) : (
                  <VersionHistory
                    versions={versions}
                    currentVersionId={generatedResume?.metadata?.versionId}
                    onPreview={handlePreviewVersion}
                    onCompare={handleCompareVersions}
                    onDownload={handleDownloadVersion}
                    onDelete={handleDeleteVersion}
                    loading={loadingVersions}
                  />
                )}
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
                      <div className="flex justify-between items-center p-3 bg-muted rounded gap-3">
                        <div className="flex-1">
                          <p className="font-semibold">{generatedResume.metadata.jobTitle}</p>
                          <p className="text-sm text-muted-foreground">
                            {generatedResume.metadata.passes.final}
                          </p>
                        </div>
                        
                        <ResumePreviewToggle 
                          mode={previewMode}
                          onModeChange={setPreviewMode}
                        />

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

                      {previewMode === 'preview' ? (
                        <div>
                          <div className="flex justify-end mb-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleApplyCustomization}
                              disabled={!generatedResume}
                            >
                              Apply Customization
                            </Button>
                          </div>
                          <div className="border rounded p-6 bg-white" dangerouslySetInnerHTML={{ __html: generatedResume.htmlContent }} />
                        </div>
                      ) : (
                        <EditableResumePreview
                          structuredData={generatedResume.structuredData}
                          onUpdate={(updatedHtml) => {
                            setGeneratedResume((prev: any) => ({
                              ...prev,
                              htmlContent: updatedHtml
                            }));
                          }}
                        />
                      )}

                      {/* ATS Score Analysis */}
                      {(atsScore || analyzingATS) && (
                        <ATSScoreCard 
                          scoreData={atsScore || {
                            overallScore: 0,
                            keywordMatch: 0,
                            formatScore: 0,
                            experienceMatch: 0,
                            skillsMatch: 0,
                            recommendations: [],
                            strengths: [],
                            warnings: []
                          }}
                          isLoading={analyzingATS}
                        />
                      )}

                      {/* Verification Results */}
                      <VerificationResults 
                        result={verificationResult} 
                        loading={verifying}
                      />

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