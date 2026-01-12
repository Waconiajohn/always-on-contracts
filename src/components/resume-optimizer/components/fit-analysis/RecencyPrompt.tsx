import { AlertTriangle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RecencyPromptProps {
  requirementText: string;
  evidenceYear?: number;
  onAddRecent?: () => void;
}

export function RecencyPrompt({ requirementText, evidenceYear, onAddRecent }: RecencyPromptProps) {
  const currentYear = new Date().getFullYear();
  const yearsAgo = evidenceYear ? currentYear - evidenceYear : null;
  
  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mt-2">
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            {yearsAgo 
              ? `This evidence is from ${yearsAgo} years ago.`
              : 'This evidence may be outdated.'}
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
            Do you have more recent experience with {requirementText.toLowerCase().slice(0, 50)}...? 
            Recent evidence is more compelling to hiring managers.
          </p>
          {onAddRecent && (
            <Button 
              size="sm" 
              variant="outline" 
              className="mt-2 h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-100"
              onClick={onAddRecent}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Recent Experience
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
