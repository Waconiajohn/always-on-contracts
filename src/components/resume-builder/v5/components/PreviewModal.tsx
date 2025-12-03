/**
 * PreviewModal - Shows before/after comparison before applying changes
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
  originalText: string;
  newText: string;
  changeType: 'conservative' | 'moderate' | 'aggressive' | 'bridge' | 'custom';
  reason?: string;
}

const changeTypeLabels = {
  conservative: {
    label: 'Conservative',
    description: 'Minor polish while preserving your voice',
    variant: 'secondary' as const,
  },
  moderate: {
    label: 'Moderate',
    description: 'Balanced optimization with key job terms',
    variant: 'default' as const,
  },
  aggressive: {
    label: 'Aggressive',
    description: 'Maximum ATS optimization and impact',
    variant: 'destructive' as const,
  },
  bridge: {
    label: 'Bridge Experience',
    description: 'Maps your skills to job requirements',
    variant: 'outline' as const,
  },
  custom: {
    label: 'Custom',
    description: 'Your custom enhancement',
    variant: 'secondary' as const,
  },
};

export function PreviewModal({
  isOpen,
  onClose,
  onApply,
  originalText,
  newText,
  changeType,
  reason,
}: PreviewModalProps) {
  const typeInfo = changeTypeLabels[changeType];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Preview Change
            <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>
          </DialogTitle>
          <DialogDescription>{typeInfo.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Before */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Current Version
            </p>
            <div className="p-4 bg-muted/50 rounded-lg border border-border">
              <p className="text-sm leading-relaxed">{originalText}</p>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <div className="flex items-center gap-2 text-primary">
              <div className="h-px w-8 bg-primary/30" />
              <ArrowRight className="h-5 w-5" />
              <div className="h-px w-8 bg-primary/30" />
            </div>
          </div>

          {/* After */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              New Version
            </p>
            <div className="p-4 bg-green-500/5 rounded-lg border border-green-500/30">
              <p className="text-sm leading-relaxed">{newText}</p>
            </div>
          </div>

          {/* Reason if provided */}
          {reason && (
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-xs font-semibold text-primary mb-1 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Why this is better:
              </p>
              <p className="text-xs text-muted-foreground">{reason}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onApply} className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Apply This Version
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
