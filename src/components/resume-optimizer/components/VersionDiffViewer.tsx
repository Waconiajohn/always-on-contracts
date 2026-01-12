import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Diff, Plus, Minus, Equal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  lineNumber: { old?: number; new?: number };
}

interface VersionDiffViewerProps {
  oldContent: string;
  newContent: string;
  oldLabel?: string;
  newLabel?: string;
  className?: string;
}

function computeDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const result: DiffLine[] = [];
  
  // Simple line-by-line diff using longest common subsequence concept
  let oldIdx = 0;
  let newIdx = 0;
  let oldLineNum = 1;
  let newLineNum = 1;
  
  while (oldIdx < oldLines.length || newIdx < newLines.length) {
    const oldLine = oldLines[oldIdx];
    const newLine = newLines[newIdx];
    
    if (oldIdx >= oldLines.length) {
      // Remaining new lines are additions
      result.push({
        type: 'added',
        content: newLine,
        lineNumber: { new: newLineNum++ }
      });
      newIdx++;
    } else if (newIdx >= newLines.length) {
      // Remaining old lines are removals
      result.push({
        type: 'removed',
        content: oldLine,
        lineNumber: { old: oldLineNum++ }
      });
      oldIdx++;
    } else if (oldLine === newLine) {
      // Lines match
      result.push({
        type: 'unchanged',
        content: oldLine,
        lineNumber: { old: oldLineNum++, new: newLineNum++ }
      });
      oldIdx++;
      newIdx++;
    } else {
      // Lines differ - check if old line exists later in new or vice versa
      const oldExistsInNew = newLines.slice(newIdx + 1).includes(oldLine);
      const newExistsInOld = oldLines.slice(oldIdx + 1).includes(newLine);
      
      if (!oldExistsInNew && newExistsInOld) {
        // Old line was removed
        result.push({
          type: 'removed',
          content: oldLine,
          lineNumber: { old: oldLineNum++ }
        });
        oldIdx++;
      } else if (oldExistsInNew && !newExistsInOld) {
        // New line was added
        result.push({
          type: 'added',
          content: newLine,
          lineNumber: { new: newLineNum++ }
        });
        newIdx++;
      } else {
        // Both modified - show as remove then add
        result.push({
          type: 'removed',
          content: oldLine,
          lineNumber: { old: oldLineNum++ }
        });
        result.push({
          type: 'added',
          content: newLine,
          lineNumber: { new: newLineNum++ }
        });
        oldIdx++;
        newIdx++;
      }
    }
  }
  
  return result;
}

export function VersionDiffViewer({
  oldContent,
  newContent,
  oldLabel = 'Previous',
  newLabel = 'Current',
  className
}: VersionDiffViewerProps) {
  const diffLines = useMemo(() => computeDiff(oldContent, newContent), [oldContent, newContent]);
  
  const stats = useMemo(() => {
    const added = diffLines.filter(l => l.type === 'added').length;
    const removed = diffLines.filter(l => l.type === 'removed').length;
    const unchanged = diffLines.filter(l => l.type === 'unchanged').length;
    return { added, removed, unchanged };
  }, [diffLines]);
  
  return (
    <div className={cn('rounded-lg border bg-card', className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Diff className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">Changes</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-200 bg-emerald-50">
            <Plus className="h-3 w-3" />
            {stats.added}
          </Badge>
          <Badge variant="outline" className="gap-1 text-red-600 border-red-200 bg-red-50">
            <Minus className="h-3 w-3" />
            {stats.removed}
          </Badge>
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            <Equal className="h-3 w-3" />
            {stats.unchanged}
          </Badge>
        </div>
      </div>
      
      {/* Labels */}
      <div className="flex border-b bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
        <div className="w-20 flex-shrink-0">Line</div>
        <div className="flex-1">
          <span className="text-red-600">{oldLabel}</span>
          <span className="mx-2">→</span>
          <span className="text-emerald-600">{newLabel}</span>
        </div>
      </div>
      
      {/* Diff Content */}
      <ScrollArea className="h-[400px]">
        <div className="font-mono text-xs">
          {diffLines.map((line, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.01, duration: 0.1 }}
              className={cn(
                'flex border-b border-border/50 px-4 py-1',
                line.type === 'added' && 'bg-emerald-50 dark:bg-emerald-950/20',
                line.type === 'removed' && 'bg-red-50 dark:bg-red-950/20'
              )}
            >
              {/* Line numbers */}
              <div className="w-20 flex-shrink-0 flex gap-2 text-muted-foreground select-none">
                <span className={cn('w-8 text-right', line.type === 'removed' && 'text-red-500')}>
                  {line.lineNumber.old || ''}
                </span>
                <span className={cn('w-8 text-right', line.type === 'added' && 'text-emerald-500')}>
                  {line.lineNumber.new || ''}
                </span>
              </div>
              
              {/* Change indicator */}
              <div className="w-6 flex-shrink-0 flex items-center justify-center">
                {line.type === 'added' && (
                  <Plus className="h-3 w-3 text-emerald-600" />
                )}
                {line.type === 'removed' && (
                  <Minus className="h-3 w-3 text-red-600" />
                )}
              </div>
              
              {/* Content */}
              <div className={cn(
                'flex-1 whitespace-pre-wrap break-all',
                line.type === 'added' && 'text-emerald-700 dark:text-emerald-300',
                line.type === 'removed' && 'text-red-700 dark:text-red-300 line-through',
                line.type === 'unchanged' && 'text-muted-foreground'
              )}>
                {line.content || ' '}
              </div>
            </motion.div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
