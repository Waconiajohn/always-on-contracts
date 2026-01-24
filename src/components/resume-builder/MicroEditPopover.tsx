import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Wand2, 
  Loader2, 
  Check, 
  RotateCcw
} from 'lucide-react';

interface MicroEditPopoverProps {
  bulletText: string;
  onApply: (newText: string) => void;
  context?: {
    job_title?: string;
    company?: string;
    section_name?: string;
  };
  evidenceClaims?: Array<{
    claim: string;
    source: string;
  }>;
}

interface MicroEditResult {
  original: string;
  edited: string;
  changes_made: string[];
  evidence_used: string[];
  confidence: number;
}

export function MicroEditPopover({ 
  bulletText, 
  onApply, 
  context,
  evidenceClaims 
}: MicroEditPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [result, setResult] = useState<MicroEditResult | null>(null);

  const handleEdit = async () => {
    if (!instruction.trim()) {
      toast.error('Please enter an edit instruction');
      return;
    }

    setIsEditing(true);
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Please sign in');
      }

      const { data, error } = await supabase.functions.invoke('rb-micro-edit', {
        body: { 
          bullet_text: bulletText,
          edit_instruction: instruction,
          context,
          evidence_claims: evidenceClaims
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;
      setResult(data as MicroEditResult);
    } catch (err) {
      console.error('Micro-edit error:', err);
      toast.error('Failed to edit bullet');
    } finally {
      setIsEditing(false);
    }
  };

  const handleApply = () => {
    if (result?.edited) {
      onApply(result.edited);
      setIsOpen(false);
      setResult(null);
      setInstruction('');
      toast.success('Edit applied');
    }
  };

  const handleReset = () => {
    setResult(null);
    setInstruction('');
  };

  const quickActions = [
    { label: 'Add metrics', instruction: 'Add quantifiable metrics or numbers if supported by context' },
    { label: 'Make concise', instruction: 'Make this more concise while keeping impact' },
    { label: 'Add keywords', instruction: 'Incorporate relevant industry keywords naturally' },
    { label: 'Strengthen verbs', instruction: 'Use stronger action verbs' },
  ];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Wand2 className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="start">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm mb-2">Micro-Edit</h4>
            <div className="p-2 rounded bg-muted text-sm">
              "{bulletText.length > 100 ? bulletText.slice(0, 100) + '...' : bulletText}"
            </div>
          </div>

          {!result ? (
            <>
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-1">
                {quickActions.map((action) => (
                  <Badge
                    key={action.label}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => setInstruction(action.instruction)}
                  >
                    {action.label}
                  </Badge>
                ))}
              </div>

              {/* Custom Instruction */}
              <Textarea
                placeholder="Describe how to edit this bullet..."
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                className="min-h-[80px] text-sm"
              />

              <Button 
                onClick={handleEdit} 
                disabled={isEditing || !instruction.trim()}
                className="w-full"
                size="sm"
              >
                {isEditing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Editing...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Apply Edit
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              {/* Result Preview */}
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-muted-foreground">Edited version:</span>
                  <div className="p-2 rounded bg-primary/10 text-sm mt-1">
                    "{result.edited}"
                  </div>
                </div>

                {result.changes_made.length > 0 && (
                  <div>
                    <span className="text-xs text-muted-foreground">Changes made:</span>
                    <ul className="text-xs mt-1 space-y-1">
                      {result.changes_made.map((change, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <Check className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Confidence: {result.confidence}%</span>
                  {result.evidence_used.length > 0 && (
                    <span>Evidence used: {result.evidence_used.length}</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={handleReset}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Try Again
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={handleApply}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Apply
                </Button>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface BulletItemProps {
  text: string;
  index: number;
  onUpdate: (index: number, newText: string) => void;
  context?: {
    job_title?: string;
    company?: string;
    section_name?: string;
  };
  evidenceClaims?: Array<{
    claim: string;
    source: string;
  }>;
}

export function BulletItem({ text, index, onUpdate, context, evidenceClaims }: BulletItemProps) {
  return (
    <div className="group flex items-start gap-2 py-1">
      <span className="text-muted-foreground mt-0.5">•</span>
      <span className="flex-1 text-sm">{text}</span>
      <MicroEditPopover
        bulletText={text}
        onApply={(newText) => onUpdate(index, newText)}
        context={context}
        evidenceClaims={evidenceClaims}
      />
    </div>
  );
}
