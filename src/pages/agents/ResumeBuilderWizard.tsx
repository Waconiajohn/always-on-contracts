import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { VaultOverlayReviewPanel } from "@/components/resume-builder/VaultOverlayReviewPanel";
import { JobInputSection } from "@/components/resume-builder/JobInputSection";
import { GapAnalysisView } from "@/components/resume-builder/GapAnalysisView";
import { FormatSelector } from "@/components/resume-builder/FormatSelector";
import { RequirementFilterView } from "@/components/resume-builder/RequirementFilterView";
import { RequirementCard } from "@/components/resume-builder/RequirementCard";
import { InteractiveResumeBuilder } from "@/components/resume-builder/InteractiveResumeBuilder";
import { GenerationProgress } from "@/components/resume-builder/GenerationProgress";
import { supabase } from "@/integrations/supabase/client";
import { getFormat } from "@/lib/resumeFormats";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionWizard } from "@/components/resume-builder/SectionWizard";
import { GenerationModeSelector } from "@/components/resume-builder/GenerationModeSelector";
import { SectionEditorCard } from "@/components/resume-builder/SectionEditorCard";
import { useResumeBuilderStore } from "@/stores/resumeBuilderStore";
import { useResumeMilestones } from "@/hooks/useResumeMilestones";
import { enhanceVaultMatches } from "@/lib/vaultQualityScoring";
import { builderStateToCanonicalResume, canonicalResumeToPlainText, canonicalResumeToHTML } from "@/lib/resumeSerialization";
import { BuilderResumeSection } from "@/lib/resumeModel";
import { injectOverlayIntoResumeSections } from "@/lib/resumeOverlayUtils";

type WizardStep = 'job-input' | 'gap-analysis' | 'format-selection' | 'requirement-filter' | 'requirement-builder' | 'generation-mode' | 'section-wizard' | 'generation' | 'final-review';

