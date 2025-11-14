import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Copy, CheckCircle2 } from "lucide-react";
import { useState } from "react";

interface VaultItem {
  id: string;
  type: 'power_phrase' | 'skill' | 'competency' | 'achievement';
  content: string;
  relevanceScore: number;
  used: boolean;
}

interface SmartVaultPanelProps {
  vaultSuggestions: VaultItem[];
  onUseItem: (item: VaultItem) => void;
  isLoading?: boolean;
}

export function SmartVaultPanel({ vaultSuggestions, onUseItem, isLoading }: SmartVaultPanelProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (item: VaultItem) => {
    navigator.clipboard.writeText(item.content);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getTypeColor = (type: VaultItem['type']) => {
    switch (type) {
      case 'power_phrase':
        return 'bg-primary/10 text-primary';
      case 'skill':
        return 'bg-accent/10 text-accent-foreground';
      case 'competency':
        return 'bg-secondary/10 text-secondary-foreground';
      case 'achievement':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeLabel = (type: VaultItem['type']) => {
    const labels = {
      'power_phrase': 'Key Achievement',
      'skill': 'Technical Skill',
      'competency': 'Soft Skill',
      'achievement': 'Achievement'
    };
    return labels[type] || type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle>Smart Vault Suggestions</CardTitle>
        </div>
        <CardDescription>
          AI-matched content from your Career Vault
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                <div className="h-16 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        ) : vaultSuggestions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No vault content available yet.</p>
            <p className="text-sm mt-1">Build your Career Vault to get smart suggestions.</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {vaultSuggestions.map((item) => (
                <div
                  key={item.id}
                  className={`border rounded-lg p-4 space-y-3 transition-all ${
                    item.used
                      ? 'bg-primary/5 border-primary/20'
                      : 'hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <Badge variant="outline" className={getTypeColor(item.type)}>
                        {getTypeLabel(item.type)}
                      </Badge>
                      <Badge variant="secondary">
                        {Math.round(item.relevanceScore * 100)}% match
                      </Badge>
                      {item.used && (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Used
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm leading-relaxed">{item.content}</p>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(item)}
                      className="gap-2"
                    >
                      <Copy className="h-3 w-3" />
                      {copiedId === item.id ? 'Copied!' : 'Copy'}
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => onUseItem(item)}
                      disabled={item.used}
                    >
                      {item.used ? 'Already Used' : 'Add to Resume'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
