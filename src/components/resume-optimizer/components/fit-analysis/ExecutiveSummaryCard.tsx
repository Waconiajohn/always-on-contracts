import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, TrendingUp, Lightbulb, AlertTriangle } from 'lucide-react';
import { ExecutiveSummaryCardProps } from './types';

export function ExecutiveSummaryCard({ executiveSummary }: ExecutiveSummaryCardProps) {
  const { hireSignal, likelyObjections, mitigationStrategy, bestPositioningAngle } = executiveSummary;
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Executive Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-medium flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            Hire Signal
          </h4>
          <p className="text-sm text-muted-foreground">{hireSignal}</p>
        </div>
        
        <div>
          <h4 className="text-sm font-medium flex items-center gap-2 mb-1">
            <Lightbulb className="h-4 w-4 text-primary" />
            Best Positioning Angle
          </h4>
          <p className="text-sm text-muted-foreground">{bestPositioningAngle}</p>
        </div>
        
        {likelyObjections.length > 0 && (
          <div>
            <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Likely Objections & Mitigations
            </h4>
            <div className="space-y-2">
              {likelyObjections.map((objection, idx) => (
                <div key={idx} className="text-sm p-2 rounded bg-muted/50">
                  <p className="text-amber-700 font-medium">⚠️ {objection}</p>
                  {mitigationStrategy[idx] && (
                    <p className="text-emerald-700 mt-1">✓ {mitigationStrategy[idx]}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
