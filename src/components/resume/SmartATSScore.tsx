import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  XCircle, 
  Download,
  Loader2,
  AlertCircle,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { invokeEdgeFunction } from '@/lib/edgeFunction';
import { cn } from '@/lib/utils';

// =============================================================================
// SMART ATS SCORE COMPONENT
// Unified from ATSScoreCard.tsx + ATSScoreReportPanel.tsx
// =============================================================================

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface ATSScoreData {
  overallScore: number;
  keywordMatch: number;
  formatScore: number;
  experienceMatch: number;
  skillsMatch: number;
  recommendations: string[];
  strengths: string[];
  warnings: string[];
}

interface SmartATSScoreProps {
  viewMode: 'card' | 'panel' | 'expanded';
  
  // Static mode (card/expanded) - pre-calculated data
  scoreData?: ATSScoreData;
  
  // Dynamic mode (panel) - fetch from edge function
  resumeContent?: string;
  canonicalSections?: any[];
  canonicalHeader?: any;
  jobDescription?: string;
  jobTitle?: string;
  industry?: string;
  
  // Navigation (panel mode only)
  onExport?: () => void;
  onBack?: () => void;
  
  isLoading?: boolean;
}

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600 dark:text-green-400';
  if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
};

const getScoreBgColor = (score: number) => {
  if (score >= 80) return 'bg-green-100 dark:bg-green-900/20';
  if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/20';
  return 'bg-red-100 dark:bg-red-900/20';
};

const getScoreBadge = (score: number) => {
  if (score >= 80) return { label: 'Excellent', variant: 'default' as const };
  if (score >= 60) return { label: 'Good', variant: 'secondary' as const };
  return { label: 'Needs Work', variant: 'destructive' as const };
};

// -----------------------------------------------------------------------------
// Loading State Component
// -----------------------------------------------------------------------------

function LoadingState({ mode }: { mode: 'card' | 'panel' | 'expanded' }) {
  if (mode === 'panel') {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h3 className="text-xl font-semibold">Analyzing ATS Compatibility...</h3>
        <p className="text-muted-foreground">
          Checking keyword coverage and industry standards
        </p>
      </div>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          ATS Compatibility Analysis
        </CardTitle>
        <CardDescription>Analyzing resume against job requirements...</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
        </div>
      </CardContent>
    </Card>
  );
}

// -----------------------------------------------------------------------------
// Card View Component (static data display)
// -----------------------------------------------------------------------------

function CardView({ scoreData }: { scoreData: ATSScoreData }) {
  const badge = getScoreBadge(scoreData.overallScore);

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            ATS Compatibility Score
          </CardTitle>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>
        <CardDescription>How well your resume matches the job posting</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Match</span>
            <span className={`text-2xl font-bold ${getScoreColor(scoreData.overallScore)}`}>
              {scoreData.overallScore}%
            </span>
          </div>
          <Progress value={scoreData.overallScore} className="h-3" />
        </div>

        {/* Individual Scores */}
        <div className="grid gap-4">
          <ScoreRow label="Keyword Match" score={scoreData.keywordMatch} />
          <ScoreRow label="Format Quality" score={scoreData.formatScore} />
          <ScoreRow label="Experience Match" score={scoreData.experienceMatch} />
          <ScoreRow label="Skills Match" score={scoreData.skillsMatch} />
        </div>

        {/* Strengths */}
        {scoreData.strengths.length > 0 && (
          <FeedbackSection
            title="Strengths"
            items={scoreData.strengths}
            icon={<CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />}
            itemColor="text-green-600 dark:text-green-400"
          />
        )}

        {/* Warnings */}
        {scoreData.warnings.length > 0 && (
          <FeedbackSection
            title="Warnings"
            items={scoreData.warnings}
            icon={<AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />}
            itemColor="text-yellow-600 dark:text-yellow-400"
          />
        )}

        {/* Recommendations */}
        {scoreData.recommendations.length > 0 && (
          <FeedbackSection
            title="Recommendations"
            items={scoreData.recommendations}
            icon={<AlertCircle className="h-4 w-4 text-primary" />}
            itemColor="text-primary"
          />
        )}
      </CardContent>
    </Card>
  );
}

