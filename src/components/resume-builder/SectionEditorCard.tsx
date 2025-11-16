import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
}

export const SectionEditorCard = ({
  section,
  onUpdateSection,
  onReanalyzeAts,
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
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm">{section.title}</CardTitle>
            {coverage && (
              <Badge variant="outline" className="text-xs">
                {Math.round(coverage.coverageScore)}% ATS match
              </Badge>
            )}
            {missingMustHaveCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {missingMustHaveCount} gaps
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
