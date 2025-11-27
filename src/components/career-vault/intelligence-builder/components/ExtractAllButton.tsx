import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Zap } from 'lucide-react';

interface ExtractAllButtonProps {
  onExtractAll: () => void;
  isExtracting?: boolean;
}

export function ExtractAllButton({ onExtractAll, isExtracting = false }: ExtractAllButtonProps) {
  return (
    <div className="flex flex-col items-center gap-4 p-8 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg border-2 border-dashed border-purple-300 dark:border-purple-700">
      <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
        <Zap className="h-5 w-5" />
        <span className="font-semibold">Quick Start</span>
      </div>
      
      <div className="text-center space-y-2">
        <h3 className="font-bold text-lg">Extract All Intelligence</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Let AI analyze your entire career history and populate all 10 intelligence categories in one comprehensive extraction.
        </p>
      </div>

      <Button
        onClick={onExtractAll}
        disabled={isExtracting}
        size="lg"
        className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 hover:from-purple-700 hover:via-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
      >
        <span className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        {isExtracting ? (
          <>
            <Sparkles className="h-5 w-5 mr-2 animate-spin" />
            <span className="font-semibold">Extracting Intelligence...</span>
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5 mr-2 animate-pulse" />
            <span className="font-semibold">Extract All Intelligence</span>
            <Badge 
              variant="secondary" 
              className="ml-3 bg-white/20 text-white border-white/30 hover:bg-white/30 text-xs font-semibold"
            >
              Gemini 2.5 Pro
            </Badge>
          </>
        )}
      </Button>

      <p className="text-xs text-muted-foreground">
        ⚡ Takes 2-3 minutes • Powered by Google's most advanced AI
      </p>
    </div>
  );
}
