import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { JobInputSection } from "@/components/resume-builder/JobInputSection";
import { GapAnalysisView } from "@/components/resume-builder/GapAnalysisView";
import { FormatSelector } from "@/components/resume-builder/FormatSelector";
import { SectionWizard } from "@/components/resume-builder/SectionWizard";
import { InteractiveResumeBuilder } from "@/components/resume-builder/InteractiveResumeBuilder";
import { ResumeBuilderOnboarding } from "@/components/resume-builder/ResumeBuilderOnboarding";
import { supabase } from "@/integrations/supabase/client";
import { getFormat } from "@/lib/resumeFormats";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";

type WizardStep = 'job-input' | 'gap-analysis' | 'format-selection' | 'wizard-mode' | 'final-review';

const ResumeBuilderWizardContent = () => {
  const { toast } = useToast();

  // Wizard flow state
  const [currentStep, setCurrentStep] = useState<WizardStep>('job-input');
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

  // Job analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [jobAnalysis, setJobAnalysis] = useState<any>(null);

  // Vault matching state
  const [matching, setMatching] = useState(false);
  const [vaultMatches, setVaultMatches] = useState<any>(null);

  // Format selection
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);

  // Resume content
  const [resumeSections, setResumeSections] = useState<any[]>([]);
  const [resumeMode, setResumeMode] = useState<'edit' | 'preview'>('edit');

  const handleAnalyzeJob = async (jobText: string) => {
    setAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-job-requirements', {
        body: { jobDescription: jobText }
      });

      if (error) throw error;

      setJobAnalysis(data);

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

    // Move to wizard mode
    setCurrentStep('wizard-mode');
    setCurrentSectionIndex(0);
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
          onContinue={() => setCurrentStep('format-selection')}
          onAddMissingItems={() => {
            toast({
              title: "Feature coming soon",
              description: "Quick vault item addition will be available soon"
            });
          }}
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

            <div className="w-24" /> {/* Spacer for centering */}
          </div>

          <SectionWizard
            section={currentSection}
            vaultMatches={vaultMatches?.matchedItems || []}
            jobAnalysis={jobAnalysis}
            onSectionComplete={handleSectionComplete}
            onBack={handleSectionBack}
            onSkip={handleSectionSkip}
            isFirst={currentSectionIndex === 0}
            isLast={currentSectionIndex === resumeSections.length - 1}
            totalSections={resumeSections.length}
            currentIndex={currentSectionIndex}
          />
        </div>
      );

    case 'final-review':
      return (
        <div className="min-h-screen bg-background">
          <div className="p-6">
            <div className="max-w-6xl mx-auto">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Your Resume</h1>
                  <p className="text-muted-foreground">
                    Review and export your benchmark resume
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

              <InteractiveResumeBuilder
                sections={resumeSections}
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
                requirementCoverage={85} // TODO: Calculate based on content
                atsScore={78} // TODO: Calculate based on keywords
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
