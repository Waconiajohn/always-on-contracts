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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow } from 'date-fns';
import { RotateCcw, GitCompare, Check } from 'lucide-react';
import { VersionDiff, SideBySideDiff } from './VersionDiff';
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
  const [diffView, setDiffView] = useState<'unified' | 'side-by-side'>('unified');

  const handleVersionClick = (version: RBVersion) => {
    setSelectedVersion(version);
  };

  const activeVersion = versions.find(v => v.is_active);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:max-w-[600px]">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            Version History
            <div className="flex items-center gap-2">
              {selectedVersion && (
                <Tabs value={diffView} onValueChange={(v) => setDiffView(v as 'unified' | 'side-by-side')}>
                  <TabsList className="h-8">
                    <TabsTrigger value="unified" className="text-xs px-2">Unified</TabsTrigger>
                    <TabsTrigger value="side-by-side" className="text-xs px-2">Side-by-Side</TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCompareMode(!compareMode)}
                className={compareMode ? 'bg-primary text-primary-foreground' : ''}
              >
                <GitCompare className="h-4 w-4 mr-1.5" />
                Compare
              </Button>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Version List */}
          <ScrollArea className="h-[180px] rounded-md border">
            <div className="p-2 space-y-1">
              {versions.map((version) => (
                <button
                  key={version.id}
                  onClick={() => handleVersionClick(version)}
                  className={`w-full flex items-center gap-3 p-2 rounded-md text-left transition-colors ${
                    selectedVersion?.id === version.id 
                      ? 'bg-primary/10 ring-1 ring-primary/30' 
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

          {/* Content Preview / Diff View */}
          {selectedVersion && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">
                  {compareMode ? 'Comparing to Current' : 'Version Preview'}
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

              {compareMode && activeVersion ? (
                // Show diff between selected version and active version
                diffView === 'unified' ? (
                  <VersionDiff
                    originalText={selectedVersion.content}
                    modifiedText={currentContent}
                    originalLabel={`Version ${selectedVersion.version_number}`}
                    modifiedLabel="Current"
                  />
                ) : (
                  <SideBySideDiff
                    originalText={selectedVersion.content}
                    modifiedText={currentContent}
                    originalLabel={`Version ${selectedVersion.version_number}`}
                    modifiedLabel="Current"
                  />
                )
              ) : (
                // Show just the selected version content
                <ScrollArea className="h-[350px] rounded-md border bg-muted/30 p-4">
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {selectedVersion.content}
                  </pre>
                </ScrollArea>
              )}
            </div>
          )}

          {!selectedVersion && versions.length > 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Select a version to preview or compare
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
