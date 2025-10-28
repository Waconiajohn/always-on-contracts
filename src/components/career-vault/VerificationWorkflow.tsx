import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AssumedItem {
  id: string;
  content: string;
  item_type: string;
  verification_status: string;
}

interface VerificationWorkflowProps {
  vaultId: string;
}

export const VerificationWorkflow = ({ vaultId }: VerificationWorkflowProps) => {
  const [assumedItems, setAssumedItems] = useState<AssumedItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [evidence, setEvidence] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  const loadAssumedItems = async () => {
    setIsLoading(true);
    
    const { data: powerPhrases } = await supabase
      .from('vault_power_phrases')
      .select('id, power_phrase, quality_tier')
      .eq('vault_id', vaultId)
      .eq('quality_tier', 'assumed');

    const { data: skills } = await supabase
      .from('vault_confirmed_skills')
      .select('id, skill_name, source')
      .eq('user_id', vaultId)
      .eq('source', 'inferred');

    const { data: competencies } = await supabase
      .from('vault_hidden_competencies')
      .select('id, inferred_capability, quality_tier')
      .eq('vault_id', vaultId)
      .eq('quality_tier', 'assumed');

    const items: AssumedItem[] = [
      ...(powerPhrases?.map(p => ({ 
        id: p.id, 
        content: p.power_phrase || '', 
        item_type: 'power_phrase',
        verification_status: p.quality_tier || 'assumed'
      })) || []),
      ...(skills?.map(s => ({ 
        id: s.id, 
        content: s.skill_name || '', 
        item_type: 'skill',
        verification_status: 'assumed'
      })) || []),
      ...(competencies?.map(c => ({ 
        id: c.id, 
        content: c.inferred_capability || '', 
        item_type: 'competency',
        verification_status: c.quality_tier || 'assumed'
      })) || [])
    ];

    setAssumedItems(items);
    setIsLoading(false);
  };

  useEffect(() => {
    loadAssumedItems();
  }, [vaultId]);

  const handleVerify = async (status: 'verified' | 'rejected') => {
    if (!assumedItems[currentIndex]) return;

    setIsVerifying(true);
    const item = assumedItems[currentIndex];
    const tableName = 
      item.item_type === 'power_phrase' ? 'vault_power_phrases' :
      item.item_type === 'skill' ? 'vault_confirmed_skills' :
      'vault_hidden_competencies';

    const updateData: any = { 
      quality_tier: status === 'verified' ? 'gold' : 'assumed',
      needs_user_review: false
    };
    
    // For power phrases, we can add evidence
    if (status === 'verified' && evidence && item.item_type === 'power_phrase') {
      updateData.impact_metrics = { evidence };
    }

    const { error } = await supabase
      .from(tableName)
      .update(updateData)
      .eq('id', item.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update verification status",
        variant: "destructive"
      });
    } else {
      toast({
        title: status === 'verified' ? "Item verified" : "Item rejected",
        description: `Successfully ${status} the item`
      });
      
      setEvidence('');
      if (currentIndex < assumedItems.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        await loadAssumedItems();
        setCurrentIndex(0);
      }
    }
    setIsVerifying(false);
  };

  const handleSkip = () => {
    setEvidence('');
    if (currentIndex < assumedItems.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
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
            <AlertCircle className="h-6 w-6 animate-pulse text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentItem = assumedItems[currentIndex];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Verification Workflow
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {assumedItems.length} items need verification
        </p>
      </CardHeader>
      <CardContent>
        {assumedItems.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🎉</div>
            <p className="font-medium">All items verified!</p>
            <p className="text-sm text-muted-foreground">
              No assumed items remaining
            </p>
          </div>
        ) : currentItem ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="outline">
                {getTypeLabel(currentItem.item_type)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {currentIndex + 1} of {assumedItems.length}
              </span>
            </div>

            <div className="p-4 border rounded-lg bg-accent">
              <p className="font-medium mb-2">Review this item:</p>
              <p className="text-sm">{currentItem.content}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Add evidence (optional)
              </label>
              <Textarea
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                placeholder="Add specific examples, metrics, or context that verifies this item..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => handleVerify('verified')}
                disabled={isVerifying}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Verify
              </Button>
              <Button
                variant="outline"
                onClick={handleSkip}
                disabled={isVerifying}
              >
                Skip
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleVerify('rejected')}
                disabled={isVerifying}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};