// -----------------------------------------------------------------------------
// Panel View Component (dynamic data with navigation)
// -----------------------------------------------------------------------------

function PanelView({ 
  atsData, 
  onExport, 
  onBack,
  onRetry 
}: { 
  atsData: any; 
  onExport?: () => void; 
  onBack?: () => void;
  onRetry: () => void;
}) {
  if (!atsData) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-orange-500 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Analysis Failed</h3>
        <p className="text-muted-foreground mb-4">
          Unable to complete ATS analysis
        </p>
        <Button onClick={onRetry}>Retry Analysis</Button>
      </div>
    );
  }

  const summary = atsData.summary || {};
  const overallScore = summary.overallScore || 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">ATS Score Report</h2>
        <p className="text-muted-foreground">
          Your resume's compatibility with Applicant Tracking Systems
        </p>
      </div>

      {/* Overall Score Dial */}
      <Card className={cn('border-2', getScoreBgColor(overallScore))}>
        <CardHeader className="text-center pb-2">
          <CardTitle>Overall ATS Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center">
            <div className={cn('text-6xl font-bold mb-4', getScoreColor(overallScore))}>
              {Math.round(overallScore)}
              <span className="text-3xl">/100</span>
            </div>
            <Progress value={overallScore} className="w-full max-w-md h-4 mb-4" />
            <p className="text-center text-muted-foreground">
              {overallScore >= 80 && 'Excellent! Your resume should pass most ATS systems.'}
              {overallScore >= 60 && overallScore < 80 && "Good, but there's room for improvement."}
              {overallScore < 60 && 'Needs work. Your resume may be filtered out by ATS.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Score Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ScoreCard title="Must-Have Keywords" score={summary.mustHaveCoverage || 0} />
        <ScoreCard title="Nice-to-Have Keywords" score={summary.niceToHaveCoverage || 0} />
        <ScoreCard title="Industry Standards" score={summary.industryCoverage || 0} />
      </div>

      {/* Matched Keywords */}
      {atsData.allMatchedKeywords?.length > 0 && (
        <KeywordBadges
          title="Found Keywords"
          keywords={atsData.allMatchedKeywords}
          icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
          variant="matched"
        />
      )}

      {/* Missing Keywords */}
      {atsData.allMissingKeywords?.length > 0 && (
        <KeywordBadges
          title="Missing Keywords"
          keywords={atsData.allMissingKeywords}
          icon={<XCircle className="h-5 w-5 text-orange-600" />}
          variant="missing"
          description="Consider adding these keywords naturally to your resume"
        />
      )}

      {/* Per-Section Breakdown */}
      {atsData.perSection?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Section-by-Section Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {atsData.perSection.map((section: any, idx: number) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{section.sectionHeading}</span>
                  <Badge variant={section.coverageScore >= 70 ? 'default' : 'secondary'}>
                    {Math.round(section.coverageScore)}%
                  </Badge>
                </div>
                <Progress value={section.coverageScore} />
                {section.missingKeywords?.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Missing: {section.missingKeywords.slice(0, 5).map((kw: any) => kw.phrase).join(', ')}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Narrative Summary */}
      {atsData.narrative && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{atsData.narrative}</p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Go Back & Optimize
          </Button>
        )}
        {onExport && (
          <Button 
            onClick={onExport} 
            className="flex-1"
            disabled={overallScore < 60}
          >
            <Download className="mr-2 h-4 w-4" />
            {overallScore >= 60 ? 'Export Resume' : 'Improve Score to Export'}
          </Button>
        )}
      </div>

      {overallScore < 60 && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Target className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-orange-900 dark:text-orange-200 mb-1">
                  Recommendation: Improve Your Score
                </h4>
                <p className="text-sm text-orange-800 dark:text-orange-300">
                  Your ATS score is below the recommended threshold of 60%. Consider adding the missing
                  must-have keywords and optimizing your resume sections before exporting.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Shared Sub-Components
// -----------------------------------------------------------------------------

function ScoreRow({ label, score }: { label: string; score: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-semibold ${getScoreColor(score)}`}>
          {score}%
        </span>
      </div>
      <Progress value={score} className="h-2" />
    </div>
  );
}

function ScoreCard({ title, score }: { title: string; score: number }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn('text-3xl font-bold', getScoreColor(score))}>
          {Math.round(score)}%
        </div>
        <Progress value={score} className="mt-2" />
      </CardContent>
    </Card>
  );
}

function FeedbackSection({ 
  title, 
  items, 
  icon, 
  itemColor 
}: { 
  title: string; 
  items: string[]; 
  icon: React.ReactNode; 
  itemColor: string;
}) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold flex items-center gap-2">
        {icon}
        {title}
      </h4>
      <ul className="space-y-1 text-sm text-muted-foreground">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2">
            <span className={`${itemColor} mt-0.5`}>•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function KeywordBadges({ 
  title, 
  keywords, 
  icon, 
  variant,
  description
}: { 
  title: string; 
  keywords: any[]; 
  icon: React.ReactNode; 
  variant: 'matched' | 'missing';
  description?: string;
}) {
  return (
    <Card className={variant === 'missing' ? 'border-orange-200' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title} ({keywords.length})
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {keywords.slice(0, 30).map((kw: any, idx: number) => (
            <Badge
              key={idx}
              variant={
                variant === 'matched'
                  ? kw.priority === 'must_have' ? 'default' : 'secondary'
                  : kw.priority === 'must_have' ? 'destructive' : 'outline'
              }
              className="flex items-center gap-1"
            >
              {kw.phrase}
              {kw.importanceScore && (
                <span className="text-xs opacity-70">
                  ({Math.round(kw.importanceScore)})
                </span>
              )}
            </Badge>
          ))}
          {keywords.length > 30 && (
            <Badge variant="outline">
              +{keywords.length - 30} more
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

export function SmartATSScore({
  viewMode,
  scoreData,
  resumeContent,
  canonicalSections,
  canonicalHeader,
  jobDescription,
  jobTitle,
  industry,
  onExport,
  onBack,
  isLoading
}: SmartATSScoreProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [atsData, setAtsData] = useState<any>(null);

  // Auto-analyze for panel mode
  useEffect(() => {
    if (viewMode === 'panel' && !scoreData) {
      analyzeATS();
    }
  }, [viewMode, jobDescription, resumeContent]);

  const analyzeATS = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await invokeEdgeFunction('analyze-ats-score', {
        jobTitle,
        jobDescription,
        industry,
        canonicalHeader,
        canonicalSections,
        resumeContent: !canonicalSections ? resumeContent : undefined
      });

      if (error) {
        toast.error('Failed to analyze ATS compatibility');
        return;
      }

      setAtsData(data);
    } catch (error) {
      console.error('Error analyzing ATS:', error);
      toast.error('Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Loading states
  if (isLoading || isAnalyzing) {
    return <LoadingState mode={viewMode} />;
  }

  // Card view with static data
  if (viewMode === 'card' && scoreData) {
    return <CardView scoreData={scoreData} />;
  }

  // Expanded view (card layout with full panel data) - future enhancement
  if (viewMode === 'expanded' && scoreData) {
    return <CardView scoreData={scoreData} />;
  }

  // Panel view with dynamic data
  if (viewMode === 'panel') {
    return (
      <PanelView 
        atsData={atsData} 
        onExport={onExport} 
        onBack={onBack}
        onRetry={analyzeATS}
      />
    );
  }

  // Fallback
  return null;
}

// Re-export the data type for backward compatibility
export type { ATSScoreData as ATSScoreDataType };
