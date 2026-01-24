import { Button } from '@/components/ui/button';
import { 
  History, 
  Save,
  Sparkles,
  Target,
  Minimize2,
  MessageSquareOff,
  FileText,
  Shield,
  RefreshCw
} from 'lucide-react';
import type { ActionSource } from '@/types/resume-builder';

interface RewriteControlsProps {
  onRewrite: (action: ActionSource) => void;
  onShowHistory: () => void;
  onSave: () => void;
  isLoading: boolean;
  hasChanges: boolean;
  disabled?: boolean;
}

const rewriteActions: { action: ActionSource; label: string; icon: React.ElementType }[] = [
  { action: 'tighten', label: 'Tighten', icon: Minimize2 },
  { action: 'executive', label: 'Executive', icon: Sparkles },
  { action: 'specific', label: 'Specific', icon: Target },
  { action: 'reduce_buzzwords', label: 'Less Buzz', icon: MessageSquareOff },
  { action: 'match_jd', label: 'Match JD', icon: FileText },
  { action: 'conservative', label: 'Conservative', icon: Shield },
  { action: 'try_another', label: 'Try Another', icon: RefreshCw },
];

export function RewriteControls({
  onRewrite,
  onShowHistory,
  onSave,
  isLoading,
  hasChanges,
  disabled = false
}: RewriteControlsProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Rewrite Actions */}
      <div className="flex items-center gap-1 flex-wrap">
        {rewriteActions.map(({ action, label, icon: Icon }) => (
          <Button
            key={action}
            variant="outline"
            size="sm"
            onClick={() => onRewrite(action)}
            disabled={isLoading || disabled}
            className="h-8 px-2.5 text-xs"
          >
            <Icon className="h-3.5 w-3.5 mr-1.5" />
            {label}
          </Button>
        ))}
      </div>

      <div className="flex-1" />

      {/* Save & History */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onShowHistory}
          disabled={isLoading}
          className="h-8"
        >
          <History className="h-4 w-4 mr-1.5" />
          History
        </Button>
        
        {hasChanges && (
          <Button
            variant="default"
            size="sm"
            onClick={onSave}
            disabled={isLoading}
            className="h-8"
          >
            <Save className="h-4 w-4 mr-1.5" />
            Save
          </Button>
        )}
      </div>
    </div>
  );
}
