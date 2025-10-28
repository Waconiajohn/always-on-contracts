import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VaultItem {
  id: string;
  category: string;
  content: any;
  quality_tier?: string | null;
  source?: string | null;
  usage_count?: number;
  last_updated_at?: string | null;
  created_at?: string;
}

interface VaultItemEditModalProps {
  item: VaultItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export const VaultItemEditModal = ({ item, open, onOpenChange, onSave }: VaultItemEditModalProps) => {
  const [mainContent, setMainContent] = useState('');
  const [evidence, setEvidence] = useState('');
  const [qualityTier, setQualityTier] = useState<string>('assumed');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (item) {
      setMainContent(item.content.text || '');
      setEvidence(item.content.evidence || item.content.examples || item.content.behavior || '');
      setQualityTier(item.quality_tier || 'assumed');
    }
  }, [item]);

  if (!item) return null;

  const getTableName = (category: string) => {
    const mapping: { [key: string]: string } = {
      'Power Phrase': 'vault_power_phrases',
      'Skill': 'vault_transferable_skills',
      'Competency': 'vault_hidden_competencies',
      'Soft Skill': 'vault_soft_skills',
      'Leadership': 'vault_leadership_philosophy',
      'Executive Presence': 'vault_executive_presence',
      'Personality': 'vault_personality_traits',
      'Work Style': 'vault_work_style',
      'Value': 'vault_values_motivations',
      'Behavior': 'vault_behavioral_indicators'
    };
    return mapping[category] || '';
  };

  const getMainContentField = (category: string) => {
    const mapping: { [key: string]: string } = {
      'Power Phrase': 'power_phrase',
      'Skill': 'stated_skill',
      'Competency': 'inferred_capability',
      'Soft Skill': 'skill_name',
      'Leadership': 'philosophy_statement',
      'Executive Presence': 'presence_indicator',
      'Personality': 'trait_name',
      'Work Style': 'preference_area',
      'Value': 'value_name',
      'Behavior': 'indicator_type'
    };
    return mapping[category] || '';
  };

  const getEvidenceField = (category: string): string | null => {
    const mapping: { [key: string]: string | null } = {
      'Power Phrase': null,
      'Skill': 'evidence',
      'Competency': null,
      'Soft Skill': 'examples',
      'Leadership': 'real_world_application',
      'Executive Presence': 'situational_example',
      'Personality': 'behavioral_evidence',
      'Work Style': 'preference_description',
      'Value': 'manifestation',
      'Behavior': 'specific_behavior'
    };
    return mapping[category] || null;
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const tableName = getTableName(item.category);
      const mainField = getMainContentField(item.category);
      const evidenceField = getEvidenceField(item.category);

      const updateData: any = {
        [mainField]: mainContent,
        quality_tier: qualityTier,
        last_updated_at: new Date().toISOString()
      };

      if (evidenceField && evidence) {
        updateData[evidenceField] = evidence;
      }

      const { error } = await supabase
        .from(tableName as any)
        .update(updateData)
        .eq('id', item.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Vault item updated successfully',
      });

      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating vault item:', error);
      toast({
        title: 'Error',
        description: 'Failed to update vault item',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>Edit {item.category}</span>
            <Badge variant="outline" className="text-xs">{item.category}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Main Content */}
          <div className="space-y-2">
            <Label htmlFor="main-content">
              {item.category === 'Personality' ? 'Trait Name' : 
               item.category === 'Work Style' ? 'Preference Area' :
               item.category === 'Value' ? 'Value Name' : 'Content'}
            </Label>
            <Textarea
              id="main-content"
              value={mainContent}
              onChange={(e) => setMainContent(e.target.value)}
              rows={3}
              placeholder="Enter main content..."
            />
          </div>

          {/* Evidence/Examples */}
          {getEvidenceField(item.category) && (
            <div className="space-y-2">
              <Label htmlFor="evidence">
                {item.category === 'Personality' ? 'Behavioral Evidence' :
                 item.category === 'Soft Skill' ? 'Examples' :
                 item.category === 'Work Style' ? 'Description' :
                 item.category === 'Value' ? 'Manifestation' :
                 item.category === 'Behavior' ? 'Specific Behavior' : 'Evidence'}
              </Label>
              <Textarea
                id="evidence"
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                rows={4}
                placeholder="Enter evidence or examples..."
              />
            </div>
          )}

          {/* Quality Tier */}
          <div className="space-y-2">
            <Label htmlFor="quality-tier">Quality Tier</Label>
            <Select value={qualityTier} onValueChange={setQualityTier}>
              <SelectTrigger id="quality-tier">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gold">Gold - Verified by user</SelectItem>
                <SelectItem value="silver">Silver - From resume evidence</SelectItem>
                <SelectItem value="bronze">Bronze - AI inferred with evidence</SelectItem>
                <SelectItem value="assumed">Assumed - Needs verification</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
