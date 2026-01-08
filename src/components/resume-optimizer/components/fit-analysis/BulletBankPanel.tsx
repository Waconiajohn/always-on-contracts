import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, ChevronDown, Copy, Plus, Check, Sparkles } from 'lucide-react';
import { EvidenceTag } from './EvidenceTag';
import { BulletBankPanelProps } from './types';
import { useOptimizerStore } from '@/stores/optimizerStore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
  
  const handleAddAll = () => {
    let addedCount = 0;
    bulletBank.forEach(bullet => {
      const isStaged = stagedBullets.some(b => b.text === bullet.bullet);
      if (!isStaged) {
        addStagedBullet({
          text: bullet.bullet,
          requirementId: bullet.requirementIds?.[0],
          sectionHint: 'experience'
        });
        addedCount++;
      }
    });
    
    toast({
      title: `Added ${addedCount} bullets`,
      description: 'All unique bullets added to your resume draft',
    });
  };
  
  const isBulletStaged = (text: string) => stagedBullets.some(b => b.text === text);
  const stagedCount = bulletBank.filter(b => isBulletStaged(b.bullet)).length;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Collapsible open={isOpen} onOpenChange={onOpenChange}>
        <Card className="border-2 border-primary/20 shadow-xl overflow-hidden">
          <CollapsibleTrigger 
            asChild
            aria-expanded={isOpen}
            aria-controls="bullet-bank-content"
          >
            <CardHeader className="cursor-pointer bg-gradient-to-r from-primary/5 via-primary/10 to-accent/5 hover:from-primary/10 hover:via-primary/15 hover:to-accent/10 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                    <Zap className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold">Your Power Bullets</h3>
                      <Badge variant="secondary" className="text-sm font-bold">
                        {bulletBank.length} ready
                      </Badge>
                      {stagedCount > 0 && (
                        <Badge className="bg-emerald-600 text-sm">
                          {stagedCount} added
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-1">
                      AI-crafted bullets to make your resume irresistible
                    </p>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="p-2 rounded-lg bg-primary/10"
                >
                  <ChevronDown className="h-5 w-5 text-primary" />
                </motion.div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent id="bullet-bank-content">
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <CardContent className="p-6 pt-0">
                    {/* Add All Button */}
                    <div className="flex justify-end mb-4">
                      <Button
                        onClick={handleAddAll}
                        disabled={stagedCount === bulletBank.length}
                        className="gap-2"
                      >
                        <Sparkles className="h-4 w-4" />
                        {stagedCount === bulletBank.length ? 'All Added!' : 'Add All to Resume'}
                      </Button>
                    </div>
                    
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="grid gap-4">
                        {bulletBank.map((bullet, idx) => {
                          const isStaged = isBulletStaged(bullet.bullet);
                          return (
                            <motion.div 
                              key={idx}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className={cn(
                                "relative p-5 rounded-xl border-2 transition-all",
                                "bg-gradient-to-br from-card to-muted/30",
                                "hover:shadow-md hover:border-primary/30",
                                isStaged && "border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20"
                              )}
                            >
                              {/* Number Badge */}
                              <div className="absolute -left-2 -top-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-lg">
                                {idx + 1}
                              </div>
                              
                              {isStaged && (
                                <Badge className="absolute -right-2 -top-2 bg-emerald-600">
                                  <Check className="h-3 w-3 mr-1" /> Added
                                </Badge>
                              )}
                              
                              <p className="text-base leading-relaxed mb-4 pl-4">{bullet.bullet}</p>
                              
                              <div className="flex items-center justify-between gap-4 flex-wrap pl-4">
                                {bullet.evidenceIds && bullet.evidenceIds.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 items-center">
                                    <span className="text-sm text-muted-foreground font-medium">Based on:</span>
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
                                    className="h-9"
                                  >
                                    {copiedIndex === idx ? <Check className="h-4 w-4 mr-1.5" /> : <Copy className="h-4 w-4 mr-1.5" />}
                                    {copiedIndex === idx ? 'Copied!' : 'Copy'}
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleAddToResume(bullet.bullet, bullet.requirementIds)}
                                    disabled={isStaged}
                                    className={cn(
                                      "h-9",
                                      isStaged && "bg-emerald-600 hover:bg-emerald-600"
                                    )}
                                  >
                                    {isStaged ? <Check className="h-4 w-4 mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />}
                                    {isStaged ? 'Added!' : 'Add to Resume'}
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </motion.div>
  );
}
