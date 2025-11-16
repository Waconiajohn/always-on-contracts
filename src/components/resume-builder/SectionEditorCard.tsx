import { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useResumeBuilderStore } from "@/stores/resumeBuilderStore";
import { ContentBlender } from "./ContentBlender";
import type { BlendedSectionOption } from "@/lib/edgeFunction/schemas";
import type { ResumeSection } from "@/stores/resumeBuilderStore";
import type { SectionCoverage, AtsKeyword } from "@/lib/atsTypes";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SectionEditorCardProps {
  section: ResumeSection;
  onUpdateSection: (sectionId: string, content: any[]) => void;
  onReanalyzeAts?: (
    sectionId: string,
    sectionTitle: string,
    previousCoverage: number | null
  ) => Promise<void>;
  isFocused?: boolean;
  onFocusHandled?: () => void;
}

export const SectionEditorCard = ({
  section,
  onUpdateSection,
  onReanalyzeAts,
  isFocused,
  onFocusHandled,
}: SectionEditorCardProps) => {
  const { toast } = useToast();
  const { atsScoreData, jobAnalysis } = useResumeBuilderStore();

  const [showBlender, setShowBlender] = useState(false);
  const [blendOptions, setBlendOptions] = useState<BlendedSectionOption[]>([]);
  const [isRefining, setIsRefining] = useState(false);

  const coverage = atsScoreData?.perSection?.find(
    (sec: SectionCoverage) => sec.sectionId === section.id || sec.sectionHeading === section.title
  );

  const missingMustHaveCount = coverage?.missingKeywords?.filter(
    (k: AtsKeyword) => k.priority === "must_have"
  ).length || 0;

  const missingNiceToHave = coverage?.missingKeywords
    ?.filter((k: AtsKeyword) => k.priority === "nice_to_have")
    .slice(0, 4) || [];

  // Derive confidence band & label
  const coverageScore = coverage?.coverageScore ?? null;
  let coverageBand: "low" | "medium" | "high" | null = null;

  if (typeof coverageScore === "number") {
    if (coverageScore < 60) coverageBand = "low";
    else if (coverageScore < 80) coverageBand = "medium";
    else coverageBand = "high";
  }

  const coverageLabel =
    coverageScore != null ? `${Math.round(coverageScore)}% ATS match` : "No ATS data";

  // Auto-scroll when focused
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isFocused && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      if (onFocusHandled) {
        onFocusHandled();
      }
    }
  }, [isFocused, onFocusHandled]);

  const handleFixAtsGaps = async () => {
    if (!atsScoreData || !atsScoreData.perSection?.length) {
      toast({
        title: "ATS analysis required",
        description:
          "Run ATS analysis first to identify missing must-have keywords.",
        variant: "destructive",
      });
      return;
    }

    const coverage = atsScoreData.perSection.find(
      (sec: SectionCoverage) => sec.sectionId === section.id || sec.sectionHeading === section.title
    );

    if (!coverage) {
      toast({
        title: "No ATS data for this section",
        description:
          "This section wasn't part of the ATS coverage breakdown.",
        variant: "destructive",
      });
      return;
    }

    const missingMustHave = (coverage.missingKeywords || [])
      .filter((k: AtsKeyword) => k.priority === "must_have")
      .map((k: AtsKeyword) => k.phrase);

    if (!missingMustHave.length) {
      toast({
        title: "No ATS gaps detected",
        description:
          "This section already covers all must-have keywords from the job.",
      });
      return;
    }

    const currentBullets = (section.content || []).map((item: any) =>
      typeof item === "string" ? item : item.content || ""
    );

    try {
      setIsRefining(true);

      const { data, error } = await supabase.functions.invoke(
        "refine-section-ats",
        {
          body: {
            jobTitle: jobAnalysis?.roleProfile?.title || "",
            jobDescription:
              jobAnalysis?.originalJobDescription ||
              jobAnalysis?.jobText ||
              "",
            industry: jobAnalysis?.roleProfile?.industry || "",
            sectionTitle: section.title || section.type || "Section",
            sectionType: section.type || "other",
            currentBullets,
            missingMustHaveKeywords: missingMustHave,
          },
        }
      );

      if (error) {
        console.error("refine-section-ats error:", error);
        throw error;
      }

      if (!data || !Array.isArray(data.bullets)) {
        throw new Error("Invalid ATS refinement result");
      }

      const atsOption: BlendedSectionOption = {
        source: "ats_optimized",
        label: data.label || "ATS-optimized version",
        bullets: data.bullets,
        rationale: data.rationale,
      };

      const baseOptions: BlendedSectionOption[] = [
        {
          source: "benchmark",
          label: "Current version",
          bullets: currentBullets,
          rationale: "Your current section content as baseline.",
        },
        atsOption,
      ];

      setBlendOptions(baseOptions);
      setShowBlender(true);
    } catch (err) {
      console.error("Fix ATS gaps failed:", err);
      toast({
        title: "Failed to fix ATS gaps",
        description: "There was a problem generating an ATS-optimized version.",
        variant: "destructive",
      });
    } finally {
      setIsRefining(false);
    }
  };

  const handleApplyBlended = (selected: BlendedSectionOption) => {
    const newContent = selected.bullets.map((b, idx) => ({
      id: `${section.id}-${selected.source}-${idx}`,
      content: b,
      source: selected.source,
    }));

    const previousCoverage = coverage?.coverageScore ?? null;

    onUpdateSection(section.id, newContent);
    setShowBlender(false);

    toast({
      title: "Content applied",
      description:
        selected.source === "ats_optimized"
          ? "This section now uses an ATS-optimized version for this job."
          : "Section content updated.",
    });

    // Automatically re-run ATS and show coverage delta
    if (selected.source === "ats_optimized" && onReanalyzeAts) {
      void onReanalyzeAts(
        section.id,
        section.title || section.type || "Section",
        previousCoverage
      );
    }
  };

  return (
    <Card ref={cardRef} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm">{section.title}</CardTitle>
            {coverageScore != null && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className={
                        coverageBand === "high"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : coverageBand === "medium"
                          ? "bg-amber-100 text-amber-800 border-amber-300"
                          : "bg-red-100 text-red-800 border-red-300"
                      }
                    >
                      {coverageLabel}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="max-w-xs text-xs">
                      Estimated keyword match for this section vs. the job's must-have and
                      nice-to-have requirements.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {missingMustHaveCount > 0 && (
              <Badge variant="outline" className="border-red-300 text-red-700">
                {missingMustHaveCount} must-have gap{missingMustHaveCount > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          {coverage && missingMustHaveCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleFixAtsGaps}
              disabled={isRefining}
            >
              {isRefining ? "Optimizing..." : "Fix my ATS gaps"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          {(section.content || []).map((item: any, idx: number) => (
            <li key={idx}>
              {typeof item === "string" ? item : item.content || ""}
            </li>
          ))}
        </ul>

        {(missingMustHaveCount > 0 || missingNiceToHave.length > 0) && (
          <div className="mt-3 text-xs text-muted-foreground space-y-1">
            {missingMustHaveCount > 0 && (
              <div>
                <span className="font-medium">High-priority gaps:</span>{" "}
                <span>
                  This section is still missing some must-have language for this job.
                  Use "Fix my ATS gaps" to auto-rewrite with those terms.
                </span>
              </div>
            )}

            {missingNiceToHave.length > 0 && (
              <div>
                <span className="font-medium">Suggestions to strengthen this section:</span>{" "}
                <span>
                  Consider weaving in:{" "}
                  {missingNiceToHave.map((k: AtsKeyword, idx: number) => (
                    <span key={k.phrase}>
                      <span className="underline decoration-dotted">
                        {k.phrase}
                      </span>
                      {idx < missingNiceToHave.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </span>
              </div>
            )}
          </div>
        )}

        {showBlender && (
          <div className="mt-4">
            <ContentBlender
              sectionTitle={section.title || "Section"}
              options={blendOptions}
              onSelectOption={handleApplyBlended}
              onCancel={() => setShowBlender(false)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
