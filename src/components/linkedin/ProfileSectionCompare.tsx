import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Check, Copy, Info } from 'lucide-react';
import { useState } from 'react';

interface ProfileSectionCompareProps {
  title: string;
  current?: string;
  suggested: string;
  rationale?: string;
  warnings?: string[];
  atsKeywords?: string[];
  onAccept: (finalText: string) => void;
  characterLimit: number;
  minLength?: number;
}

export const ProfileSectionCompare = ({
  title,
  current,
  suggested,
  rationale,
  warnings,
  atsKeywords,
  onAccept,
  characterLimit,
  minLength = 0
}: ProfileSectionCompareProps) => {
  const [editedText, setEditedText] = useState(suggested);
  const [accepted, setAccepted] = useState(false);

  const charCount = editedText.length;
  const isOverLimit = charCount > characterLimit;
  const isTooShort = charCount < minLength;
  
  const charCountColor = isOverLimit ? 'text-destructive' : 
                         charCount > characterLimit * 0.9 ? 'text-amber-600' : 
                         'text-muted-foreground';

  const handleAccept = () => {
    onAccept(editedText);
    setAccepted(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-mono ${charCountColor}`}>
              {charCount}/{characterLimit}
            </span>
            {accepted && (
              <Badge variant="default" className="bg-green-600">
                <Check className="h-3 w-3 mr-1" /> Accepted
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Warnings */}
        {warnings && warnings.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Review Required</AlertTitle>
            <AlertDescription className="space-y-1">
              {warnings.map((warning, idx) => (
                <div key={idx} className="text-sm">{warning}</div>
              ))}
            </AlertDescription>
          </Alert>
        )}

        {/* Character limit violation */}
        {isOverLimit && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              LinkedIn limit exceeded by {charCount - characterLimit} characters
            </AlertDescription>
          </Alert>
        )}

        {isTooShort && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Minimum {minLength} characters recommended
            </AlertDescription>
          </Alert>
        )}

        {/* ATS Keywords */}
        {atsKeywords && atsKeywords.length > 0 && (
          <div>
            <Label className="text-xs text-muted-foreground">
              Recommended ATS keywords for recruiters:
            </Label>
            <div className="flex flex-wrap gap-1 mt-2">
              {atsKeywords.map((kw, idx) => (
                <Badge 
                  key={idx} 
                  variant="outline" 
                  className="text-xs cursor-pointer hover:bg-primary/10"
                  onClick={() => {
                    // Insert keyword at end
                    setEditedText(prev => prev + ' ' + kw);
                  }}
                >
                  {kw}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Current vs Suggested */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {current && (
            <div>
              <Label className="text-xs text-muted-foreground">Current</Label>
              <div className="mt-1 p-3 bg-muted/50 rounded-md text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
                {current}
              </div>
            </div>
          )}
          <div className={current ? '' : 'md:col-span-2'}>
            <Label className="text-xs text-muted-foreground">AI Suggestion (Editable)</Label>
            <Textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="mt-1 font-mono text-sm"
              rows={10}
            />
          </div>
        </div>

        {/* Rationale */}
        {rationale && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Why this is better:</strong> {rationale}
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigator.clipboard.writeText(editedText)}
          >
            <Copy className="h-3 w-3 mr-1" /> Copy
          </Button>
          <Button
            size="sm"
            onClick={handleAccept}
            disabled={accepted || isOverLimit}
          >
            {accepted ? 'Accepted' : 'Accept & Apply'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
