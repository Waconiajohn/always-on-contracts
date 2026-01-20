// =====================================================
// STEP 3: Edit & Optimize - Unified Fit Report
// =====================================================
// Single scrollable report where each issue has its action inline
// No navigation. No cognitive overhead. See problem → fix problem → move on.
// =====================================================

import { useRef, useState, useEffect, useCallback } from "react";
import { useResumeBuilderV3Store } from "@/stores/resumeBuilderV3Store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Copy,
  CheckCircle2,
  FileText,
  Sparkles,
  Printer,
  Loader2,
  Eye,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { ExportOptionsV3 } from "./ExportOptionsV3";
import { PrintableResume } from "./PrintableResume";
import { SuccessAnimation, FadeIn } from "./StepTransition";
import { formatResumeAsText } from "./utils/formatters";
import { VersionHistory, safeParseVersions } from "./components/VersionHistory";
import { FitReport } from "./FitReport";
import { MAX_VERSION_HISTORY } from "./constants";
import { logger } from "@/lib/logger";
import type { ResumeVersion, OptimizedResume } from "@/types/resume-builder-v3";
import { EnrichmentPrompt } from "@/components/master-resume/EnrichmentPrompt";
import { useMasterResume } from "@/hooks/useMasterResume";
import { useEnrichment } from "@/hooks/useEnrichment";
import type { EnrichmentSuggestion } from "@/types/master-resume";

// Helper functions for safe localStorage access
const safeGetVersions = (): ResumeVersion[] => {
  try {
    const saved = localStorage.getItem('resume-versions');
    return safeParseVersions(saved);
  } catch (error) {
    logger.error("Failed to read version history from localStorage:", error);
    return [];
  }
};

const safeSaveVersions = (versions: ResumeVersion[]): boolean => {
  try {
    localStorage.setItem('resume-versions', JSON.stringify(versions));
    return true;
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError' && versions.length > 1) {
      logger.warn("Storage full, trying to save fewer versions");
      return safeSaveVersions(versions.slice(0, -1));
    }
    logger.error("Failed to save version history to localStorage:", error);
    return false;
  }
};

// Create a robust content fingerprint for duplicate detection
const createFingerprintSync = (resume: Record<string, unknown>): string => {
  const content = JSON.stringify({
    summary: (resume.summary as string) || '',
    skillsHash: ((resume.skills as string[]) || []).sort().join('|'),
    experienceHash: ((resume.experience as Array<{ title?: string; company?: string; bullets?: string[] }>) || [])
      .map(e => `${e.title || ''}:${e.company || ''}:${(e.bullets || []).join(';;')}`)
      .join('||'),
    atsScore: resume.ats_score || 0,
    headerName: (resume.header as { name?: string })?.name || '',
    improvementsCount: (resume.improvements_made as unknown[])?.length || 0,
  });
  try {
    return btoa(unescape(encodeURIComponent(content)));
  } catch {
    return `fallback-${content.length}-${Date.now()}`;
  }
};

