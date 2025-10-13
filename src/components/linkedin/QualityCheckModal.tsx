import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

interface QualityIssue {
  type: 'error' | 'warning';
  message: string;
}

interface QualityCheckModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: string;
  onSave: () => void;
  onFix?: () => void;
}

export function QualityCheckModal({ open, onOpenChange, content, onSave, onFix }: QualityCheckModalProps) {
  const runChecks = (): QualityIssue[] => {
    const issues: QualityIssue[] = [];
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.split(/\s+/);
    const wordCount = words.length;

    // Critical checks (block save)
    const longSentences = sentences.filter(s => s.trim().split(/\s+/).length > 20);
    if (longSentences.length > 0) {
      issues.push({
        type: 'error',
        message: `${longSentences.length} sentence(s) exceed 20 words - split them up`
      });
    }

    const contractionCount = (content.match(/\b\w+[''](?:ll|re|s|t|ve|d|m)\b/gi) || []).length;
    if (contractionCount === 0) {
      issues.push({
        type: 'error',
        message: 'No contractions found - add "you\'ll," "we\'re," etc. for conversational tone'
      });
    }

    if (wordCount < 220) {
      issues.push({
        type: 'error',
        message: `Too short (${wordCount} words) - aim for 240-260 words`
      });
    }

    if (wordCount > 280) {
      issues.push({
        type: 'error',
        message: `Too long (${wordCount} words) - trim to 240-260 words`
      });
    }

    const forbiddenTerms = ['utilize', 'leverage', 'synergy', 'holistic', 'implement', 'execute'];
    const foundJargon = forbiddenTerms.filter(term => content.toLowerCase().includes(term));
    if (foundJargon.length > 0) {
      issues.push({
        type: 'error',
        message: `Remove jargon: ${foundJargon.join(', ')}`
      });
    }

    const hasCTA = /\?[^?]*$/.test(content.trim());
    if (!hasCTA) {
      issues.push({
        type: 'error',
        message: 'No question at the end - add a CTA to encourage engagement'
      });
    }

    // Warnings (allow override)
    const passiveVoiceCount = (content.match(/\b(was|were|been|being)\s+\w+ed\b/gi) || []).length;
    if (passiveVoiceCount > 2) {
      issues.push({
        type: 'warning',
        message: `${passiveVoiceCount} passive voice instances - consider active voice`
      });
    }

    return issues;
  };

  const issues = runChecks();
  const errors = issues.filter(i => i.type === 'error');
  const warnings = issues.filter(i => i.type === 'warning');
  const canSave = errors.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quality Check</DialogTitle>
          <DialogDescription>
            {canSave
              ? 'Content passes quality checks!'
              : 'Fix these issues before saving to ensure authenticity'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {errors.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-destructive flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Critical Issues ({errors.length})
              </h4>
              <ul className="space-y-1">
                {errors.map((issue, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-destructive">•</span>
                    {issue.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {warnings.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-yellow-700 dark:text-yellow-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Warnings ({warnings.length})
              </h4>
              <ul className="space-y-1">
                {warnings.map((issue, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-yellow-600">•</span>
                    {issue.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {canSave && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">Ready to save!</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {!canSave && onFix && (
            <Button variant="secondary" onClick={onFix}>
              Help Me Fix
            </Button>
          )}
          <Button onClick={onSave} disabled={!canSave}>
            {canSave ? 'Save Draft' : 'Override & Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}