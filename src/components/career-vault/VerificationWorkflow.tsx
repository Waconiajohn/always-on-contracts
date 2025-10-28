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
  table_name: string;
}

interface VerificationWorkflowProps {
  vaultId: string;
}

// Configuration for all vault tables
const TABLE_CONFIG = {
  vault_power_phrases: {
    contentField: 'power_phrase',
    evidenceField: 'impact_metrics',
    displayName: 'Achievement',
  },
  vault_confirmed_skills: {
    contentField: 'skill_name',
    evidenceField: 'custom_notes',
    displayName: 'Skill',
  },
  vault_hidden_competencies: {
    contentField: 'inferred_capability',
    evidenceField: 'evidence_from_resume',
    displayName: 'Competency',
  },
  vault_soft_skills: {
    contentField: 'skill_name',
    evidenceField: 'examples',
    displayName: 'Soft Skill',
  },
  vault_leadership_philosophy: {
    contentField: 'philosophy_statement',
    evidenceField: 'real_world_application',
    displayName: 'Leadership Philosophy',
  },
  vault_executive_presence: {
    contentField: 'presence_indicator',
    evidenceField: 'situational_example',
    displayName: 'Executive Presence',
  },
  vault_personality_traits: {
    contentField: 'trait_name',
    evidenceField: 'behavioral_evidence',
    displayName: 'Personality Trait',
  },
  vault_work_style: {
    contentField: 'preference_area',
    evidenceField: 'preference_description',
    displayName: 'Work Style',
  },
  vault_values_motivations: {
    contentField: 'value_name',
    evidenceField: 'manifestation',
    displayName: 'Core Value',
  },
  vault_behavioral_indicators: {
    contentField: 'specific_behavior',
    evidenceField: 'outcome_pattern',
    displayName: 'Behavioral Pattern',
  },
} as const;

