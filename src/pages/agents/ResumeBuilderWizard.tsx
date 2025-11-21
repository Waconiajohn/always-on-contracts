import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { JobInputSection } from "@/components/resume-builder/JobInputSection";
import { GapAnalysisView } from "@/components/resume-builder/GapAnalysisView";
import { FormatSelector } from "@/components/resume-builder/FormatSelector";
import { RequirementFilterView } from "@/components/resume-builder/RequirementFilterView";
import { RequirementCard } from "@/components/resume-builder/RequirementCard";
import { GenerationProgress } from "@/components/resume-builder/GenerationProgress";
import { supabase } from "@/integrations/supabase/client";
import { getFormat } from "@/lib/resumeFormats";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionWizard } from "@/components/resume-builder/SectionWizard";
import { GenerationModeSelector } from "@/components/resume-builder/GenerationModeSelector";
import { useResumeBuilderStore } from "@/stores/resumeBuilderStore";
import { useResumeMilestones } from "@/hooks/useResumeMilestones";
import { enhanceVaultMatches } from "@/lib/vaultQualityScoring";
import { ResumeWorkspace } from "@/components/resume-builder/v2/ResumeWorkspace";

type WizardStep = 'job-input' | 'gap-analysis' | 'format-selection' | 'requirement-filter' | 'requirement-builder' | 'generation-mode' | 'section-wizard' | 'generation' | 'final-review';

