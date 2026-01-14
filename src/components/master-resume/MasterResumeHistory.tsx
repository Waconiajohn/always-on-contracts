import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { History, Clock, FileText, ChevronRight, RotateCcw, Loader2 } from "lucide-react";
import { MasterResumeHistory as HistoryType } from "@/types/master-resume";
import { formatDistanceToNow, format } from "date-fns";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface MasterResumeHistoryProps {
  history: HistoryType[];
  isLoading: boolean;
  onRestore?: (historyItem: HistoryType) => void;
  isRestoring?: boolean;
}

export const MasterResumeHistory = ({ history, isLoading, onRestore, isRestoring }: MasterResumeHistoryProps) => {
  const [selectedVersion, setSelectedVersion] = useState<HistoryType | null>(null);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <History className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Version History</h3>
        </div>
        <p className="text-sm text-muted-foreground">Loading history...</p>
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <History className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Version History</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          No previous versions yet. Your resume history will appear here as you make changes.
        </p>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <History className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Version History</h3>
          <Badge variant="secondary" className="ml-auto">
            {history.length} versions
          </Badge>
        </div>

        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {history.map((version) => (
              <button
                key={version.id}
                onClick={() => setSelectedVersion(version)}
                className="w-full p-3 rounded-lg border bg-card hover:bg-accent transition-colors text-left flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-muted">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Version {version.version}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>
            ))}
          </div>
        </ScrollArea>
      </Card>

      <Dialog open={!!selectedVersion} onOpenChange={() => setSelectedVersion(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Version {selectedVersion?.version}
              <span className="text-sm font-normal text-muted-foreground ml-2">
                {selectedVersion && format(new Date(selectedVersion.created_at), "PPpp")}
              </span>
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[500px] mt-4">
            <div className="whitespace-pre-wrap font-mono text-sm p-4 bg-muted rounded-lg">
              {selectedVersion?.content}
            </div>
          </ScrollArea>
          {onRestore && selectedVersion && (
            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => setSelectedVersion(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  onRestore(selectedVersion);
                  setSelectedVersion(null);
                }}
                disabled={isRestoring}
              >
                {isRestoring ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Restoring...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restore This Version
                  </>
                )}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
