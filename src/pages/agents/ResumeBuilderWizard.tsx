import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { JobInputSection } from "@/components/resume-builder/JobInputSection";
import { GapAnalysisView } from "@/components/resume-builder/GapAnalysisView";
import { FormatSelector } from "@/components/resume-builder/FormatSelector";
import { SectionWizard } from "@/components/resume-builder/SectionWizard";
import { InteractiveResumeBuilder } from "@/components/resume-builder/InteractiveResumeBuilder";
import { ResumeBuilderOnboarding } from "@/components/resume-builder/ResumeBuilderOnboarding";
import { ResumePreviewModal } from "@/components/resume-builder/ResumePreviewModal";
import { supabase } from "@/integrations/supabase/client";
import { getFormat } from "@/lib/resumeFormats";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";

type WizardStep = 'job-input' | 'gap-analysis' | 'format-selection' | 'wizard-mode' | 'final-review';

const ResumeBuilderWizardContent = () => {
  const { toast } = useToast();
  const location = useLocation();

  // Wizard flow state
  const [currentStep, setCurrentStep] = useState<WizardStep>('job-input');
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

  // Job analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [jobAnalysis, setJobAnalysis] = useState<any>(null);
  const [autoLoadedJob, setAutoLoadedJob] = useState(false);

  // Vault matching state
  const [matching, setMatching] = useState(false);
  const [vaultMatches, setVaultMatches] = useState<any>(null);
  
  // Resume milestones from uploaded resume
  const [resumeMilestones, setResumeMilestones] = useState<any[]>([]);

  // Format selection
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);

  // Resume content
  const [resumeSections, setResumeSections] = useState<any[]>([]);
  const [resumeMode, setResumeMode] = useState<'edit' | 'preview'>('edit');

  // Preview modal state
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Auto-load job from job search navigation
  useEffect(() => {
    const jobData = location.state as any;
    if (jobData?.fromJobSearch && jobData?.jobDescription && !autoLoadedJob) {
      setAutoLoadedJob(true);
      
      // Build enhanced job description with metadata
      let enhancedDescription = jobData.jobDescription;
      
      // Add note if description appears truncated
      if (jobData.jobDescription.endsWith('…') || jobData.jobDescription.endsWith('...')) {
        enhancedDescription += `\n\nNote: This description may be truncated. ${
          jobData.applyUrl ? `Full job posting: ${jobData.applyUrl}` : ''
        }`;
      }
      
      // Add additional context if available
      if (jobData.location) {
        enhancedDescription = `Location: ${jobData.location}\n\n${enhancedDescription}`;
      }
      
      if (jobData.salary) {
        enhancedDescription = `Salary Range: $${jobData.salary}\n\n${enhancedDescription}`;
      }
      
      handleAnalyzeJob(enhancedDescription);
      // Clear location state to prevent re-triggering
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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

      // Fetch resume milestones in parallel with vault matching
      const [matchResult, milestonesResult] = await Promise.all([
        supabase.functions.invoke('match-vault-to-requirements', {
          body: {
            userId: user.id,
            jobRequirements: analysis.jobRequirements,
            industryStandards: analysis.industryStandards,
            professionBenchmarks: analysis.professionBenchmarks,
            atsKeywords: analysis.atsKeywords
          }
        }),
        supabase
          .from('vault_resume_milestones')
          .select('*')
          .eq('user_id', user.id)
          .order('milestone_date', { ascending: false })
      ]);

      if (matchResult.error) throw matchResult.error;
      
      setVaultMatches(matchResult.data);
      setResumeMilestones(milestonesResult.data || []);
      
      console.log('Resume milestones loaded:', milestonesResult.data?.length || 0);
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

    // Initialize resume sections based on selected format
    const format = getFormat(selectedFormat);
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

    // Move to resume editor with vault panel
    setCurrentStep('final-review');
  };

  const handleSectionComplete = (sectionContent: any) => {
    // Save section content
    const updatedSections = [...resumeSections];
    updatedSections[currentSectionIndex] = {
      ...updatedSections[currentSectionIndex],
      content: sectionContent.content,
      vaultItemsUsed: sectionContent.vaultItemsUsed
    };
    setResumeSections(updatedSections);

    // Move to next section or finish
    if (currentSectionIndex < resumeSections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
    } else {
      setCurrentStep('final-review');
      toast({
        title: "Resume complete!",
        description: "Review and export your resume"
      });
    }
  };

  const handleSectionBack = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
    } else {
      setCurrentStep('format-selection');
    }
  };

  const handleSectionSkip = () => {
    if (currentSectionIndex < resumeSections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
    } else {
      setCurrentStep('final-review');
    }
  };

  const handleStartOver = () => {
    setCurrentStep('job-input');
    setCurrentSectionIndex(0);
    setJobAnalysis(null);
    setVaultMatches(null);
    setSelectedFormat(null);
    setResumeSections([]);
  };

  const handleExport = async (format: string) => {
    toast({
      title: "Export coming soon",
      description: `${format.toUpperCase()} export will be available soon`
    });
  };

  // Render based on current step
  switch (currentStep) {
    case 'job-input':
      return (
        <div className="min-h-screen bg-background">
          <ResumeBuilderOnboarding />
          <div className="max-w-4xl mx-auto p-6">
            <div className="mb-8 text-center">
              <h1 className="text-4xl font-bold mb-3">Benchmark Resume Builder</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Build a resume that exceeds job requirements using AI and your Career Vault intelligence
              </p>
            </div>

            <JobInputSection
              onAnalyze={handleAnalyzeJob}
              isAnalyzing={analyzing || matching}
              initialJobText={(location.state as any)?.jobDescription || ""}
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

    case 'wizard-mode':
      const format = getFormat(selectedFormat || 'executive');
      const currentSection = format?.sections[currentSectionIndex];

      if (!currentSection) {
        return <div>Error: Section not found</div>;
      }

      return (
        <>
          <div className="h-screen flex flex-col bg-background">
            <div className="p-4 border-b flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={handleStartOver}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Start Over
              </Button>

              <h3 className="font-semibold">{format?.name}</h3>

              <Button
                variant="outline"
                onClick={() => setShowPreviewModal(true)}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                Preview Resume
              </Button>
            </div>

            <SectionWizard
              section={currentSection}
              vaultMatches={vaultMatches?.matchedItems || []}
              jobAnalysis={jobAnalysis}
              resumeMilestones={resumeMilestones}
              onSectionComplete={handleSectionComplete}
              onBack={handleSectionBack}
              onSkip={handleSectionSkip}
              isFirst={currentSectionIndex === 0}
              isLast={currentSectionIndex === resumeSections.length - 1}
              totalSections={resumeSections.length}
              currentIndex={currentSectionIndex}
            />
          </div>

          <ResumePreviewModal
            isOpen={showPreviewModal}
            onClose={() => setShowPreviewModal(false)}
            sections={resumeSections}
            currentSectionId={currentSection.id}
            overallQuality={{
              atsScore: vaultMatches?.coverageScore || 0,
              requirementCoverage: vaultMatches?.coverageScore || 0,
              completedSections: resumeSections.filter(s => s.content).length,
              totalSections: resumeSections.length
            }}
            onExport={handleExport}
          />
        </>
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
              resumeMilestones={resumeMilestones}
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
              onExport={handleExport}
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
