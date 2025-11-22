import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Circle, TrendingUp, Download } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface EvidenceMatrixDashboardProps {
  evidenceMatrix: any[];
  selections: Record<string, any>;
  onRequirementClick: (index: number) => void;
  onExportPDF?: () => void;
}

export const EvidenceMatrixDashboard = ({
  evidenceMatrix,
  selections,
  onRequirementClick,
  onExportPDF
}: EvidenceMatrixDashboardProps) => {
  const getRequirementStatus = (req: any) => {
    const selection = selections[req.requirement];
    if (!selection) return 'uncovered';
    
    if (req.matchScore >= 80) return 'covered';
    if (req.matchScore >= 60) return 'partial';
    return 'weak';
  };

  const statusCounts = {
    covered: evidenceMatrix.filter(r => getRequirementStatus(r) === 'covered').length,
    partial: evidenceMatrix.filter(r => getRequirementStatus(r) === 'partial').length,
    weak: evidenceMatrix.filter(r => getRequirementStatus(r) === 'weak').length,
    uncovered: evidenceMatrix.filter(r => getRequirementStatus(r) === 'uncovered').length,
  };

  const coveragePercent = ((statusCounts.covered + statusCounts.partial) / evidenceMatrix.length) * 100;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'covered': return 'bg-green-500';
      case 'partial': return 'bg-yellow-500';
      case 'weak': return 'bg-orange-500';
      case 'uncovered': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'covered': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'partial': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'weak': return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'uncovered': return <Circle className="h-4 w-4 text-red-600" />;
      default: return <Circle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'required': return 'destructive';
      case 'preferred': return 'default';
      case 'nice-to-have': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Coverage Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Evidence Matrix Overview
              </CardTitle>
              <CardDescription>
                Your job requirement coverage and evidence strength
              </CardDescription>
            </div>
            {onExportPDF && (
              <Button onClick={onExportPDF} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Coverage</span>
              <span className="text-2xl font-bold">{Math.round(coveragePercent)}%</span>
            </div>
            <Progress value={coveragePercent} className="h-3" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm font-medium">Strong Match</span>
              </div>
              <div className="text-2xl font-bold">{statusCounts.covered}</div>
              <p className="text-xs text-muted-foreground">80%+ match score</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-sm font-medium">Good Match</span>
              </div>
              <div className="text-2xl font-bold">{statusCounts.partial}</div>
              <p className="text-xs text-muted-foreground">60-79% match</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span className="text-sm font-medium">Weak Match</span>
              </div>
              <div className="text-2xl font-bold">{statusCounts.weak}</div>
              <p className="text-xs text-muted-foreground">&lt;60% match</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm font-medium">Gaps</span>
              </div>
              <div className="text-2xl font-bold">{statusCounts.uncovered}</div>
              <p className="text-xs text-muted-foreground">No evidence yet</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requirements Grid */}
      <Card>
        <CardHeader>
          <CardTitle>All Requirements</CardTitle>
          <CardDescription>
            Click any requirement to view or edit evidence
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {evidenceMatrix.map((req, index) => {
              const status = getRequirementStatus(req);
              const selection = selections[req.requirement];

              return (
                <button
                  key={index}
                  onClick={() => onRequirementClick(index)}
                  className="w-full text-left p-4 rounded-lg border hover:border-primary transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getStatusIcon(status)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium group-hover:text-primary transition-colors">
                          {req.requirement}
                        </span>
                        {req.priority && (
                          <Badge variant={getPriorityColor(req.priority)} className="text-xs">
                            {req.priority}
                          </Badge>
                        )}
                      </div>
                      
                      {selection && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {selection.content || req.enhancedBullet}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Match: {req.matchScore}%</span>
                        {req.source && (
                          <>
                            <span>•</span>
                            <span>{req.source.company || req.source.position}</span>
                          </>
                        )}
                        {selection && (
                          <>
                            <span>•</span>
                            <span className="text-green-600 font-medium">✓ Reviewed</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className={`w-2 h-2 rounded-full ${getStatusColor(status)} mt-2`} />
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Improvement Suggestions */}
      {statusCounts.weak > 0 || statusCounts.uncovered > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="text-orange-900">Improvement Opportunities</CardTitle>
            <CardDescription className="text-orange-700">
              Strengthen your application by addressing these gaps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {statusCounts.uncovered > 0 && (
                <li className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                  <span>
                    <strong>{statusCounts.uncovered} requirements</strong> have no evidence yet. 
                    Consider adding relevant projects or experiences to your Career Vault.
                  </span>
                </li>
              )}
              {statusCounts.weak > 0 && (
                <li className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                  <span>
                    <strong>{statusCounts.weak} requirements</strong> have weak matches (&lt;60%). 
                    Review these and provide more context or choose different evidence.
                  </span>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
