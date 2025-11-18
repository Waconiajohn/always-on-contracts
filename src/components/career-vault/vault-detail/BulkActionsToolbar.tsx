import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Sparkles, 
  Trash2, 
  Tag, 
  Loader2,
  X
} from 'lucide-react';

interface BulkActionsToolbarProps {
  selectedCount: number;
  vaultId: string;
  selectedItems: string[];
  onClearSelection: () => void;
  onComplete: () => void;
}

export function BulkActionsToolbar({
  selectedCount,
  vaultId,
  selectedItems,
  onClearSelection,
  onComplete
}: BulkActionsToolbarProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleBulkEnhance = async () => {
    setIsProcessing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('batch-enhance-items', {
        body: {
          vaultId,
          itemIds: selectedItems
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: 'Enhanced!',
          description: `${data.enhanced_count} items upgraded successfully`
        });
        onClearSelection();
        onComplete();
      }
    } catch (error) {
      console.error('Error in bulk enhance:', error);
      toast({
        title: 'Error',
        description: 'Failed to enhance items',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="border-primary bg-primary/5">
      <CardContent className="py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="default">{selectedCount} selected</Badge>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkEnhance}
                disabled={isProcessing}
                className="bg-gradient-to-r from-purple-500/10 to-blue-500/10"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Enhancing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3 w-3 mr-1" />
                    Bulk Enhance with AI
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
              >
                <Tag className="h-3 w-3 mr-1" />
                Add Tags
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClearSelection}
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