const ResumeBuilderWizardContent = () => {
  const { toast } = useToast();
  const location = useLocation();

  // Use store for state management
  const store = useResumeBuilderStore();
  const vaultOverlay = store.vaultOverlay;
  const pendingVaultCount = vaultOverlay?.pendingVaultPromotions?.length || 0;
  const [resumeId, setResumeId] = useState<string | null>(null);
  
  // Fetch resume milestones
  const { milestones } = useResumeMilestones();
  
  // Local wizard flow state
  const [currentStep, setCurrentStep] = useState<WizardStep>('job-input');
  const [currentRequirementIndex, setCurrentRequirementIndex] = useState(0);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
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
  const [enhancedVaultMatches, setEnhancedVaultMatches] = useState<any[]>([]);
  

  // Format selection
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);

  // Resume content
  const [resumeSections, setResumeSections] = useState<any[]>([]);
  const [resumeMode, setResumeMode] = useState<'edit' | 'preview'>('edit');
  const [userProfile, setUserProfile] = useState<any>({});
  const [isBuilding, setIsBuilding] = useState(false);
  const [showVaultReview, setShowVaultReview] = useState(false);

  // Compute hydrated sections with overlay items injected
  const hydratedSections = injectOverlayIntoResumeSections(
    resumeSections,
    vaultOverlay
  );

  // ATS Score state
  const [atsScoreData, setAtsScoreData] = useState<any>(null);
  const [analyzingATS, setAnalyzingATS] = useState(false);

  // Job text for display in JobInputSection
  const [displayJobText, setDisplayJobText] = useState<string>("");

  // Fetch user profile on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserProfile({
          email: user.email,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
          phone: user.user_metadata?.phone || '',
          location: user.user_metadata?.location || '',
          linkedin: user.user_metadata?.linkedin_url || '',
        });
      }
    };
    fetchUserProfile();
  }, []);

  // Track if currently building/generating
  useEffect(() => {
    setIsBuilding(!!store.generatingSection);
  }, [store.generatingSection]);


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
    const allRequirements = [
      ...(jobAnalysis?.jobRequirements?.required || []).map((r: any) => ({ 
        text: r.requirement || r.text || r, 
        priority: 'required', 
        source: 'job_description',
        importance: r.importance || 10
      })),
      ...(jobAnalysis?.jobRequirements?.preferred || []).map((r: any) => ({ 
        text: r.requirement || r.text || r, 
        priority: 'preferred', 
        source: 'job_description',
        importance: r.importance || 7
      })),
      ...(jobAnalysis?.industryStandards || []).map((s: any) => ({ 
        text: s.standard || s.text || s, 
        priority: 'nice_to_have', 
        source: 'industry_standard',
        importance: s.importance || 5
      }))
    ];

    const categorized = {
      autoHandled: [] as any[],
      needsInput: [] as any[],
      optionalEnhancement: [] as any[]
    };

    allRequirements.forEach((req: any) => {
      const matchingVaultItems = vaultMatches?.matchedItems?.filter((item: any) => {
        return item.satisfiesRequirements?.some((satisfied: string) => {
          const reqText = req.text.toLowerCase();
          const satisfiedText = satisfied.toLowerCase();
          return satisfiedText === reqText || 
                 satisfiedText.includes(reqText) || 
                 reqText.includes(satisfiedText);
        });
      }) || [];

      let coverage = 0;
      if (matchingVaultItems.length > 0) {
        const avgMatchScore = matchingVaultItems.reduce((sum: number, item: any) => 
          sum + (item.matchScore || 0), 0
        ) / matchingVaultItems.length;
        
        const qualityBonus = matchingVaultItems.some((item: any) => 
          item.qualityTier === 'gold'
        ) ? 10 : matchingVaultItems.some((item: any) => 
          item.qualityTier === 'silver'
        ) ? 5 : 0;
        
        coverage = Math.min(100, Math.round(avgMatchScore + qualityBonus));
      }

      const reqWithData = { 
        ...req, 
        coverage, 
        matches: matchingVaultItems, 
        id: Math.random().toString()
      };

      if (coverage >= 80) {
        categorized.autoHandled.push(reqWithData);
      } else if (req.source === 'industry_standard' && coverage < 50) {
        categorized.optionalEnhancement.push(reqWithData);
      } else {
        categorized.needsInput.push(reqWithData);
      }
    });

    setCategorizedRequirements(categorized);
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
      // Section-by-section - start wizard
      setCurrentSectionIndex(0);
      setCurrentStep('section-wizard');
    }
  };

  const handleSectionComplete = (sectionData: any) => {
    // Save section content
    setResumeSections(prev => prev.map(s => 
      s.id === sectionData.sectionId 
        ? { ...s, content: sectionData.content, vaultItemsUsed: sectionData.vaultItemsUsed }
        : s
    ));

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
      
      setResumeSections(sections);

      // Track progress
      let completedCount = 0;
      const requiredSections = sections.filter(s => s.required);
      const totalSections = requiredSections.length;

      // Check if vault has work positions before generating
      const { data: vaultCheck } = await supabase
        .from('vault_work_positions')
        .select('id')
        .limit(1);

      if (!vaultCheck || vaultCheck.length === 0) {
        toast({
          title: "Career Vault Empty",
          description: "Please upload and analyze your resume first to populate your career vault.",
          variant: "destructive"
        });
        store.setGeneratingSection(null);
        return;
      }

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
          const contentArray = typeof content === 'string' 
            ? content.split('\n').filter(Boolean).map(line => ({ id: Date.now() + Math.random(), content: line }))
            : Array.isArray(content) ? content : [];

          return {
            ...section,
            content: contentArray,
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

      // Auto-trigger ATS analysis after a small delay
      setTimeout(() => {
        analyzeATSScore();
      }, 1000);

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

  const analyzeATSScore = async (opts?: {
    sectionId?: string;
    sectionTitle?: string;
    previousCoverage?: number | null;
    onDelta?: (prev: number | null, current: number | null) => void;
  }) => {
    if (!resumeSections || resumeSections.length === 0) {
      toast({
        title: "Cannot analyze ATS score",
        description: "No resume sections generated yet. Generate your resume first.",
        variant: "destructive"
      });
      return;
    }
    
    if (!jobAnalysis) {
      toast({
        title: "Cannot analyze ATS score",
        description: "Job description is missing. Please re-analyze the job posting.",
        variant: "destructive"
      });
      return;
    }
    
    // Check if sections have actual content
    const hasContent = resumeSections.some(s => 
      Array.isArray(s.content) && s.content.length > 0
    );
    
    if (!hasContent) {
      toast({
        title: "Cannot analyze ATS score",
        description: "Resume sections are empty. This may indicate your career vault needs to be populated first.",
        variant: "destructive"
      });
      return;
    }

    setAnalyzingATS(true);

    try {
      // Build canonical resume for ATS analysis
      const userProfileHeader = {
        fullName: userProfile?.full_name || userProfile?.name || "",
        headline: userProfile?.headline || jobAnalysis.roleProfile?.title || "",
        contactLine: [
          userProfile?.email,
          userProfile?.phone,
          userProfile?.location,
          userProfile?.linkedin,
        ]
          .filter(Boolean)
          .join(" • "),
      };

      const builderSections = hydratedSections.map((section: any) => ({
        id: section.id ?? section.sectionId ?? crypto.randomUUID(),
        type: section.type ?? section.sectionType ?? section.title ?? "Other",
        title: section.title ?? section.type ?? "Section",
        order: section.order ?? 0,
        items: (section.content ?? []).map((item: any, idx: number) => ({
          id: item.id ?? `${section.id ?? "section"}-item-${idx}`,
          content: typeof item === "string" ? item : item.content ?? "",
          order: item.order ?? idx,
        })),
      }));

      const canonical = builderStateToCanonicalResume({
        userProfile: userProfileHeader,
        sections: builderSections,
      });

      const atsInput = {
        jobTitle: jobAnalysis.roleProfile?.title || "",
        jobDescription: jobAnalysis.originalJobDescription || jobAnalysis.jobText || displayJobText || "",
        industry: jobAnalysis.roleProfile?.industry || "",
        canonicalHeader: canonical.header,
        canonicalSections: canonical.sections,
      };

      const { data, error } = await supabase.functions.invoke('analyze-ats-score', {
        body: atsInput
      });

      if (error) {
        console.error('ATS analysis error:', error);
        // Handle rate limiting
        if (error.message?.includes('429') || error.status === 429) {
          throw new Error('Rate limit exceeded. Please try again in a few moments.');
        }
        // Handle payment required
        if (error.message?.includes('402') || error.status === 402) {
          throw new Error('AI credits required. Please add funds to your workspace.');
        }
        // Handle generic AI errors
        if (error.message?.includes('AI_GENERATION_FAILED')) {
          throw new Error('AI service error. Please try again in a moment.');
        }
        throw error;
      }

      if (!data) {
        throw new Error('No data returned from ATS analysis');
      }

      const previousData = atsScoreData;
      setAtsScoreData(data);
      
      // Save ATS score to database
      if (resumeId) {
        await supabase
          .from('resumes')
          .update({
            ats_analysis: data,
            ats_score: data.summary?.overallScore || data.overallScore || 0,
            last_ats_analysis_at: new Date().toISOString()
          })
          .eq('id', resumeId);
      }

      // If called for a specific section, compute and report delta
      if (opts?.sectionId || opts?.sectionTitle) {
        const secId = opts.sectionId;
        const secTitle = opts.sectionTitle;

        const prevSection = previousData?.perSection?.find(
          (s: any) =>
            (secId && s.sectionId === secId) ||
            (secTitle && s.sectionHeading === secTitle)
        );
        const newSection = data.perSection?.find(
          (s: any) =>
            (secId && s.sectionId === secId) ||
            (secTitle && s.sectionHeading === secTitle)
        );

        const prevCoverage =
          opts.previousCoverage ?? prevSection?.coverageScore ?? null;
        const currentCoverage = newSection?.coverageScore ?? null;

        if (opts.onDelta) {
          opts.onDelta(prevCoverage, currentCoverage);
        }
      }

      toast({
        title: "ATS Analysis Complete",
        description: `Overall score: ${data.summary?.overallScore || data.overallScore || 0}%`,
      });
    } catch (error: any) {
      console.error('ATS analysis failed:', error);
      toast({
        title: "ATS Analysis Failed",
        description: error.message || "Could not analyze ATS compatibility",
        variant: "destructive"
      });
    } finally {
      setAnalyzingATS(false);
    }
  };

  const handleSectionAtsReanalyze = async (
    sectionId: string,
    sectionTitle: string,
    previousCoverage: number | null
  ) => {
    await analyzeATSScore({
      sectionId,
      sectionTitle,
      previousCoverage,
      onDelta: (prev, current) => {
        if (prev == null || current == null) return;

        toast({
          title: "ATS coverage updated",
          description: `Section improved from ${Math.round(
            prev
          )}% → ${Math.round(current)}% coverage.`,
        });
      },
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

  // Helper to convert builder state into canonical form for export
  const buildCanonicalResumeFromBuilderState = (params: {
    userProfile: any;
    resumeSections: any[];
  }) => {
    const { userProfile, resumeSections } = params;

    // Map your existing resumeSections -> BuilderResumeSection[]
    const builderSections: BuilderResumeSection[] = (resumeSections ?? []).map((section: any) => ({
      id: section.id ?? section.sectionId ?? crypto.randomUUID(),
      type: section.type ?? section.sectionType ?? section.title ?? "Other",
      title: section.title ?? section.type ?? "Section",
      order: section.order ?? 0,
      items: (section.items ?? section.content ?? []).map((item: any, idx: number) => ({
        id: item.id ?? `${section.id ?? "section"}-item-${idx}`,
        content: typeof item === "string" ? item : item.content ?? "",
        order: item.order ?? idx,
      })),
    }));

    const canonical = builderStateToCanonicalResume({
      userProfile,
      sections: builderSections,
    });

    const asText = canonicalResumeToPlainText(canonical);
    const asHtml = canonicalResumeToHTML(canonical);

    return { canonical, asText, asHtml };
  };

  const handleExport = async (format: 'pdf' | 'docx' | 'html' | 'txt') => {
    try {
      toast({
        title: "Generating export...",
        description: `Creating ${format.toUpperCase()} file`
      });

      // Fetch user profile for canonical export
      const { data: { user } } = await supabase.auth.getUser();
      const userProfile = user ? {
        email: user.email,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
        // Add more fields as needed from user metadata or profiles table
      } : {};

      const { asText, asHtml } = buildCanonicalResumeFromBuilderState({
        userProfile,
        resumeSections: hydratedSections,
      });

      const fileName = `Resume_${jobAnalysis?.roleProfile?.title?.replace(/\s+/g, '_') || 'Professional'}`;

      if (format === 'txt') {
        const blob = new Blob([asText], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${fileName}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Export successful!",
          description: "TXT file downloaded"
        });
        return;
      }

      if (format === 'html') {
        const blob = new Blob([asHtml], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${fileName}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Export successful!",
          description: "HTML file downloaded"
        });
        return;
      }

      // For PDF / DOCX, temporarily export HTML
      // Later this can be wired into proper PDF/DOCX generation
      if (format === 'pdf' || format === 'docx') {
        const blob = new Blob([asHtml], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = format === 'pdf' ? `${fileName}-for-pdf.html` : `${fileName}-for-docx.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Export successful!",
          description: `HTML file downloaded (${format.toUpperCase()} generation coming soon)`
        });
        return;
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "Please try again",
        variant: "destructive"
      });
    }
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
      return (
        <div className="h-screen flex flex-col bg-background">
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Resume Builder</h1>
              <p className="text-xs text-muted-foreground">
                Build your resume using vault intelligence and gap solutions
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => analyzeATSScore()}
                disabled={analyzingATS}
                className="gap-2"
              >
                {analyzingATS ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4" />
                    {atsScoreData ? 'Re-Analyze' : 'Analyze'} ATS Score
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleStartOver}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Start New Resume
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            {pendingVaultCount > 0 && (
              <div className="p-4">
                <Card className="border-amber-300 bg-amber-50/60 px-4 py-3 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[13px] font-medium">
                        You have {pendingVaultCount} item
                        {pendingVaultCount > 1 ? "s" : ""} queued for your Career Vault
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        These came from this job&apos;s gap analysis when you chose
                        &quot;Add to Career Vault.&quot; You can review them before they
                        become part of your permanent record.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowVaultReview(true)}
                    >
                      Review Career Vault updates
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {showVaultReview && (
              <div className="px-4 pb-4">
                <VaultOverlayReviewPanel onClose={() => setShowVaultReview(false)} />
              </div>
            )}

            {atsScoreData && (
              <div className="px-4 pb-4 space-y-4">
                <div className="grid gap-3 md:grid-cols-4 text-xs">
                  <Card className="p-3 flex flex-col gap-1">
                    <span className="font-semibold text-sm">Overall match</span>
                    <span className="text-2xl font-bold">
                      {Math.round(atsScoreData.summary?.overallScore || atsScoreData.overallScore || 0)}%
                    </span>
                    <span className="text-muted-foreground">
                      Estimated alignment vs. this job posting.
                    </span>
                  </Card>

                  <Card className="p-3">
                    <div className="font-semibold text-xs mb-1">Must-have coverage</div>
                    <div className="text-lg font-bold">
                      {Math.round(atsScoreData.summary?.mustHaveCoverage || 0)}%
                    </div>
                    <div className="text-muted-foreground">
                      Critical skills and requirements matched.
                    </div>
                  </Card>

                  <Card className="p-3">
                    <div className="font-semibold text-xs mb-1">Nice-to-have coverage</div>
                    <div className="text-lg font-bold">
                      {Math.round(atsScoreData.summary?.niceToHaveCoverage || 0)}%
                    </div>
                    <div className="text-muted-foreground">
                      Extra skills that differentiate you.
                    </div>
                  </Card>

                  <Card className="p-3">
                    <div className="font-semibold text-xs mb-1">Industry language</div>
                    <div className="text-lg font-bold">
                      {Math.round(atsScoreData.summary?.industryCoverage || 0)}%
                    </div>
                    <div className="text-muted-foreground">
                      Use of standard terms for this role.
                    </div>
                  </Card>
                </div>

                {atsScoreData.perSection && atsScoreData.perSection.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">
                      Section-by-section keyword coverage
                    </h3>
                    <div className="space-y-2">
                      {hydratedSections.map((section: any) => {
                        const secCoverage = atsScoreData.perSection.find(
                          (s: any) => 
                            s.sectionId === section.id || 
                            s.sectionHeading === section.title
                        );
                        
                        if (!secCoverage) return null;
                        
                        return (
                          <SectionEditorCard
                            key={section.id}
                            section={section}
                            onUpdateSection={(sectionId, content) => {
                              setResumeSections(prev =>
                                prev.map(s => s.id === sectionId ? { ...s, content } : s)
                              );
                            }}
                            onReanalyzeAts={handleSectionAtsReanalyze}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex-1 overflow-hidden">
              <InteractiveResumeBuilder
                sections={hydratedSections as any}
                jobAnalysis={jobAnalysis}
                vaultMatches={vaultMatches?.matchedItems || []}
                atsScoreData={atsScoreData}
                analyzingATS={analyzingATS}
                onReanalyzeATS={analyzeATSScore}
                userProfile={userProfile}
                isBuilding={isBuilding}
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
                atsScore={atsScoreData?.overallScore || vaultMatches?.coverageScore || 0}
                mode={resumeMode}
                onModeChange={setResumeMode}
              />
            </div>
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
