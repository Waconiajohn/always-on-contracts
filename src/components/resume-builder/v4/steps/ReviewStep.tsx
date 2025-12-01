/**
 * ReviewStep - Step 5
 * 
 * The "wow" moment - clean résumé preview with score improvement.
 * Features:
 * - Full résumé preview (NO AI markers)
 * - Before/after score comparison
 * - Gap resolution summary
 * - Export options (DOCX, PDF, Copy)
 * - Re-score functionality with error handling
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { FinalResume } from "../config/resumeExport";
import { renderResumeToHTML, copyResumeToClipboard } from "../config/resumeExport";
import { validateForExport } from "../config/resumeBuilderRules";
import { REVIEW_EMPTY_STATES } from "../config/emptyStates";
import { SECTION_LABELS, BUTTON_LABELS, DISCLAIMERS, ERROR_MESSAGES, SUCCESS_MESSAGES } from "../config/uiCopy";
import { 
  ArrowLeft, 
  Download,
  FileText,
  Copy,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Target,
  Loader2
} from "lucide-react";

interface ReviewStepProps {
  finalResume: FinalResume;
  initialScore: number;
  currentScore: number;
  gapStatus: {
    criticalTotal: number;
    criticalResolved: number;
    importantTotal: number;
    importantResolved: number;
  };
  onRescore: () => Promise<number>;
  onExportDOCX: () => Promise<void>;
  onExportPDF: () => Promise<void>;
  onBack: () => void;
  onEditSection: (section: 'highlights' | 'experience' | 'skills') => void;
}

export const ReviewStep = ({
  finalResume,
  initialScore,
  currentScore,
  gapStatus,
  onRescore,
  onExportDOCX,
  onExportPDF,
  onBack,
  onEditSection,
}: ReviewStepProps) => {
  const [isRescoring, setIsRescoring] = useState(false);
  const [rescoreError, setRescoreError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<'docx' | 'pdf' | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [displayScore, setDisplayScore] = useState(currentScore);

  // Score improvement
  const scoreImprovement = displayScore - initialScore;
  const scoreColor = scoreImprovement > 0 ? "text-green-600" : scoreImprovement < 0 ? "text-red-600" : "text-gray-600";

  // Validation
  const validation = validateForExport(displayScore, gapStatus.criticalTotal - gapStatus.criticalResolved);

  // Check for empty resume
  const totalBullets = finalResume.highlights.length + 
    finalResume.experience.reduce((sum, role) => sum + role.bullets.length, 0);
  
  if (totalBullets === 0) {
    const emptyState = REVIEW_EMPTY_STATES.emptyResume;
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Badge variant="outline">Step 5 of 5</Badge>
            <span>{SECTION_LABELS.review.title}</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">{SECTION_LABELS.review.title}</h1>
        </div>

        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{emptyState.title}</h3>
            <p className="text-muted-foreground mb-4">{emptyState.message}</p>
            <Button onClick={() => onEditSection('highlights')}>
              {emptyState.action?.label || "Go to Highlights"}
            </Button>
          </CardContent>
        </Card>

        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Skills
        </Button>
      </div>
    );
  }

  // Handle rescore
  const handleRescore = async () => {
    setIsRescoring(true);
    setRescoreError(null);
    try {
      const newScore = await onRescore();
      setDisplayScore(newScore);
    } catch (error) {
      setRescoreError(ERROR_MESSAGES.rescoreFailed);
    } finally {
      setIsRescoring(false);
    }
  };

  // Handle copy to clipboard
  const handleCopy = async () => {
    const success = await copyResumeToClipboard(finalResume);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  // Handle exports
  const handleExportDOCX = async () => {
    setIsExporting('docx');
    try {
      await onExportDOCX();
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting('pdf');
    try {
      await onExportPDF();
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Badge variant="outline">Step 5 of 5</Badge>
          <span>{SECTION_LABELS.review.title}</span>
        </div>
        <h1 className="text-2xl font-bold mb-2">{SECTION_LABELS.review.title}</h1>
        <p className="text-muted-foreground">
          {DISCLAIMERS.export}
        </p>
      </div>

      {/* Main layout: Preview + Side panel */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Resume Preview (2/3 width) */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader className="bg-gray-50 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Résumé Preview</CardTitle>
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Ready to Export
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Render clean HTML preview */}
              <div 
                className="prose prose-sm max-w-none p-6 bg-white"
                dangerouslySetInnerHTML={{ __html: renderResumeToHTML(finalResume) }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right: Score & Actions (1/3 width) */}
        <div className="space-y-4">
          {/* Score Card */}
          <Card className={cn(
            "border-2",
            scoreImprovement > 10 ? "border-green-300 bg-green-50/50" : "border-gray-200"
          )}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4" />
                Alignment Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-400 line-through">{initialScore}</p>
                  <p className="text-xs text-muted-foreground">Before</p>
                </div>
                <TrendingUp className={cn("h-6 w-6", scoreColor)} />
                <div className="text-center">
                  <p className={cn("text-4xl font-bold", scoreColor)}>{displayScore}</p>
                  <p className="text-xs text-muted-foreground">After</p>
                </div>
              </div>
              
              {scoreImprovement > 0 && (
                <div className="text-center p-2 bg-green-100 rounded-lg">
                  <p className="text-lg font-semibold text-green-700">
                    +{scoreImprovement} points
                  </p>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3 gap-2"
                onClick={handleRescore}
                disabled={isRescoring}
              >
                {isRescoring ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {BUTTON_LABELS.rescore}
              </Button>

              {rescoreError && (
                <p className="text-xs text-red-600 mt-2">{rescoreError}</p>
              )}
            </CardContent>
          </Card>

          {/* Gaps Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Gaps Resolved</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Critical</span>
                <Badge 
                  variant={gapStatus.criticalResolved === gapStatus.criticalTotal ? "default" : "destructive"}
                  className="gap-1"
                >
                  {gapStatus.criticalResolved}/{gapStatus.criticalTotal}
                  {gapStatus.criticalResolved === gapStatus.criticalTotal && (
                    <CheckCircle2 className="h-3 w-3" />
                  )}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Important</span>
                <Badge 
                  variant={gapStatus.importantResolved === gapStatus.importantTotal ? "secondary" : "outline"}
                >
                  {gapStatus.importantResolved}/{gapStatus.importantTotal}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Content Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Content Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Highlights</span>
                <span className="font-medium">{finalResume.highlights.length} bullets</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Experience</span>
                <span className="font-medium">
                  {finalResume.experience.length} roles, {finalResume.experience.reduce((s, r) => s + r.bullets.length, 0)} bullets
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Skills</span>
                <span className="font-medium">{finalResume.skills.length} skills</span>
              </div>
            </CardContent>
          </Card>

          {/* Validation Warning */}
          {validation.type === 'warning' && validation.message && (
            <Alert className="border-amber-300 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 text-sm">
                {validation.message.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Export Actions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Export</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                className="w-full gap-2" 
                onClick={handleExportDOCX}
                disabled={isExporting !== null}
              >
                {isExporting === 'docx' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                {BUTTON_LABELS.downloadDocx}
              </Button>
              <Button 
                variant="outline" 
                className="w-full gap-2"
                onClick={handleExportPDF}
                disabled={isExporting !== null}
              >
                {isExporting === 'pdf' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {BUTTON_LABELS.downloadPdf}
              </Button>
              <Button 
                variant="ghost" 
                className="w-full gap-2"
                onClick={handleCopy}
              >
                {copySuccess ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copySuccess ? SUCCESS_MESSAGES.copied : BUTTON_LABELS.copyToClipboard}
              </Button>
            </CardContent>
          </Card>

          {/* Edit Sections */}
          <Card className="bg-muted/30">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground mb-2">Need to make changes?</p>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onEditSection('highlights')}
                >
                  Edit Highlights
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onEditSection('experience')}
                >
                  Edit Experience
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onEditSection('skills')}
                >
                  Edit Skills
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Navigation */}
      <Separator />
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Skills
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCopy} className="gap-2">
            <Copy className="h-4 w-4" />
            {copySuccess ? "Copied!" : "Copy Text"}
          </Button>
          <Button onClick={handleExportDOCX} disabled={isExporting !== null} className="gap-2">
            {isExporting === 'docx' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download Word
          </Button>
        </div>
      </div>

      {/* Final celebration message */}
      {scoreImprovement > 15 && gapStatus.criticalResolved === gapStatus.criticalTotal && (
        <Card className="border-green-300 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-green-700 mb-1">
              Outstanding Improvement!
            </h3>
            <p className="text-sm text-green-600">
              Your résumé score improved by {scoreImprovement} points with all critical gaps resolved.
              You're ready to apply!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
