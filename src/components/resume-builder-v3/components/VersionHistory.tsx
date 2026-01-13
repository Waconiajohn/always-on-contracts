// =====================================================
// VERSION HISTORY - Compare resume versions
// =====================================================

import { useState, useMemo, useCallback } from "react";
import { OptimizedResume } from "@/stores/resumeBuilderV3Store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { History, ArrowLeftRight, Check, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
// Import shared type and constants - no local duplication
import type { ResumeVersion } from "@/types/resume-builder-v3";
import { MAX_SKILLS_DISPLAY } from "../constants";

// Validation function for version data
const isValidVersion = (v: unknown): v is ResumeVersion => {
  if (!v || typeof v !== 'object') return false;
  const version = v as Record<string, unknown>;
  
  return (
    typeof version.id === 'string' &&
    typeof version.label === 'string' &&
    version.resume !== null &&
    typeof version.resume === 'object' &&
    typeof (version.resume as Record<string, unknown>).ats_score === 'number' &&
    Array.isArray((version.resume as Record<string, unknown>).skills) &&
    Array.isArray((version.resume as Record<string, unknown>).experience)
  );
};

// Safe version parsing with validation - exported for use in GenerateStep
export const safeParseVersions = (saved: string | null): ResumeVersion[] => {
  if (!saved) return [];
  
  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    
    return parsed
      .filter(isValidVersion)
      .map((v) => ({
        ...v,
        // Handle Date objects that may already be Date or string
        createdAt: v.createdAt instanceof Date 
          ? v.createdAt 
          : new Date(v.createdAt),
      }))
      // Filter out versions with invalid dates
      .filter(v => !isNaN(v.createdAt.getTime()));
  } catch (error) {
    logger.error("Failed to parse version history", error);
    return [];
  }
};

interface VersionHistoryProps {
  versions: ResumeVersion[];
  currentVersion: OptimizedResume | null;
}

