import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  XCircle,
  Lightbulb,
  Send
} from 'lucide-react';

interface DisputeGapModalProps {
  isOpen: boolean;
  onClose: () => void;
  requirementId: string;
  requirementText: string;
  currentCategory: string;
  gapExplanation?: string;
  jobDescription: string;
  onDisputeResolved: (result: DisputeResult) => void;
}

export interface DisputeResult {
  newCategory: string;
  categoryChanged: boolean;
  reasoning: string;
  newWhyQualified?: string;
  newGapExplanation?: string;
  suggestedBullet?: string;
  confidenceLevel: string;
  followUpQuestion?: string;
}

const CATEGORY_STYLES = {
  'HIGHLY QUALIFIED': {
    icon: CheckCircle2,
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/30'
  },
  'PARTIALLY QUALIFIED': {
    icon: AlertCircle,
    color: 'text-muted-foreground',
    bg: 'bg-muted',
    border: 'border-muted-foreground/30'
  },
  'EXPERIENCE GAP': {
    icon: XCircle,
    color: 'text-muted-foreground',
    bg: 'bg-muted/50',
    border: 'border-muted-foreground/20'
  }
};

export function DisputeGapModal({
  isOpen,
  onClose,
  requirementId,
  requirementText,
  currentCategory,
  gapExplanation,
  jobDescription,
  onDisputeResolved
}: DisputeGapModalProps) {
  const { toast } = useToast();
  const [userEvidence, setUserEvidence] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<DisputeResult | null>(null);

  const handleSubmit = async () => {
    if (!userEvidence.trim()) {
      toast({
        title: 'Please provide evidence',
        description: 'Describe your experience or skills related to this requirement',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('dispute-gap', {
        body: {
          requirementId,
          requirementText,
          originalCategory: currentCategory,
          originalGapExplanation: gapExplanation,
          userEvidence,
          jobDescription
        }
      });

      if (error) throw error;

      setResult(data);
      onDisputeResolved(data);

      if (data.categoryChanged) {
        toast({
          title: 'Assessment Updated!',
          description: `Your qualification status has been upgraded based on your evidence.`,
        });
      } else {
        toast({
          title: 'Assessment Reviewed',
          description: 'The original assessment stands, but we\'ve noted your input.',
        });
      }
    } catch (err) {
      console.error('Dispute error:', err);
      toast({
        title: 'Review failed',
        description: 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setUserEvidence('');
    setResult(null);
    onClose();
  };

  const currentStyles = CATEGORY_STYLES[currentCategory as keyof typeof CATEGORY_STYLES] || CATEGORY_STYLES['EXPERIENCE GAP'];
  const CurrentIcon = currentStyles.icon;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Lightbulb className="h-5 w-5 text-primary" />
            Dispute This Assessment
          </DialogTitle>
          <DialogDescription>
            Tell us about your experience with this requirement. We'll re-evaluate your qualification.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Current Assessment */}
          <div className={cn(
            "p-4 rounded-xl border-2",
            currentStyles.border,
            currentStyles.bg
          )}>
            <div className="flex items-start gap-3">
              <CurrentIcon className={cn("h-5 w-5 mt-0.5", currentStyles.color)} />
              <div>
                <p className="font-medium text-sm">Current Assessment: {currentCategory}</p>
                <p className="text-sm text-muted-foreground mt-1">{requirementText}</p>
                {gapExplanation && (
                  <p className="text-sm text-muted-foreground mt-2 italic">
                    Gap: {gapExplanation}
                  </p>
                )}
              </div>
            </div>
          </div>

          {!result ? (
            <>
              {/* Evidence Input */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Your Evidence
                </label>
                <Textarea
                  value={userEvidence}
                  onChange={(e) => setUserEvidence(e.target.value)}
                  placeholder="Describe your relevant experience, projects, certifications, or skills that demonstrate you meet this requirement. Be specific with examples, metrics, and outcomes..."
                  className="min-h-[120px] resize-none"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Tip: Include specific examples, metrics, and outcomes for the best chance of upgrading your assessment.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting || !userEvidence.trim()}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Re-evaluating...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Evidence
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Result */}
              <div className={cn(
                "p-4 rounded-xl border-2",
                result.categoryChanged 
                  ? "border-primary/30 bg-primary/5" 
                  : "border-muted-foreground/30 bg-muted/30"
              )}>
                <div className="flex items-center gap-2 mb-3">
                  {result.categoryChanged ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className="font-semibold">
                    {result.categoryChanged ? 'Assessment Updated!' : 'Assessment Unchanged'}
                  </span>
                  <Badge variant="outline" className="ml-auto">
                    {result.newCategory}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{result.reasoning}</p>
              </div>

              {result.suggestedBullet && (
                <div className="p-4 rounded-xl border bg-card">
                  <p className="text-sm font-medium mb-2">Suggested Resume Bullet:</p>
                  <p className="text-sm">{result.suggestedBullet}</p>
                </div>
              )}

              {result.followUpQuestion && (
                <div className="p-4 rounded-xl border-2 border-primary/20 bg-primary/5">
                  <p className="text-sm font-medium mb-1">Need More Info:</p>
                  <p className="text-sm text-muted-foreground">{result.followUpQuestion}</p>
                </div>
              )}

              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
