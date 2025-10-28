import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Trash2, Check } from 'lucide-react';
import { findDuplicates, mergeItems, DuplicateGroup } from '@/lib/services/vaultDuplicateDetector';
import { useToast } from '@/hooks/use-toast';

interface DuplicateDetectorProps {
  vaultId: string;
}

export const DuplicateDetector = ({ vaultId }: DuplicateDetectorProps) => {
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedToKeep, setSelectedToKeep] = useState<Record<number, string>>({});
  const [isMerging, setIsMerging] = useState<number | null>(null);
  const { toast } = useToast();

  const loadDuplicates = async () => {
    setIsLoading(true);
    const groups = await findDuplicates(vaultId);
    setDuplicateGroups(groups);
    setIsLoading(false);
  };

  useEffect(() => {
    loadDuplicates();
  }, [vaultId]);

  const handleMerge = async (groupIndex: number) => {
    const group = duplicateGroups[groupIndex];
    const keepId = selectedToKeep[groupIndex];
    
    if (!keepId) {
      toast({
        title: "Select an item to keep",
        description: "Choose which version to keep before merging",
        variant: "destructive"
      });
      return;
    }

    const deleteIds = group.items.filter(item => item.id !== keepId).map(item => item.id);
    const itemType = group.items.find(item => item.id === keepId)?.item_type || '';

    setIsMerging(groupIndex);
    const success = await mergeItems(keepId, deleteIds, itemType);

    if (success) {
      toast({
        title: "Duplicates merged",
        description: `Kept 1 item and removed ${deleteIds.length} duplicate(s)`
      });
      await loadDuplicates();
    } else {
      toast({
        title: "Error",
        description: "Failed to merge duplicates",
        variant: "destructive"
      });
    }
    setIsMerging(null);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'power_phrase': return 'Achievement';
      case 'skill': return 'Skill';
      case 'competency': return 'Competency';
      default: return type;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <Copy className="h-6 w-6 animate-pulse text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Copy className="h-5 w-5" />
          Duplicate Detector
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Found {duplicateGroups.length} groups of similar items
        </p>
      </CardHeader>
      <CardContent>
        {duplicateGroups.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">✨</div>
            <p className="font-medium">No duplicates found!</p>
            <p className="text-sm text-muted-foreground">
              Your vault items are all unique
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {duplicateGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {group.items.length} similar items found
                  </p>
                  <Button
                    size="sm"
                    onClick={() => handleMerge(groupIndex)}
                    disabled={!selectedToKeep[groupIndex] || isMerging === groupIndex}
                  >
                    {isMerging === groupIndex ? (
                      <Copy className="h-4 w-4 animate-pulse" />
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Merge
                      </>
                    )}
                  </Button>
                </div>

                <div className="space-y-2">
                  {group.items.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedToKeep[groupIndex] === item.id
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-accent'
                      }`}
                      onClick={() => setSelectedToKeep(prev => ({ ...prev, [groupIndex]: item.id }))}
                    >
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5">
                          {selectedToKeep[groupIndex] === item.id ? (
                            <Check className="h-4 w-4 text-primary" />
                          ) : (
                            <div className="h-4 w-4 border rounded" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {getTypeLabel(item.item_type)}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {item.similarity}% match
                            </Badge>
                          </div>
                          <p className="text-sm">{item.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
