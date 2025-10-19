import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { JobImportDialog } from "@/components/JobImportDialog";
import { Upload, Sparkles, Loader2 } from "lucide-react";
import { JobAnalysisPanel } from "@/components/resume-builder/JobAnalysisPanel";
import { IntelligentVaultPanel } from "@/components/resume-builder/IntelligentVaultPanel";
import { InteractiveResumeBuilder } from "@/components/resume-builder/InteractiveResumeBuilder";

const ResumeBuilderV2Content = () => {
  const { toast } = useToast();

  // Job description state
  const [jobDescription, setJobDescription] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // Analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [jobAnalysis, setJobAnalysis] = useState<any>(null);

  // Vault matching state
  const [matching, setMatching] = useState(false);
  const [vaultMatches, setVaultMatches] = useState<any>(null);

  // Resume builder state
  const [resumeMode, setResumeMode] = useState<'edit' | 'preview'>('edit');
  const [resumeSections, setResumeSections] = useState([
    { id: 'summary', type: 'summary' as const, title: 'Professional Summary', content: [], order: 1 },
    { id: 'experience', type: 'experience' as const, title: 'Professional Experience', content: [], order: 2 },
    { id: 'achievements', type: 'achievements' as const, title: 'Key Achievements', content: [], order: 3 },
    { id: 'leadership', type: 'leadership' as const, title: 'Leadership & Impact', content: [], order: 4 },
    { id: 'skills', type: 'skills' as const, title: 'Core Competencies', content: [], order: 5 },
    { id: 'projects', type: 'projects' as const, title: 'Notable Projects', content: [], order: 6 },
    { id: 'education', type: 'education' as const, title: 'Education & Certifications', content: [], order: 7 }
  ]);

  const handleAnalyzeJob = async () => {
    if (!jobDescription.trim()) {
      toast({ title: "Please enter a job description", variant: "destructive" });
      return;
    }

    setAnalyzing(true);

    try {
      // Call the multi-source intelligence edge function
      const { data, error } = await supabase.functions.invoke('analyze-job-requirements', {
        body: {
          jobDescription,
          jobTitle,
          companyName,
          industry
        }
      });

      if (error) throw error;

      if (data.success) {
        setJobAnalysis(data);

        toast({
          title: "Job Analysis Complete!",
          description: `Found ${data.jobRequirements.required.length} required + ${data.industryStandards.length} industry standards + ${data.professionBenchmarks.length} top performer benchmarks`
        });

        // Automatically start vault matching
        handleMatchVault(data);
      }
    } catch (error: any) {
      console.error('Error analyzing job:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Please try again",
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
      if (!user) throw new Error('User not authenticated');

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

      if (data.success) {
        setVaultMatches(data);

        toast({
          title: "Vault Matching Complete!",
          description: `Found ${data.recommendations.mustInclude.length} perfect matches, ${data.recommendations.stronglyRecommended.length} strong recommendations`
        });

        // Update job requirements with match status
        updateRequirementMatchStatus(data);
      }
    } catch (error: any) {
      console.error('Error matching vault:', error);
      toast({
        title: "Matching Failed",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    } finally {
      setMatching(false);
    }
  };

  const updateRequirementMatchStatus = (matchData: any) => {
    if (!jobAnalysis) return;

    const satisfiedRequirements = new Set(
      matchData.matchedItems
        .filter((m: any) => m.matchScore >= 70)
        .flatMap((m: any) => m.satisfiesRequirements)
    );

    const partiallySatisfied = new Set(
      matchData.matchedItems
        .filter((m: any) => m.matchScore >= 50 && m.matchScore < 70)
        .flatMap((m: any) => m.satisfiesRequirements)
    );

    const updateRequirements = (reqs: any[]) =>
      reqs.map(req => ({
        ...req,
        matched: satisfiedRequirements.has(req.requirement),
        partiallyMatched: !satisfiedRequirements.has(req.requirement) && partiallySatisfied.has(req.requirement)
      }));

    setJobAnalysis({
      ...jobAnalysis,
      jobRequirements: {
        required: updateRequirements(jobAnalysis.jobRequirements.required),
        preferred: updateRequirements(jobAnalysis.jobRequirements.preferred),
        niceToHave: updateRequirements(jobAnalysis.jobRequirements.niceToHave)
      },
      industryStandards: jobAnalysis.industryStandards.map((std: any) => ({
        ...std,
        matched: satisfiedRequirements.has(std.standard)
      })),
      professionBenchmarks: jobAnalysis.professionBenchmarks.map((bench: any) => ({
        ...bench,
        matched: satisfiedRequirements.has(bench.standard)
      }))
    });
  };

  const handleAddToResume = (match: any, placement: string) => {
    const sectionId = placement;
    const section = resumeSections.find(s => s.type === sectionId);

    if (!section) return;

    const newItem = {
      id: `item-${Date.now()}`,
      content: match.enhancedLanguage || match.content.phrase || match.content.skill_name || JSON.stringify(match.content),
      vaultItemId: match.vaultItemId,
      atsKeywords: match.atsKeywords,
      satisfiesRequirements: match.satisfiesRequirements
    };

    setResumeSections(prev =>
      prev.map(s =>
        s.id === section.id
          ? { ...s, content: [...s.content, newItem] }
          : s
      )
    );

    // Mark as added in vault matches
    if (vaultMatches) {
      setVaultMatches({
        ...vaultMatches,
        matchedItems: vaultMatches.matchedItems.map((m: any) =>
          m.vaultItemId === match.vaultItemId ? { ...m, added: true } : m
        ),
        recommendations: {
          mustInclude: vaultMatches.recommendations.mustInclude.map((m: any) =>
            m.vaultItemId === match.vaultItemId ? { ...m, added: true } : m
          ),
          stronglyRecommended: vaultMatches.recommendations.stronglyRecommended.map((m: any) =>
            m.vaultItemId === match.vaultItemId ? { ...m, added: true } : m
          ),
          consider: vaultMatches.recommendations.consider.map((m: any) =>
            m.vaultItemId === match.vaultItemId ? { ...m, added: true } : m
          )
        }
      });
    }

    toast({
      title: "Added to resume!",
      description: `Added to ${section.title}`
    });
  };

  const handleEnhanceLanguage = (match: any) => {
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

  const handleExport = async (format: string) => {
    toast({
      title: "Exporting resume...",
      description: `Generating ${format.toUpperCase()} file`
    });

    // TODO: Implement actual export logic
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Benchmark Resume Builder</h1>
          <p className="text-muted-foreground">
            Build resumes that exceed job requirements + industry standards + top performer benchmarks
          </p>
        </div>

        {/* Job Input Section */}
        {!jobAnalysis && (
          <Card className="p-6 mb-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
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

              <div className="grid grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Job Title"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm"
                />
                <input
                  type="text"
                  placeholder="Company Name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm"
                />
                <input
                  type="text"
                  placeholder="Industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm"
                />
              </div>

              <Textarea
                placeholder="Paste the full job description here..."
                className="min-h-[200px]"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />

              <Button
                onClick={handleAnalyzeJob}
                disabled={analyzing || !jobDescription.trim()}
                className="w-full"
                size="lg"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing with AI (Job + Industry + Benchmarks)...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Analyze Job & Match Career Vault
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* 3-Panel Resume Builder */}
        {jobAnalysis && (
          <div className="grid grid-cols-12 gap-6">
            {/* Left Panel: Job Analysis */}
            <div className="col-span-3">
              <JobAnalysisPanel
                jobRequirements={jobAnalysis.jobRequirements}
                industryStandards={jobAnalysis.industryStandards}
                professionBenchmarks={jobAnalysis.professionBenchmarks}
                atsKeywords={jobAnalysis.atsKeywords}
                roleProfile={jobAnalysis.roleProfile}
                gapAnalysis={jobAnalysis.gapAnalysis}
                loading={analyzing}
              />
            </div>

            {/* Center Panel: Resume Builder */}
            <div className="col-span-6">
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
            </div>

            {/* Right Panel: Career Vault */}
            <div className="col-span-3">
              <IntelligentVaultPanel
                matches={vaultMatches?.matchedItems || []}
                recommendations={vaultMatches?.recommendations}
                onAddToResume={handleAddToResume}
                onEnhanceLanguage={handleEnhanceLanguage}
                loading={matching}
              />
            </div>
          </div>
        )}
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

export default function ResumeBuilderV2() {
  return (
    <ProtectedRoute>
      <ResumeBuilderV2Content />
    </ProtectedRoute>
  );
}
