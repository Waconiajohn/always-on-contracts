/**
 * RefinementPanel - Sophisticated AI-assisted editing with clear explanations and preview
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useEnhanceBullet } from '@/hooks/useEnhanceBullet';
import { useRefinementSuggestions } from '@/hooks/useRefinementSuggestions';
import { PreviewModal } from './PreviewModal';
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
  Lightbulb,
  ArrowRight,
  HelpCircle,
  Zap
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

// Explanation tooltips for each alternative style
const styleExplanations = {
  conservative: 'Minor polish — keeps your exact voice and phrasing, improves grammar and flow',
  moderate: 'Balanced optimization — adds relevant industry keywords while preserving meaning',
  aggressive: 'Maximum ATS impact — restructures for keyword density and action verbs',
};

export function RefinementPanel({
  selectedBullet,
  onSave,
  onRemove,
  jobDescription
}: RefinementPanelProps) {
  const [editedText, setEditedText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [customGuidance, setCustomGuidance] = useState('');
  const [selectedAlternative, setSelectedAlternative] = useState<'conservative' | 'moderate' | 'aggressive' | null>(null);
  
  // Preview modal state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<{
    newText: string;
    changeType: 'conservative' | 'moderate' | 'aggressive' | 'bridge' | 'custom';
    reason?: string;
  } | null>(null);

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
    userExperience: null
  });

  // Fetch suggestions when bullet is selected
  useEffect(() => {
    if (selectedBullet && jobDescription) {
      fetchSuggestions();
    }
  }, [selectedBullet?.id]);

  // Reset state when bullet changes
  useEffect(() => {
    setIsEditing(false);
    setEditedText('');
    setSelectedAlternative(null);
    setPreviewOpen(false);
    setPreviewData(null);
  }, [selectedBullet?.id]);

  if (!selectedBullet) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-muted/20">
        <div className="p-4 rounded-full bg-primary/10 mb-4">
          <Sparkles className="h-10 w-10 text-primary" />
        </div>
        <h3 className="font-semibold text-lg mb-2">AI Refinement Studio</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Click any highlighted section on the left to refine it with AI assistance
        </p>
        <div className="mt-6 text-xs text-muted-foreground space-y-1">
          <p className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded" /> Verified from your resume</p>
          <p className="flex items-center gap-2"><span className="w-2 h-2 bg-yellow-500 rounded" /> AI-enhanced version</p>
          <p className="flex items-center gap-2"><span className="w-2 h-2 bg-red-500 rounded" /> AI-generated to fill gaps</p>
        </div>
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

  // Open preview modal instead of directly applying
  const previewAlternativeVersion = (version: 'conservative' | 'moderate' | 'aggressive') => {
    if (suggestions?.alternativeVersions[version]) {
      setPreviewData({
        newText: suggestions.alternativeVersions[version],
        changeType: version,
        reason: styleExplanations[version],
      });
      setPreviewOpen(true);
    }
  };

  const previewLikeKindSuggestion = (suggestion: string, reasoning: string) => {
    setPreviewData({
      newText: suggestion,
      changeType: 'bridge',
      reason: reasoning,
    });
    setPreviewOpen(true);
  };

  const handleApplyPreview = () => {
    if (previewData) {
      onSave(selectedBullet.id, previewData.newText);
      setPreviewOpen(false);
      setPreviewData(null);
    }
  };

  // Handle different content types (education, certification, skill)
  const contentType = (selectedBullet as any).contentType;
  
  if (contentType === 'education' || contentType === 'certification' || contentType === 'skill') {
    return (
      <div className="h-full flex flex-col bg-background border-l">
        <div className="p-4 border-b bg-muted/30">
          <h3 className="font-semibold flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            Edit {contentType === 'education' ? 'Education' : contentType === 'certification' ? 'Certification' : 'Skill'}
          </h3>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
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
                <CheckCircle2 className="h-4 w-4 mr-2" />
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

  const getConfidenceHeader = () => {
    switch (selectedBullet.confidence) {
      case 'exact':
        return (
          <div className="flex items-start gap-2 p-3 bg-green-500/10 rounded-lg">
            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Verified Content</p>
              <p className="text-xs text-muted-foreground mt-1">
                Matches your resume/vault exactly
              </p>
            </div>
          </div>
        );
      case 'enhanced':
        return (
          <div className="flex items-start gap-2 p-3 bg-yellow-500/10 rounded-lg">
            <Sparkles className="h-5 w-5 text-yellow-500 mt-0.5" />
            <div>
              <p className="font-medium text-sm">AI Enhanced</p>
              <p className="text-xs text-muted-foreground mt-1">
                Optimized version of your original content
              </p>
            </div>
          </div>
        );
      case 'invented':
        return (
          <div className="flex items-start gap-2 p-3 bg-red-500/10 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <p className="font-medium text-sm">AI Generated</p>
              <p className="text-xs text-muted-foreground mt-1">
                Created to fill a gap — please verify or customize
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col bg-background border-l">
        {/* Header */}
        <div className="p-4 border-b bg-muted/30">
          <h3 className="font-semibold flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-primary" />
            AI Refinement Studio
          </h3>
          {isLoadingSuggestions && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <RefreshCw className="h-3 w-3 animate-spin" />
              Loading AI suggestions...
            </p>
          )}
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {/* Currently Editing Section */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Currently Editing
              </p>
              <Card className="p-3 bg-muted/30 border-primary/20">
                <p className="text-sm leading-relaxed line-clamp-3">
                  {selectedBullet.userEditedText || selectedBullet.text}
                </p>
              </Card>
              {getConfidenceHeader()}
            </div>

            {isEditing ? (
              /* Manual Edit Mode */
              <div className="space-y-3">
                <Textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="min-h-[120px]"
                  placeholder="Edit content..."
                />
                <div className="flex gap-2">
                  <Button onClick={handleSave} size="sm" className="flex-1" disabled={isEnhancing}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
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
              /* AI Enhancement Options */
              <Accordion type="multiple" defaultValue={['quick-actions', 'alternatives']} className="space-y-2">
                {/* Quick Actions */}
                <AccordionItem value="quick-actions" className="border rounded-lg px-3">
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      Quick Enhancements
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p>One-click improvements to add metrics, technical depth, leadership language, or ATS keywords</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => handleQuickEnhance('quantifiable')}
                        variant="outline"
                        size="sm"
                        disabled={isEnhancing}
                        className="text-xs h-auto py-2.5 justify-start"
                      >
                        <TrendingUp className="h-3.5 w-3.5 mr-2 text-blue-500" />
                        + Numbers
                      </Button>
                      <Button
                        onClick={() => handleQuickEnhance('technical')}
                        variant="outline"
                        size="sm"
                        disabled={isEnhancing}
                        className="text-xs h-auto py-2.5 justify-start"
                      >
                        <Code className="h-3.5 w-3.5 mr-2 text-purple-500" />
                        + Technical
                      </Button>
                      <Button
                        onClick={() => handleQuickEnhance('leadership')}
                        variant="outline"
                        size="sm"
                        disabled={isEnhancing}
                        className="text-xs h-auto py-2.5 justify-start"
                      >
                        <Crown className="h-3.5 w-3.5 mr-2 text-amber-500" />
                        + Leadership
                      </Button>
                      <Button
                        onClick={() => handleQuickEnhance('keywords')}
                        variant="outline"
                        size="sm"
                        disabled={isEnhancing}
                        className="text-xs h-auto py-2.5 justify-start"
                      >
                        <Hash className="h-3.5 w-3.5 mr-2 text-green-500" />
                        + Keywords
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* AI Alternatives */}
                {suggestions?.alternativeVersions && (
                  <AccordionItem value="alternatives" className="border rounded-lg px-3">
                    <AccordionTrigger className="py-3 hover:no-underline">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <Lightbulb className="h-4 w-4 text-primary" />
                        AI Alternatives
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            <p>Choose how aggressively to optimize. Click to preview before applying.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3 space-y-3">
                      {(['conservative', 'moderate', 'aggressive'] as const).map((style) => (
                        <Card
                          key={style}
                          className={`p-3 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all ${
                            selectedAlternative === style ? 'border-primary bg-primary/5' : ''
                          }`}
                          onClick={() => previewAlternativeVersion(style)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={style === 'conservative' ? 'secondary' : style === 'moderate' ? 'default' : 'destructive'} 
                                className="text-[10px]"
                              >
                                {style.toUpperCase()}
                              </Badge>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-xs">
                                  <p>{styleExplanations[style]}</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <span className="text-[10px] text-primary font-medium">Preview →</span>
                          </div>
                          <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">
                            {suggestions.alternativeVersions[style]}
                          </p>
                        </Card>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* Bridge Experience */}
                {suggestions?.likeKindSuggestions && suggestions.likeKindSuggestions.length > 0 && (
                  <AccordionItem value="bridge" className="border rounded-lg px-3">
                    <AccordionTrigger className="py-3 hover:no-underline">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <ArrowRight className="h-4 w-4 text-green-500" />
                        Bridge Your Experience
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            <p>Maps your existing skills to what the job requires (e.g., HubSpot → Salesforce)</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3 space-y-3">
                      {suggestions.likeKindSuggestions.map((item, i) => (
                        <Card
                          key={i}
                          className="p-3 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
                          onClick={() => previewLikeKindSuggestion(item.suggestion, item.reasoning)}
                        >
                          <div className="text-[10px] text-muted-foreground mb-2 flex items-center gap-1">
                            <span className="font-semibold text-foreground">{item.candidateHas}</span>
                            <ArrowRight className="h-3 w-3" />
                            <span className="font-semibold text-foreground">{item.jobRequires}</span>
                          </div>
                          <p className="text-xs leading-relaxed line-clamp-2 mb-1">{item.suggestion}</p>
                          <div className="flex justify-between items-center">
                            <p className="text-[10px] text-muted-foreground italic line-clamp-1">{item.reasoning}</p>
                            <span className="text-[10px] text-primary font-medium">Preview →</span>
                          </div>
                        </Card>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* Missing Keywords */}
                {suggestions?.keywordsToAdd && suggestions.keywordsToAdd.length > 0 && (
                  <AccordionItem value="keywords" className="border rounded-lg px-3">
                    <AccordionTrigger className="py-3 hover:no-underline">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <Hash className="h-4 w-4 text-orange-500" />
                        Missing Keywords
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3">
                      <p className="text-xs text-muted-foreground mb-2">Click to add to your bullet:</p>
                      <div className="flex flex-wrap gap-2">
                        {suggestions.keywordsToAdd.map((kw, i) => (
                          <Badge
                            key={i}
                            variant={kw.relevance === 'critical' ? 'destructive' : 'secondary'}
                            className="cursor-pointer hover:scale-105 transition-transform text-xs"
                            onClick={() => insertKeyword(kw.keyword)}
                          >
                            + {kw.keyword}
                          </Badge>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* Custom Enhancement */}
                <AccordionItem value="custom" className="border rounded-lg px-3">
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Wand2 className="h-4 w-4 text-violet-500" />
                      Custom Enhancement
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3 space-y-2">
                    <Textarea
                      value={customGuidance}
                      onChange={(e) => setCustomGuidance(e.target.value)}
                      placeholder='E.g., "Emphasize collaboration" or "Add more about the technology stack"'
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
                      Apply Custom AI Enhancement
                    </Button>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}

            <Separator />

            {/* Action Buttons */}
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
              
              {selectedBullet.confidence === 'invented' ? (
                <Button
                  onClick={() => onRemove(selectedBullet.id)}
                  variant="outline"
                  size="sm"
                  className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove This Content
                </Button>
              ) : (
                <Button
                  onClick={() => onSave(selectedBullet.id, selectedBullet.text)}
                  variant="default"
                  size="sm"
                  className="w-full"
                >
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Keep As-Is
                </Button>
              )}
            </div>

            {/* Show ATS keywords */}
            {selectedBullet.atsKeywords && selectedBullet.atsKeywords.length > 0 && (
              <div className="p-3 bg-muted/50 rounded-lg">
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
              <div className="p-3 bg-primary/5 rounded-lg flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-primary">Enhancing with AI...</span>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Preview Modal */}
        {previewData && (
          <PreviewModal
            isOpen={previewOpen}
            onClose={() => {
              setPreviewOpen(false);
              setPreviewData(null);
            }}
            onApply={handleApplyPreview}
            originalText={selectedBullet.userEditedText || selectedBullet.text}
            newText={previewData.newText}
            changeType={previewData.changeType}
            reason={previewData.reason}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