export const VerificationWorkflow = ({ vaultId }: VerificationWorkflowProps) => {
  const [assumedItems, setAssumedItems] = useState<AssumedItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [evidence, setEvidence] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  const loadAssumedItems = async () => {
    setIsLoading(true);
    
    const items: AssumedItem[] = [];

    // Fetch power phrases
    const { data: powerPhrases } = await supabase
      .from('vault_power_phrases')
      .select('id, power_phrase, quality_tier')
      .eq('vault_id', vaultId)
      .eq('quality_tier', 'assumed');

    if (powerPhrases) {
      items.push(...powerPhrases.map(p => ({
        id: p.id,
        content: p.power_phrase || '',
        item_type: 'vault_power_phrases',
        table_name: 'vault_power_phrases',
        verification_status: 'assumed'
      })));
    }

    // Fetch confirmed skills (uses user_id, no quality_tier - uses source='inferred' instead)
    const { data: skills } = await supabase
      .from('vault_confirmed_skills')
      .select('id, skill_name')
      .eq('user_id', vaultId)
      .eq('source', 'inferred');

    if (skills) {
      items.push(...skills.map(s => ({
        id: s.id,
        content: s.skill_name || '',
        item_type: 'vault_confirmed_skills',
        table_name: 'vault_confirmed_skills',
        verification_status: 'assumed'
      })));
    }

    // Fetch hidden competencies
    const { data: competencies } = await supabase
      .from('vault_hidden_competencies')
      .select('id, inferred_capability, quality_tier')
      .eq('vault_id', vaultId)
      .eq('quality_tier', 'assumed');

    if (competencies) {
      items.push(...competencies.map(c => ({
        id: c.id,
        content: c.inferred_capability || '',
        item_type: 'vault_hidden_competencies',
        table_name: 'vault_hidden_competencies',
        verification_status: 'assumed'
      })));
    }

    // Fetch soft skills
    const { data: softSkills } = await supabase
      .from('vault_soft_skills')
      .select('id, skill_name, quality_tier')
      .eq('vault_id', vaultId)
      .eq('quality_tier', 'assumed');

    if (softSkills) {
      items.push(...softSkills.map(s => ({
        id: s.id,
        content: s.skill_name || '',
        item_type: 'vault_soft_skills',
        table_name: 'vault_soft_skills',
        verification_status: 'assumed'
      })));
    }

    // Fetch leadership philosophy
    const { data: leadership } = await supabase
      .from('vault_leadership_philosophy')
      .select('id, philosophy_statement, quality_tier')
      .eq('vault_id', vaultId)
      .eq('quality_tier', 'assumed');

    if (leadership) {
      items.push(...leadership.map(l => ({
        id: l.id,
        content: l.philosophy_statement || '',
        item_type: 'vault_leadership_philosophy',
        table_name: 'vault_leadership_philosophy',
        verification_status: 'assumed'
      })));
    }

    // Fetch executive presence
    const { data: execPresence } = await supabase
      .from('vault_executive_presence')
      .select('id, presence_indicator, quality_tier')
      .eq('vault_id', vaultId)
      .eq('quality_tier', 'assumed');

    if (execPresence) {
      items.push(...execPresence.map(e => ({
        id: e.id,
        content: e.presence_indicator || '',
        item_type: 'vault_executive_presence',
        table_name: 'vault_executive_presence',
        verification_status: 'assumed'
      })));
    }

    // Fetch personality traits
    const { data: traits } = await supabase
      .from('vault_personality_traits')
      .select('id, trait_name, quality_tier')
      .eq('vault_id', vaultId)
      .eq('quality_tier', 'assumed');

    if (traits) {
      items.push(...traits.map(t => ({
        id: t.id,
        content: t.trait_name || '',
        item_type: 'vault_personality_traits',
        table_name: 'vault_personality_traits',
        verification_status: 'assumed'
      })));
    }

    // Fetch work style
    const { data: workStyle } = await supabase
      .from('vault_work_style')
      .select('id, preference_area, quality_tier')
      .eq('vault_id', vaultId)
      .eq('quality_tier', 'assumed');

    if (workStyle) {
      items.push(...workStyle.map(w => ({
        id: w.id,
        content: w.preference_area || '',
        item_type: 'vault_work_style',
        table_name: 'vault_work_style',
        verification_status: 'assumed'
      })));
    }

    // Fetch values & motivations
    const { data: values } = await supabase
      .from('vault_values_motivations')
      .select('id, value_name, quality_tier')
      .eq('vault_id', vaultId)
      .eq('quality_tier', 'assumed');

    if (values) {
      items.push(...values.map(v => ({
        id: v.id,
        content: v.value_name || '',
        item_type: 'vault_values_motivations',
        table_name: 'vault_values_motivations',
        verification_status: 'assumed'
      })));
    }

    // Fetch behavioral indicators
    const { data: behaviors } = await supabase
      .from('vault_behavioral_indicators')
      .select('id, specific_behavior, quality_tier')
      .eq('vault_id', vaultId)
      .eq('quality_tier', 'assumed');

    if (behaviors) {
      items.push(...behaviors.map(b => ({
        id: b.id,
        content: b.specific_behavior || '',
        item_type: 'vault_behavioral_indicators',
        table_name: 'vault_behavioral_indicators',
        verification_status: 'assumed'
      })));
    }

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
    const tableName = item.table_name as keyof typeof TABLE_CONFIG;

    let error = null;

    // Type-safe update based on table name
    if (tableName === 'vault_power_phrases') {
      const updateData: any = { quality_tier: status === 'verified' ? 'gold' : 'assumed', needs_user_review: false };
      if (status === 'verified' && evidence) updateData.impact_metrics = evidence;
      ({ error } = await supabase.from('vault_power_phrases').update(updateData).eq('id', item.id));
    } else if (tableName === 'vault_confirmed_skills') {
      // vault_confirmed_skills uses 'source' instead of quality_tier
      const updateData: any = { source: status === 'verified' ? 'verified' : 'inferred' };
      if (status === 'verified' && evidence) updateData.custom_notes = evidence;
      ({ error } = await supabase.from('vault_confirmed_skills').update(updateData).eq('id', item.id));
    } else if (tableName === 'vault_hidden_competencies') {
      const updateData: any = { quality_tier: status === 'verified' ? 'gold' : 'assumed', needs_user_review: false };
      if (status === 'verified' && evidence) updateData.evidence_from_resume = evidence;
      ({ error } = await supabase.from('vault_hidden_competencies').update(updateData).eq('id', item.id));
    } else if (tableName === 'vault_soft_skills') {
      const updateData: any = { quality_tier: status === 'verified' ? 'gold' : 'assumed', needs_user_review: false };
      if (status === 'verified' && evidence) updateData.examples = evidence;
      ({ error } = await supabase.from('vault_soft_skills').update(updateData).eq('id', item.id));
    } else if (tableName === 'vault_leadership_philosophy') {
      const updateData: any = { quality_tier: status === 'verified' ? 'gold' : 'assumed', needs_user_review: false };
      if (status === 'verified' && evidence) updateData.real_world_application = evidence;
      ({ error } = await supabase.from('vault_leadership_philosophy').update(updateData).eq('id', item.id));
    } else if (tableName === 'vault_executive_presence') {
      const updateData: any = { quality_tier: status === 'verified' ? 'gold' : 'assumed', needs_user_review: false };
      if (status === 'verified' && evidence) updateData.situational_example = evidence;
      ({ error } = await supabase.from('vault_executive_presence').update(updateData).eq('id', item.id));
    } else if (tableName === 'vault_personality_traits') {
      const updateData: any = { quality_tier: status === 'verified' ? 'gold' : 'assumed', needs_user_review: false };
      if (status === 'verified' && evidence) updateData.behavioral_evidence = evidence;
      ({ error } = await supabase.from('vault_personality_traits').update(updateData).eq('id', item.id));
    } else if (tableName === 'vault_work_style') {
      const updateData: any = { quality_tier: status === 'verified' ? 'gold' : 'assumed', needs_user_review: false };
      if (status === 'verified' && evidence) updateData.preference_description = evidence;
      ({ error } = await supabase.from('vault_work_style').update(updateData).eq('id', item.id));
    } else if (tableName === 'vault_values_motivations') {
      const updateData: any = { quality_tier: status === 'verified' ? 'gold' : 'assumed', needs_user_review: false };
      if (status === 'verified' && evidence) updateData.manifestation = evidence;
      ({ error } = await supabase.from('vault_values_motivations').update(updateData).eq('id', item.id));
    } else if (tableName === 'vault_behavioral_indicators') {
      const updateData: any = { quality_tier: status === 'verified' ? 'gold' : 'assumed', needs_user_review: false };
      if (status === 'verified' && evidence) updateData.outcome_pattern = evidence;
      ({ error } = await supabase.from('vault_behavioral_indicators').update(updateData).eq('id', item.id));
    }

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
    const config = TABLE_CONFIG[type as keyof typeof TABLE_CONFIG];
    return config?.displayName || type;
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
