import { Button } from "@/components/ui/button";
import { Eye, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResumePreviewToggleProps {
  mode: 'preview' | 'edit';
  onModeChange: (mode: 'preview' | 'edit') => void;
}

export function ResumePreviewToggle({ mode, onModeChange }: ResumePreviewToggleProps) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-background p-1 gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onModeChange('preview')}
        className={cn(
          "relative",
          mode === 'preview' && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
        )}
      >
        <Eye className="h-4 w-4 mr-2" />
        Preview
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onModeChange('edit')}
        className={cn(
          "relative",
          mode === 'edit' && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
        )}
      >
        <Edit3 className="h-4 w-4 mr-2" />
        Visual Editor
      </Button>
    </div>
  );
}
