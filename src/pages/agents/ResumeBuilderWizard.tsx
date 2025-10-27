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
import { GenerationProgress } from "@/components/resume-builder/GenerationProgress";
import { supabase } from "@/integrations/supabase/client";
import { getFormat } from "@/lib/resumeFormats";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionWizard } from "@/components/resume-builder/SectionWizard";
import { GenerationModeSelector } from "@/components/resume-builder/GenerationModeSelector";
import { useResumeBuilderStore } from "@/stores/resumeBuilderStore";
import { useResumeMilestones } from "@/hooks/useResumeMilestones";
import { enhanceVaultMatches } from "@/lib/vaultQualityScoring";

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

  // ATS Score state
  const [atsScoreData, setAtsScoreData] = useState<any>(null);
  const [analyzingATS, setAnalyzingATS] = useState(false);

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
    console.log('🔍 Attempting to fetch full job description from URL...');
    
    try {
      const { data, error } = await supabase.functions.invoke('parse-job-document', {
        body: { url: jobData.applyUrl }
      });
      
      // Check for blocked/error response
      if (error || !data?.success || data?.blocked || data?.error === 'BLOCKED') {
        console.log('❌ URL fetch blocked or failed, using search result description');
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
      console.log('⚠️ Falling back to search result description:', error.message);
      
      // Fall back to using the existing job description from search results
      const enhancedDescription = buildEnhancedDescription(jobData);
      setDisplayJobText(enhancedDescription);
      
      const isBlocked = error?.message === 'URL_BLOCKED' || error?.message?.includes('BLOCKED');
      
      toast({
        title: isBlocked ? "Using search result description" : "Using available job details",
        description: isBlocked 
          ? "Job board blocked access - using description from search results instead." 
          : "Using available job information to continue.",
      });
      
      // Proceed with analysis using the available description
      handleAnalyzeJob(enhancedDescription);
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

    // Skip requirement filtering and go straight to generation
    toast({
      title: "Format selected",
      description: "Generating your resume with all matched vault items..."
    });
    
    generateCompleteResume();
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

  const analyzeATSScore = async () => {
    if (!resumeSections || resumeSections.length === 0 || !jobAnalysis?.originalJobDescription) {
      toast({
        title: "Cannot analyze ATS score",
        description: "Missing resume content or job description",
        variant: "destructive"
      });
      return;
    }

    setAnalyzingATS(true);

    try {
      // Convert resume sections to plain text for analysis
      const resumeContent = resumeSections.map(section => {
        const items = Array.isArray(section.content) 
          ? section.content.map((item: any) => item.content || item).join('\n')
          : section.content;
        return `${section.title.toUpperCase()}\n${items}`;
      }).join('\n\n');

      const { data, error } = await supabase.functions.invoke('analyze-ats-score', {
        body: {
          resumeContent,
          jobDescription: jobAnalysis.originalJobDescription
        }
      });

      if (error) {
        // Handle rate limiting
        if (error.message?.includes('429')) {
          throw new Error('Rate limit exceeded. Please try again in a few moments.');
        }
        // Handle payment required
        if (error.message?.includes('402')) {
          throw new Error('AI credits required. Please add funds to your workspace.');
        }
        throw error;
      }

      setAtsScoreData(data);
      
      // Save ATS score to database
      if (resumeId) {
        await supabase
          .from('resumes')
          .update({
            ats_analysis: data,
            ats_score: data.overallScore,
            last_ats_analysis_at: new Date().toISOString()
          })
          .eq('id', resumeId);
      }
      
      toast({
        title: "ATS Analysis Complete",
        description: `Overall score: ${data.overallScore}%`,
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

      return (
        <div className="min-h-screen bg-background">
          <div className="p-4">
            <Button
              variant="ghost"
              onClick={() => setCurrentStep('requirement-filter')}
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
                onClick={analyzeATSScore}
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

          <div className="flex-1 overflow-hidden">
            <InteractiveResumeBuilder
              sections={resumeSections}
              jobAnalysis={jobAnalysis}
              vaultMatches={vaultMatches?.matchedItems || []}
              atsScoreData={atsScoreData}
              analyzingATS={analyzingATS}
              onReanalyzeATS={analyzeATSScore}
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
