import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { HelpCircle, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';

interface QuestionCaptureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  questions: string[];
  onComplete?: () => void;
}

export function QuestionCaptureModal({
  open,
  onOpenChange,
  projectId,
  questions,
  onComplete,
}: QuestionCaptureModalProps) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const answeredCount = Object.values(answers).filter(a => a.trim().length > 0).length;
  const canSubmit = answeredCount > 0;

  const handleAnswerChange = (index: number, value: string) => {
    setAnswers(prev => ({ ...prev, [index]: value }));
  };

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

      // Convert answers to evidence entries
      const evidenceEntries = Object.entries(answers)
        .filter(([_, answer]) => answer.trim().length > 0)
        .map(([indexStr, answer]) => {
          const question = questions[parseInt(indexStr)];
          return {
            project_id: projectId,
            claim_text: answer.trim(),
            evidence_quote: `User response to: "${question}"`,
            source: 'user_provided',
            category: 'responsibility', // Default, can be refined
            confidence: '0.9', // String for DB compatibility
            is_active: true,
          };
        });

      if (evidenceEntries.length === 0) {
        toast.error('Please answer at least one question');
        return;
      }

      // Insert evidence entries
      const { error } = await supabase
        .from('rb_evidence')
        .insert(evidenceEntries);

      if (error) throw error;

      toast.success(`Added ${evidenceEntries.length} evidence item${evidenceEntries.length > 1 ? 's' : ''}`);
      
      // Reset and close
      setAnswers({});
      setCurrentStep(0);
      onOpenChange(false);
      onComplete?.();
    } catch (err) {
      console.error('Failed to save answers:', err);
      toast.error('Failed to save your answers');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  if (questions.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <HelpCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Help Us Understand Your Experience</DialogTitle>
              <DialogDescription className="mt-1">
                Answer these questions to provide evidence for your resume
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-2">
          {/* Progress indicator */}
          <div className="flex items-center justify-between mb-4">
            <Badge variant="outline" className="text-xs">
              {answeredCount} of {questions.length} answered
            </Badge>
            <div className="flex gap-1">
              {questions.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-6 rounded-full transition-colors ${
                    answers[i]?.trim()
                      ? 'bg-primary'
                      : i === currentStep
                      ? 'bg-primary/40'
                      : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>

          <ScrollArea className="max-h-[400px] pr-4">
            <div className="space-y-6">
              {questions.map((question, index) => (
                <div
                  key={index}
                  className={`space-y-3 p-4 rounded-lg border transition-colors ${
                    index === currentStep
                      ? 'border-primary/50 bg-primary/5'
                      : 'border-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <Label className="text-sm font-medium leading-relaxed">
                      {question}
                    </Label>
                    {answers[index]?.trim() && (
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    )}
                  </div>
                  <Textarea
                    placeholder="Share specific examples, metrics, or details..."
                    value={answers[index] || ''}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    className="min-h-[80px] resize-none text-sm"
                    onFocus={() => setCurrentStep(index)}
                  />
                  <p className="text-xs text-muted-foreground">
                    <Sparkles className="inline h-3 w-3 mr-1" />
                    Be specific — include metrics and results when possible
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          {currentStep < questions.length - 1 && !answers[currentStep]?.trim() && (
            <Button variant="outline" onClick={handleSkip}>
              Skip This Question
            </Button>
          )}
          <Button onClick={handleSubmit} disabled={!canSubmit || saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Save {answeredCount} Answer{answeredCount !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
