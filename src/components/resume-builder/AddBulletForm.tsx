import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, ChevronDown, Loader2, Sparkles } from 'lucide-react';

interface AddBulletFormProps {
  projectId: string;
  positions?: Array<{ title: string; company: string; index: number }>;
  prefillRequirement?: string;
  onBulletAdded?: () => void;
}

const ACTION_VERBS = [
  'Led', 'Developed', 'Managed', 'Designed', 'Implemented',
  'Increased', 'Reduced', 'Optimized', 'Created', 'Built',
  'Delivered', 'Launched', 'Established', 'Improved', 'Streamlined',
];

export function AddBulletForm({
  projectId,
  positions = [],
  prefillRequirement,
  onBulletAdded,
}: AddBulletFormProps) {
  const [isOpen, setIsOpen] = useState(!!prefillRequirement);
  const [saving, setSaving] = useState(false);
  
  const [position, setPosition] = useState<string>('');
  const [actionVerb, setActionVerb] = useState<string>('');
  const [achievement, setAchievement] = useState<string>(prefillRequirement || '');
  const [result, setResult] = useState<string>('');
  const [tools, setTools] = useState<string>('');

  // Validation constants
  const MAX_ACHIEVEMENT_LENGTH = 500;
  const MAX_RESULT_LENGTH = 200;
  const MAX_TOOLS_LENGTH = 200;

  const achievementError = achievement.length > MAX_ACHIEVEMENT_LENGTH
    ? `Achievement too long (${achievement.length}/${MAX_ACHIEVEMENT_LENGTH})`
    : '';
  const resultError = result.length > MAX_RESULT_LENGTH
    ? `Result too long (${result.length}/${MAX_RESULT_LENGTH})`
    : '';
  const toolsError = tools.length > MAX_TOOLS_LENGTH
    ? `Tools too long (${tools.length}/${MAX_TOOLS_LENGTH})`
    : '';

  const hasErrors = !!achievementError || !!resultError || !!toolsError;
  const canSubmit = achievement.trim().length > 0 && !hasErrors;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to continue');
        return;
      }

      // Construct the full bullet text
      const bulletParts = [
        actionVerb,
        achievement.trim(),
        result.trim() ? `resulting in ${result.trim()}` : '',
        tools.trim() ? `using ${tools.trim()}` : '',
      ].filter(Boolean);
      
      const fullBullet = bulletParts.join(' ');

      // Create evidence entry
      const { error } = await supabase
        .from('rb_evidence')
        .insert({
          project_id: projectId,
          claim_text: fullBullet,
          evidence_quote: 'User-provided accomplishment',
          source: 'user_provided',
          category: 'responsibility',
          confidence: '0.95',
          is_active: true,
          span_location: position ? { section: 'experience', jobIndex: parseInt(position) } : null,
        });

      if (error) throw error;

      toast.success('Bullet added successfully');
      
      // Reset form
      setPosition('');
      setActionVerb('');
      setAchievement('');
      setResult('');
      setTools('');
      setIsOpen(false);
      
      onBulletAdded?.();
    } catch (err) {
      console.error('Failed to add bullet:', err);
      toast.error('Failed to add bullet');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors text-left">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Plus className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Add New Bullet</p>
                <p className="text-xs text-muted-foreground">
                  Add an accomplishment not in your resume
                </p>
              </div>
            </div>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="p-4 pt-0 space-y-4 border-t">
            {/* Position Selection */}
            {positions.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs">Add to Position (optional)</Label>
                <Select value={position} onValueChange={setPosition}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a position..." />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((pos) => (
                      <SelectItem key={pos.index} value={pos.index.toString()}>
                        {pos.title} at {pos.company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Action Verb */}
            <div className="space-y-2">
              <Label className="text-xs">Start with a strong verb</Label>
              <div className="flex flex-wrap gap-1.5">
                {ACTION_VERBS.map((verb) => (
                  <button
                    key={verb}
                    type="button"
                    onClick={() => setActionVerb(verb)}
                    className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                      actionVerb === verb
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    }`}
                  >
                    {verb}
                  </button>
                ))}
              </div>
            </div>

            {/* What you did */}
            <div className="space-y-2">
              <Label className="text-xs">What did you do? *</Label>
              <Textarea
                placeholder="e.g., a cross-functional team of 8 engineers to deliver the new payment platform"
                value={achievement}
                onChange={(e) => setAchievement(e.target.value)}
                maxLength={MAX_ACHIEVEMENT_LENGTH + 50}
                className={`min-h-[60px] resize-none text-sm ${achievementError ? 'border-destructive' : ''}`}
              />
              {achievementError && (
                <p className="text-xs text-destructive">{achievementError}</p>
              )}
            </div>

            {/* Result/Metric */}
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-primary" />
                Result or metric (highly recommended)
              </Label>
              <Input
                placeholder="e.g., 40% increase in checkout conversion"
                value={result}
                onChange={(e) => setResult(e.target.value)}
                maxLength={MAX_RESULT_LENGTH + 20}
                className={`text-sm ${resultError ? 'border-destructive' : ''}`}
              />
              {resultError && (
                <p className="text-xs text-destructive">{resultError}</p>
              )}
            </div>

            {/* Tools/Keywords */}
            <div className="space-y-2">
              <Label className="text-xs">Tools or technologies used</Label>
              <Input
                placeholder="e.g., React, TypeScript, AWS Lambda"
                value={tools}
                onChange={(e) => setTools(e.target.value)}
                maxLength={MAX_TOOLS_LENGTH + 20}
                className={`text-sm ${toolsError ? 'border-destructive' : ''}`}
              />
              {toolsError && (
                <p className="text-xs text-destructive">{toolsError}</p>
              )}
            </div>

            {/* Preview */}
            {(actionVerb || achievement) && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Preview:</p>
                <p className="text-sm">
                  • {actionVerb} {achievement}
                  {result && ` resulting in ${result}`}
                  {tools && ` using ${tools}`}
                </p>
              </div>
            )}

            {/* Submit */}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={!canSubmit || saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Bullet'
                )}
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
