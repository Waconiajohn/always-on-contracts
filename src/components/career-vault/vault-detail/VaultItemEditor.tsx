import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, X, Save } from 'lucide-react';

interface VaultItemEditorProps {
  item: any;
  itemType: 'power_phrase' | 'transferable_skill' | 'hidden_competency';
  vaultId: string;
  onClose: () => void;
  onSave: () => void;
}

export function VaultItemEditor({
  item,
  itemType,
  onClose,
  onSave
}: VaultItemEditorProps) {
  const [content, setContent] = useState(
    item.power_phrase || item.phrase || item.stated_skill || item.skill || 
    item.competency_area || item.inferred_capability || ''
  );
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const getTableName = () => {
    switch (itemType) {
      case 'power_phrase':
        return 'vault_power_phrases';
      case 'transferable_skill':
        return 'vault_transferable_skills';
      case 'hidden_competency':
        return 'vault_hidden_competencies';
      default:
        return 'vault_power_phrases';
    }
  };

  const getContentField = () => {
    switch (itemType) {
      case 'power_phrase':
        return 'power_phrase';
      case 'transferable_skill':
        return 'stated_skill';
      case 'hidden_competency':
        return 'competency_area';
      default:
        return 'power_phrase';
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const tableName = getTableName();
      const contentField = getContentField();

      const { error } = await supabase
        .from(tableName)
        .update({
          [contentField]: content,
          last_updated_at: new Date().toISOString()
        })
        .eq('id', item.id);

      if (error) throw error;

      toast({
        title: 'Saved',
        description: 'Item updated successfully'
      });

      onSave();
    } catch (error) {
      console.error('Error saving:', error);
      toast({
        title: 'Error',
        description: 'Failed to save changes',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border-primary">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Edit Item</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Content</Label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            placeholder="Enter your content here..."
          />
        </div>

        <div className="space-y-2">
          <Label>Quality Tier</Label>
          <div className="flex gap-2">
            <Badge variant={item.quality_tier === 'gold' ? 'default' : 'outline'}>
              🥇 Gold
            </Badge>
            <Badge variant={item.quality_tier === 'silver' ? 'default' : 'outline'}>
              🥈 Silver
            </Badge>
            <Badge variant={item.quality_tier === 'bronze' ? 'default' : 'outline'}>
              🥉 Bronze
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {item.quality_tier === 'gold' && 'Gold tier: Includes strategic context and measurable impact'}
            {item.quality_tier === 'silver' && 'Silver tier: Good quality, could add more context'}
            {item.quality_tier === 'bronze' && 'Bronze tier: Basic statement, needs quantification'}
            {item.quality_tier === 'assumed' && 'Assumed: Needs review and validation'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
