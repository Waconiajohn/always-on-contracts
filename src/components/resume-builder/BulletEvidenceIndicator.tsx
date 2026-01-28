import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CheckCircle2, AlertCircle, HelpCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface EvidenceClaim {
  id?: string;
  claim: string;
  source: string;
}

interface BulletEvidenceIndicatorProps {
  bulletText: string;
  evidenceClaims?: EvidenceClaim[];
  onMarkInaccurate?: (claimId: string) => void;
}

type EvidenceStrength = 'high' | 'medium' | 'none';

/**
 * Normalize text for fuzzy matching
 */
function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculate similarity between two strings using word overlap
 */
function calculateSimilarity(a: string, b: string): number {
  const wordsA = new Set(normalizeForMatch(a).split(' ').filter(w => w.length > 3));
  const wordsB = new Set(normalizeForMatch(b).split(' ').filter(w => w.length > 3));
  
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  
  let overlap = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) overlap++;
  }
  
  return overlap / Math.min(wordsA.size, wordsB.size);
}

/**
 * Find matching evidence claims for a bullet
 */
function findMatchingEvidence(
  bulletText: string,
  evidenceClaims: EvidenceClaim[]
): { strength: EvidenceStrength; matches: EvidenceClaim[] } {
  if (!evidenceClaims || evidenceClaims.length === 0) {
    return { strength: 'none', matches: [] };
  }
  
  const matches: EvidenceClaim[] = [];
  let bestSimilarity = 0;
  
  for (const claim of evidenceClaims) {
    const similarity = calculateSimilarity(bulletText, claim.claim);
    
    if (similarity >= 0.3) { // At least 30% word overlap
      matches.push(claim);
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
      }
    }
  }
  
  let strength: EvidenceStrength = 'none';
  if (bestSimilarity >= 0.6) {
    strength = 'high';
  } else if (bestSimilarity >= 0.3) {
    strength = 'medium';
  }
  
  return { strength, matches };
}

/**
 * Visual indicator showing evidence support level for a bullet point
 */
export function BulletEvidenceIndicator({ bulletText, evidenceClaims, onMarkInaccurate }: BulletEvidenceIndicatorProps) {
  const [markingId, setMarkingId] = useState<string | null>(null);
  const { strength, matches } = findMatchingEvidence(bulletText, evidenceClaims || []);

  const config = {
    high: {
      icon: CheckCircle2,
      label: 'Strong',
      className: 'text-green-600 dark:text-green-400',
      badgeVariant: 'default' as const,
      description: 'Well-supported by evidence',
    },
    medium: {
      icon: AlertCircle,
      label: 'Partial',
      className: 'text-yellow-600 dark:text-yellow-400',
      badgeVariant: 'secondary' as const,
      description: 'Some supporting evidence',
    },
    none: {
      icon: HelpCircle,
      label: 'Unverified',
      className: 'text-muted-foreground',
      badgeVariant: 'outline' as const,
      description: 'No matching evidence found',
    },
  };

  const { icon: Icon, label, className, badgeVariant, description } = config[strength];

  const handleMarkInaccurate = (claimId: string) => {
    if (!onMarkInaccurate || !claimId) return;
    setMarkingId(claimId);
    onMarkInaccurate(claimId);
    // Reset after a short delay (parent will handle actual update)
    setTimeout(() => setMarkingId(null), 1000);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={badgeVariant}
            className="h-5 px-1.5 cursor-help gap-1 text-[10px] font-normal opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Icon className={`h-3 w-3 ${className}`} />
            {label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2">
            <p className="font-medium text-sm">{description}</p>
            {matches.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Supporting evidence:</p>
                {matches.slice(0, 2).map((match) => (
                  <div key={match.id || match.claim} className="text-xs bg-muted/50 rounded p-1.5">
                    <span className="italic">"{match.claim.slice(0, 100)}{match.claim.length > 100 ? '...' : ''}"</span>
                    <span className="block text-muted-foreground mt-0.5">
                      Source: {match.source}
                    </span>
                    {/* Mark inaccurate action */}
                    {onMarkInaccurate && match.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 px-1.5 mt-1 text-[10px] text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkInaccurate(match.id!);
                        }}
                        disabled={markingId === match.id}
                      >
                        {markingId === match.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Not accurate
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                ))}
                {matches.length > 2 && (
                  <p className="text-xs text-muted-foreground">+{matches.length - 2} more</p>
                )}
              </div>
            )}
            {matches.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Consider adding supporting evidence or marking for review.
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
