import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, TrendingUp } from 'lucide-react';

interface KeywordAnalysis {
  coverage_score: number;
  keywords_found: string[];
  keywords_missing: string[];
  improvement_suggestions: string[];
}

interface KeywordScoreCardProps {
  analysis: KeywordAnalysis;
  totalKeywords: number;
}

export const KeywordScoreCard: React.FC<KeywordScoreCardProps> = ({ analysis, totalKeywords }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-3">
          <TrendingUp className="h-6 w-6 text-primary" />
          Keyword Match Analysis
        </CardTitle>
        <CardDescription>
          How well your resume matches the job requirements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Keyword Coverage</span>
            <span className={`text-2xl font-bold ${getScoreColor(analysis.coverage_score)}`}>
              {analysis.coverage_score}%
            </span>
          </div>
          <Progress value={analysis.coverage_score} className="h-3" />
          <p className="text-xs text-muted-foreground">
            {analysis.keywords_found.length} of {totalKeywords} required keywords found
          </p>
        </div>

        {/* Keywords Found */}
        {analysis.keywords_found.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Keywords Present ({analysis.keywords_found.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {analysis.keywords_found.map((keyword) => (
                <Badge key={keyword} variant="secondary" className="bg-green-100 text-green-800">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Keywords Missing */}
        {analysis.keywords_missing.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              Missing Keywords ({analysis.keywords_missing.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {analysis.keywords_missing.map((keyword) => (
                <Badge key={keyword} variant="outline" className="border-red-300 text-red-700">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Improvement Suggestions */}
        {analysis.improvement_suggestions.length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <h4 className="text-sm font-semibold">💡 Improvement Suggestions</h4>
            <ul className="space-y-2">
              {analysis.improvement_suggestions.map((suggestion, index) => (
                <li key={index} className="text-sm text-muted-foreground flex gap-2">
                  <span className="text-primary">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
