// =====================================================
// BEFORE/AFTER COMPARISON - Shows value of optimization
// =====================================================

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  CheckCircle2,
  Plus,
  Sparkles,
} from "lucide-react";
import { FitAnalysisResult, OptimizedResume } from "@/stores/resumeBuilderV3Store";
import { MAX_KEYWORDS_DISPLAY } from "./constants";

interface BeforeAfterComparisonProps {
  fitAnalysis: FitAnalysisResult | null;
  finalResume: OptimizedResume | null;
}

export function BeforeAfterComparison({ fitAnalysis, finalResume }: BeforeAfterComparisonProps) {
  if (!fitAnalysis || !finalResume) return null;

  const keywordsBefore = fitAnalysis.keywords_found.length;
  const keywordsMissing = fitAnalysis.keywords_missing.length;

  const gapsBefore = fitAnalysis.gaps.length;
  const gapsAddressed = finalResume.improvements_made.length;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Optimization Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6" role="group" aria-label="Resume optimization comparison">
          {/* Before Column */}
          <div className="space-y-4" role="region" aria-label="Original resume metrics">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" aria-hidden="true" />
              Original Resume
            </h4>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span>Fit Score</span>
                <Badge variant="outline" className="font-mono" aria-label={`Original fit score: ${fitAnalysis.fit_score}%`}>
                  {fitAnalysis.fit_score}%
                </Badge>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span>Keywords Found</span>
                <Badge variant="outline" className="font-mono" aria-label={`${keywordsBefore} keywords found in original`}>
                  {keywordsBefore}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span>Gaps Identified</span>
                <Badge variant="outline" className="font-mono text-amber-600" aria-label={`${gapsBefore} gaps identified`}>
                  {gapsBefore}
                </Badge>
              </div>
            </div>
          </div>

          {/* After Column */}
          <div className="space-y-4" role="region" aria-label="Optimized resume metrics">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" aria-hidden="true" />
              Optimized Resume
            </h4>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span>ATS Score</span>
                <Badge 
                  className="font-mono bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                  aria-label={`Optimized ATS score: ${finalResume.ats_score}%${finalResume.ats_score > fitAnalysis.fit_score ? ', improved from original' : ''}`}
                >
                  {finalResume.ats_score}%
                  {finalResume.ats_score > fitAnalysis.fit_score && (
                    <ArrowRight className="h-3 w-3 ml-1 inline" aria-hidden="true" />
                  )}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span>Keywords Targeted</span>
                <Badge 
                  className="font-mono bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                  aria-label={`${keywordsMissing} keywords targeted for inclusion`}
                >
                  <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                  {keywordsMissing}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span>Improvements Made</span>
                <Badge 
                  className="font-mono bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                  aria-label={`${gapsAddressed} improvements made`}
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" aria-hidden="true" />
                  {gapsAddressed}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Keywords Added List */}
        {fitAnalysis.keywords_missing.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2">Keywords Targeted for Inclusion</p>
            <div className="flex flex-wrap gap-1">
              {fitAnalysis.keywords_missing.slice(0, MAX_KEYWORDS_DISPLAY).map((keyword) => (
                <Badge key={`keyword-${keyword}`} variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                  + {keyword}
                </Badge>
              ))}
              {fitAnalysis.keywords_missing.length > MAX_KEYWORDS_DISPLAY && (
                <Badge variant="secondary" className="text-xs">
                  +{fitAnalysis.keywords_missing.length - MAX_KEYWORDS_DISPLAY} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
