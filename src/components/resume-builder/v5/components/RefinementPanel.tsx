/**
 * RefinementPanel - Right column for AI-assisted editing
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  RefreshCw, 
  Wand2,
  Trash2,
  ThumbsUp
} from 'lucide-react';
import type { ResumeBullet } from '../types';

interface RefinementPanelProps {
  selectedBullet: ResumeBullet | null;
  onSave: (bulletId: string, newText: string) => void;
  onRegenerate: (bulletId: string) => void;
  onRemove: (bulletId: string) => void;
  isProcessing: boolean;
}

export function RefinementPanel({
  selectedBullet,
  onSave,
  onRegenerate,
  onRemove,
  isProcessing
}: RefinementPanelProps) {
  const [editedText, setEditedText] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  if (!selectedBullet) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-muted/20">
        <Sparkles className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="font-semibold mb-2">Select Content to Edit</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Click any highlighted section on the left to refine it with AI assistance
        </p>
      </div>
    );
  }

  const handleStartEdit = () => {
    setEditedText(selectedBullet.userEditedText || selectedBullet.text);
    setIsEditing(true);
  };

  const handleSave = () => {
    onSave(selectedBullet.id, editedText);
    setIsEditing(false);
  };

  const getConfidencePanel = () => {
    switch (selectedBullet.confidence) {
      case 'exact':
        return (
          <div className="space-y-3">
            <div className="flex items-start gap-2 p-3 bg-green-500/10 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Verified Content</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This matches your resume/vault exactly.
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Button
                onClick={handleStartEdit}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Enhance with AI
              </Button>
              <Button
                onClick={() => onSave(selectedBullet.id, selectedBullet.text)}
                variant="default"
                size="sm"
                className="w-full"
              >
                <ThumbsUp className="h-4 w-4 mr-2" />
                Keep As-Is
              </Button>
            </div>
          </div>
        );

      case 'enhanced':
        return (
          <div className="space-y-3">
            <div className="flex items-start gap-2 p-3 bg-yellow-500/10 rounded-lg">
              <Sparkles className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="font-medium text-sm">AI Enhanced Version</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Review AI improvements to your original content.
                </p>
              </div>
            </div>

            {selectedBullet.source.originalText && (
              <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Original:</p>
                <p className="text-sm">{selectedBullet.source.originalText}</p>
              </div>
            )}

            <div className="space-y-2">
              <Button
                onClick={handleStartEdit}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Edit Manually
              </Button>
              <Button
                onClick={() => onRegenerate(selectedBullet.id)}
                variant="outline"
                size="sm"
                className="w-full"
                disabled={isProcessing}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
            </div>
          </div>
        );

      case 'invented':
        return (
          <div className="space-y-3">
            <div className="flex items-start gap-2 p-3 bg-red-500/10 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-medium text-sm">AI Generated Content</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This was created to fill a gap. Please verify or edit.
                </p>
              </div>
            </div>

            {selectedBullet.gapAddressed && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Addresses requirement:
                </p>
                <p className="text-sm">{selectedBullet.gapAddressed}</p>
              </div>
            )}

            <div className="space-y-2">
              <Button
                onClick={handleStartEdit}
                variant="default"
                size="sm"
                className="w-full"
              >
                Edit to Match Reality
              </Button>
              <Button
                onClick={() => onRemove(selectedBullet.id)}
                variant="outline"
                size="sm"
                className="w-full text-red-500 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-background border-l">
      <div className="p-4 border-b">
        <h3 className="font-semibold flex items-center gap-2">
          <Wand2 className="h-4 w-4" />
          Refine Content
        </h3>
      </div>

      <ScrollArea className="flex-1 p-4">
        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="min-h-[120px]"
              placeholder="Edit content..."
            />
            <div className="flex gap-2">
              <Button onClick={handleSave} size="sm" className="flex-1">
                Save Changes
              </Button>
              <Button
                onClick={() => setIsEditing(false)}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          getConfidencePanel()
        )}

        {/* Show ATS keywords if available */}
        {selectedBullet.atsKeywords && selectedBullet.atsKeywords.length > 0 && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              ATS Keywords:
            </p>
            <div className="flex flex-wrap gap-1">
              {selectedBullet.atsKeywords.map((keyword, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
