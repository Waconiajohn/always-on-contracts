// =====================================================
// STEP 3: Edit & Optimize - Unified Analysis + Editing
// =====================================================
// Side-by-side view with resume editor (left) and analysis (right)
// Combines FitAnalysis, Standards, and GenerateStep into one cohesive experience
// =====================================================

import { useRef, useState, useEffect, useCallback } from "react";
import { useResumeBuilderV3Store } from "@/stores/resumeBuilderV3Store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Copy,
  CheckCircle2,
  FileText,
  Sparkles,
  Printer,
  Loader2,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { toast } from "sonner";
import { ExportOptionsV3 } from "./ExportOptionsV3";
import { PrintableResume } from "./PrintableResume";
import { SuccessAnimation, FadeIn, StaggerContainer, StaggerItem } from "./StepTransition";
import { formatResumeAsText } from "./utils/formatters";
import { HelpTooltip, HELP_CONTENT } from "./components/HelpTooltip";
import { VersionHistory, safeParseVersions } from "./components/VersionHistory";
import { BulletEditor } from "./components/BulletEditor";
import { SummaryEditor } from "./components/SummaryEditor";
import { SkillsSuggester } from "./components/SkillsSuggester";
import { AIEnhancementsSidebar } from "./components/AIEnhancementsSidebar";
import { SectionHealthBadge, getSectionStatus } from "./components/SectionHealthBadge";
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
  const { finalResume, fitAnalysis, jobDescription, resumeText, setFinalResume } = useResumeBuilderV3Store();
  const printRef = useRef<HTMLDivElement>(null);
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [aiEnhancementsCount, setAiEnhancementsCount] = useState(0);
  const [showAnalysisSidebar, setShowAnalysisSidebar] = useState(true);
  
  // Master Resume enrichment
  const { masterResume, enrichMasterResume, isEnriching } = useMasterResume();
  const { suggestions, generateSuggestions, formatSuggestionsForEnrichment, clearSuggestions } = useEnrichment();
  const [showEnrichmentPrompt, setShowEnrichmentPrompt] = useState(false);
  const hasShownEnrichmentRef = useRef(false);
  
  // Handler for bullet updates from BulletEditor
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

  // Handler for summary updates from SummaryEditor
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

  // Handler for skill additions from SkillsSuggester
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

  // Load versions on mount and cleanup ref on unmount
  useEffect(() => {
    setVersions(safeGetVersions());
    return () => {
      savedFingerprintRef.current = null;
      hasShownEnrichmentRef.current = false;
    };
  }, []);

  // Keyboard shortcuts (V2 pattern)
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
  
  // Check for enrichment opportunities when resume is generated
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

  if (!finalResume) return null;

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

  // Calculate section health
  const missingKeywordsCount = fitAnalysis?.keywords_missing?.length || 0;
  const fitScore = fitAnalysis?.fit_score || 0;
  const summaryStatus = getSectionStatus('summary', fitScore, missingKeywordsCount, aiEnhancementsCount > 0);
  const experienceStatus = getSectionStatus('experience', fitScore, missingKeywordsCount, aiEnhancementsCount > 0);
  const skillsStatus = getSectionStatus('skills', fitScore, missingKeywordsCount, aiEnhancementsCount > 0);
  const matchedKeywords = fitAnalysis?.keywords_found || [];

  return (
    <div className="space-y-4 no-print">
      {/* Hidden printable version */}
      <div className="hidden print:block">
        <PrintableResume ref={printRef} resume={finalResume} />
      </div>

      {/* Success header */}
      <SuccessAnimation>
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 mb-3">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>
          <h2 className="text-lg font-semibold mb-1">Edit & Optimize Your Resume</h2>
          <p className="text-sm text-muted-foreground">
            See issues on the right, fix them on the left. Click "Improve with AI" on any bullet to enhance it.
          </p>
        </div>
      </SuccessAnimation>

      {/* Main content: Side-by-side layout */}
      <div className="flex gap-4">
        {/* Left Panel: Resume Editor (60-100%) */}
        <div className={`flex-1 min-w-0 ${showAnalysisSidebar ? 'lg:w-[60%]' : 'w-full'}`}>
          <FadeIn delay={0.1}>
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3 sm:px-6 py-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Resume Editor
                  {aiEnhancementsCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {aiEnhancementsCount} AI edits
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex flex-wrap gap-2">
                  <VersionHistory versions={versions} currentVersion={finalResume} />
                  <Button variant="outline" size="sm" onClick={handleSaveVersion} disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Version"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handlePrint} className="hidden sm:flex">
                    <Printer className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Print</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCopyText}>
                    <Copy className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Copy</span>
                  </Button>
                  <ExportOptionsV3 resume={finalResume} />
                  {/* Toggle sidebar button for mobile/tablet */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAnalysisSidebar(!showAnalysisSidebar)}
                    className="lg:hidden"
                  >
                    {showAnalysisSidebar ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 px-3 sm:px-6">
                {/* Header */}
                <div className="text-center border-b pb-3">
                  <h3 className="text-lg sm:text-xl font-bold">{finalResume.header.name}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">{finalResume.header.title}</p>
                  {finalResume.header.contact && (
                    <p className="text-xs text-muted-foreground mt-1 break-all">{finalResume.header.contact}</p>
                  )}
                </div>

                {/* Summary with health badge */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-sm uppercase tracking-wide">
                      Professional Summary
                    </h4>
                    <SectionHealthBadge status={summaryStatus} />
                  </div>
                  <SummaryEditor
                    summary={finalResume.summary}
                    jobDescription={jobDescription}
                    onSummaryUpdate={handleSummaryUpdate}
                  />
                </div>

                <Separator />

                {/* Experience with health badge */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="font-semibold text-sm uppercase tracking-wide">
                      Experience
                    </h4>
                    <SectionHealthBadge status={experienceStatus} />
                  </div>
                  <div className="space-y-4">
                    {finalResume.experience.map((exp, index) => (
                      <div key={`exp-${index}-${exp.company}`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold">{exp.title}</p>
                            <p className="text-sm text-muted-foreground">{exp.company}</p>
                          </div>
                          <p className="text-sm text-muted-foreground">{exp.dates}</p>
                        </div>
                        <ul className="mt-2 space-y-2">
                          {exp.bullets.map((bullet, bIndex) => (
                            <BulletEditor
                              key={`bullet-${index}-${bIndex}-${bullet.substring(0, 20).replace(/\s/g, '')}`}
                              bullet={bullet}
                              experienceIndex={index}
                              bulletIndex={bIndex}
                              jobDescription={jobDescription}
                              fitAnalysis={fitAnalysis}
                              onBulletUpdate={handleBulletUpdate}
                            />
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Skills with health badge */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-sm uppercase tracking-wide">
                      Skills
                    </h4>
                    <SectionHealthBadge status={skillsStatus} />
                  </div>
                  {finalResume.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2" role="list" aria-label="Skills">
                      {finalResume.skills.map((skill, index) => {
                        const isMatched = matchedKeywords.some(
                          kw => kw.toLowerCase() === skill.toLowerCase()
                        );
                        return (
                          <Badge 
                            key={`skill-${index}-${skill}`} 
                            variant={isMatched ? "default" : "secondary"} 
                            role="listitem"
                            className={isMatched ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800" : ""}
                          >
                            {isMatched && <span className="mr-1">✓</span>}
                            {skill}
                          </Badge>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No skills listed</p>
                  )}
                  <SkillsSuggester
                    currentSkills={finalResume.skills}
                    jobDescription={jobDescription}
                    onSkillAdd={handleSkillAdd}
                  />
                </div>

                {/* Education */}
                {finalResume.education && finalResume.education.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold text-sm uppercase tracking-wide mb-2">
                        Education
                      </h4>
                      <div className="space-y-2">
                        {finalResume.education.map((edu, index) => (
                          <div key={`edu-${index}-${edu.institution}-${edu.degree}`} className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-sm">{edu.degree}</p>
                              <p className="text-sm text-muted-foreground">{edu.institution}</p>
                            </div>
                            {edu.year && (
                              <p className="text-sm text-muted-foreground">{edu.year}</p>
                            )}
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
                      <h4 className="font-semibold text-sm uppercase tracking-wide mb-2">
                        Certifications
                      </h4>
                      <ul className="space-y-1">
                        {finalResume.certifications.map((cert, index) => (
                          <li key={`cert-${index}-${cert}`} className="text-sm flex items-start gap-2">
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
                    <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3">
                      <h4 className="font-semibold text-sm flex items-center gap-2 text-green-800 dark:text-green-200 mb-2">
                        <Sparkles className="h-4 w-4" aria-hidden="true" />
                        Improvements Made ({finalResume.improvements_made.length})
                        <HelpTooltip content={HELP_CONTENT.improvements} />
                      </h4>
                      <StaggerContainer staggerDelay={0.05}>
                        <ul className="space-y-1" role="list">
                          {finalResume.improvements_made.slice(-5).map((improvement, index) => (
                            <StaggerItem key={`improvement-${index}`}>
                              <li className="text-xs text-green-700 dark:text-green-300 flex items-start gap-2">
                                <CheckCircle2 className="h-3 w-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
                                {improvement}
                              </li>
                            </StaggerItem>
                          ))}
                        </ul>
                      </StaggerContainer>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </FadeIn>
        </div>

        {/* Right Panel: Analysis Sidebar (40%) - Hidden on mobile by default */}
        {showAnalysisSidebar && (
          <div className="hidden lg:block lg:w-[40%] lg:max-w-md">
            <div className="sticky top-4">
              <FadeIn delay={0.2}>
                <div className="space-y-4">
                  {/* Toggle button for desktop */}
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAnalysisSidebar(false)}
                      className="text-xs text-muted-foreground"
                    >
                      <PanelLeftClose className="h-3 w-3 mr-1" />
                      Hide Analysis
                    </Button>
                  </div>
                  
                  <ScrollArea className="h-[calc(100vh-12rem)]">
                    <AIEnhancementsSidebar
                      fitAnalysis={fitAnalysis}
                      finalResume={finalResume}
                      resumeText={resumeText}
                      jobDescription={jobDescription}
                      onSkillAdd={handleSkillAdd}
                    />
                  </ScrollArea>
                </div>
              </FadeIn>
            </div>
          </div>
        )}

        {/* Collapsed sidebar toggle */}
        {!showAnalysisSidebar && (
          <div className="hidden lg:block">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAnalysisSidebar(true)}
              className="sticky top-4"
            >
              <PanelLeft className="h-4 w-4 mr-1" />
              Show Analysis
            </Button>
          </div>
        )}
      </div>
      
      {/* Keyboard shortcuts hint (V2 pattern) */}
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
