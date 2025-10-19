import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertTriangle, ExternalLink, ChevronDown, ChevronUp, Shield } from 'lucide-react';
import { useState } from 'react';
import { Progress } from '@/components/ui/progress';

interface VerificationResult {
  confidence: number;
  verifiedClaims: Array<{
    claim: string;
    verified: boolean;
    confidence: number;
  }>;
  flaggedClaims: Array<{
    claim: string;
    issue: string;
    suggestion: string;
  }>;
  citations: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
  recommendations: string[];
}

interface VerificationResultsProps {
  result: VerificationResult | null;
  loading?: boolean;
}

export const VerificationResults = ({ result, loading }: VerificationResultsProps) => {
  const [showCitations, setShowCitations] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-5 w-5 text-primary animate-pulse" />
          <div>
            <h3 className="font-semibold">Verifying Resume Claims...</h3>
            <p className="text-sm text-muted-foreground">
              Fact-checking with Perplexity AI
            </p>
          </div>
        </div>
        <Progress value={33} className="h-2" />
      </Card>
    );
  }

  if (!result) {
    return null;
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) return 'default';
    if (confidence >= 60) return 'secondary';
    return 'destructive';
  };

  return (
    <Card className="p-6 space-y-6">
      {/* Header with Overall Score */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Verification Results</h3>
            <p className="text-sm text-muted-foreground">
              Fact-checked by Perplexity AI
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-bold ${getConfidenceColor(result.confidence)}`}>
            {result.confidence}%
          </div>
          <Badge variant={getConfidenceBadge(result.confidence)} className="mt-1">
            {result.confidence >= 80 ? 'High Confidence' : result.confidence >= 60 ? 'Medium Confidence' : 'Needs Review'}
          </Badge>
        </div>
      </div>

      {/* Verified Claims */}
      {result.verifiedClaims.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Verified Claims ({result.verifiedClaims.length})
          </h4>
          <div className="space-y-2">
            {result.verifiedClaims.slice(0, 5).map((claim, idx) => (
              <div 
                key={idx} 
                className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800"
              >
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm">{claim.claim}</p>
                    <Badge variant="outline" className="mt-2 text-xs">
                      {claim.confidence}% confidence
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Flagged Claims */}
      {result.flaggedClaims.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            Flagged for Review ({result.flaggedClaims.length})
          </h4>
          <div className="space-y-3">
            {result.flaggedClaims.map((flagged, idx) => (
              <div 
                key={idx} 
                className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-medium">{flagged.claim}</p>
                    <div className="text-xs text-muted-foreground">
                      <span className="font-semibold">Issue:</span> {flagged.issue}
                    </div>
                    {flagged.suggestion && (
                      <div className="text-xs">
                        <span className="font-semibold">Suggestion:</span>{' '}
                        <span className="text-muted-foreground">{flagged.suggestion}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Citations */}
      {result.citations.length > 0 && (
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCitations(!showCitations)}
            className="w-full justify-between"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              View {result.citations.length} Citations
            </span>
            {showCitations ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          
          {showCitations && (
            <div className="mt-3 space-y-2">
              {result.citations.map((citation, idx) => (
                <a
                  key={idx}
                  href={citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <ExternalLink className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{citation.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {citation.snippet}
                      </p>
                      <p className="text-xs text-primary mt-1 truncate">{citation.url}</p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRecommendations(!showRecommendations)}
            className="w-full justify-between"
          >
            <span className="flex items-center gap-2">
              Improvement Recommendations ({result.recommendations.length})
            </span>
            {showRecommendations ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          
          {showRecommendations && (
            <div className="mt-3 space-y-2">
              {result.recommendations.map((rec, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-muted text-sm">
                  <span className="font-semibold text-primary">{idx + 1}.</span> {rec}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
