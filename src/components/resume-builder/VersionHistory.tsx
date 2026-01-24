import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow } from 'date-fns';
import { RotateCcw, GitCompare, Check } from 'lucide-react';
import type { RBVersion, ActionSource } from '@/types/resume-builder';

interface VersionHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versions: RBVersion[];
  currentContent: string;
  onRevert: (version: RBVersion) => void;
}

const actionLabels: Record<ActionSource, string> = {
  tighten: 'Tighten',
  executive: 'Executive',
  specific: 'More Specific',
  reduce_buzzwords: 'Reduce Buzzwords',
  match_jd: 'Match JD',
  conservative: 'Conservative',
  try_another: 'Try Another',
  micro_edit: 'Micro Edit',
  manual: 'Manual Edit',
  initial: 'Initial'
};

export function VersionHistory({
  open,
  onOpenChange,
  versions,
  currentContent,
  onRevert
}: VersionHistoryProps) {
  const [selectedVersion, setSelectedVersion] = useState<RBVersion | null>(null);
  const [compareMode, setCompareMode] = useState(false);

  const handleVersionClick = (version: RBVersion) => {
    setSelectedVersion(version);
    setCompareMode(false);
  };

  const formatContent = (content: string): string => {
    try {
      // Try to parse as JSON for prettier display
      const parsed = JSON.parse(content);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return content;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[500px] sm:max-w-[500px]">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            Version History
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCompareMode(!compareMode)}
              className={compareMode ? 'bg-primary text-primary-foreground' : ''}
            >
              <GitCompare className="h-4 w-4 mr-1.5" />
              Compare
            </Button>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Version List */}
          <ScrollArea className="h-[200px] rounded-md border">
            <div className="p-2 space-y-1">
              {versions.map((version) => (
                <button
                  key={version.id}
                  onClick={() => handleVersionClick(version)}
                  className={`w-full flex items-center gap-3 p-2 rounded-md text-left transition-colors ${
                    selectedVersion?.id === version.id 
                      ? 'bg-primary/10' 
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        Version {version.version_number}
                      </span>
                      {version.is_active && (
                        <Badge variant="secondary" className="text-xs">
                          <Check className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-xs">
                        {actionLabels[version.action_source] || version.action_source}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>

          {/* Content Preview */}
          {selectedVersion && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">
                  {compareMode ? 'Compare View' : 'Version Preview'}
                </h4>
                {!selectedVersion.is_active && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRevert(selectedVersion)}
                  >
                    <RotateCcw className="h-4 w-4 mr-1.5" />
                    Revert to This
                  </Button>
                )}
              </div>

              {compareMode ? (
                <Tabs defaultValue="current" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="current">Current</TabsTrigger>
                    <TabsTrigger value="selected">Version {selectedVersion.version_number}</TabsTrigger>
                  </TabsList>
                  <TabsContent value="current">
                    <ScrollArea className="h-[300px] rounded-md border bg-muted/30 p-3">
                      <pre className="text-xs whitespace-pre-wrap font-mono">
                        {formatContent(currentContent)}
                      </pre>
                    </ScrollArea>
                  </TabsContent>
                  <TabsContent value="selected">
                    <ScrollArea className="h-[300px] rounded-md border bg-muted/30 p-3">
                      <pre className="text-xs whitespace-pre-wrap font-mono">
                        {formatContent(selectedVersion.content)}
                      </pre>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              ) : (
                <ScrollArea className="h-[300px] rounded-md border bg-muted/30 p-3">
                  <pre className="text-xs whitespace-pre-wrap font-mono">
                    {formatContent(selectedVersion.content)}
                  </pre>
                </ScrollArea>
              )}
            </div>
          )}

          {!selectedVersion && versions.length > 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Select a version to preview
            </p>
          )}

          {versions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No version history yet
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
