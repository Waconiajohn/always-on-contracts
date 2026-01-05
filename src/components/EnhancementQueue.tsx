import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { ResponseReviewModal } from './ResponseReviewModal';
import { Sparkles, TrendingUp, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface EnhancementItem {
  id: string;
  question: string;
  response: string;
  quality_score: number;
  completeness_score: number;
  specificity_score: number;
  intelligence_value: number;
  enhancement_priority: string;
  phase: string;
}

interface EnhancementQueueProps {
  vaultId: string;
  onEnhancementComplete?: () => void | Promise<void>;
}

export function EnhancementQueue({ vaultId, onEnhancementComplete }: EnhancementQueueProps) {
  const [queue, setQueue] = useState<EnhancementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<EnhancementItem | null>(null);

  const fetchQueue = async () => {
    const { data } = await supabase
      .from('vault_interview_responses')
      .select('*')
      .eq('vault_id', vaultId)
      .eq('needs_enhancement', true)
      .order('enhancement_priority', { ascending: false })
      .order('intelligence_value', { ascending: true });

    if (data) setQueue(data as any);
    setLoading(false);
  };

  const handleEnhancementSuccess = async () => {
    try {
      // Always refresh the local queue first
      await fetchQueue();
      
      // Try to refresh the parent dashboard (optional callback)
      if (onEnhancementComplete) {
        try {
          await onEnhancementComplete();
        } catch (error) {
          // Log but don't throw - parent refresh is non-critical
          logger.error('Failed to refresh parent dashboard', error);
          toast.error('Dashboard stats will refresh on next page load');
        }
      }
    } catch (error) {
      // Log queue refresh failure
      logger.error('Failed to refresh enhancement queue', error);
      toast.error('Queue refresh failed, please reload the page');
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [vaultId]);

  if (loading) {
    return <div className="flex justify-center p-8">Loading enhancement queue...</div>;
  }

  if (queue.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary" />
        <h3 className="text-xl font-semibold mb-2">All Caught Up!</h3>
        <p className="text-muted-foreground">
          No responses need enhancement right now. Great work!
        </p>
      </Card>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="h-4 w-4" />;
      case 'medium': return <TrendingUp className="h-4 w-4" />;
      case 'low': return <Sparkles className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <>
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Enhancement Queue</h3>
        <p className="text-sm text-muted-foreground">
          {queue.length} response{queue.length !== 1 ? 's' : ''} ready for enhancement to maximize your Career Vault intelligence
        </p>
      </div>

      <div className="grid gap-4">
        {queue.map((item) => (
          <Card key={item.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={getPriorityColor(item.enhancement_priority)}>
                    {getPriorityIcon(item.enhancement_priority)}
                    {item.enhancement_priority} priority
                  </Badge>
                  <Badge variant="outline">{item.phase}</Badge>
                </div>
                
                <p className="font-medium mb-2">{item.question}</p>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {item.response}
                </p>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-muted-foreground">Completeness</span>
                      <span className="font-medium">{item.completeness_score}/100</span>
                    </div>
                    <Progress value={item.completeness_score} className="h-1" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-muted-foreground">Specificity</span>
                      <span className="font-medium">{item.specificity_score}/100</span>
                    </div>
                    <Progress value={item.specificity_score} className="h-1" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-muted-foreground">Intelligence</span>
                      <span className="font-medium">{item.intelligence_value}/100</span>
                    </div>
                    <Progress value={item.intelligence_value} className="h-1" />
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedItem(item)}
              >
                <Sparkles className="h-4 w-4 mr-1" />
                Enhance
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {selectedItem && (
        <ResponseReviewModal
          open={!!selectedItem}
          onOpenChange={(open) => !open && setSelectedItem(null)}
          responseId={selectedItem.id}
          vaultId={vaultId}
          question={selectedItem.question}
          currentAnswer={selectedItem.response}
          currentScore={selectedItem.quality_score}
          onSuccess={handleEnhancementSuccess}
        />
      )}
    </>
  );
}