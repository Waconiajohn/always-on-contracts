/**
 * BulletComparisonCard
 * 
 * Shows original vs AI-enhanced bullet with:
 * - Clear before/after comparison
 * - Confidence badges (not inline text)
 * - "Supports" chips showing which job requirements it addresses
 * - Why this helps explanation
 * - Interview questions (expandable)
 * - 4 action buttons: Use AI / Keep Original / Edit / Remove
 */

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { BulletSuggestion } from "../types/builderV2Types";
import { CONFIDENCE_INFO } from "../types/builderV2Types";
import { 
  Check, 
  X, 
  Edit3, 
  Trash2, 
  ChevronDown, 
  ChevronUp,
  Lightbulb,
  MessageCircle,
  Sparkles,
  FileText
} from "lucide-react";

interface BulletComparisonCardProps {
  suggestion: BulletSuggestion;
  onUseAI: () => void;
  onKeepOriginal: () => void;
  onEdit: (text: string) => void;
  onRemove: () => void;
  bulletNumber?: number;
  roleName?: string;
}

export const BulletComparisonCard = ({
  suggestion,
  onUseAI,
  onKeepOriginal,
  onEdit,
  onRemove,
  bulletNumber,
  roleName
}: BulletComparisonCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(suggestion.suggestedText);
  const [showInterviewQs, setShowInterviewQs] = useState(false);

  const confidenceInfo = CONFIDENCE_INFO[suggestion.confidence];
  const hasOriginal = !!suggestion.originalText;

  const handleSaveEdit = () => {
    onEdit(editText);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditText(suggestion.suggestedText);
    setIsEditing(false);
  };

  // If already accepted/rejected, show condensed view
  if (suggestion.status === 'accepted' || suggestion.status === 'edited') {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  {suggestion.status === 'edited' ? 'Edited & Accepted' : 'Accepted'}
                </span>
              </div>
              <p className="text-sm text-gray-700">
                {suggestion.editedText || suggestion.suggestedText}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onRemove}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (suggestion.status === 'rejected') {
    return (
      <Card className="border-gray-200 bg-gray-50/50 opacity-60">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2">
            <X className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-500">Skipped</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-auto"
              onClick={onUseAI}
            >
              Undo
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 hover:border-primary/50 transition-colors">
      <CardContent className="pt-4 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              {bulletNumber ? `Bullet ${bulletNumber}` : 'Suggestion'}
            </span>
            {roleName && (
              <span className="text-sm text-muted-foreground">• {roleName}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={cn(confidenceInfo.bgColor, confidenceInfo.color, "border-0")}
            >
              {suggestion.confidence === 'high' ? '✓' : suggestion.confidence === 'medium' ? '~' : '?'} {confidenceInfo.label}
            </Badge>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
              <Sparkles className="h-3 w-3 mr-1" />
              AI Draft
            </Badge>
          </div>
        </div>

        {/* Supports chips */}
        {suggestion.supports.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            <span className="text-xs text-muted-foreground mr-1">Supports:</span>
            {suggestion.supports.map((skill, i) => (
              <Badge key={i} variant="secondary" className="text-xs font-normal">
                {skill}
              </Badge>
            ))}
          </div>
        )}

        {/* Source basis */}
        {suggestion.sourceBasis && (
          <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md">
            <FileText className="h-3.5 w-3.5" />
            <span>From: {suggestion.sourceBasis}</span>
          </div>
        )}

        {/* Before/After comparison */}
        <div className={cn("space-y-4", hasOriginal && "grid md:grid-cols-2 gap-4 space-y-0")}>
          {/* Original (if exists) */}
          {hasOriginal && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-gray-400" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Your Original
                </span>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 border border-muted">
                <p className="text-sm text-muted-foreground">
                  {suggestion.originalText}
                </p>
              </div>
            </div>
          )}

          {/* AI Enhanced */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-xs font-medium text-primary uppercase tracking-wide">
                {hasOriginal ? 'AI Enhanced' : 'AI Suggested'}
              </span>
            </div>
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="min-h-[100px] text-sm"
                  placeholder="Edit the bullet point..."
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveEdit}>
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
                <p className="text-sm">
                  {suggestion.suggestedText}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Why this helps */}
        {suggestion.whyThisHelps && !isEditing && (
          <div className="mt-4 flex items-start gap-2 text-sm bg-amber-50 text-amber-800 rounded-lg p-3 border border-amber-100">
            <Lightbulb className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-medium">Why this helps: </span>
              <span className="text-amber-700">{suggestion.whyThisHelps}</span>
            </div>
          </div>
        )}

        {/* Interview Questions (collapsible) */}
        {suggestion.interviewQuestions && suggestion.interviewQuestions.length > 0 && !isEditing && (
          <Collapsible open={showInterviewQs} onOpenChange={setShowInterviewQs}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full mt-3 text-muted-foreground hover:text-foreground"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Interview Questions ({suggestion.interviewQuestions.length})
                {showInterviewQs ? (
                  <ChevronUp className="h-4 w-4 ml-auto" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-auto" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100 space-y-2">
                <p className="text-xs font-medium text-blue-700 mb-2">
                  🎤 If you use this bullet, be ready to answer:
                </p>
                <ul className="space-y-1.5">
                  {suggestion.interviewQuestions.map((q, i) => (
                    <li key={i} className="text-sm text-blue-800 flex items-start gap-2">
                      <span className="text-blue-400 mt-1">•</span>
                      {q}
                    </li>
                  ))}
                </ul>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Action buttons */}
        {!isEditing && (
          <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
            <Button 
              size="sm" 
              onClick={onUseAI}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="h-4 w-4 mr-1" />
              Use AI Version
            </Button>
            {hasOriginal && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={onKeepOriginal}
              >
                Keep Original
              </Button>
            )}
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setIsEditing(true)}
            >
              <Edit3 className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-auto"
              onClick={onRemove}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Skip
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
