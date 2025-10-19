import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertTriangle, Info } from "lucide-react";
import { useState } from "react";

interface VerificationResultsProps {
  verification: any;
}

export const VerificationResults = ({ verification }: VerificationResultsProps) => {
  const [showCitations, setShowCitations] = useState(false);
  
  if (!verification) return null;
  
  const verifiedCount = verification.verification_analysis?.verified_claims?.length || 0;
  const flaggedCount = verification.verification_analysis?.unverified_statements?.length || 0;
  const confidenceScore = verification.verification_analysis?.factual_accuracy_score || 0;
  
  return (
    <Card className="border-l-4 border-l-green-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CheckCircle className="h-5 w-5 text-green-600" />
          Perplexity Verification Complete
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-muted rounded">
          <span className="font-medium">Factual Accuracy Score</span>
          <Badge variant={confidenceScore >= 80 ? "default" : confidenceScore >= 60 ? "secondary" : "destructive"} className="text-lg px-3 py-1">
            {confidenceScore}%
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="font-medium">Verified Claims: {verifiedCount}</span>
          </div>
          {verifiedCount > 0 && verification.verification_analysis?.verified_claims && (
            <div className="pl-6 space-y-1 text-sm text-muted-foreground">
              {verification.verification_analysis.verified_claims.slice(0, 3).map((claim: string, idx: number) => (
                <p key={idx}>✓ {claim}</p>
              ))}
              {verifiedCount > 3 && <p className="text-xs italic">+ {verifiedCount - 3} more verified</p>}
            </div>
          )}
        </div>
        
        {flaggedCount > 0 && verification.verification_analysis?.unverified_statements && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold mb-2">⚠️ {flaggedCount} claims need attention:</p>
              <ul className="space-y-1 text-sm">
                {verification.verification_analysis.unverified_statements.map((statement: string, idx: number) => (
                  <li key={idx}>• {statement}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
        
        {verification.verification_analysis?.sources && verification.verification_analysis.sources.length > 0 && (
          <>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setShowCitations(!showCitations)}
            >
              <Info className="h-4 w-4 mr-2" />
              {showCitations ? 'Hide' : 'View'} {verification.verification_analysis.sources.length} Citations
            </Button>
            
            {showCitations && (
              <div className="p-3 bg-muted rounded space-y-2 text-xs">
                {verification.verification_analysis.sources.map((source: any, idx: number) => (
                  <div key={idx} className="border-l-2 border-primary pl-2">
                    <p className="font-semibold">{source.title}</p>
                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {source.url}
                    </a>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        
        {verification.consensus?.final_recommendations && verification.consensus.final_recommendations.length > 0 && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded space-y-1 text-sm">
            <p className="font-semibold">Recommendations:</p>
            <ul className="list-disc list-inside space-y-1">
              {verification.consensus.final_recommendations.map((rec: string, idx: number) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
