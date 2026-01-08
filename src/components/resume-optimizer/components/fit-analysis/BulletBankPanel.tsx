import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Zap, ChevronDown, ChevronRight, Copy, Plus, Check } from 'lucide-react';
import { EvidenceTag } from './EvidenceTag';
import { BulletBankPanelProps } from './types';
import { useOptimizerStore } from '@/stores/optimizerStore';
import { useToast } from '@/hooks/use-toast';

export function BulletBankPanel({ 
  bulletBank, 
  isOpen, 
  onOpenChange,
  getEvidenceById
}: BulletBankPanelProps) {
  const { toast } = useToast();
  const addStagedBullet = useOptimizerStore(state => state.addStagedBullet);
  const stagedBullets = useOptimizerStore(state => state.stagedBullets);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  if (bulletBank.length === 0) return null;
  
  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      toast({
        title: 'Copied!',
        description: 'Bullet copied to clipboard',
      });
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Please select and copy manually',
        variant: 'destructive'
      });
    }
  };
  
  const handleAddToResume = (text: string, requirementIds?: string[]) => {
    const isStaged = stagedBullets.some(b => b.text === text);
    if (isStaged) return;
    
    addStagedBullet({
      text,
      requirementId: requirementIds?.[0],
      sectionHint: 'experience'
    });
    
    toast({
      title: 'Added to Resume Draft',
      description: 'This bullet will be included in your optimized resume',
    });
  };
  
  const isBulletStaged = (text: string) => stagedBullets.some(b => b.text === text);
  
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
                AI-Generated Content Suggestions ({bulletBank.length})
              </CardTitle>
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>
              Ready-to-use resume bullets based on your experience — click to add to your resume
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent id="bullet-bank-content">
          <CardContent>
            <ScrollArea className="h-[350px]">
              <div className="space-y-3">
                {bulletBank.map((bullet, idx) => {
                  const isStaged = isBulletStaged(bullet.bullet);
                  return (
                    <div 
                      key={idx} 
                      className="p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <p className="text-sm mb-3">{bullet.bullet}</p>
                      
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        {bullet.evidenceIds && bullet.evidenceIds.length > 0 && (
                          <div className="flex flex-wrap gap-1 items-center">
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
                        
                        <div className="flex gap-2 ml-auto">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleCopy(bullet.bullet, idx)}
                            className="h-7 text-xs"
                          >
                            {copiedIndex === idx ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                            {copiedIndex === idx ? 'Copied' : 'Copy'}
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => handleAddToResume(bullet.bullet, bullet.requirementIds)}
                            disabled={isStaged}
                            className="h-7 text-xs"
                          >
                            {isStaged ? <Check className="h-3 w-3 mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
                            {isStaged ? 'Added' : 'Add to Resume'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}