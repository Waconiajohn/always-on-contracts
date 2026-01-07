import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { EvidenceTag } from './EvidenceTag';
import { RequirementCardProps, RISK_COLORS } from './types';

export function RequirementCard({ entry, getRequirementById, getEvidenceById }: RequirementCardProps) {
  const requirement = getRequirementById(entry.requirementId);
  if (!requirement) return null;
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-3">
        {/* Requirement header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs font-mono">{requirement.id}</Badge>
              <Badge variant="secondary" className="text-xs">{requirement.type}</Badge>
              <Badge variant="outline" className="text-xs">{requirement.senioritySignal}</Badge>
            </div>
            <h4 className="font-medium text-sm">{requirement.requirement}</h4>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge className={cn("text-xs", RISK_COLORS[entry.riskLevel])}>
              {entry.riskLevel} Risk
            </Badge>
            <span className="text-xs text-muted-foreground">{entry.confidence}</span>
          </div>
        </div>
        
        {/* Rationale */}
        <p className="text-xs text-muted-foreground">{entry.rationale}</p>
        
        {/* Gap Taxonomy (for partial/gaps) */}
        {entry.gapTaxonomy && entry.gapTaxonomy.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <span className="text-xs text-muted-foreground mr-1">Gap Type:</span>
            {entry.gapTaxonomy.map((gap, idx) => (
              <Badge key={idx} variant="destructive" className="text-xs">
                {gap}
              </Badge>
            ))}
          </div>
        )}
        
        {/* Evidence Citations */}
        {entry.evidenceIds && entry.evidenceIds.length > 0 && (
          <div className="flex flex-wrap gap-1 items-center">
            <span className="text-xs text-muted-foreground mr-1">Evidence:</span>
            {entry.evidenceIds.map((evidenceId) => (
              <EvidenceTag 
                key={evidenceId}
                evidenceId={evidenceId} 
                getEvidenceById={getEvidenceById} 
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
