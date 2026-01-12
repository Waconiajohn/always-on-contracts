import { useState } from 'react';
import { motion } from 'framer-motion';
import { History, Clock, RotateCcw, Eye, GitCompare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { VersionHistoryEntry, STEP_CONFIG } from '../types';
import { useOptimizerStore } from '@/stores/optimizerStore';
import { format } from 'date-fns';
import { VersionDiffViewer } from './VersionDiffViewer';

interface VersionHistoryProps {
  className?: string;
}

export function VersionHistory({ className }: VersionHistoryProps) {
  const { versionHistory, restoreVersion } = useOptimizerStore();
  const [previewEntry, setPreviewEntry] = useState<VersionHistoryEntry | null>(null);
  const [compareEntry, setCompareEntry] = useState<VersionHistoryEntry | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<'content' | 'diff'>('content');

  if (versionHistory.length === 0) {
    return null;
  }

  const formatTime = (timestamp: number) => {
    return format(new Date(timestamp), 'MMM d, h:mm a');
  };

  const getStepLabel = (step: string) => {
    return STEP_CONFIG[step as keyof typeof STEP_CONFIG]?.title || step;
  };

  const handleRestoreClick = (historyId: string) => {
    setConfirmRestoreId(historyId);
  };

  const handleConfirmRestore = () => {
    if (confirmRestoreId) {
      restoreVersion(confirmRestoreId);
      setConfirmRestoreId(null);
      setPreviewEntry(null);
      setCompareEntry(null);
      setIsOpen(false);
    }
  };

  const handleCompare = (entry: VersionHistoryEntry) => {
    // Find the previous version to compare against
    const currentIndex = versionHistory.findIndex(v => v.id === entry.id);
    if (currentIndex > 0) {
      setCompareEntry(versionHistory[currentIndex - 1]);
    } else {
      setCompareEntry(null);
    }
    setPreviewEntry(entry);
    setPreviewTab('diff');
  };

  // Reversed for display (newest first)
  const reversedHistory = versionHistory.slice().reverse();

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className={className}>
            <History className="h-4 w-4 mr-2" />
            History
            <Badge variant="secondary" className="ml-2">
              {versionHistory.length}
            </Badge>
          </Button>
        </SheetTrigger>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Version History
            </SheetTitle>
            <SheetDescription>
              View, compare, and restore previous versions
            </SheetDescription>
          </SheetHeader>
          
          <ScrollArea className="h-[calc(100vh-140px)] mt-6 pr-4">
            <div className="space-y-4">
              {reversedHistory.map((entry: VersionHistoryEntry, index: number) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative"
                  >
                    {/* Timeline connector - show for all except the last item */}
                    {index < reversedHistory.length - 1 && (
                      <div className="absolute left-4 top-12 w-0.5 h-[calc(100%+1rem)] bg-border" />
                    )}
                    
                    <div className="flex gap-4">
                      {/* Timeline dot */}
                      <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 rounded-lg border bg-card p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">
                                Resume Version
                              </p>
                              {index === 0 && (
                                <Badge variant="default" className="text-xs">
                                  Current
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatTime(entry.timestamp)}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {getStepLabel(entry.stepCompleted)}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mt-2">
                          {entry.changeDescription}
                        </p>
                        
                        <div className="flex gap-2 mt-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setPreviewEntry(entry);
                              setCompareEntry(null);
                              setPreviewTab('content');
                            }}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Preview
                          </Button>
                          {index < reversedHistory.length - 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCompare(entry)}
                            >
                              <GitCompare className="h-3 w-3 mr-1" />
                              Compare
                            </Button>
                          )}
                          {index !== 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRestoreClick(entry.id)}
                            >
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Restore
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={!!confirmRestoreId} onOpenChange={() => setConfirmRestoreId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore this version?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace your current resume with this version. Your current work will be saved to history before restoring.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRestore}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restore Version
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview/Compare Dialog */}
      <Dialog open={!!previewEntry} onOpenChange={() => { setPreviewEntry(null); setCompareEntry(null); }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Resume Version
              <Badge variant="outline" className="ml-2">
                {previewEntry && formatTime(previewEntry.timestamp)}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              {previewEntry?.changeDescription}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={previewTab} onValueChange={(v) => setPreviewTab(v as 'content' | 'diff')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="content" className="gap-2">
                <Eye className="h-4 w-4" />
                Content
              </TabsTrigger>
              <TabsTrigger value="diff" className="gap-2" disabled={!compareEntry}>
                <GitCompare className="h-4 w-4" />
                Diff {!compareEntry && '(select to compare)'}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="content" className="mt-4">
              <ScrollArea className="h-[50vh] pr-4">
                {previewEntry?.resumeSnapshot && (
                  <div className="border rounded-lg p-4">
                    <div className="text-sm whitespace-pre-wrap font-mono">
                      {previewEntry.resumeSnapshot}
                    </div>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="diff" className="mt-4">
              {compareEntry && previewEntry && (
                <VersionDiffViewer
                  oldContent={compareEntry.resumeSnapshot}
                  newContent={previewEntry.resumeSnapshot}
                  oldLabel={formatTime(compareEntry.timestamp)}
                  newLabel={formatTime(previewEntry.timestamp)}
                />
              )}
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => { setPreviewEntry(null); setCompareEntry(null); }}>
              Close
            </Button>
            <Button onClick={() => {
              if (previewEntry) {
                handleRestoreClick(previewEntry.id);
              }
            }}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restore This Version
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
