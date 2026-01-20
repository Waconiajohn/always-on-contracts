// =====================================================
// STEP 4: Generated Resume Display
// =====================================================

import { useRef, useState, useEffect, useCallback } from "react";
import { useResumeBuilderV3Store } from "@/stores/resumeBuilderV3Store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Copy,
  CheckCircle2,
  FileText,
  Printer,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { ScoringReport } from "./ScoringReport";
import { BeforeAfterComparison } from "./BeforeAfterComparison";
import { ExportOptionsV3 } from "./ExportOptionsV3";
import { PrintableResume } from "./PrintableResume";
import { SuccessAnimation, FadeIn, StaggerContainer, StaggerItem } from "./StepTransition";
import { formatResumeAsText } from "./utils/formatters";
import { HelpTooltip, HELP_CONTENT } from "./components/HelpTooltip";
import { VersionHistory, safeParseVersions } from "./components/VersionHistory";
import { BulletEditor } from "./components/BulletEditor";
import { SummaryEditor } from "./components/SummaryEditor";
import { SkillsSuggester } from "./components/SkillsSuggester";
import { MAX_VERSION_HISTORY } from "./constants";
import { logger } from "@/lib/logger";
import type { ResumeVersion, OptimizedResume } from "@/types/resume-builder-v3";
import { EnrichmentPrompt } from "@/components/master-resume/EnrichmentPrompt";
import { useMasterResume } from "@/hooks/useMasterResume";
import { useEnrichment } from "@/hooks/useEnrichment";
import type { EnrichmentSuggestion } from "@/types/master-resume";
import { cn } from "@/lib/utils";

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

export function GenerateStep() {
  const { finalResume, fitAnalysis, standards, jobDescription, setFinalResume } = useResumeBuilderV3Store();
  const printRef = useRef<HTMLDivElement>(null);
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showImprovements, setShowImprovements] = useState(false);
  
  const { masterResume, enrichMasterResume, isEnriching } = useMasterResume();
  const { suggestions, generateSuggestions, formatSuggestionsForEnrichment, clearSuggestions } = useEnrichment();
  const [showEnrichmentPrompt, setShowEnrichmentPrompt] = useState(false);
  const hasShownEnrichmentRef = useRef(false);
  
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
  }, [finalResume, setFinalResume]);

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
  }, [finalResume, setFinalResume]);

  const handleSkillAdd = useCallback((skill: string) => {
    if (!finalResume) return;
    
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
  }, [finalResume, setFinalResume]);
  
  const savedFingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    setVersions(safeGetVersions());
    return () => {
      savedFingerprintRef.current = null;
      hasShownEnrichmentRef.current = false;
    };
  }, []);
  
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
    const resumeText = formatResumeAsText(finalResume);
    
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(resumeText);
        toast.success("Resume copied to clipboard!");
      } catch {
        fallbackCopyToClipboard(resumeText);
      }
    } else {
      fallbackCopyToClipboard(resumeText);
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
    } catch (error) {
      toast.error("Failed to save version");
    } finally {
      setIsSaving(false);
    }
  };

  const matchedKeywords = fitAnalysis?.keywords_found || [];

  return (
    <div className="space-y-8 no-print">
      {/* Hidden printable version */}
      <div className="hidden print:block">
        <PrintableResume ref={printRef} resume={finalResume} />
      </div>

      {/* Success header */}
      <SuccessAnimation>
        <div className="text-center py-6">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-muted mb-4">
            <CheckCircle2 className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">Your Optimized Resume</h2>
          <p className="text-muted-foreground">
            Your resume has been tailored to match the job requirements
          </p>
        </div>
      </SuccessAnimation>

      {/* Before/After Comparison */}
      <FadeIn delay={0.1}>
        <BeforeAfterComparison fitAnalysis={fitAnalysis} finalResume={finalResume} />
      </FadeIn>

      {/* Scoring Report */}
      <FadeIn delay={0.2}>
        <ScoringReport fitAnalysis={fitAnalysis} standards={standards} finalResume={finalResume} />
      </FadeIn>

      {/* Improvements made - Collapsible */}
      <FadeIn delay={0.3}>
        <div className="space-y-3">
          <button
            onClick={() => setShowImprovements(!showImprovements)}
            className="w-full flex items-center justify-between group"
          >
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
              Improvements Made ({finalResume.improvements_made.length})
              <HelpTooltip content={HELP_CONTENT.improvements} />
            </h3>
            <ChevronRight className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              showImprovements && "rotate-90"
            )} />
          </button>

          {showImprovements && (
            finalResume.improvements_made.length > 0 ? (
              <StaggerContainer staggerDelay={0.03}>
                <ul className="space-y-2" role="list" aria-label="List of improvements made to your resume">
                  {finalResume.improvements_made.map((improvement, index) => (
                    <StaggerItem key={`improvement-${index}-${improvement.substring(0, 20).replace(/\s/g, '')}`}>
                      <li className="text-sm text-muted-foreground flex items-start gap-3 py-1">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" aria-hidden="true" />
                        {improvement}
                      </li>
                    </StaggerItem>
                  ))}
                </ul>
              </StaggerContainer>
            ) : (
              <p className="text-sm text-muted-foreground">
                Your resume was already well-optimized. No major improvements were needed.
              </p>
            )
          )}
        </div>
      </FadeIn>

      {/* Resume preview */}
      <FadeIn delay={0.4}>
        <div className="border border-border rounded-lg">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-6 border-b border-border/50">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Resume Preview
            </h3>
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
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-6">
            {/* Header */}
            <div className="text-center border-b border-border/50 pb-4">
              <h3 className="text-xl sm:text-2xl font-bold">{finalResume.header.name}</h3>
              <p className="text-base sm:text-lg text-muted-foreground">{finalResume.header.title}</p>
              {finalResume.header.contact && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-all">{finalResume.header.contact}</p>
              )}
            </div>

            {/* Summary */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Professional Summary
              </h4>
              <SummaryEditor
                summary={finalResume.summary}
                jobDescription={jobDescription}
                onSummaryUpdate={handleSummaryUpdate}
              />
            </div>

            <Separator />

            {/* Experience */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Experience
              </h4>
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
                          onBulletUpdate={handleBulletUpdate}
                        />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Skills */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Skills
              </h4>
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
                        className={isMatched ? "bg-primary/10 text-primary border-primary/20" : ""}
                      >
                        {isMatched && <CheckCircle2 className="h-3 w-3 mr-1" />}
                        {skill}
                      </Badge>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No skills listed</p>
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
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
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
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
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
          </div>
        </div>
      </FadeIn>
      
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
