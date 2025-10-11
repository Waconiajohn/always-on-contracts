import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, Trash2, AlertTriangle } from "lucide-react";
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
import { useState } from "react";

interface ResumeUploadChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChoice: (choice: 'replace' | 'enhance') => void;
  currentStats: {
    completionPercentage: number;
    totalIntelligence: number;
    milestoneCount: number;
  };
}

export const ResumeUploadChoiceModal = ({
  isOpen,
  onClose,
  onChoice,
  currentStats,
}: ResumeUploadChoiceModalProps) => {
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleEnhance = () => {
    onChoice('enhance');
    onClose();
  };

  const handleStartFresh = () => {
    setShowConfirmation(true);
  };

  const confirmStartFresh = () => {
    setShowConfirmation(false);
    onChoice('replace');
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">You Already Have a Career Vault</DialogTitle>
            <DialogDescription>
              Choose how you'd like to proceed with your new resume
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Current Progress */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current Progress:</span>
                <span className="text-sm text-muted-foreground">
                  {currentStats.completionPercentage}% Complete
                </span>
              </div>
              <Progress value={currentStats.completionPercentage} className="h-2" />
            </div>

            {/* Vault Stats */}
            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="font-medium mb-3">Your Vault Contains:</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-primary">✓</span>
                  <span>{currentStats.totalIntelligence} Total Intelligence Items</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-primary">✓</span>
                  <span>{currentStats.milestoneCount} Career Milestones</span>
                </div>
              </div>
            </div>

            {/* Choice Cards */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Enhance Option */}
              <button
                onClick={handleEnhance}
                className="relative rounded-lg border-2 border-primary/20 bg-card p-6 text-left hover:border-primary/40 hover:bg-accent transition-all"
              >
                <div className="absolute top-3 right-3">
                  <Badge variant="secondary">Recommended</Badge>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <RefreshCw className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">Enhance Vault</h3>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Keep all existing data</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Add new experiences from resume</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Grow your intelligence vault</span>
                  </p>
                </div>
              </button>

              {/* Replace Option */}
              <button
                onClick={handleStartFresh}
                className="relative rounded-lg border-2 border-destructive/20 bg-card p-6 text-left hover:border-destructive/40 hover:bg-accent transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <Trash2 className="h-5 w-5 text-destructive" />
                  </div>
                  <h3 className="font-semibold text-lg">Start Fresh</h3>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="flex items-start gap-2">
                    <span className="text-destructive mt-0.5">•</span>
                    <span>Clear all vault data</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-destructive mt-0.5">•</span>
                    <span>Begin with new resume</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-destructive mt-0.5">•</span>
                    <span>Complete reset</span>
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-destructive">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Cannot be undone</span>
                </div>
              </button>
            </div>

            {/* Comparison Table */}
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-medium">What Happens</th>
                    <th className="text-center p-3 font-medium">Enhance</th>
                    <th className="text-center p-3 font-medium">Start Fresh</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="p-3">Milestones</td>
                    <td className="text-center p-3 text-primary">Added</td>
                    <td className="text-center p-3 text-destructive">Deleted</td>
                  </tr>
                  <tr>
                    <td className="p-3">Skills</td>
                    <td className="text-center p-3 text-primary">Merged</td>
                    <td className="text-center p-3 text-destructive">Deleted</td>
                  </tr>
                  <tr>
                    <td className="p-3">Intelligence</td>
                    <td className="text-center p-3 text-primary">Added</td>
                    <td className="text-center p-3 text-destructive">Deleted</td>
                  </tr>
                  <tr>
                    <td className="p-3">Interviews</td>
                    <td className="text-center p-3 text-primary">Kept</td>
                    <td className="text-center p-3 text-destructive">Deleted</td>
                  </tr>
                  <tr>
                    <td className="p-3">Progress</td>
                    <td className="text-center p-3 text-muted-foreground">{currentStats.completionPercentage}% → Recalculated</td>
                    <td className="text-center p-3 text-muted-foreground">{currentStats.completionPercentage}% → 0%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Start Fresh */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all your Career Vault data including:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>{currentStats.totalIntelligence} intelligence items</li>
                <li>{currentStats.milestoneCount} career milestones</li>
                <li>All interview responses and progress</li>
              </ul>
              <p className="mt-3 font-medium text-destructive">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmStartFresh}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Delete Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
