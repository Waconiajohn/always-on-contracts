import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, RefreshCw, AlertTriangle } from 'lucide-react';
import { getStaleItems, refreshItem, StaleItem } from '@/lib/services/vaultFreshnessManager';
import { useToast } from '@/hooks/use-toast';

interface FreshnessManagerProps {
  vaultId: string;
}

export const FreshnessManager = ({ vaultId }: FreshnessManagerProps) => {
  const [staleItems, setStaleItems] = useState<StaleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState<string | null>(null);
  const { toast } = useToast();

  const loadStaleItems = async () => {
    setIsLoading(true);
    const items = await getStaleItems(vaultId);
    setStaleItems(items);
    setIsLoading(false);
  };

  useEffect(() => {
    loadStaleItems();
  }, [vaultId]);

  const handleRefresh = async (itemId: string, itemType: string) => {
    setIsRefreshing(itemId);
    const success = await refreshItem(itemId, itemType, vaultId);
    
    if (success) {
      toast({
        title: "Item refreshed",
        description: "This item is now marked as current"
      });
      await loadStaleItems();
    } else {
      toast({
        title: "Error",
        description: "Failed to refresh item",
        variant: "destructive"
      });
    }
    setIsRefreshing(null);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'power_phrase': return 'Achievement';
      case 'skill': return 'Skill';
      case 'competency': return 'Competency';
      default: return type;
    }
  };

  const getAgeBadgeVariant = (days: number) => {
    if (days > 365) return 'destructive';
    if (days > 270) return 'default';
    return 'secondary';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Freshness Manager
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Items older than 6 months that may need updating
        </p>
      </CardHeader>
      <CardContent>
        {staleItems.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">✅</div>
            <p className="font-medium">All items are fresh!</p>
            <p className="text-sm text-muted-foreground">
              No items older than 6 months found
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {staleItems.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent transition-colors"
              >
                <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {getTypeLabel(item.item_type)}
                    </Badge>
                    <Badge variant={getAgeBadgeVariant(item.age_days)} className="text-xs">
                      {item.age_days} days old
                    </Badge>
                  </div>
                  <p className="text-sm font-medium line-clamp-2">{item.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Last updated: {new Date(item.last_updated_at).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRefresh(item.id, item.item_type)}
                  disabled={isRefreshing === item.id}
                >
                  {isRefreshing === item.id ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Refresh
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
