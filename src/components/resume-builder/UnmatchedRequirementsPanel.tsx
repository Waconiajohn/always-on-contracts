import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingUp, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UnmatchedRequirement {
  requirement: string;
  category: string;
  suggestedVaultCategories: string[];
}

interface UnmatchedRequirementsPanelProps {
  unmatchedRequirements: UnmatchedRequirement[];
  matchedCount: number;
  totalCount: number;
}

export const UnmatchedRequirementsPanel = ({
  unmatchedRequirements,
  matchedCount,
  totalCount
}: UnmatchedRequirementsPanelProps) => {
  const navigate = useNavigate();

  if (!unmatchedRequirements || unmatchedRequirements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <CardTitle>All Requirements Matched!</CardTitle>
          </div>
          <CardDescription>
            Your Career Vault has content for all {totalCount} job requirements
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Group by category
  const groupedRequirements = unmatchedRequirements.reduce((acc, req) => {
    if (!acc[req.category]) {
      acc[req.category] = [];
    }
    acc[req.category].push(req);
    return acc;
  }, {} as Record<string, UnmatchedRequirement[]>);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div>
              <CardTitle>Requirements Analysis</CardTitle>
              <CardDescription>
                {matchedCount} of {totalCount} requirements matched • {unmatchedRequirements.length} need attention
              </CardDescription>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/career-vault')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Enhance Vault
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(groupedRequirements).map(([category, requirements]) => (
          <div key={category} className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{category}</Badge>
              <span className="text-sm text-muted-foreground">
                {requirements.length} unmatched
              </span>
            </div>
            
            <div className="space-y-2 pl-4 border-l-2 border-muted">
              {requirements.map((req, idx) => (
                <div key={idx} className="space-y-1">
                  <p className="text-sm">{req.requirement}</p>
                  {req.suggestedVaultCategories.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Add to:</span>
                      {req.suggestedVaultCategories.map((cat, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground mb-2">
            💡 <strong>Tip:</strong> Add missing content to your Career Vault to improve your match score
          </p>
          <Button 
            onClick={() => navigate('/career-vault')} 
            className="w-full"
          >
            Complete Career Vault
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
