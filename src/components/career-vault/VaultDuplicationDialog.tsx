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
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";

interface VaultDuplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingVault: {
    extraction_timestamp?: string;
    extraction_item_count?: number;
    vault_name?: string;
  } | null;
  onReplace: () => void;
  onCancel: () => void;
}

export function VaultDuplicationDialog({
  open,
  onOpenChange,
  existingVault,
  onReplace,
  onCancel
}: VaultDuplicationDialogProps) {
  if (!existingVault) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Replace Existing Vault?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                You already have a career vault created on{' '}
                <strong>{formatDate(existingVault.extraction_timestamp)}</strong>.
              </p>
              
              {existingVault.extraction_item_count && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Current vault contains{' '}
                    <Badge variant="secondary" className="mx-1">
                      {existingVault.extraction_item_count} items
                    </Badge>
                  </span>
                </div>
              )}

              <div className="text-sm text-muted-foreground border-l-2 border-primary/20 pl-3">
                <strong>Note:</strong> AI extraction is non-deterministic. Each run may identify 
                slightly different insights based on context analysis.
              </div>

              <p className="text-sm font-medium">
                Would you like to replace your existing vault with a new analysis?
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            Keep Existing
          </AlertDialogCancel>
          <AlertDialogAction onClick={onReplace}>
            Replace with New Analysis
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
