import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Lightbulb, 
  TrendingUp,
  FileText,
  Target,
  Zap,
  RefreshCw
} from "lucide-react";
import { useState } from "react";

interface CritiqueSuggestion {
  id: string;
  category: 'critical' | 'important' | 'optional';
  type: 'content' | 'formatting' | 'keywords' | 'impact';
  title: string;
  description: string;
  suggestion: string;
  location?: string;
}

interface CritiqueData {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: CritiqueSuggestion[];
  industryInsights: string[];
  atsCompatibility: {
    score: number;
    issues: string[];
  };
}

interface ResumeCritiqueProps {
  resumeContent?: string;
  jobDescription?: string;
  onRefresh?: () => void;
  loading?: boolean;
}

export function ResumeCritique({ 
  resumeContent: _resumeContent, 
  jobDescription: _jobDescription,
  onRefresh,
  loading = false 
}: ResumeCritiqueProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'important' | 'optional'>('all');

  // Mock critique data - in production, this would come from an AI analysis
  const critiqueData: CritiqueData = {
    overallScore: 78,
    strengths: [
      "Strong quantifiable achievements with metrics",
      "Well-structured leadership experience section",
      "Effective use of action verbs throughout",
      "Clear career progression demonstrated"
    ],
    weaknesses: [
      "Missing key technical skills mentioned in job posting",
      "Summary section could be more impactful",
      "Some bullet points lack specific outcomes",
      "Limited industry-specific terminology"
    ],
    suggestions: [
      {
        id: '1',
        category: 'critical',
        type: 'keywords',
        title: 'Missing Critical Keywords',
        description: 'Your resume is missing 5 key terms from the job description',
        suggestion: 'Add these keywords: "Agile methodology", "Cross-functional leadership", "P&L management", "Strategic planning", "Digital transformation"',
        location: 'Throughout resume'
      },
      {
        id: '2',
        category: 'critical',
        type: 'content',
        title: 'Weak Executive Summary',
        description: 'Your summary doesn\'t highlight executive-level achievements',
        suggestion: 'Start with your most impressive metric: "Fortune 500 executive who drove $50M revenue growth..." Add specific numbers and leadership scope.',
        location: 'Summary section'
      },
      {
        id: '3',
        category: 'important',
        type: 'impact',
        title: 'Enhance Achievement Statements',
        description: '3 bullet points lack quantifiable results',
        suggestion: 'Replace vague statements with specific metrics. Instead of "Improved team performance", use "Increased team productivity by 35% through implementation of new workflow processes"',
        location: 'Experience section'
      },
      {
        id: '4',
        category: 'important',
        type: 'formatting',
        title: 'Inconsistent Date Formatting',
        description: 'Mix of MM/YYYY and Month YYYY formats',
        suggestion: 'Use consistent "Month YYYY - Month YYYY" format throughout. Example: "January 2020 - December 2023"',
        location: 'All date fields'
      },
      {
        id: '5',
        category: 'optional',
        type: 'content',
        title: 'Add Industry Certifications',
        description: 'No professional certifications listed',
        suggestion: 'If you have relevant certifications (PMP, Six Sigma, MBA), add a dedicated section. This increases credibility by 40%.',
        location: 'New section after Education'
      },
      {
        id: '6',
        category: 'optional',
        type: 'keywords',
        title: 'Optimize for ATS Scanning',
        description: 'Some skills buried in paragraphs',
        suggestion: 'Create a dedicated "Core Competencies" section with bullet points. This improves ATS parsing by 60%.',
        location: 'After Summary'
      }
    ],
    industryInsights: [
      "Executive resumes in your industry typically emphasize P&L responsibility prominently",
      "Board-level experience should be highlighted if available",
      "Strategic transformation initiatives are highly valued - ensure these are prominent",
      "Industry peers average 8-10 quantified achievements per role"
    ],
    atsCompatibility: {
      score: 72,
      issues: [
        "Tables detected - may cause parsing issues",
        "Some skills in graphics/columns - ATS may miss these",
        "Consider adding a plain text version of key skills"
      ]
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'critical':
        return <XCircle className="w-5 h-5 text-destructive" />;
      case 'important':
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      case 'optional':
        return <Lightbulb className="w-5 h-5 text-primary" />;
      default:
        return <CheckCircle2 className="w-5 h-5 text-success" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    const variants: Record<string, 'destructive' | 'default' | 'secondary'> = {
      critical: 'destructive',
      important: 'default',
      optional: 'secondary'
    };
    return <Badge variant={variants[category] || 'secondary'}>{category}</Badge>;
  };

  const filteredSuggestions = activeFilter === 'all' 
    ? critiqueData.suggestions 
    : critiqueData.suggestions.filter(s => s.category === activeFilter);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Analyzing your resume...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Resume Quality Score</CardTitle>
              <CardDescription>AI-powered analysis of your resume</CardDescription>
            </div>
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Analysis
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-8 border-primary/20 flex items-center justify-center">
                <span className="text-3xl font-bold">{critiqueData.overallScore}</span>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Content Quality</span>
                <span className="font-medium">85%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: '85%' }} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Keyword Optimization</span>
                <span className="font-medium">68%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: '68%' }} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>ATS Compatibility</span>
                <span className="font-medium">{critiqueData.atsCompatibility.score}%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${critiqueData.atsCompatibility.score}%` }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Improvement Suggestions
          </CardTitle>
          <CardDescription>
            {critiqueData.suggestions.filter(s => s.category === 'critical').length} critical •{' '}
            {critiqueData.suggestions.filter(s => s.category === 'important').length} important •{' '}
            {critiqueData.suggestions.filter(s => s.category === 'optional').length} optional
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={activeFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('all')}
            >
              All ({critiqueData.suggestions.length})
            </Button>
            <Button
              variant={activeFilter === 'critical' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('critical')}
            >
              Critical ({critiqueData.suggestions.filter(s => s.category === 'critical').length})
            </Button>
            <Button
              variant={activeFilter === 'important' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('important')}
            >
              Important ({critiqueData.suggestions.filter(s => s.category === 'important').length})
            </Button>
            <Button
              variant={activeFilter === 'optional' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('optional')}
            >
              Optional ({critiqueData.suggestions.filter(s => s.category === 'optional').length})
            </Button>
          </div>

          <div className="space-y-3">
            {filteredSuggestions.map((suggestion) => (
              <Alert key={suggestion.id} className="border-l-4">
                <div className="flex items-start gap-3">
                  {getCategoryIcon(suggestion.category)}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{suggestion.title}</p>
                        {suggestion.location && (
                          <p className="text-xs text-muted-foreground mt-1">
                            📍 {suggestion.location}
                          </p>
                        )}
                      </div>
                      {getCategoryBadge(suggestion.category)}
                    </div>
                    <AlertDescription className="text-sm">
                      <p className="mb-2">{suggestion.description}</p>
                      <div className="p-3 bg-accent/50 rounded-md">
                        <p className="text-xs font-medium mb-1">💡 Suggestion:</p>
                        <p className="text-sm">{suggestion.suggestion}</p>
                      </div>
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Strengths & Weaknesses */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {critiqueData.strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-success mt-1">✓</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-warning" />
              Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {critiqueData.weaknesses.map((weakness, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-warning mt-1">→</span>
                  <span>{weakness}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Industry Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Industry Insights
          </CardTitle>
          <CardDescription>
            Best practices for executive resumes in your field
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {critiqueData.industryInsights.map((insight, index) => (
              <li key={index} className="flex items-start gap-3 p-3 bg-accent/30 rounded-lg">
                <Lightbulb className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">{insight}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* ATS Compatibility */}
      {critiqueData.atsCompatibility.issues.length > 0 && (
        <Card className="border-warning">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <FileText className="w-5 h-5" />
              ATS Compatibility Warnings
            </CardTitle>
            <CardDescription>
              These issues may prevent ATS systems from reading your resume correctly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {critiqueData.atsCompatibility.issues.map((issue, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
