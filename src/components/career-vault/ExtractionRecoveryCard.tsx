import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, SkipForward } from "lucide-react";

interface ExtractionRecoveryCardProps {
  onRetry: () => void;
  onSkip: () => void;
  errorMessage?: string;
}

export const ExtractionRecoveryCard = ({ 
  onRetry, 
  onSkip, 
  errorMessage 
}: ExtractionRecoveryCardProps) => {
  return (
    <Card className="p-6 border-destructive/50 bg-destructive/5">
      <div className="flex flex-col items-center text-center gap-4">
        <AlertTriangle className="w-12 h-12 text-destructive" />
        
        <div>
          <h3 className="text-lg font-semibold mb-2">Extraction Taking Longer Than Expected</h3>
          <p className="text-sm text-muted-foreground mb-1">
            The AI analysis is taking longer than usual.
          </p>
          {errorMessage && (
            <p className="text-xs text-destructive mt-2 font-mono bg-destructive/10 p-2 rounded">
              {errorMessage}
            </p>
          )}
        </div>

        <div className="flex gap-3 w-full justify-center">
          <Button 
            onClick={onRetry}
            variant="default"
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Resume Extraction
          </Button>
          
          <Button 
            onClick={onSkip}
            variant="outline"
            className="gap-2"
          >
            <SkipForward className="w-4 h-4" />
            Skip to Dashboard
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Your partial progress has been saved and can be resumed anytime
        </p>
      </div>
    </Card>
  );
};
