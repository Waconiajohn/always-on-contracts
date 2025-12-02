/**
 * RefinementPanel - Sophisticated AI-assisted editing with full enhancement features
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useEnhanceBullet } from '@/hooks/useEnhanceBullet';
import { useRefinementSuggestions } from '@/hooks/useRefinementSuggestions';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  RefreshCw, 
  Wand2,
  Trash2,
  ThumbsUp,
  TrendingUp,
  Code,
  Crown,
  Hash,
  Eye,
  EyeOff,
  Lightbulb,
  ArrowRight,
  Copy
} from 'lucide-react';
import type { ResumeBullet } from '../types';

interface RefinementPanelProps {
  selectedBullet: ResumeBullet | null;
  onSave: (bulletId: string, newText: string) => void;
  onRegenerate: (bulletId: string) => void;
  onRemove: (bulletId: string) => void;
  isProcessing: boolean;
  jobDescription?: string;
}

export function RefinementPanel({
  selectedBullet,
  onSave,
  onRegenerate,
  onRemove,
  isProcessing,
  jobDescription
}: RefinementPanelProps) {
  const [editedText, setEditedText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [customGuidance, setCustomGuidance] = useState('');
  const [selectedAlternative, setSelectedAlternative] = useState<'conservative' | 'moderate' | 'aggressive' | null>(null);

  const { enhance, isEnhancing } = useEnhanceBullet({
    originalBullet: selectedBullet?.source?.originalText || selectedBullet?.text || '',
    currentBullet: editedText || selectedBullet?.text || '',
    requirement: (selectedBullet as any)?.gapAddressed || '',
    jobContext: jobDescription,
    onSuccess: (enhanced) => {
      setEditedText(enhanced);
      setIsEditing(true);
    }
  });

  const { suggestions, isLoading: isLoadingSuggestions, fetchSuggestions } = useRefinementSuggestions({
    bulletText: selectedBullet?.text || '',
    originalText: selectedBullet?.source?.originalText,
    jobDescription: jobDescription || '',
    requirement: (selectedBullet as any)?.gapAddressed,
    userExperience: null // Could pass vault data here
  });

  // Fetch suggestions when bullet is selected
  useEffect(() => {
    if (selectedBullet && jobDescription) {
      fetchSuggestions();
    }
  }, [selectedBullet?.id]);

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

  const handleQuickEnhance = (type: string) => {
    if (!editedText) {
      setEditedText(selectedBullet.text);
    }
    enhance(type);
  };

  const handleCustomEnhance = () => {
    if (!customGuidance.trim()) return;
    if (!editedText) {
      setEditedText(selectedBullet.text);
    }
    enhance(customGuidance);
    setCustomGuidance('');
  };

  const insertKeyword = (keyword: string) => {
    const currentText = editedText || selectedBullet.text;
    setEditedText(`${currentText} ${keyword}`);
    setIsEditing(true);
  };

  const applyAlternativeVersion = (version: 'conservative' | 'moderate' | 'aggressive') => {
    if (suggestions?.alternativeVersions[version]) {
      setEditedText(suggestions.alternativeVersions[version]);
      setSelectedAlternative(version);
      setIsEditing(true);
    }
  };

  const applyLikeKindSuggestion = (suggestion: string) => {
    setEditedText(suggestion);
    setIsEditing(true);
  };

  // Handle different content types (education, certification, skill)
  const contentType = (selectedBullet as any).contentType;
  
  if (contentType === 'education' || contentType === 'certification' || contentType === 'skill') {
    return (
      <div className="h-full flex flex-col bg-background border-l">
        <div className="p-4 border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            Edit {contentType === 'education' ? 'Education' : contentType === 'certification' ? 'Certification' : 'Skill'}
          </h3>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            <div className="flex items-start gap-2 p-3 bg-green-500/10 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Verified Content</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This comes from your resume or career vault
                </p>
              </div>
            </div>

            <Textarea
              value={editedText || selectedBullet.text}
              onChange={(e) => setEditedText(e.target.value)}
              className="min-h-[120px]"
              placeholder="Edit content..."
            />

            <div className="flex gap-2">
              <Button 
                onClick={() => onSave(selectedBullet.id, editedText || selectedBullet.text)} 
                size="sm" 
                className="flex-1"
              >
                Save Changes
              </Button>
              <Button
                onClick={() => onRemove(selectedBullet.id)}
                variant="outline"
                size="sm"
                className="text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  }

  const getConfidencePanel = () => {
    switch (selectedBullet.confidence) {
      case 'exact':
        return (
          <div className="space-y-4">
            <div className="flex items-start gap-2 p-3 bg-green-500/10 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Verified Content</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This matches your resume/vault exactly.
                </p>
              </div>
            </div>
            
            {/* Quick AI Enhancement Buttons */}
            <div className="space-y-2">
              <p className="text-xs font-semibold">Quick AI Enhancements:</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => handleQuickEnhance('quantifiable')}
                  variant="outline"
                  size="sm"
                  disabled={isEnhancing}
                  className="text-xs h-auto py-2"
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Quantifiable
                </Button>
                <Button
                  onClick={() => handleQuickEnhance('technical')}
                  variant="outline"
                  size="sm"
                  disabled={isEnhancing}
                  className="text-xs h-auto py-2"
                >
                  <Code className="h-3 w-3 mr-1" />
                  Technical
                </Button>
                <Button
                  onClick={() => handleQuickEnhance('leadership')}
                  variant="outline"
                  size="sm"
                  disabled={isEnhancing}
                  className="text-xs h-auto py-2"
                >
                  <Crown className="h-3 w-3 mr-1" />
                  Leadership
                </Button>
                <Button
                  onClick={() => handleQuickEnhance('keywords')}
                  variant="outline"
                  size="sm"
                  disabled={isEnhancing}
                  className="text-xs h-auto py-2"
                >
                  <Hash className="h-3 w-3 mr-1" />
                  Keywords
                </Button>
              </div>
            </div>

            {/* Alternative Versions from AI */}
            {suggestions?.alternativeVersions && (
              <div className="space-y-2">
                <p className="text-xs font-semibold flex items-center gap-1">
                  <Lightbulb className="h-3 w-3" />
                  AI-Suggested Alternatives:
                </p>
                <div className="space-y-2">
                  {(['conservative', 'moderate', 'aggressive'] as const).map((style) => (
                    <Card
                      key={style}
                      className={`p-3 cursor-pointer hover:border-primary transition-colors ${
                        selectedAlternative === style ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => applyAlternativeVersion(style)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <Badge variant={style === 'conservative' ? 'secondary' : style === 'moderate' ? 'default' : 'destructive'} className="text-[10px]">
                          {style.toUpperCase()}
                        </Badge>
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs leading-relaxed">
                        {suggestions.alternativeVersions[style]}
                      </p>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Like-Kind Experience Suggestions */}
            {suggestions?.likeKindSuggestions && suggestions.likeKindSuggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold flex items-center gap-1">
                  <ArrowRight className="h-3 w-3" />
                  Leverage Similar Experience:
                </p>
                {suggestions.likeKindSuggestions.map((item, i) => (
                  <Card
                    key={i}
                    className="p-3 cursor-pointer hover:border-primary transition-colors"
                    onClick={() => applyLikeKindSuggestion(item.suggestion)}
                  >
                    <div className="text-[10px] text-muted-foreground mb-1">
                      You have: <span className="font-semibold text-foreground">{item.candidateHas}</span> → Job wants: <span className="font-semibold text-foreground">{item.jobRequires}</span>
                    </div>
                    <p className="text-xs leading-relaxed mb-1">{item.suggestion}</p>
                    <p className="text-[10px] text-muted-foreground italic">{item.reasoning}</p>
                  </Card>
                ))}
              </div>
            )}

            {/* Missing Keywords */}
            {suggestions?.keywordsToAdd && suggestions.keywordsToAdd.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  Missing Keywords (click to add):
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.keywordsToAdd.map((kw, i) => (
                    <Badge
                      key={i}
                      variant={kw.relevance === 'critical' ? 'destructive' : 'secondary'}
                      className="cursor-pointer hover:scale-105 transition-transform text-xs"
                      onClick={() => insertKeyword(kw.keyword)}
                    >
                      {kw.keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            <div className="space-y-2">
              <Button
                onClick={handleStartEdit}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Edit Manually
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
          <div className="space-y-4">
            <div className="flex items-start gap-2 p-3 bg-yellow-500/10 rounded-lg">
              <Sparkles className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="font-medium text-sm">AI Enhanced Version</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Review AI improvements to your original content.
                </p>
              </div>
            </div>

            {/* Comparison: Original vs Enhanced */}
            {suggestions?.comparison && (
              <Card className="p-3">
                <p className="text-xs font-semibold mb-2">Original vs Enhanced:</p>
                <div className="space-y-2">
                  <div className="p-2 bg-muted/50 rounded">
                    <p className="text-[10px] text-muted-foreground mb-1">Original:</p>
                    <p className="text-xs">{suggestions.comparison.original}</p>
                  </div>
                  <div className="p-2 bg-primary/5 rounded">
                    <p className="text-[10px] text-muted-foreground mb-1">Enhanced:</p>
                    <p className="text-xs">{suggestions.comparison.enhanced}</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {suggestions.comparison.differences.map((diff, i) => (
                      <Badge key={i} variant="outline" className="text-[10px]">
                        {diff}
                      </Badge>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Show/Hide Original Toggle (fallback if no comparison) */}
            {!suggestions?.comparison && selectedBullet.source?.originalText && (
              <div className="space-y-2">
                <Button
                  onClick={() => setShowOriginal(!showOriginal)}
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                >
                  {showOriginal ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                  {showOriginal ? 'Hide' : 'Show'} Original
                </Button>
                {showOriginal && (
                  <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Original:</p>
                    <p className="text-sm">{selectedBullet.source.originalText}</p>
                  </div>
                )}
              </div>
            )}

            {/* Quick AI Enhancement Buttons */}
            <div className="space-y-2">
              <p className="text-xs font-semibold">Further enhance:</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => handleQuickEnhance('quantifiable')}
                  variant="outline"
                  size="sm"
                  disabled={isEnhancing}
                  className="text-xs h-auto py-2"
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Quantifiable
                </Button>
                <Button
                  onClick={() => handleQuickEnhance('technical')}
                  variant="outline"
                  size="sm"
                  disabled={isEnhancing}
                  className="text-xs h-auto py-2"
                >
                  <Code className="h-3 w-3 mr-1" />
                  Technical
                </Button>
                <Button
                  onClick={() => handleQuickEnhance('leadership')}
                  variant="outline"
                  size="sm"
                  disabled={isEnhancing}
                  className="text-xs h-auto py-2"
                >
                  <Crown className="h-3 w-3 mr-1" />
                  Leadership
                </Button>
                <Button
                  onClick={() => handleQuickEnhance('keywords')}
                  variant="outline"
                  size="sm"
                  disabled={isEnhancing}
                  className="text-xs h-auto py-2"
                >
                  <Hash className="h-3 w-3 mr-1" />
                  Keywords
                </Button>
              </div>
            </div>

            {/* Alternative Versions from AI */}
            {suggestions?.alternativeVersions && (
              <div className="space-y-2">
                <p className="text-xs font-semibold flex items-center gap-1">
                  <Lightbulb className="h-3 w-3" />
                  AI-Suggested Alternatives:
                </p>
                <div className="space-y-2">
                  {(['conservative', 'moderate', 'aggressive'] as const).map((style) => (
                    <Card
                      key={style}
                      className={`p-3 cursor-pointer hover:border-primary transition-colors ${
                        selectedAlternative === style ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => applyAlternativeVersion(style)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <Badge variant={style === 'conservative' ? 'secondary' : style === 'moderate' ? 'default' : 'destructive'} className="text-[10px]">
                          {style.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs leading-relaxed">
                        {suggestions.alternativeVersions[style]}
                      </p>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <Separator />

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
          <div className="space-y-4">
            <div className="flex items-start gap-2 p-3 bg-red-500/10 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-medium text-sm">AI Generated Content</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This was created to fill a gap. Please verify or edit.
                </p>
              </div>
            </div>

            {(selectedBullet as any).gapAddressed && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Addresses requirement:
                </p>
                <p className="text-sm">{(selectedBullet as any).gapAddressed}</p>
              </div>
            )}

            {/* Gap Filling Guidance */}
            {suggestions?.gapFillingGuidance && (
              <Card className="p-3 bg-amber-50 dark:bg-amber-950/20">
                <p className="text-xs font-semibold mb-1 flex items-center gap-1">
                  <Lightbulb className="h-3 w-3" />
                  How to Personalize This:
                </p>
                <p className="text-xs text-muted-foreground">{suggestions.gapFillingGuidance}</p>
              </Card>
            )}

            {/* Like-Kind Experience Suggestions */}
            {suggestions?.likeKindSuggestions && suggestions.likeKindSuggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold flex items-center gap-1">
                  <ArrowRight className="h-3 w-3" />
                  Use Similar Experience:
                </p>
                {suggestions.likeKindSuggestions.map((item, i) => (
                  <Card
                    key={i}
                    className="p-3 cursor-pointer hover:border-primary transition-colors"
                    onClick={() => applyLikeKindSuggestion(item.suggestion)}
                  >
                    <div className="text-[10px] text-muted-foreground mb-1">
                      You have: <span className="font-semibold text-foreground">{item.candidateHas}</span> → Job wants: <span className="font-semibold text-foreground">{item.jobRequires}</span>
                    </div>
                    <p className="text-xs leading-relaxed mb-1">{item.suggestion}</p>
                    <p className="text-[10px] text-muted-foreground italic">{item.reasoning}</p>
                  </Card>
                ))}
              </div>
            )}

            {/* Quick AI Enhancement Buttons */}
            <div className="space-y-2">
              <p className="text-xs font-semibold">Refine generated content:</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => handleQuickEnhance('quantifiable')}
                  variant="outline"
                  size="sm"
                  disabled={isEnhancing}
                  className="text-xs h-auto py-2"
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Quantifiable
                </Button>
                <Button
                  onClick={() => handleQuickEnhance('technical')}
                  variant="outline"
                  size="sm"
                  disabled={isEnhancing}
                  className="text-xs h-auto py-2"
                >
                  <Code className="h-3 w-3 mr-1" />
                  Technical
                </Button>
                <Button
                  onClick={() => handleQuickEnhance('leadership')}
                  variant="outline"
                  size="sm"
                  disabled={isEnhancing}
                  className="text-xs h-auto py-2"
                >
                  <Crown className="h-3 w-3 mr-1" />
                  Leadership
                </Button>
                <Button
                  onClick={() => handleQuickEnhance('keywords')}
                  variant="outline"
                  size="sm"
                  disabled={isEnhancing}
                  className="text-xs h-auto py-2"
                >
                  <Hash className="h-3 w-3 mr-1" />
                  Keywords
                </Button>
              </div>
            </div>

            {/* Alternative Versions from AI */}
            {suggestions?.alternativeVersions && (
              <div className="space-y-2">
                <p className="text-xs font-semibold flex items-center gap-1">
                  <Lightbulb className="h-3 w-3" />
                  AI-Suggested Alternatives:
                </p>
                <div className="space-y-2">
                  {(['conservative', 'moderate', 'aggressive'] as const).map((style) => (
                    <Card
                      key={style}
                      className={`p-3 cursor-pointer hover:border-primary transition-colors ${
                        selectedAlternative === style ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => applyAlternativeVersion(style)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <Badge variant={style === 'conservative' ? 'secondary' : style === 'moderate' ? 'default' : 'destructive'} className="text-[10px]">
                          {style.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs leading-relaxed">
                        {suggestions.alternativeVersions[style]}
                      </p>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <Separator />

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
        {isLoadingSuggestions && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Loading AI suggestions...
          </p>
        )}
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
              <Button onClick={handleSave} size="sm" className="flex-1" disabled={isEnhancing}>
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

        {/* Custom Enhancement Section */}
        {!isEditing && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold">Custom Enhancement:</p>
            <Textarea
              value={customGuidance}
              onChange={(e) => setCustomGuidance(e.target.value)}
              placeholder="E.g., 'Emphasize collaboration' or 'Add more about the technology stack'"
              className="min-h-[60px] text-sm"
            />
            <Button
              onClick={handleCustomEnhance}
              size="sm"
              variant="secondary"
              className="w-full"
              disabled={!customGuidance.trim() || isEnhancing}
            >
              <Sparkles className="h-3 w-3 mr-2" />
              Apply Custom Enhancement
            </Button>
          </div>
        )}

        {/* Show ATS keywords as clickable badges */}
        {selectedBullet.atsKeywords && selectedBullet.atsKeywords.length > 0 && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs font-semibold mb-2">
              ATS Keywords (click to insert):
            </p>
            <div className="flex flex-wrap gap-1">
              {selectedBullet.atsKeywords.map((keyword, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => insertKeyword(keyword)}
                >
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Loading state for AI enhancement */}
        {isEnhancing && (
          <div className="mt-4 p-3 bg-primary/5 rounded-lg flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm text-primary">Enhancing with AI...</span>
          </div>
        )}

        {/* Suggestions Loading */}
        {isLoadingSuggestions && !suggestions && (
          <div className="mt-4 p-3 bg-muted/30 rounded-lg flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-xs text-muted-foreground">Analyzing enhancement opportunities...</span>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
