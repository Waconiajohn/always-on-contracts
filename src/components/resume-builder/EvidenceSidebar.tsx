import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ShieldCheck, ShieldAlert, Shield, FileText, UserPlus, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { RBEvidence } from '@/types/resume-builder';

interface EvidenceSidebarProps {
  evidence: RBEvidence[];
  maxItems?: number;
  onEvidenceRemoved?: (evidenceId: string) => void;
  readOnly?: boolean;
}

type ConfidenceLevel = 'high' | 'medium' | 'low';
type EvidenceSource = 'extracted' | 'user_provided';

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

function SourceBadge({ source }: { source: EvidenceSource }) {
  const isUserProvided = source === 'user_provided';
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`text-xs gap-1 ${isUserProvided ? 'border-primary/50 text-primary' : ''}`}
          >
            {isUserProvided ? (
              <>
                <UserPlus className="h-3 w-3" />
                You Added
              </>
            ) : (
              <>
                <FileText className="h-3 w-3" />
                From Resume
              </>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          {isUserProvided 
            ? 'You provided this information via questions'
            : 'Extracted from your uploaded resume'
          }
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function EvidenceSidebar({ evidence, maxItems = 10, onEvidenceRemoved, readOnly = false }: EvidenceSidebarProps) {
  const [removingId, setRemovingId] = useState<string | null>(null);
  const displayEvidence = evidence.slice(0, maxItems);
  const remainingCount = evidence.length - maxItems;

  // Sort by confidence (highest first)
  const sortedEvidence = [...displayEvidence].sort(
    (a, b) => (Number(b.confidence) || 0) - (Number(a.confidence) || 0)
  );

  const handleRemoveEvidence = async (evidenceId: string) => {
    setRemovingId(evidenceId);
    try {
      const { error } = await supabase
        .from('rb_evidence')
        .update({ is_active: false })
        .eq('id', evidenceId);

      if (error) throw error;

      toast.success('Evidence removed');
      onEvidenceRemoved?.(evidenceId);
    } catch (err) {
      console.error('Failed to remove evidence:', err);
      toast.error('Failed to remove evidence');
    } finally {
      setRemovingId(null);
    }
  };

  const handleMarkInaccurate = async (evidenceId: string) => {
    setRemovingId(evidenceId);
    try {
      // Mark as inactive and update confidence to indicate it was marked inaccurate
      const { error } = await supabase
        .from('rb_evidence')
        .update({
          is_active: false,
          confidence: 'low' // Downgrade confidence when marked inaccurate
        })
        .eq('id', evidenceId);

      if (error) throw error;

      toast.success('Marked as inaccurate and removed');
      onEvidenceRemoved?.(evidenceId);
    } catch (err) {
      console.error('Failed to mark evidence as inaccurate:', err);
      toast.error('Failed to update evidence');
    } finally {
      setRemovingId(null);
    }
  };

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
            <Card key={item.id} className="p-3 hover:border-primary/30 transition-colors group">
              <div className="space-y-2">
                <p className="text-xs font-medium leading-relaxed line-clamp-3">
                  {item.claim_text}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <SourceBadge source={(item.source as EvidenceSource) || 'extracted'} />
                  <ConfidenceIndicator confidence={Number(item.confidence) || 0} />
                </div>
                {item.evidence_quote && (
                  <p className="text-xs text-muted-foreground italic line-clamp-2 border-l-2 border-muted pl-2">
                    "{item.evidence_quote}"
                  </p>
                )}

                {/* Action buttons - visible on hover */}
                {!readOnly && (
                  <div className="flex items-center gap-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                            onClick={() => handleMarkInaccurate(item.id)}
                            disabled={removingId === item.id}
                          >
                            {removingId === item.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Inaccurate
                              </>
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Mark this claim as inaccurate</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoveEvidence(item.id)}
                            disabled={removingId === item.id}
                          >
                            {removingId === item.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <Trash2 className="h-3 w-3 mr-1" />
                                Remove
                              </>
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Remove this evidence</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
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
