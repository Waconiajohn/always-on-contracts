import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { EvidenceTag } from './EvidenceTag';
import { RequirementCardProps, RISK_COLORS } from './types';
import { useOptimizerStore } from '@/stores/optimizerStore';
import { useToast } from '@/hooks/use-toast';
import { Copy, Plus, Check, Lightbulb } from 'lucide-react';

export function RequirementCard({ entry, getRequirementById, getEvidenceById }: RequirementCardProps) {
  const { toast } = useToast();
  const requirement = getRequirementById(entry.requirementId);
  const addStagedBullet = useOptimizerStore(state => state.addStagedBullet);
  const stagedBullets = useOptimizerStore(state => state.stagedBullets);
  
  const [copied, setCopied] = useState(false);
  
  if (!requirement) return null;
  
  const isStaged = stagedBullets.some(b => b.text === entry.resumeLanguage);
  
  const handleCopy = async () => {
    if (!entry.resumeLanguage) return;
    
    try {
      await navigator.clipboard.writeText(entry.resumeLanguage);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Resume language copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Please select and copy manually',
        variant: 'destructive'
      });
    }
  };
  
  const handleAddToResume = () => {
    if (!entry.resumeLanguage || isStaged) return;
    
    addStagedBullet({
      text: entry.resumeLanguage,
      requirementId: entry.requirementId,
      sectionHint: 'experience'
    });
    
    toast({
      title: 'Added to Resume Draft',
      description: 'This bullet will be included in your optimized resume',
    });
  };
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        {/* Requirement header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
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
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Category-specific content */}
        {entry.category === 'HIGHLY QUALIFIED' && (
          <>
            {entry.whyQualified && (
              <div>
                <p className="text-xs font-semibold text-emerald-700 mb-1">Why you are highly qualified:</p>
                <p className="text-sm text-muted-foreground">{entry.whyQualified}</p>
              </div>
            )}
          </>
        )}
        
        {entry.category === 'PARTIALLY QUALIFIED' && (
          <>
            {entry.whyQualified && (
              <div>
                <p className="text-xs font-semibold text-amber-700 mb-1">Partial match:</p>
                <p className="text-sm text-muted-foreground">{entry.whyQualified}</p>
              </div>
            )}
            {entry.gapExplanation && (
              <div className="p-2 bg-amber-50 dark:bg-amber-950/30 rounded border-l-2 border-amber-400">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">Gap:</p>
                <p className="text-sm text-amber-900 dark:text-amber-200">{entry.gapExplanation}</p>
              </div>
            )}
          </>
        )}
        
        {entry.category === 'EXPERIENCE GAP' && (
          <>
            {entry.gapExplanation && (
              <div className="p-2 bg-red-50 dark:bg-red-950/30 rounded border-l-2 border-red-400">
                <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">Gap:</p>
                <p className="text-sm text-red-900 dark:text-red-200">{entry.gapExplanation}</p>
              </div>
            )}
            {entry.whyQualified && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Transferable strengths:</p>
                <p className="text-sm text-muted-foreground">{entry.whyQualified}</p>
              </div>
            )}
            {entry.bridgingStrategy && (
              <div className="flex items-start gap-2 p-2 bg-muted/50 rounded">
                <Lightbulb className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-primary mb-1">Bridging Strategy:</p>
                  <p className="text-xs text-muted-foreground">{entry.bridgingStrategy}</p>
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Resume Language Box - Prominent for all categories */}
        {entry.resumeLanguage && (
          <div className={cn(
            "p-3 rounded-lg border-l-4",
            entry.category === 'HIGHLY QUALIFIED' && "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500",
            entry.category === 'PARTIALLY QUALIFIED' && "bg-amber-50 dark:bg-amber-950/30 border-amber-500",
            entry.category === 'EXPERIENCE GAP' && "bg-red-50 dark:bg-red-950/30 border-red-500"
          )}>
            <p className="text-xs font-semibold mb-2 flex items-center gap-1">
              📝 {entry.category === 'EXPERIENCE GAP' ? 'Suggested bridging language:' : 'Resume Language:'}
            </p>
            <p className="text-sm italic mb-3 leading-relaxed">{entry.resumeLanguage}</p>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleCopy}
                className="h-7 text-xs"
              >
                {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button 
                size="sm" 
                onClick={handleAddToResume}
                disabled={isStaged}
                className="h-7 text-xs"
              >
                {isStaged ? <Check className="h-3 w-3 mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
                {isStaged ? 'Added' : 'Add to Resume'}
              </Button>
            </div>
          </div>
        )}
        
        {/* Fallback to rationale if no whyQualified */}
        {!entry.whyQualified && entry.rationale && (
          <p className="text-xs text-muted-foreground">{entry.rationale}</p>
        )}
        
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