export function VersionHistory({ versions, currentVersion }: VersionHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);

  if (versions.length === 0 && !currentVersion) {
    return null;
  }

  const allVersions: ResumeVersion[] = currentVersion
    ? [
        {
          id: "current",
          resume: currentVersion,
          createdAt: new Date(),
          label: "Current",
        },
        ...versions,
      ]
    : versions;

  const toggleVersionSelection = (id: string) => {
    if (selectedVersions.includes(id)) {
      setSelectedVersions(selectedVersions.filter((v) => v !== id));
    } else if (selectedVersions.length < 2) {
      setSelectedVersions([...selectedVersions, id]);
    }
  };

  const getSelectedVersions = () => {
    return allVersions.filter((v) => selectedVersions.includes(v.id));
  };

  const getDifferences = (v1: OptimizedResume, v2: OptimizedResume) => {
    const differences: Array<{
      field: string;
      before: string | number;
      after: string | number;
      improved: boolean;
    }> = [];

    // Compare ATS scores
    if (v1.ats_score !== v2.ats_score) {
      differences.push({
        field: "ATS Score",
        before: `${v1.ats_score}%`,
        after: `${v2.ats_score}%`,
        improved: v2.ats_score > v1.ats_score,
      });
    }

    // Compare skills count
    if (v1.skills.length !== v2.skills.length) {
      differences.push({
        field: "Skills Count",
        before: v1.skills.length,
        after: v2.skills.length,
        improved: v2.skills.length > v1.skills.length,
      });
    }

    // Compare improvements count
    if (v1.improvements_made.length !== v2.improvements_made.length) {
      differences.push({
        field: "Improvements",
        before: v1.improvements_made.length,
        after: v2.improvements_made.length,
        improved: v2.improvements_made.length > v1.improvements_made.length,
      });
    }

    // Compare summary content (not just length)
    if (v1.summary !== v2.summary) {
      const lengthDiff = Math.abs(v2.summary.length - v1.summary.length);
      differences.push({
        field: "Summary",
        before: lengthDiff > 20 ? `${v1.summary.length} chars` : "Modified",
        after: lengthDiff > 20 ? `${v2.summary.length} chars` : "Updated",
        improved: true, // Content changed - mark as improved (neutral)
      });
    }

    return differences;
  };

  // Memoize formatDate to prevent recreation on every render
  const formatDate = useCallback((date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <History className="h-4 w-4" />
          <span className="hidden sm:inline">History</span>
          {versions.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {versions.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History
          </DialogTitle>
          <DialogDescription>
            {compareMode
              ? "Select two versions to compare differences"
              : "View and compare different versions of your resume"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between mb-4">
          <Button
            variant={compareMode ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setCompareMode(!compareMode);
              setSelectedVersions([]);
            }}
            className="gap-2"
          >
            <ArrowLeftRight className="h-4 w-4" />
            {compareMode ? "Exit Compare" : "Compare Versions"}
          </Button>

          {compareMode && selectedVersions.length === 2 && (
            <Badge variant="secondary">
              Comparing {selectedVersions.length} versions
            </Badge>
          )}
        </div>

        <ScrollArea className="h-[400px] pr-4">
          {compareMode && selectedVersions.length === 2 ? (
            <CompareView
              versions={getSelectedVersions()}
              getDifferences={getDifferences}
            />
          ) : (
            <div className="space-y-3">
              {allVersions.map((version) => (
                <VersionCard
                  key={version.id}
                  version={version}
                  isSelected={selectedVersions.includes(version.id)}
                  compareMode={compareMode}
                  onSelect={() => toggleVersionSelection(version.id)}
                  formatDate={formatDate}
                />
              ))}

              {allVersions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>No version history yet</p>
                  <p className="text-sm">
                    Generate a resume to start tracking versions
                  </p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

interface VersionCardProps {
  version: ResumeVersion;
  isSelected: boolean;
  compareMode: boolean;
  onSelect: () => void;
  formatDate: (date: Date) => string;
}

function VersionCard({
  version,
  isSelected,
  compareMode,
  onSelect,
  formatDate,
}: VersionCardProps) {
  return (
    <div
      className={cn(
        "p-4 rounded-lg border transition-all",
        compareMode && "cursor-pointer hover:border-primary/50",
        isSelected && "border-primary bg-primary/5"
      )}
      onClick={compareMode ? onSelect : undefined}
      role={compareMode ? "button" : undefined}
      tabIndex={compareMode ? 0 : undefined}
      onKeyDown={
        compareMode
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect();
              }
            }
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium">{version.label}</span>
            {version.id === "current" && (
              <Badge variant="default" className="text-xs">
                Current
              </Badge>
            )}
            {compareMode && isSelected && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {formatDate(version.createdAt)}
          </p>
        </div>

        <div className="text-right">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                "font-mono",
                version.resume.ats_score >= 80
                  ? "text-green-600"
                  : version.resume.ats_score >= 60
                  ? "text-amber-600"
                  : "text-red-600"
              )}
            >
              {version.resume.ats_score}% ATS
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {version.resume.skills.length} skills •{" "}
            {version.resume.improvements_made.length} improvements
          </p>
        </div>
      </div>
    </div>
  );
}

interface CompareViewProps {
  versions: ResumeVersion[];
  getDifferences: (
    v1: OptimizedResume,
    v2: OptimizedResume
  ) => Array<{
    field: string;
    before: string | number;
    after: string | number;
    improved: boolean;
  }>;
}

function CompareView({ versions, getDifferences }: CompareViewProps) {
  if (versions.length !== 2) return null;

  const [v1, v2] = versions;
  const differences = getDifferences(v1.resume, v2.resume);

  return (
    <div className="space-y-4">
      {/* Version Labels */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-muted rounded-lg text-center">
          <p className="font-medium">{v1.label}</p>
          <p className="text-xs text-muted-foreground">Version A</p>
        </div>
        <div className="p-3 bg-muted rounded-lg text-center">
          <p className="font-medium">{v2.label}</p>
          <p className="text-xs text-muted-foreground">Version B</p>
        </div>
      </div>

      <Separator />

      {/* Differences */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm">Differences Found</h4>

        {differences.length > 0 ? (
          differences.map((diff) => (
            <div
              key={`diff-${diff.field}`}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
            >
              <span className="text-sm font-medium">{diff.field}</span>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="font-mono">
                  {diff.before}
                </Badge>
                <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                <Badge
                  variant="outline"
                  className={cn(
                    "font-mono",
                    diff.improved ? "text-green-600" : "text-muted-foreground"
                  )}
                >
                  {diff.after}
                </Badge>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No significant differences found between these versions
          </p>
        )}
      </div>

      <Separator />

      {/* Skills Comparison */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm">Skills Comparison</h4>
        <div className="grid grid-cols-2 gap-4">
          <SkillsList
            title={v1.label}
            skills={v1.resume.skills}
            otherSkills={v2.resume.skills}
          />
          <SkillsList
            title={v2.label}
            skills={v2.resume.skills}
            otherSkills={v1.resume.skills}
          />
        </div>
      </div>
    </div>
  );
}

interface SkillsListProps {
  title: string;
  skills: string[];
  otherSkills: string[];
}

function SkillsList({ title, skills, otherSkills }: SkillsListProps) {
  // Use Set for O(1) lookup instead of O(n) includes check
  const otherSkillsSet = useMemo(() => new Set(otherSkills), [otherSkills]);
  
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <div className="flex flex-wrap gap-1">
        {skills.slice(0, MAX_SKILLS_DISPLAY).map((skill) => {
          const isNew = !otherSkillsSet.has(skill);
          return (
            <Badge
              key={skill}
              variant="secondary"
              className={cn("text-xs", isNew && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300")}
            >
              {isNew && <span className="mr-1">+</span>}
              {skill}
            </Badge>
          );
        })}
        {skills.length > MAX_SKILLS_DISPLAY && (
          <Badge variant="secondary" className="text-xs">
            +{skills.length - MAX_SKILLS_DISPLAY} more
          </Badge>
        )}
      </div>
    </div>
  );
}
