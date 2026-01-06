import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Clock, FileText, Building2 } from 'lucide-react';
import { useOptimizerStore } from '@/stores/optimizerStore';
import { STEP_CONFIG } from '../types';

interface SessionRecoveryDialogProps {
  open: boolean;
  onContinue: () => void;
  onStartFresh: () => void;
}

export function SessionRecoveryDialog({
  open,
  onContinue,
  onStartFresh,
}: SessionRecoveryDialogProps) {
  const { jobTitle, company, currentStep, getSessionAge } = useOptimizerStore();
  
  const stepConfig = STEP_CONFIG[currentStep];
  const sessionAge = getSessionAge();

  return (
    <AlertDialog 
      open={open} 
      onOpenChange={(isOpen) => {
        // Prevent closing by clicking outside or pressing Escape
        // User must choose an explicit action
        if (!isOpen) return;
      }}
    >
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Resume Session Found
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              You have an unfinished resume optimization session. Would you like to continue where you left off?
            </p>
            
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              {jobTitle && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{jobTitle}</span>
                </div>
              )}
              {company && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{company}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Last saved {sessionAge}</span>
              </div>
              <div className="pt-2">
                <Badge variant="secondary">
                  {stepConfig?.icon} Step: {stepConfig?.title}
                </Badge>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onStartFresh}>
            Start Fresh
          </AlertDialogCancel>
          <AlertDialogAction onClick={onContinue}>
            Continue Session
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
