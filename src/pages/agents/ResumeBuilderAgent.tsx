import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { JobAnalysisPanel } from "@/components/resume-builder/JobAnalysisPanel";
import { IntelligentVaultPanel } from "@/components/resume-builder/IntelligentVaultPanel";
import { InteractiveResumeBuilder } from "@/components/resume-builder/InteractiveResumeBuilder";
import { JobInputSection } from "@/components/resume-builder/JobInputSection";
import { ContentLayout } from "@/components/layout/ContentLayout";
import { ContextSidebar } from "@/components/layout/ContextSidebar";
import { useLayout } from "@/contexts/LayoutContext";
import { supabase } from "@/integrations/supabase/client";

const ResumeBuilderV2Content = () => {
  const { toast } = useToast();
  const { leftSidebarCollapsed, toggleLeftSidebar, rightSidebarCollapsed, toggleRightSidebar } = useLayout();

  // Analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [jobAnalysis, setJobAnalysis] = useState<any>(null);

  // Vault matching state
  const [matching, setMatching] = useState(false);
  const [vaultMatches, setVaultMatches] = useState<any>(null);

  // Resume builder state
  const [resumeMode, setResumeMode] = useState<'edit' | 'preview'>('edit');
  const [resumeSections, setResumeSections] = useState<Array<{
    id: string;
    type: 'summary' | 'experience' | 'achievements' | 'leadership' | 'skills' | 'projects' | 'education';
    title: string;
    content: Array<{
      id: string;
      content: string;
      vaultItemId?: string;
      atsKeywords?: string[];
      satisfiesRequirements?: string[];
    }>;
    order: number;
  }>>([
    { id: 'summary', type: 'summary' as const, title: 'Professional Summary', content: [], order: 1 },
    { id: 'experience', type: 'experience' as const, title: 'Professional Experience', content: [], order: 2 },
    { id: 'achievements', type: 'achievements' as const, title: 'Key Achievements', content: [], order: 3 },
    { id: 'leadership', type: 'leadership' as const, title: 'Leadership & Impact', content: [], order: 4 },
    { id: 'skills', type: 'skills' as const, title: 'Core Competencies', content: [], order: 5 },
    { id: 'projects', type: 'projects' as const, title: 'Notable Projects', content: [], order: 6 },
    { id: 'education', type: 'education' as const, title: 'Education & Certifications', content: [], order: 7 }
  ]);

  const handleAnalyzeJob = async (jobText: string) => {
    setAnalyzing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-job-requirements', {
        body: { jobDescription: jobText }
      });

      if (error) throw error;

      setJobAnalysis(data);
      
      // Automatically trigger vault matching after analysis
      handleMatchVault(data);

      toast({
        title: "Job analyzed successfully",
        description: "Building your resume with vault intelligence"
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
      const { data, error } = await supabase.functions.invoke('match-vault-to-requirements', {
        body: { 
          jobRequirements: analysis.jobRequirements,
          atsKeywords: analysis.atsKeywords
        }
      });

      if (error) throw error;

      setVaultMatches(data);
    } catch (error) {
      console.error("Error matching vault:", error);
      toast({
        title: "Vault matching failed",
        description: "Could not match your vault intelligence. Continue building manually.",
        variant: "destructive"
      });
    } finally {
      setMatching(false);
    }
  };

  const handleAddToResume = (_match: any, _placement: string) => {
    // TODO: Implement when vault matching is available
    toast({
      title: "Coming soon",
      description: "Adding vault items to resume will be available soon"
    });
  };

  const handleEnhanceLanguage = (_match: any) => {
    toast({
      title: "Enhanced language available",
      description: "Use the enhanced version optimized for this job"
    });
  };

  const calculateCoverage = () => {
    if (!jobAnalysis) return 0;

    const allReqs = [
      ...jobAnalysis.jobRequirements.required,
      ...jobAnalysis.jobRequirements.preferred
    ];

    const matched = allReqs.filter((r: any) => r.matched).length;
    const partial = allReqs.filter((r: any) => r.partiallyMatched && !r.matched).length;

    return allReqs.length > 0
      ? Math.round((matched + partial * 0.5) / allReqs.length * 100)
      : 0;
  };

  const calculateATSScore = () => {
    if (!jobAnalysis || !vaultMatches) return 0;

    const criticalKeywords = jobAnalysis.atsKeywords?.critical || [];
    const allResumeContent = resumeSections.flatMap(s => s.content.map(c => c.content)).join(' ').toLowerCase();

    const keywordsCovered = criticalKeywords.filter((kw: string) =>
      allResumeContent.includes(kw.toLowerCase())
    ).length;

    return criticalKeywords.length > 0
      ? Math.round((keywordsCovered / criticalKeywords.length) * 100)
      : 0;
  };

  const handleExport = async (_format: string) => {
    // TODO: Implement export functionality
    toast({
      title: "Coming soon",
      description: "Export functionality will be available soon"
    });
  };

  return (
    <ContentLayout
      leftSidebar={
        jobAnalysis ? (
          <ContextSidebar
            side="left"
            width="lg"
            collapsed={leftSidebarCollapsed}
            onToggle={toggleLeftSidebar}
          >
            <JobAnalysisPanel
              jobRequirements={jobAnalysis.jobRequirements}
              industryStandards={jobAnalysis.industryStandards}
              professionBenchmarks={jobAnalysis.professionBenchmarks}
              atsKeywords={jobAnalysis.atsKeywords}
              roleProfile={jobAnalysis.roleProfile}
              gapAnalysis={jobAnalysis.gapAnalysis}
              loading={analyzing}
            />
          </ContextSidebar>
        ) : undefined
      }
      rightSidebar={
        vaultMatches ? (
          <ContextSidebar
            side="right"
            width="lg"
            collapsed={rightSidebarCollapsed}
            onToggle={toggleRightSidebar}
          >
            <IntelligentVaultPanel
              matches={vaultMatches?.matchedItems || []}
              recommendations={vaultMatches?.recommendations}
              onAddToResume={handleAddToResume}
              onEnhanceLanguage={handleEnhanceLanguage}
              loading={matching}
            />
          </ContextSidebar>
        ) : undefined
      }
      maxWidth="full"
    >
      <div className="p-6">
        {!jobAnalysis ? (
          <>
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">Benchmark Resume Builder</h1>
              <p className="text-muted-foreground">
                Build resumes that exceed job requirements + industry standards + top performer benchmarks
              </p>
            </div>
            <JobInputSection onAnalyze={handleAnalyzeJob} isAnalyzing={analyzing} />
          </>
        ) : (
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
                    ? { ...s, content: s.content.filter(c => c.id !== itemId) }
                    : s
                )
              );
            }}
            onReorderSections={(sections) => setResumeSections(sections)}
            onExport={handleExport}
            requirementCoverage={calculateCoverage()}
            atsScore={calculateATSScore()}
            mode={resumeMode}
            onModeChange={setResumeMode}
          />
        )}
      </div>
    </ContentLayout>
  );
};

export default function ResumeBuilderV2() {
  return (
    <ProtectedRoute>
      <ResumeBuilderV2Content />
    </ProtectedRoute>
  );
}
