import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Sparkles, User, Blend } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface ContentBlenderProps {
  idealContent: string;
  personalizedContent: string;
  onBlend: (blendedContent: string, blendRatio: number) => void;
  onCancel: () => void;
}

export const ContentBlender = ({
  idealContent,
  personalizedContent,
  onBlend,
  onCancel
}: ContentBlenderProps) => {
  const [blendRatio, setBlendRatio] = useState(50); // 0 = ideal, 100 = personalized
  const [customEdit, setCustomEdit] = useState('');
  const [previewMode, setPreviewMode] = useState<'auto' | 'manual'>('auto');

  // Simple blending: pick sentences from each based on ratio
  const generateBlendedContent = (): string => {
    if (previewMode === 'manual' && customEdit) {
      return customEdit;
    }

    const idealSentences = idealContent.split(/[.!?]+/).filter(s => s.trim());
    const personalizedSentences = personalizedContent.split(/[.!?]+/).filter(s => s.trim());

    const totalSentences = Math.max(idealSentences.length, personalizedSentences.length);
    const personalizedCount = Math.round((blendRatio / 100) * totalSentences);
    const idealCount = totalSentences - personalizedCount;

    const blended: string[] = [];

    // Interleave sentences based on ratio
    let idealIndex = 0;
    let personalizedIndex = 0;

    for (let i = 0; i < totalSentences; i++) {
      if (idealIndex < idealCount && idealIndex < idealSentences.length) {
        blended.push(idealSentences[idealIndex].trim() + '.');
        idealIndex++;
      }
      if (personalizedIndex < personalizedCount && personalizedIndex < personalizedSentences.length) {
        blended.push(personalizedSentences[personalizedIndex].trim() + '.');
        personalizedIndex++;
      }
    }

    return blended.join(' ');
  };

  const blendedPreview = generateBlendedContent();

  const handleApplyBlend = () => {
    onBlend(previewMode === 'manual' && customEdit ? customEdit : blendedPreview, blendRatio);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Blend className="h-5 w-5 text-primary" />
          <CardTitle>Content Blender</CardTitle>
        </div>
        <CardDescription>
          Mix industry-standard and personalized versions to create your ideal content
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Blend Ratio Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent-foreground" />
              <span>Industry Standard</span>
            </div>
            <Badge variant="outline">{100 - blendRatio}%</Badge>
            <Badge variant="outline">{blendRatio}%</Badge>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <span>Personalized</span>
            </div>
          </div>

          <Slider
            value={[blendRatio]}
            onValueChange={(value) => setBlendRatio(value[0])}
            min={0}
            max={100}
            step={5}
            className="w-full"
          />

          <div className="flex gap-2">
            <Button
              variant={blendRatio === 0 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setBlendRatio(0)}
            >
              All Industry
            </Button>
            <Button
              variant={blendRatio === 50 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setBlendRatio(50)}
            >
              50/50 Mix
            </Button>
            <Button
              variant={blendRatio === 100 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setBlendRatio(100)}
            >
              All Personal
            </Button>
          </div>
        </div>

        {/* Preview Modes */}
        <div className="flex gap-2">
          <Button
            variant={previewMode === 'auto' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreviewMode('auto')}
            className="flex-1"
          >
            Auto Blend
          </Button>
          <Button
            variant={previewMode === 'manual' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setPreviewMode('manual');
              if (!customEdit) setCustomEdit(blendedPreview);
            }}
            className="flex-1"
          >
            Manual Edit
          </Button>
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Preview:</h4>
          {previewMode === 'auto' ? (
            <div className="p-4 border rounded-lg bg-muted/30 text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
              {blendedPreview}
            </div>
          ) : (
            <Textarea
              value={customEdit}
              onChange={(e) => setCustomEdit(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
              placeholder="Edit the blended content manually..."
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={handleApplyBlend} className="flex-1">
            Apply Blended Content
          </Button>
          <Button onClick={onCancel} variant="outline">
            Cancel
          </Button>
        </div>

        {/* Tips */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>💡 <strong>Tip:</strong> Move the slider to adjust the mix</p>
          <p>🎯 <strong>Industry Standard</strong>: Professional, data-driven language</p>
          <p>✨ <strong>Personalized</strong>: Your unique experiences and achievements</p>
        </div>
      </CardContent>
    </Card>
  );
};