const ResumeBuilderWizardContent = () => {
  const { toast } = useToast();
  const location = useLocation();

  // Use store for state management
  const store = useResumeBuilderStore();
  const [resumeId, setResumeId] = useState<string | null>(null);
  
  // Fetch resume milestones
  const { milestones } = useResumeMilestones();
  
  // Local wizard flow state
  const [currentStep, setCurrentStep] = useState<WizardStep>('job-input');
  const [currentRequirementIndex, setCurrentRequirementIndex] = useState(0);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [categorizedRequirements] = useState<any>({
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
  const [enhancedVaultMatches, setEnhancedVaultMatches] = useState<any[]>([]);
  

  // Format selection
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);

  // Resume content
  const [resumeSections, setResumeSections] = useState<any[]>([]);

  // Job text for display in JobInputSection
  const [displayJobText, setDisplayJobText] = useState<string>("");

  // Sync local sections to store for ResumeWorkspace
  useEffect(() => {
    if (resumeSections.length > 0) {
      store.setResumeSections(resumeSections);
    }
  }, [resumeSections]);

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
    console.log('🔍 Attempting to fetch full job description from URL...');
    
    // Check if we already have a good description
    const hasGoodDescription = jobData.jobDescription && jobData.jobDescription.length > 200;
    
    try {
      const { data, error } = await supabase.functions.invoke('parse-job-document', {
        body: { url: jobData.applyUrl }
      });
      
      // Check for blocked/error response
      if (error || !data?.success || data?.blocked || data?.error === 'BLOCKED') {
        console.log('❌ URL fetch blocked or failed');
        throw new Error('URL_BLOCKED');
      }
      
      if (data?.success && data.jobDescription && data.jobDescription.length > 200) {
        console.log('✅ Successfully fetched full job description:', {
          originalLength: jobData.jobDescription?.length || 0,
          fetchedLength: data.jobDescription.length,
          improvement: data.jobDescription.length - (jobData.jobDescription?.length || 0)
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
          description: `Successfully fetched complete job details`,
        });
        
        handleAnalyzeJob(enhancedDescription);
        return;
      }
      
      // If we got here, the response wasn't good enough
      throw new Error('INVALID_RESPONSE');
    } catch (error: any) {
      console.log('⚠️ URL fetch failed:', error.message);
      
      // Only show error if we don't have a good fallback description
      if (!hasGoodDescription) {
        toast({
          title: "Job Board Blocked Access",
          description: "Please copy and paste the full job description using the Import button.",
          variant: "destructive",
          duration: 8000
        });
      } else {
        // We have a good description from search results - use it!
        toast({
          title: "Using search result description",
          description: "Job board blocked direct access, but we have the description from search results.",
        });
        
        const enhancedDescription = buildEnhancedDescription(jobData);
        setDisplayJobText(enhancedDescription);
        handleAnalyzeJob(enhancedDescription);
      }
    }
  };

  // Auto-save interval (2 minutes)
  const AUTO_SAVE_INTERVAL = 120000;

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

    // Auto-save every 2 minutes
    saveTimeout = setTimeout(autoSave, AUTO_SAVE_INTERVAL);

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
        .from('resumes')
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
      store.setResumeSections(resumeData.sections || []);
      store.setJobAnalysis(resumeData.job_analysis);
      
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
      store.setJobAnalysis({
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
      store.setVaultMatches(data);
      
      // Enhance vault matches with quality scores
      if (data?.matchedItems) {
        const enhanced = enhanceVaultMatches(data.matchedItems);
        setEnhancedVaultMatches(enhanced);
        
        // Update store with milestones
        store.setResumeMilestones(milestones);
      }
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

    // Move to generation mode selector
    toast({
      title: "Format selected",
      description: "Choose how you'd like to build your resume"
    });
    
    setCurrentStep('generation-mode');
  };

  // Legacy requirement categorization - only used if user manually navigates to requirement-filter
  // @ts-ignore - Function kept for backwards compatibility
  const categorizeRequirements = () => {
    // Logic kept for potential reuse in requirement filter step
  };

  const handleContinueFromFilter = (mode: string) => {
    if (mode === 'skip_to_generate') {
      // Show generation mode selector
      setCurrentStep('generation-mode');
    } else {
      // Start requirement-by-requirement flow
      setCurrentStep('requirement-builder');
      setCurrentRequirementIndex(0);
    }
  };

  const handleGenerationModeSelected = (mode: 'full' | 'section-by-section') => {
    store.setGenerationMode(mode);
    
    if (mode === 'full') {
      // Full generation - skip to generation
      generateCompleteResume();
    } else {
      // Section-by-section - initialize empty sections from format
      const format = getFormat(selectedFormat || 'executive');
      if (format) {
          const sections = format.sections.map(section => ({
            id: section.id,
            type: section.type,
            title: section.title,
            content: [],
            order: section.order,
            required: section.required,
            vaultItemsUsed: [],
            atsKeywords: [],
            requirementsCovered: []
          }));
          setResumeSections(sections as any[]);
          store.setResumeSections(sections as any[]);
      }
      
      setCurrentSectionIndex(0);
      setCurrentStep('section-wizard');
    }
  };

  const handleSectionComplete = (sectionData: any) => {
    // Save section content - convert to items format for BuilderResumeSection
    setResumeSections(prev => {
      const updated = prev.map(s => {
        if (s.id === sectionData.sectionId) {
          const sectionTitle = s.title?.toLowerCase().trim() || '';
          const sectionType = s.type?.toLowerCase().replace(/_/g, ' ').trim() || '';
          
          const items = Array.isArray(sectionData.content) 
            ? sectionData.content
                .map((item: any) => ({
                  id: item.id || crypto.randomUUID(),
                  content: typeof item === 'string' ? item : item.content || '',
                  order: item.order || 0
                }))
                .filter((item: any) => {
                  const content = item.content.toLowerCase().trim();
                  // Filter out items that match the section title or type
                  return content && 
                         content !== sectionTitle && 
                         content !== sectionType &&
                         content !== 'education' &&
                         content !== 'experience' &&
                         content !== 'professional experience' &&
                         content !== 'work experience';
                })
            : [];

          return { 
            ...s, 
            items,
            vaultItemsUsed: sectionData.vaultItemsUsed 
          };
        }
        return s;
      });

      return updated;
    });

    const format = getFormat(selectedFormat || 'executive');
    if (!format) return;

    // Move to next section or final review
    if (currentSectionIndex < format.sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
    } else {
      // All sections complete
      setCurrentStep('final-review');
      toast({
        title: "Resume Complete!",
        description: "All sections have been generated. Review and export below."
      });
    }
  };

  const handleSectionBack = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
    } else {
      setCurrentStep('generation-mode');
    }
  };

  const handleSectionSkip = () => {
    const format = getFormat(selectedFormat || 'executive');
    if (!format) return;

    if (currentSectionIndex < format.sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
    } else {
      setCurrentStep('final-review');
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
    
    toast({
      title: "Starting generation",
      description: "Generating all resume sections with your vault intelligence..."
    });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Initialize resume sections based on selected format
      const format = getFormat(selectedFormat || 'executive');
      if (!format) {
        throw new Error('Invalid format selected');
      }

      const sections = format.sections.map(section => ({
        id: section.id,
        type: section.type,
        title: section.title,
        content: [],
        order: section.order,
        required: section.required,
        vaultItemsUsed: [],
        atsKeywords: [],
        requirementsCovered: []
      }));
      
      setResumeSections(sections as any[]);
      store.setResumeSections(sections as any[]);

      // Track progress
      let completedCount = 0;
      const requiredSections = sections.filter(s => s.required);
      const totalSections = requiredSections.length;

      // Generate all sections in parallel for speed
      const generationPromises = requiredSections.map(async (section) => {
        store.setGeneratingSection(section.type);
        
        try {
          const { data: sectionData, error } = await supabase.functions.invoke('generate-dual-resume-section', {
            body: {
              section_type: section.type,
              section_guidance: '',
              vault_items: enhancedVaultMatches || [],
              resume_milestones: milestones,
              user_id: user.id,
              job_title: jobAnalysis?.roleProfile?.title || '',
              industry: jobAnalysis?.roleProfile?.industry || '',
              seniority: jobAnalysis?.roleProfile?.seniority || 'mid-level',
              ats_keywords: jobAnalysis?.atsKeywords || { critical: [], important: [], nice_to_have: [] },
              requirements: [
                ...(jobAnalysis?.jobRequirements?.required || []).map((r: any) => r.requirement || r),
                ...(jobAnalysis?.jobRequirements?.preferred || []).map((r: any) => r.requirement || r)
              ]
            }
          });

          if (error) throw error;

          completedCount++;
          toast({
            title: `Section ${completedCount}/${totalSections} complete`,
            description: `${section.title} generated successfully`
          });

          // Use personalized version by default, extract metadata
          const content = sectionData?.personalizedVersion?.content || sectionData?.content || [];
          const sectionTitle = section.title?.toLowerCase().trim() || '';
          const sectionType = section.type?.toLowerCase().replace(/_/g, ' ').trim() || '';
          
          const contentArray = typeof content === 'string' 
            ? content.split('\n').filter(Boolean).map(line => ({ id: Date.now() + Math.random(), content: line }))
            : Array.isArray(content) ? content : [];
          
          // Filter out duplicate section titles/types
          const filteredContent = contentArray.filter((item: any) => {
            const itemContent = (typeof item === 'string' ? item : item.content || '').toLowerCase().trim();
            return itemContent &&
                   itemContent !== sectionTitle &&
                   itemContent !== sectionType &&
                   itemContent !== 'education' &&
                   itemContent !== 'experience' &&
                   itemContent !== 'professional experience' &&
                   itemContent !== 'work experience';
          });

          return {
            ...section,
            content: filteredContent,
            vaultItemsUsed: sectionData?.vaultItemsUsed || [],
            atsKeywords: sectionData?.atsKeywords || [],
            requirementsCovered: sectionData?.requirementsCovered || []
          };
        } catch (error) {
          console.error(`Error generating ${section.type}:`, error);
          return section; // Return empty section on error
        }
      });

      // Wait for all sections to complete
      const generatedSections = await Promise.all(generationPromises);
      setResumeSections(generatedSections);
      store.setResumeSections(generatedSections);

      store.setGeneratingSection(null);

      // Save the complete resume
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
        await supabase.from('resumes').update(resumeData).eq('id', resumeId);
      } else {
        const { data, error } = await supabase
          .from('resumes')
          .insert(resumeData)
          .select()
          .single();
        
        if (!error && data) {
          setResumeId((data as any).id);
        }
      }

      setCurrentStep('final-review');

      toast({
        title: "Resume Generated!",
        description: "Review and edit your sections below"
      });
    } catch (error) {
      console.error('Failed to generate resume:', error);
      toast({
        title: "Generation failed",
        description: "Please try again or contact support",
        variant: "destructive"
      });
      store.setGeneratingSection(null);
    }
  };

  const handleStartOver = () => {
    setCurrentStep('job-input');
    setCurrentRequirementIndex(0);
    setJobAnalysis(null);
    setVaultMatches(null);
    setSelectedFormat(null);
    setResumeSections([]);
  };

  // Render based on current step
  switch (currentStep) {
    case 'job-input':
      return (
        <div className="min-h-screen bg-background">
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

    case 'generation-mode':
      return (
        <div className="min-h-screen bg-background">
          <div className="p-4">
            <Button
              variant="ghost"
              onClick={() => setCurrentStep('format-selection')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>

          <div className="max-w-5xl mx-auto p-6">
            <GenerationModeSelector
              onSelectMode={handleGenerationModeSelected}
              sectionsCount={getFormat(selectedFormat || 'executive')?.sections.length || 0}
            />
          </div>
        </div>
      );

    case 'section-wizard':
      const format = getFormat(selectedFormat || 'executive');
      if (!format) return <div>Invalid format</div>;

      const currentSection = format.sections[currentSectionIndex];
      if (!currentSection) {
        setCurrentStep('final-review');
        return null;
      }

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
          
          <div className="max-w-5xl mx-auto p-6">
            <SectionWizard
              section={currentSection}
              vaultMatches={enhancedVaultMatches}
              jobAnalysis={jobAnalysis}
              resumeMilestones={milestones}
              onSectionComplete={handleSectionComplete}
              onBack={handleSectionBack}
              onSkip={handleSectionSkip}
              isFirst={currentSectionIndex === 0}
              isLast={currentSectionIndex === format.sections.length - 1}
              totalSections={format.sections.length}
              currentIndex={currentSectionIndex}
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
        <div className="min-h-screen bg-gradient-to-b from-background to-primary/5 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full">
            <GenerationProgress
              currentStep={0}
              isComplete={false}
              generatingSection={store.generatingSection}
              vaultItemsUsed={enhancedVaultMatches.length}
              estimatedTimeRemaining={20}
              isDualGeneration={store.generationMode === 'section-by-section'}
            />
          </div>
        </div>
      );

    case 'final-review':
      return <ResumeWorkspace />;

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
