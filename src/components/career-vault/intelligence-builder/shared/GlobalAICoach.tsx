import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Check, X, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { CoachingType } from '@/hooks/useAICoach';

interface GlobalAICoachProps {
  isOpen: boolean;
  onClose: () => void;
  currentText: string;
  suggestion: string;
  isLoading: boolean;
  currentCoachingType: CoachingType;
  onSwitchType: (type: CoachingType) => void;
  onAccept: (text: string) => void;
  onReject: () => void;
}

export const GlobalAICoach = ({
  isOpen,
  onClose,
  currentText,
  suggestion,
  isLoading,
  currentCoachingType,
  onSwitchType,
  onAccept,
  onReject
}: GlobalAICoachProps) => {
  const [editedText, setEditedText] = useState(suggestion);

  // Update edited text when suggestion changes
  useState(() => {
    setEditedText(suggestion);
  });

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Career Coach
          </SheetTitle>
          <SheetDescription>
            Get AI-powered suggestions to enhance your career content
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Coaching Mode Tabs */}
          <Tabs value={currentCoachingType} onValueChange={(v) => onSwitchType(v as CoachingType)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="improve">Improve</TabsTrigger>
              <TabsTrigger value="quantify">Quantify</TabsTrigger>
              <TabsTrigger value="expand">Expand</TabsTrigger>
            </TabsList>

            <TabsContent value="improve" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                AI will rewrite your text to be more impactful, clear, and ATS-friendly with strong action verbs and keywords.
              </p>
            </TabsContent>

            <TabsContent value="quantify" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                AI will suggest specific metrics and numbers you can add to make your achievements more concrete and measurable.
              </p>
            </TabsContent>

            <TabsContent value="expand" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                AI will ask follow-up questions to help you remember and add more detail about impact, scope, tools, and challenges.
              </p>
            </TabsContent>
          </Tabs>

          {/* Original Text */}
          <Card>
            <CardContent className="pt-6">
              <label className="text-sm font-medium mb-2 block">Original Text</label>
              <div className="p-3 bg-muted rounded-md text-sm">
                {currentText}
              </div>
            </CardContent>
          </Card>

          {/* AI Suggestion */}
          {isLoading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  AI is analyzing and generating suggestions...
                </p>
              </CardContent>
            </Card>
          ) : suggestion ? (
            <Card className="border-primary/20">
              <CardContent className="pt-6 space-y-4">
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  AI Suggestion
                </label>
                <Textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  You can edit the suggestion before accepting it
                </p>
              </CardContent>
            </Card>
          ) : null}

          {/* Action Buttons */}
          {!isLoading && suggestion && (
            <div className="flex gap-3">
              <Button
                onClick={() => onAccept(editedText)}
                className="flex-1"
                size="lg"
              >
                <Check className="h-4 w-4 mr-2" />
                Accept & Apply
              </Button>
              <Button
                onClick={onReject}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                <X className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
