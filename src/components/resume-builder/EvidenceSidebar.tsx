import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { RBEvidence } from '@/types/resume-builder';

interface EvidenceSidebarProps {
  evidence: RBEvidence[];
  maxItems?: number;
}

export function EvidenceSidebar({ evidence, maxItems = 10 }: EvidenceSidebarProps) {
  const displayEvidence = evidence.slice(0, maxItems);
  const remainingCount = evidence.length - maxItems;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground">Verified Evidence</h3>
      
      {evidence.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          No evidence extracted yet
        </p>
      ) : (
        <div className="space-y-2">
          {displayEvidence.map((item) => (
            <Card key={item.id} className="p-2">
              <div className="space-y-1">
                <p className="text-xs font-medium">{item.claim_text}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {item.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(Number(item.confidence || 0) * 100)}% conf
                  </span>
                </div>
              </div>
            </Card>
          ))}
          {remainingCount > 0 && (
            <p className="text-xs text-muted-foreground text-center">
              +{remainingCount} more
            </p>
          )}
        </div>
      )}
    </div>
  );
}
