import { useMemo } from 'react';
import { diffLines, Change } from 'diff';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface VersionDiffProps {
  originalText: string;
  modifiedText: string;
  originalLabel?: string;
  modifiedLabel?: string;
}

export function VersionDiff({
  originalText,
  modifiedText,
  originalLabel = 'Original',
  modifiedLabel = 'Modified',
}: VersionDiffProps) {
  const diff = useMemo(() => {
    return diffLines(originalText, modifiedText);
  }, [originalText, modifiedText]);

  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    diff.forEach((change) => {
      if (change.added) {
        added += change.count || 0;
      } else if (change.removed) {
        removed += change.count || 0;
      }
    });
    return { added, removed };
  }, [diff]);

  return (
    <div className="space-y-3">
      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="text-primary">+{stats.added} line(s) added</span>
        <span className="text-destructive">-{stats.removed} line(s) removed</span>
      </div>

      {/* Unified Diff View */}
      <ScrollArea className="h-[400px] rounded-md border">
        <div className="p-4 font-mono text-sm">
          {diff.map((change, index) => (
            <DiffLine key={index} change={change} />
          ))}
        </div>
      </ScrollArea>

      {/* Labels */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{originalLabel}</span>
        <span>{modifiedLabel}</span>
      </div>
    </div>
  );
}

function DiffLine({ change }: { change: Change }) {
  const lines = change.value.split('\n').filter(Boolean);

  return (
    <>
      {lines.map((line, i) => (
        <div
          key={i}
          className={cn(
            'px-2 py-0.5 rounded-sm',
            change.added && 'bg-primary/10 text-primary border-l-2 border-primary',
            change.removed && 'bg-destructive/10 text-destructive border-l-2 border-destructive line-through',
            !change.added && !change.removed && 'text-muted-foreground'
          )}
        >
          <span className="inline-block w-4 text-muted-foreground opacity-50">
            {change.added ? '+' : change.removed ? '-' : ' '}
          </span>
          {line}
        </div>
      ))}
    </>
  );
}

/**
 * Side-by-side diff view for comparing two versions
 */
export function SideBySideDiff({
  originalText,
  modifiedText,
  originalLabel = 'Before',
  modifiedLabel = 'After',
}: VersionDiffProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Original */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">{originalLabel}</h4>
        <ScrollArea className="h-[300px] rounded-md border bg-muted/30">
          <div className="p-4 font-mono text-sm whitespace-pre-wrap">
            {originalText || <span className="text-muted-foreground italic">Empty</span>}
          </div>
        </ScrollArea>
      </div>

      {/* Modified */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-primary">{modifiedLabel}</h4>
        <ScrollArea className="h-[300px] rounded-md border bg-primary/5">
          <div className="p-4 font-mono text-sm whitespace-pre-wrap">
            {modifiedText || <span className="text-muted-foreground italic">Empty</span>}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
