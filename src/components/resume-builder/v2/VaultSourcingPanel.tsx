import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Plus } from "lucide-react";

interface VaultItem {
  id: string;
  category: string;
  content: string;
  qualityTier?: 'gold' | 'silver' | 'bronze';
}

interface VaultSourcingPanelProps {
  usedItems: VaultItem[];
  suggestedItems: VaultItem[];
  onAddItem: (item: VaultItem) => void;
}

export function VaultSourcingPanel({ usedItems, suggestedItems, onAddItem }: VaultSourcingPanelProps) {
  return (
    <div className="space-y-4">
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Used from Career Vault
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {usedItems.length > 0 ? (
            <div className="space-y-2">
              {usedItems.map(item => (
                <div key={item.id} className="p-2 bg-muted/50 rounded border text-xs">
                  <div className="flex justify-between mb-1">
                    <Badge variant="outline" className="text-[10px] px-1 h-4">{item.category}</Badge>
                    {item.qualityTier === 'gold' && <span className="text-yellow-600">🥇</span>}
                  </div>
                  <p className="line-clamp-2 text-muted-foreground">{item.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No vault items used yet.</p>
          )}
        </CardContent>
      </Card>

      {suggestedItems.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Suggested Additions
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-2">
              {suggestedItems.map(item => (
                <div key={item.id} className="p-2 bg-card rounded border text-xs hover:border-primary transition-colors group">
                  <div className="flex justify-between mb-1">
                    <Badge variant="secondary" className="text-[10px] px-1 h-4">{item.category}</Badge>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-5 w-5 opacity-0 group-hover:opacity-100"
                      onClick={() => onAddItem(item)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="line-clamp-2 text-muted-foreground">{item.content}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
