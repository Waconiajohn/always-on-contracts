import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { JobInputSection } from "@/components/resume-builder/JobInputSection";
import { GapAnalysisView } from "@/components/resume-builder/GapAnalysisView";
import { FormatSelector } from "@/components/resume-builder/FormatSelector";
import { RequirementFilterView } from "@/components/resume-builder/RequirementFilterView";
import { RequirementCard } from "@/components/resume-builder/RequirementCard";
import { InteractiveResumeBuilder } from "@/components/resume-builder/InteractiveResumeBuilder";
import { ResumeBuilderOnboarding } from "@/components/resume-builder/ResumeBuilderOnboarding";
import { supabase } from "@/integrations/supabase/client";
import { getFormat } from "@/lib/resumeFormats";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useResumeBuilderStore } from "@/stores/resumeBuilderStore";

type WizardStep = 'job-input' | 'gap-analysis' | 'format-selection' | 'requirement-filter' | 'requirement-builder' | 'generation' | 'final-review';

const ResumeBuilderWizardContent = () => {
  const { toast } = useToast();
  const location = useLocation();

  // Use store for state management
  const store = useResumeBuilderStore();
  const [resumeId, setResumeId] = useState<string | null>(null);
  
  // Local wizard flow state
  const [currentStep, setCurrentStep] = useState<WizardStep>('job-input');
  const [currentRequirementIndex, setCurrentRequirementIndex] = useState(0);
  const [categorizedRequirements, setCategorizedRequirements] = useState<any>({
    autoHandled: [],
    needsInput: [],
    optionalEnhancement: []
  });

  // Job analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [jobAnalysis, setJobAnalysis] = useState<any>(null);
  const [autoLoadedJob, setAutoLoadedJob] = useState(false);

  // Vault matching state
  const [matching, setMatching] = useState(false);
  const [vaultMatches, setVaultMatches] = useState<any>(null);
  

  // Format selection
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);

  // Resume content
  const [resumeSections, setResumeSections] = useState<any[]>([]);
  const [resumeMode, setResumeMode] = useState<'edit' | 'preview'>('edit');

  // Job text for display in JobInputSection
  const [displayJobText, setDisplayJobText] = useState<string>("");


  // Helper function to build enhanced job description with metadata
  const buildEnhancedDescription = (jobData: any): string => {
    let enhancedDescription = jobData.jobDescription;
    
    // Add location context if available
    if (jobData.location) {
      enhancedDescription = `Location: ${jobData.location}\n\n${enhancedDescription}`;
    }
    
    // Add salary context if available
    if (jobData.salary) {
      enhancedDescription = `Salary Range: $${jobData.salary}\n\n${enhancedDescription}`;
    }
    
    return enhancedDescription;
  };

  // Helper function to fetch full job description from URL
  const fetchFullJobDescription = async (jobData: any) => {
    toast({
      title: "Fetching full job description",
      description: "Getting complete details from the job posting...",
    });
    
    try {
      const { data, error } = await supabase.functions.invoke('parse-job-document', {
        body: { url: jobData.applyUrl }
      });
      
      if (error) throw error;
      
      if (data?.success && data.jobDescription) {
        console.log('✅ Fetched full job description:', {
          originalLength: jobData.jobDescription.length,
          fetchedLength: data.jobDescription.length,
          improvement: data.jobDescription.length - jobData.jobDescription.length
        });
        
        // Use fetched description with enhanced metadata
        const enhancedDescription = buildEnhancedDescription({
          ...jobData,
          jobDescription: data.jobDescription,
          jobTitle: data.jobTitle || jobData.jobTitle,
          companyName: data.companyName || jobData.companyName
        });
        
        // Store for display in JobInputSection
        setDisplayJobText(enhancedDescription);
        
        toast({
          title: "Full description loaded",
          description: `Fetched ${data.jobDescription.length} characters from job posting`,
        });
        
        handleAnalyzeJob(enhancedDescription);
      } else {
        throw new Error(data?.error || 'Failed to fetch full description');
      }
    } catch (error) {
      console.error('❌ Error fetching job description:', error);
      
      // If fetch fails, show error with clear instructions
      toast({
        title: "Could not fetch full job description",
        description: "Please copy the full job description manually and paste it below.",
        variant: "destructive"
      });
      
      // Navigate back to the initial state where user can manually paste
      // Don't auto-load the truncated description - let them paste manually
      window.history.replaceState({}, document.title);
      setAutoLoadedJob(false);
    }
  };

  // Auto-save effect
  useEffect(() => {
    let saveTimeout: NodeJS.Timeout;

    const autoSave = async () => {
      if (resumeId && (jobAnalysis || resumeSections.length > 0)) {
        try {
          await store.saveResume();
          console.log('Auto-saved resume:', resumeId);
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }
    };

    // Auto-save every 30 seconds
    saveTimeout = setTimeout(autoSave, 30000);

    return () => clearTimeout(saveTimeout);
  }, [resumeId, jobAnalysis, resumeSections]);

  // Auto-load job from job search navigation
  useEffect(() => {
    const jobData = location.state as any;
    
    // Check if loading existing resume
    if (jobData?.resumeId) {
      setResumeId(jobData.resumeId);
      loadExistingResume(jobData.resumeId);
      return;
    }
    
    if (jobData?.fromJobSearch && jobData?.jobDescription && !autoLoadedJob) {
      setAutoLoadedJob(true);
      
      // If URL exists, always try to fetch full description (API descriptions are often truncated)
      if (jobData.applyUrl) {
        fetchFullJobDescription(jobData);
      } else {
        // No URL - use provided description
        const enhancedDescription = buildEnhancedDescription(jobData);
        handleAnalyzeJob(enhancedDescription);
      }
      
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const loadExistingResume = async (id: string) => {
    try {
      const { data: resume, error } = await supabase
        .from('saved_resumes' as any)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Restore state from database
      const resumeData = resume as any;
      setJobAnalysis(resumeData.job_analysis);
      setDisplayJobText(resumeData.job_description);
      setSelectedFormat(resumeData.selected_format);
      setVaultMatches(resumeData.vault_matches);
      setResumeSections(resumeData.sections || []);
      
      // Determine which step to resume at
      if (resumeData.sections && resumeData.sections.length > 0) {
        setCurrentStep('final-review');
      } else if (resumeData.requirement_responses && resumeData.requirement_responses.length > 0) {
        setCurrentStep('requirement-builder');
        setCurrentRequirementIndex(resumeData.requirement_responses.length);
      } else if (resumeData.selected_format) {
        setCurrentStep('format-selection');
      } else if (resumeData.job_analysis) {
        setCurrentStep('gap-analysis');
      }
      
      toast({
        title: "Resume Loaded",
        description: "Continuing where you left off"
      });
    } catch (error) {
      console.error('Failed to load resume:', error);
      toast({
        title: "Error",
        description: "Failed to load resume. Starting fresh.",
        variant: "destructive"
      });
    }
  };

  const handleAnalyzeJob = async (jobText: string) => {
    setAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-job-requirements', {
        body: { jobDescription: jobText }
      });

      if (error) throw error;

      // Store original job description with the analysis
      setJobAnalysis({
        ...data,
        originalJobDescription: jobText
      });

      // Automatically trigger vault matching
      await handleMatchVault(data);

      // Move to gap analysis
      setCurrentStep('gap-analysis');

      toast({
        title: "Analysis complete",
        description: "Review how your Career Vault matches this job"
      });
    } catch (error) {
      console.error("Error analyzing job:", error);
      toast({
        title: "Analysis failed",
        description: "Failed to analyze job description. Please try again.",
        variant: "destructive"
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleMatchVault = async (analysis: any) => {
    setMatching(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase.functions.invoke('match-vault-to-requirements', {
        body: {
          userId: user.id,
          jobRequirements: analysis.jobRequirements,
          industryStandards: analysis.industryStandards,
          professionBenchmarks: analysis.professionBenchmarks,
          atsKeywords: analysis.atsKeywords
        }
      });

      if (error) throw error;
      
      setVaultMatches(data);
    } catch (error) {
      console.error("Error matching vault:", error);
      toast({
        title: "Vault matching failed",
        description: "Could not match your vault intelligence. You can still continue.",
        variant: "destructive"
      });
    } finally {
      setMatching(false);
    }
  };

  const handleFormatSelected = () => {
    if (!selectedFormat) return;

    // Categorize requirements for intelligent filtering
    categorizeRequirements();

    // Move to requirement filter
    setCurrentStep('requirement-filter');
  };

  const categorizeRequirements = () => {
    const allRequirements = [
      ...(jobAnalysis?.jobRequirements?.required || []).map((r: any) => ({ ...r, priority: 'required', source: 'job_description' })),
      ...(jobAnalysis?.jobRequirements?.preferred || []).map((r: any) => ({ ...r, priority: 'preferred', source: 'job_description' })),
      ...(jobAnalysis?.industryStandards || []).map((r: any) => ({ text: r, priority: 'nice_to_have', source: 'industry_standard' }))
    ];

    const categorized = {
      autoHandled: [] as any[],
      needsInput: [] as any[],
      optionalEnhancement: [] as any[]
    };

    allRequirements.forEach((req: any) => {
      // Calculate vault coverage for this requirement
      const matches = vaultMatches?.matchedItems?.filter((item: any) => 
        item.matchedRequirement?.toLowerCase().includes(req.text?.toLowerCase() || req)
      ) || [];

      const coverage = matches.length > 0 ? 90 : 0; // Simplified for now

      if (coverage >= 90) {
        categorized.autoHandled.push({ ...req, coverage, matches, id: Math.random().toString() });
      } else if (req.source === 'industry_standard') {
        categorized.optionalEnhancement.push({ ...req, coverage, matches, id: Math.random().toString() });
      } else {
        categorized.needsInput.push({ ...req, coverage, matches, id: Math.random().toString() });
      }
    });

    setCategorizedRequirements(categorized);
  };

  const handleContinueFromFilter = (mode: string) => {
    if (mode === 'skip_to_generate') {
      // Skip directly to generation
      generateCompleteResume();
    } else {
      // Start requirement-by-requirement flow
      setCurrentStep('requirement-builder');
      setCurrentRequirementIndex(0);
    }
  };

  const handleRequirementComplete = async (response: any) => {
    // Save response
    store.addRequirementResponse(response);

    // Auto-save after requirement completion
    if (resumeId) {
      try {
        await store.saveResume();
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }

    // Move to next requirement or generation
    if (currentRequirementIndex < categorizedRequirements.needsInput.length - 1) {
      setCurrentRequirementIndex(currentRequirementIndex + 1);
    } else {
      // All requirements addressed, generate resume
      generateCompleteResume();
    }
  };

  const handleRequirementSkip = () => {
    // Move to next or generate
    if (currentRequirementIndex < categorizedRequirements.needsInput.length - 1) {
      setCurrentRequirementIndex(currentRequirementIndex + 1);
    } else {
      generateCompleteResume();
    }
  };

  const generateCompleteResume = async () => {
    setCurrentStep('generation');

    // Initialize resume sections based on selected format
    const format = getFormat(selectedFormat || 'executive');
    if (format) {
      const sections = format.sections.map(section => ({
        id: section.id,
        type: section.type,
        title: section.title,
        content: [],
        order: section.order,
        required: section.required
      }));
      setResumeSections(sections);
    }

    // Simulate generation (in real implementation, this would call an edge function)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Create or update resume in database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const resumeData: any = {
          user_id: user.id,
          job_title: jobAnalysis?.roleProfile?.title || 'Untitled Position',
          job_company: jobAnalysis?.roleProfile?.company,
          job_description: displayJobText,
          job_analysis: jobAnalysis,
          selected_format: selectedFormat,
          sections: resumeSections,
          vault_matches: vaultMatches,
          requirement_responses: store.requirementResponses,
          updated_at: new Date().toISOString()
        };

        if (resumeId) {
          await supabase.from('saved_resumes' as any).update(resumeData).eq('id', resumeId);
        } else {
          const { data, error } = await supabase
            .from('saved_resumes' as any)
            .insert(resumeData)
            .select()
            .single();
          
          if (!error && data) {
            setResumeId((data as any).id);
          }
        }
      }
    } catch (error) {
      console.error('Failed to save resume:', error);
    }

    setCurrentStep('final-review');

    toast({
      title: "Resume Generated!",
      description: "Review and edit your sections below"
    });
  };


  const handleStartOver = () => {
    setCurrentStep('job-input');
    setCurrentRequirementIndex(0);
    setJobAnalysis(null);
    setVaultMatches(null);
    setSelectedFormat(null);
    setResumeSections([]);
  };

  const handleExport = async (format: 'pdf' | 'docx' | 'html' | 'txt') => {
    try {
      const { exportFormats } = await import('@/lib/resumeExportUtils');
      
      toast({
        title: "Generating export...",
        description: `Creating ${format.toUpperCase()} file`
      });

      // Prepare structured data
      const structuredData = {
        name: jobAnalysis?.roleProfile?.title || 'Professional',
        contact: {
          email: 'your.email@example.com',
          phone: '(555) 123-4567',
          location: 'City, State',
          linkedin: ''
        },
        sections: resumeSections.map(section => ({
          title: section.title,
          type: section.type,
          content: section.content.map((item: any) => item.content || item)
        }))
      };

      const fileName = `Resume_${jobAnalysis?.roleProfile?.title?.replace(/\s+/g, '_') || 'Professional'}`;

      switch(format) {
        case 'pdf':
          await exportFormats.atsPDF(structuredData, fileName);
          break;
        case 'docx':
          await exportFormats.generateDOCX(structuredData, fileName);
          break;
        case 'html':
          const htmlContent = generateHTMLContent(structuredData);
          await exportFormats.htmlExport(htmlContent, fileName);
          break;
        case 'txt':
          await exportFormats.txtExport(structuredData, fileName);
          break;
      }

      toast({
        title: "Export successful!",
        description: `${format.toUpperCase()} file downloaded`
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const generateHTMLContent = (data: any): string => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${data.name} - Resume</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      max-width: 8.5in; 
      margin: 0 auto; 
      padding: 0.5in; 
      font-size: 11pt;
      color: #000;
    }
    h1 { 
      font-size: 24pt; 
      margin-bottom: 8px; 
      text-align: center;
      font-weight: bold;
    }
    .contact { 
      font-size: 10pt; 
      text-align: center;
      margin-bottom: 20px; 
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
    }
    h2 { 
      font-size: 12pt; 
      text-transform: uppercase;
      border-bottom: 1px solid #666; 
      padding-bottom: 4px; 
      margin-top: 16px; 
      margin-bottom: 8px; 
      font-weight: bold;
    }
    p, li { 
      font-size: 11pt; 
      line-height: 1.4; 
      margin: 6px 0; 
    }
    ul { 
      margin: 8px 0; 
      padding-left: 20px; 
    }
    .skills {
      font-size: 11pt;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <h1>${data.name}</h1>
  <div class="contact">
    ${data.contact.email} | ${data.contact.phone} | ${data.contact.location}
    ${data.contact.linkedin ? `| ${data.contact.linkedin}` : ''}
  </div>
  
  ${data.sections.map((section: any) => `
    <h2>${section.title}</h2>
    ${section.type === 'skills' ? `
      <div class="skills">${section.content.join(', ')}</div>
    ` : `
      <ul>
        ${section.content.map((item: string) => `<li>${item}</li>`).join('')}
      </ul>
    `}
  `).join('')}
</body>
</html>
    `;
  };

  // Render based on current step
  switch (currentStep) {
    case 'job-input':
      return (
        <div className="min-h-screen bg-background">
          <ResumeBuilderOnboarding />
          <div className="max-w-4xl mx-auto p-6">
            <div className="mb-8 text-center relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 rounded-lg blur-3xl -z-10" />
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                  <span className="text-3xl">✨</span>
                </div>
              </div>
              <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Benchmark Resume Builder
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Build a resume that exceeds job requirements using AI and your Career Vault intelligence
              </p>
            </div>

            <JobInputSection
              onAnalyze={handleAnalyzeJob}
              isAnalyzing={analyzing || matching}
              initialJobText={displayJobText || (location.state as any)?.jobDescription || ""}
              autoLoaded={autoLoadedJob}
            />

            {analyzing && (
              <Card className="mt-6 p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Analyzing job requirements and matching your Career Vault...
                </p>
              </Card>
            )}
          </div>
        </div>
      );

    case 'gap-analysis':
      if (!vaultMatches) {
        return <div>Loading...</div>;
      }

      return (
        <GapAnalysisView
          unmatchedRequirements={vaultMatches.unmatchedRequirements || []}
          coverageScore={vaultMatches.coverageScore || 0}
          totalRequirements={
            (jobAnalysis?.jobRequirements?.required?.length || 0) +
            (jobAnalysis?.jobRequirements?.preferred?.length || 0)
          }
          vaultMatches={vaultMatches.matchedItems || []}
          jobAnalysis={jobAnalysis}
          onContinue={() => setCurrentStep('format-selection')}
        />
      );

    case 'format-selection':
      return (
        <div className="min-h-screen bg-background">
          <div className="p-4">
            <Button
              variant="ghost"
              onClick={handleStartOver}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Start Over
            </Button>
          </div>

          <FormatSelector
            jobAnalysis={jobAnalysis}
            selectedFormat={selectedFormat}
            onSelectFormat={setSelectedFormat}
            onContinue={handleFormatSelected}
          />
        </div>
      );

    case 'requirement-filter':
      return (
        <div className="min-h-screen bg-background">
          <div className="p-4 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
            <Button
              variant="ghost"
              onClick={handleStartOver}
              className="gap-2 hover:bg-primary/10"
            >
              <ArrowLeft className="h-4 w-4" />
              Start Over
            </Button>
          </div>
          <div className="max-w-4xl mx-auto p-6">
            <RequirementFilterView
              categorizedRequirements={categorizedRequirements}
              onContinue={handleContinueFromFilter}
            />
          </div>
        </div>
      );

    case 'requirement-builder':
      const currentRequirement = categorizedRequirements.needsInput[currentRequirementIndex];
      if (!currentRequirement) {
        generateCompleteResume();
        return null;
      }

      return (
        <div className="min-h-screen bg-background py-8 bg-gradient-to-b from-background to-primary/5">
          <div className="max-w-4xl mx-auto px-6">
            <RequirementCard
              requirement={currentRequirement}
              vaultMatches={currentRequirement.matches || []}
              matchStatus={currentRequirement.coverage >= 90 ? 'perfect_match' : currentRequirement.coverage > 0 ? 'partial_match' : 'complete_gap'}
              currentIndex={currentRequirementIndex + 1}
              totalCount={categorizedRequirements.needsInput.length}
              onComplete={handleRequirementComplete}
              onSkip={handleRequirementSkip}
              jobContext={jobAnalysis}
            />
          </div>
        </div>
      );

    case 'generation':
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="p-12 text-center max-w-md">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-bold mb-2">Generating Your Resume</h2>
            <p className="text-muted-foreground">
              Assembling all sections using your approved content...
            </p>
          </Card>
        </div>
      );

    case 'final-review':
      return (
        <div className="h-screen flex flex-col bg-background">
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Resume Builder</h1>
              <p className="text-xs text-muted-foreground">
                Build your resume using vault intelligence and gap solutions
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleStartOver}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Start New Resume
            </Button>
          </div>

          <div className="flex-1 overflow-hidden">
            <InteractiveResumeBuilder
              sections={resumeSections}
              jobAnalysis={jobAnalysis}
              vaultMatches={vaultMatches?.matchedItems || []}
              onUpdateSection={(sectionId, content) => {
                setResumeSections(prev =>
                  prev.map(s => s.id === sectionId ? { ...s, content } : s)
                );
              }}
              onAddItem={(sectionType, item) => {
                setResumeSections(prev =>
                  prev.map(s =>
                    s.type === sectionType
                      ? { ...s, content: [...s.content, item] }
                      : s
                  )
                );
              }}
              onRemoveItem={(sectionId, itemId) => {
                setResumeSections(prev =>
                  prev.map(s =>
                    s.id === sectionId
                      ? { ...s, content: s.content.filter((c: any) => c.id !== itemId) }
                      : s
                  )
                );
              }}
              onReorderSections={(sections) => setResumeSections(sections)}
              onExport={(format: string) => handleExport(format as 'pdf' | 'docx' | 'html' | 'txt')}
              requirementCoverage={vaultMatches?.coverageScore || 0}
              atsScore={vaultMatches?.coverageScore || 0}
              mode={resumeMode}
              onModeChange={setResumeMode}
            />
          </div>
        </div>
      );

    default:
      return <div>Unknown step</div>;
  }
};

export default function ResumeBuilderWizard() {
  return (
    <ProtectedRoute>
      <ResumeBuilderWizardContent />
    </ProtectedRoute>
  );
}
