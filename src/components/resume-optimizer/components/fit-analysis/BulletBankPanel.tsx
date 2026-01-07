import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Zap, ChevronDown, ChevronRight } from 'lucide-react';
import { EvidenceTag } from './EvidenceTag';
import { BulletBankPanelProps } from './types';

export function BulletBankPanel({ 
  bulletBank, 
  isOpen, 
  onOpenChange,
  getEvidenceById
}: BulletBankPanelProps) {
  if (bulletBank.length === 0) return null;
  
  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <Card>
        <CollapsibleTrigger 
          asChild
          aria-expanded={isOpen}
          aria-controls="bullet-bank-content"
        >
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Pre-Generated Bullets ({bulletBank.length})
              </CardTitle>
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>
              AI-generated bullets ready to use in your optimized resume
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent id="bullet-bank-content">
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {bulletBank.map((bullet, idx) => (
                  <div 
                    key={idx} 
                    className="p-3 rounded-lg border bg-muted/30"
                  >
                    <p className="text-sm">{bullet.bullet}</p>
                    {bullet.evidenceIds && bullet.evidenceIds.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        <span className="text-xs text-muted-foreground mr-1">Based on:</span>
                        {bullet.evidenceIds.map((evidenceId) => (
                          <EvidenceTag 
                            key={evidenceId}
                            evidenceId={evidenceId} 
                            getEvidenceById={getEvidenceById} 
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
