import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Gem, 
  User, 
  Blend,
  Save,
  RotateCcw,
  Copy,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

interface BlendEditorProps {
  idealContent: string;
  personalizedContent: string;
  initialContent?: 'ideal' | 'personalized';
  onSave: (blendedContent: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function BlendEditor({
  idealContent,
  personalizedContent,
  initialContent = 'personalized',
  onSave,
  onCancel,
  isLoading = false,
}: BlendEditorProps) {
  const [blendedContent, setBlendedContent] = useState(
    initialContent === 'ideal' ? idealContent : personalizedContent
  );
  const [hasChanges, setHasChanges] = useState(false);

  const handleContentChange = useCallback((value: string) => {
    setBlendedContent(value);
    setHasChanges(true);
  }, []);

  const handleReset = useCallback(() => {
    setBlendedContent(personalizedContent);
    setHasChanges(false);
  }, [personalizedContent]);

  const handleUseIdeal = useCallback(() => {
    setBlendedContent(idealContent);
    setHasChanges(true);
    toast.info('Switched to Industry Standard version');
  }, [idealContent]);

  const handleUsePersonalized = useCallback(() => {
    setBlendedContent(personalizedContent);
    setHasChanges(true);
    toast.info('Switched to Personalized version');
  }, [personalizedContent]);

  const handleCopyFromIdeal = useCallback(() => {
    navigator.clipboard.writeText(idealContent);
    toast.success('Industry Standard copied - paste into editor');
  }, [idealContent]);

  const handleCopyFromPersonalized = useCallback(() => {
    navigator.clipboard.writeText(personalizedContent);
    toast.success('Personalized copied - paste into editor');
  }, [personalizedContent]);

  const handleSave = useCallback(() => {
    onSave(blendedContent);
  }, [blendedContent, onSave]);

  const wordCount = blendedContent.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Blend className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Blend Editor</h2>
        </div>
        <Badge variant="outline">
          {wordCount} words
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Left: Reference Panels */}
        <div className="col-span-1 space-y-4">
          {/* Industry Standard Reference */}
          <Card className="border-primary/20">
            <CardHeader className="py-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Gem className="h-4 w-4 text-primary" />
                  Industry Standard
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleCopyFromIdeal}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={handleUseIdeal}
                  >
                    Use
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[200px] px-4 pb-4">
                <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {idealContent}
                </p>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Personalized Reference */}
          <Card>
            <CardHeader className="py-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Personalized
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleCopyFromPersonalized}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={handleUsePersonalized}
                  >
                    Use
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[200px] px-4 pb-4">
                <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {personalizedContent}
                </p>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3 inline mr-1" />
                <strong>Tip:</strong> Copy phrases from either version and blend them in the editor. Keep the structure from Industry Standard but inject your real evidence.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right: Editor */}
        <div className="col-span-2">
          <Card className="h-full">
            <CardHeader className="py-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Blend className="h-4 w-4 text-primary" />
                  Your Blended Version
                </CardTitle>
                {hasChanges && (
                  <Badge variant="secondary" className="text-xs">
                    Unsaved changes
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <Textarea
                value={blendedContent}
                onChange={(e) => handleContentChange(e.target.value)}
                className="min-h-[400px] resize-none font-mono text-sm leading-relaxed"
                placeholder="Edit your blended content here..."
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={handleReset}
          disabled={!hasChanges || isLoading}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Blended Version
          </Button>
        </div>
      </div>
    </div>
  );
}
