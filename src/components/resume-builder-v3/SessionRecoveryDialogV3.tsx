// =====================================================
// SESSION RECOVERY DIALOG - V3
// =====================================================

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useResumeBuilderV3Store } from "@/stores/resumeBuilderV3Store";
import { Clock, FileText, RotateCcw } from "lucide-react";
import { STEP_LABELS } from "./constants";

interface SessionRecoveryDialogV3Props {
  open: boolean;
  onContinue: () => void;
  onStartFresh: () => void;
}

export function SessionRecoveryDialogV3({
  open,
  onContinue,
  onStartFresh,
}: SessionRecoveryDialogV3Props) {
  const { step, getSessionAge, fitAnalysis } = useResumeBuilderV3Store();

  return (
    <AlertDialog open={open}>
      <AlertDialogContent onEscapeKeyDown={() => onStartFresh()}>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Resume Session Found
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>You have an unfinished resume building session.</p>
            
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              {fitAnalysis && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Fit Score:</span>
                  <span className="text-primary">{fitAnalysis.fit_score}%</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Current Step:</span>
                <span>{STEP_LABELS[step] || `Step ${step}`}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Last updated: {getSessionAge()}</span>
              </div>
            </div>

            <p className="text-sm">
              Would you like to continue where you left off?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onStartFresh} className="gap-2">
            <RotateCcw className="h-4 w-4" />
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