export function EditAndOptimizeStep() {
  const { finalResume, fitAnalysis, jobDescription, setFinalResume } = useResumeBuilderV3Store();
  const printRef = useRef<HTMLDivElement>(null);
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [aiEnhancementsCount, setAiEnhancementsCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"report" | "preview">("report");
  
  // Master Resume enrichment
  const { masterResume, enrichMasterResume, isEnriching } = useMasterResume();
  const { suggestions, generateSuggestions, formatSuggestionsForEnrichment, clearSuggestions } = useEnrichment();
  const [showEnrichmentPrompt, setShowEnrichmentPrompt] = useState(false);
  const hasShownEnrichmentRef = useRef(false);
  
  // Handler for bullet updates
  const handleBulletUpdate = useCallback((experienceIndex: number, bulletIndex: number, newBullet: string) => {
    if (!finalResume) return;
    
    const updatedExperience = finalResume.experience.map((exp, expIdx) => {
      if (expIdx !== experienceIndex) return exp;
      return {
        ...exp,
        bullets: exp.bullets.map((b, bIdx) => 
          bIdx === bulletIndex ? newBullet : b
        ),
      };
    });
    
    const updatedResume: OptimizedResume = {
      ...finalResume,
      experience: updatedExperience,
      improvements_made: [
        ...finalResume.improvements_made,
        `Refined bullet point in ${finalResume.experience[experienceIndex]?.title || 'experience'}`,
      ],
    };
    
    setFinalResume(updatedResume);
    setAiEnhancementsCount(prev => prev + 1);
  }, [finalResume, setFinalResume]);

  // Handler for adding new bullets
  const handleBulletAdd = useCallback((experienceIndex: number, newBullet: string) => {
    if (!finalResume) return;
    
    const updatedExperience = finalResume.experience.map((exp, expIdx) => {
      if (expIdx !== experienceIndex) return exp;
      return {
        ...exp,
        bullets: [...exp.bullets, newBullet],
      };
    });
    
    const updatedResume: OptimizedResume = {
      ...finalResume,
      experience: updatedExperience,
      improvements_made: [
        ...finalResume.improvements_made,
        `Added new bullet to ${finalResume.experience[experienceIndex]?.title || 'experience'}`,
      ],
    };
    
    setFinalResume(updatedResume);
    setAiEnhancementsCount(prev => prev + 1);
  }, [finalResume, setFinalResume]);

  // Handler for summary updates
  const handleSummaryUpdate = useCallback((newSummary: string) => {
    if (!finalResume) return;
    
    const updatedResume: OptimizedResume = {
      ...finalResume,
      summary: newSummary,
      improvements_made: [
        ...finalResume.improvements_made,
        'Refined professional summary with AI',
      ],
    };
    
    setFinalResume(updatedResume);
    setAiEnhancementsCount(prev => prev + 1);
  }, [finalResume, setFinalResume]);

  // Handler for skill additions
  const handleSkillAdd = useCallback((skill: string) => {
    if (!finalResume) return;
    
    // Avoid duplicates
    if (finalResume.skills.some(s => s.toLowerCase() === skill.toLowerCase())) {
      return;
    }
    
    const updatedResume: OptimizedResume = {
      ...finalResume,
      skills: [...finalResume.skills, skill],
      improvements_made: [
        ...finalResume.improvements_made,
        `Added missing skill: ${skill}`,
      ],
    };
    
    setFinalResume(updatedResume);
    setAiEnhancementsCount(prev => prev + 1);
  }, [finalResume, setFinalResume]);
  
  // Track saved fingerprints to prevent race conditions
  const savedFingerprintRef = useRef<string | null>(null);

  // Load versions on mount
  useEffect(() => {
    setVersions(safeGetVersions());
    return () => {
      savedFingerprintRef.current = null;
      hasShownEnrichmentRef.current = false;
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;
      
      if (modKey && e.key === 's') {
        e.preventDefault();
        handleSaveVersion();
        toast.success("Version saved!");
      }
      if (modKey && e.key === 'p') {
        e.preventDefault();
        handlePrint();
      }
      if (modKey && e.key === 'c' && e.shiftKey) {
        e.preventDefault();
        handleCopyText();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Check for enrichment opportunities
  useEffect(() => {
    if (!finalResume || !masterResume?.content || hasShownEnrichmentRef.current) return;
    
    const newSuggestions = generateSuggestions(finalResume, masterResume.content);
    if (newSuggestions.length > 0) {
      const timer = setTimeout(() => {
        setShowEnrichmentPrompt(true);
        hasShownEnrichmentRef.current = true;
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [finalResume, masterResume?.content, generateSuggestions]);
  
  const handleAddEnrichments = useCallback((items: EnrichmentSuggestion[]) => {
    const content = formatSuggestionsForEnrichment(items);
    enrichMasterResume(content);
    setShowEnrichmentPrompt(false);
    clearSuggestions();
  }, [formatSuggestionsForEnrichment, enrichMasterResume, clearSuggestions]);
  
  const handleSkipEnrichment = useCallback(() => {
    setShowEnrichmentPrompt(false);
    clearSuggestions();
  }, [clearSuggestions]);

  // Auto-save version when a NEW resume is generated
  useEffect(() => {
    if (!finalResume) return;
    
    const newFingerprint = createFingerprintSync(finalResume as unknown as Record<string, unknown>);
    
    if (savedFingerprintRef.current === newFingerprint) return;
    
    const existingVersions = safeGetVersions();
    
    const alreadySaved = existingVersions.some((v) => 
      createFingerprintSync(v.resume as unknown as Record<string, unknown>) === newFingerprint
    );
    
    if (!alreadySaved) {
      const maxVersionNum = existingVersions.reduce((max, v) => {
        const match = v.label.match(/Version (\d+)/);
        return match ? Math.max(max, parseInt(match[1], 10)) : max;
      }, 0);
      
      const newVersion: ResumeVersion = {
        id: crypto.randomUUID(),
        resume: finalResume,
        createdAt: new Date(),
        label: `Version ${maxVersionNum + 1}`,
      };
      const updatedVersions = [newVersion, ...existingVersions].slice(0, MAX_VERSION_HISTORY);
      if (safeSaveVersions(updatedVersions)) {
        setVersions(updatedVersions);
        savedFingerprintRef.current = newFingerprint;
      }
    } else {
      savedFingerprintRef.current = newFingerprint;
    }
  }, [finalResume]);

  if (!finalResume || !fitAnalysis) return null;

  const handleCopyText = async () => {
    const resumeTextFormatted = formatResumeAsText(finalResume);
    
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(resumeTextFormatted);
        toast.success("Resume copied to clipboard!");
      } catch {
        fallbackCopyToClipboard(resumeTextFormatted);
      }
    } else {
      fallbackCopyToClipboard(resumeTextFormatted);
    }
  };

  const fallbackCopyToClipboard = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand("copy");
      if (successful) {
        toast.success("Resume copied to clipboard!");
      } else {
        toast.error("Failed to copy. Please select and copy manually.");
      }
    } catch {
      toast.error("Copy not supported. Please select and copy manually.");
    } finally {
      document.body.removeChild(textArea);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSaveVersion = async () => {
    if (isSaving || !finalResume) return;
    setIsSaving(true);
    
    try {
      const maxVersionNum = versions.reduce((max, v) => {
        const match = v.label.match(/Version (\d+)/);
        return match ? Math.max(max, parseInt(match[1], 10)) : max;
      }, 0);
      
      const newVersion: ResumeVersion = {
        id: crypto.randomUUID(),
        resume: finalResume,
        createdAt: new Date(),
        label: `Version ${maxVersionNum + 1}`,
      };
      const updatedVersions = [newVersion, ...versions].slice(0, MAX_VERSION_HISTORY);
      
      if (safeSaveVersions(updatedVersions)) {
        setVersions(updatedVersions);
        toast.success("Version saved to history!");
      } else {
        toast.error("Failed to save version. Storage may be full.");
      }
    } catch {
      toast.error("Failed to save version");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 no-print max-w-4xl mx-auto">
      {/* Hidden printable version */}
      <div className="hidden print:block">
        <PrintableResume ref={printRef} resume={finalResume} />
      </div>

      {/* Header */}
      <SuccessAnimation>
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 mb-3">
            <CheckCircle2 className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-lg font-semibold mb-1">Your Fit Report</h2>
          <p className="text-sm text-muted-foreground">
            See what's strong, what needs work, and fix it inline.
          </p>
        </div>
      </SuccessAnimation>

      {/* Action Bar */}
      <FadeIn delay={0.1}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {finalResume.header.name}
              </CardTitle>
              {aiEnhancementsCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {aiEnhancementsCount} improvements
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <VersionHistory versions={versions} currentVersion={finalResume} />
              <Button variant="outline" size="sm" onClick={handleSaveVersion} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint} className="hidden sm:flex">
                <Printer className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopyText}>
                <Copy className="h-4 w-4" />
              </Button>
              <ExportOptionsV3 resume={finalResume} />
            </div>
          </CardHeader>
        </Card>
      </FadeIn>

      {/* Main Content: Tabs for Report vs Preview */}
      <FadeIn delay={0.2}>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "report" | "preview")} className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="report" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Fit Report
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="h-4 w-4" />
              Resume Preview
            </TabsTrigger>
          </TabsList>

          {/* Fit Report Tab */}
          <TabsContent value="report" className="mt-4">
            <FitReport
              fitAnalysis={fitAnalysis}
              finalResume={finalResume}
              jobDescription={jobDescription}
              onBulletUpdate={handleBulletUpdate}
              onBulletAdd={handleBulletAdd}
              onSkillAdd={handleSkillAdd}
              onSummaryUpdate={handleSummaryUpdate}
            />
          </TabsContent>

          {/* Resume Preview Tab */}
          <TabsContent value="preview" className="mt-4">
            <Card>
              <CardContent className="space-y-4 p-6">
                {/* Header */}
                <div className="text-center border-b pb-4">
                  <h3 className="text-xl font-bold">{finalResume.header.name}</h3>
                  <p className="text-muted-foreground">{finalResume.header.title}</p>
                  {finalResume.header.contact && (
                    <p className="text-xs text-muted-foreground mt-1">{finalResume.header.contact}</p>
                  )}
                </div>

                {/* Summary */}
                <div>
                  <h4 className="font-semibold text-sm uppercase tracking-wide mb-2">Professional Summary</h4>
                  <p className="text-sm text-muted-foreground">{finalResume.summary}</p>
                </div>

                <Separator />

                {/* Experience */}
                <div>
                  <h4 className="font-semibold text-sm uppercase tracking-wide mb-3">Experience</h4>
                  <div className="space-y-4">
                    {finalResume.experience.map((exp, index) => (
                      <div key={`exp-${index}`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold">{exp.title}</p>
                            <p className="text-sm text-muted-foreground">{exp.company}</p>
                          </div>
                          <p className="text-sm text-muted-foreground">{exp.dates}</p>
                        </div>
                        <ul className="mt-2 space-y-1">
                          {exp.bullets.map((bullet, bIdx) => (
                            <li key={`bullet-${index}-${bIdx}`} className="text-sm flex items-start gap-2">
                              <span className="text-muted-foreground">•</span>
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Skills */}
                <div>
                  <h4 className="font-semibold text-sm uppercase tracking-wide mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {finalResume.skills.map((skill, index) => (
                      <Badge key={`skill-${index}`} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </div>

                {/* Education */}
                {finalResume.education && finalResume.education.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold text-sm uppercase tracking-wide mb-2">Education</h4>
                      <div className="space-y-2">
                        {finalResume.education.map((edu, index) => (
                          <div key={`edu-${index}`} className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-sm">{edu.degree}</p>
                              <p className="text-sm text-muted-foreground">{edu.institution}</p>
                            </div>
                            {edu.year && <p className="text-sm text-muted-foreground">{edu.year}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Certifications */}
                {finalResume.certifications && finalResume.certifications.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold text-sm uppercase tracking-wide mb-2">Certifications</h4>
                      <ul className="space-y-1">
                        {finalResume.certifications.map((cert, index) => (
                          <li key={`cert-${index}`} className="text-sm flex items-start gap-2">
                            <span className="text-muted-foreground">•</span>
                            {cert}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                {/* Improvements made */}
                {finalResume.improvements_made.length > 0 && (
                  <>
                    <Separator />
                    <div className="bg-primary/5 rounded-lg p-4">
                      <h4 className="font-semibold text-sm flex items-center gap-2 text-primary mb-2">
                        <Sparkles className="h-4 w-4" />
                        {finalResume.improvements_made.length} Improvements Made
                      </h4>
                      <ul className="space-y-1">
                        {finalResume.improvements_made.slice(-5).map((improvement, index) => (
                          <li key={`improvement-${index}`} className="text-xs text-muted-foreground flex items-start gap-2">
                            <CheckCircle2 className="h-3 w-3 mt-0.5 text-primary flex-shrink-0" />
                            {improvement}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </FadeIn>
      
      {/* Keyboard shortcuts hint */}
      <div className="text-center text-[10px] text-muted-foreground mt-4 py-2 border-t">
        <span className="inline-flex items-center gap-3">
          <span><kbd className="px-1.5 py-0.5 text-[9px] bg-muted rounded">⌘/Ctrl</kbd> + <kbd className="px-1.5 py-0.5 text-[9px] bg-muted rounded">S</kbd> Save</span>
          <span><kbd className="px-1.5 py-0.5 text-[9px] bg-muted rounded">⌘/Ctrl</kbd> + <kbd className="px-1.5 py-0.5 text-[9px] bg-muted rounded">P</kbd> Print</span>
          <span><kbd className="px-1.5 py-0.5 text-[9px] bg-muted rounded">⌘/Ctrl</kbd> + <kbd className="px-1.5 py-0.5 text-[9px] bg-muted rounded">Shift</kbd> + <kbd className="px-1.5 py-0.5 text-[9px] bg-muted rounded">C</kbd> Copy</span>
        </span>
      </div>
      
      {/* Enrichment Prompt Dialog */}
      <EnrichmentPrompt
        open={showEnrichmentPrompt}
        onOpenChange={setShowEnrichmentPrompt}
        suggestions={suggestions}
        onAddSelected={handleAddEnrichments}
        onSkip={handleSkipEnrichment}
        isAdding={isEnriching}
      />
    </div>
  );
}
