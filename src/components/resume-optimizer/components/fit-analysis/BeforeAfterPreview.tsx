import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Check, 
  X, 
  Copy, 
  RefreshCw,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface RewriteOption {
  id: string;
  bullet: string;
  improvements: string[];
  focus: string;
}

interface BeforeAfterPreviewProps {
  originalBullet: string;
  rewriteOptions: RewriteOption[];
  onAccept: (bullet: string) => void;
  onReject: () => void;
  onRegenerate: () => void;
  isLoading?: boolean;
  className?: string;
}

export function BeforeAfterPreview({
  originalBullet,
  rewriteOptions,
  onAccept,
  onReject,
  onRegenerate,
  isLoading,
  className,
}: BeforeAfterPreviewProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedOption = rewriteOptions[selectedIndex];

  if (!selectedOption) return null;

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : rewriteOptions.length - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev < rewriteOptions.length - 1 ? prev + 1 : 0));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedOption.bullet);
    toast.success('Copied to clipboard');
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">AI Rewrite Preview</span>
          </div>
          {rewriteOptions.length > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handlePrev}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs text-muted-foreground min-w-[3rem] text-center">
                {selectedIndex + 1} of {rewriteOptions.length}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleNext}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Comparison View */}
      <div className="p-4 space-y-4">
        {/* Before */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
              Before
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed pl-2 border-l-2 border-red-200">
            {originalBullet}
          </p>
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <div className="p-1.5 rounded-full bg-primary/10">
            <ArrowRight className="h-3.5 w-3.5 text-primary" />
          </div>
        </div>

        {/* After */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
              After
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {selectedOption.focus}
            </Badge>
          </div>
          <p className="text-sm leading-relaxed pl-2 border-l-2 border-emerald-400 font-medium">
            {selectedOption.bullet}
          </p>
        </div>

        {/* Improvements */}
        {selectedOption.improvements.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {selectedOption.improvements.map((improvement, idx) => (
              <Badge 
                key={idx} 
                variant="secondary" 
                className="text-xs bg-emerald-100 text-emerald-700"
              >
                ✓ {improvement}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-3 border-t bg-muted/30 flex items-center gap-2">
        <Button
          size="sm"
          className="flex-1 gap-1.5"
          onClick={() => onAccept(selectedOption.bullet)}
        >
          <Check className="h-3.5 w-3.5" />
          Accept This Version
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={handleCopy}
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={onRegenerate}
          disabled={isLoading}
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={onReject}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  );
}
