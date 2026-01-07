import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EvidenceInventoryPanelProps, STRENGTH_COLORS } from './types';

export function EvidenceInventoryPanel({ 
  evidenceInventory, 
  isOpen, 
  onOpenChange 
}: EvidenceInventoryPanelProps) {
  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <Card>
        <CollapsibleTrigger 
          asChild
          aria-expanded={isOpen}
          aria-controls="evidence-inventory-content"
        >
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Evidence Inventory ({evidenceInventory.length} items)
              </CardTitle>
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent id="evidence-inventory-content">
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {evidenceInventory.map((evidence) => (
                  <div 
                    key={evidence.id} 
                    className={cn(
                      "p-3 rounded-lg border",
                      STRENGTH_COLORS[evidence.strength]
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs font-mono">{evidence.id}</Badge>
                          <span className="text-xs text-muted-foreground">{evidence.sourceRole}</span>
                        </div>
                        <p className="text-sm">{evidence.text}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">{evidence.strength}</Badge>
                    </div>
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
