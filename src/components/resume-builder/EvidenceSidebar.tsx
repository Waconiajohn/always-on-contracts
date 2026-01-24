import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react';
import type { RBEvidence } from '@/types/resume-builder';

interface EvidenceSidebarProps {
  evidence: RBEvidence[];
  maxItems?: number;
}

type ConfidenceLevel = 'high' | 'medium' | 'low';

function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 0.8) return 'high';
  if (confidence >= 0.5) return 'medium';
  return 'low';
}

function ConfidenceIndicator({ confidence }: { confidence: number }) {
  const level = getConfidenceLevel(confidence);
  
  const config = {
    high: {
      icon: ShieldCheck,
      label: 'High',
      className: 'text-primary',
      badgeVariant: 'default' as const,
    },
    medium: {
      icon: Shield,
      label: 'Medium',
      className: 'text-amber-500',
      badgeVariant: 'secondary' as const,
    },
    low: {
      icon: ShieldAlert,
      label: 'Low',
      className: 'text-destructive',
      badgeVariant: 'destructive' as const,
    },
  };

  const { icon: Icon, label, className, badgeVariant } = config[level];

  return (
    <Badge variant={badgeVariant} className="text-xs gap-1">
      <Icon className={`h-3 w-3 ${className}`} />
      {label}
    </Badge>
  );
}

export function EvidenceSidebar({ evidence, maxItems = 10 }: EvidenceSidebarProps) {
  const displayEvidence = evidence.slice(0, maxItems);
  const remainingCount = evidence.length - maxItems;

  // Sort by confidence (highest first)
  const sortedEvidence = [...displayEvidence].sort(
    (a, b) => (Number(b.confidence) || 0) - (Number(a.confidence) || 0)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Verified Evidence</h3>
        {evidence.length > 0 && (
          <Badge variant="outline" className="text-xs">
            {evidence.length} claims
          </Badge>
        )}
      </div>
      
      {evidence.length === 0 ? (
        <Card className="p-4 border-dashed">
          <p className="text-sm text-muted-foreground text-center italic">
            No evidence extracted yet
          </p>
          <p className="text-xs text-muted-foreground text-center mt-1">
            Evidence will appear after processing
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {sortedEvidence.map((item) => (
            <Card key={item.id} className="p-3 hover:border-primary/30 transition-colors">
              <div className="space-y-2">
                <p className="text-xs font-medium leading-relaxed line-clamp-3">
                  {item.claim_text}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="text-xs truncate max-w-[120px]">
                    {item.category}
                  </Badge>
                  <ConfidenceIndicator confidence={Number(item.confidence) || 0} />
                </div>
              </div>
            </Card>
          ))}
          {remainingCount > 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              +{remainingCount} more evidence items
            </p>
          )}
        </div>
      )}
    </div>
  );
}
