import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Sparkles, 
  ThumbsUp, 
  ThumbsDown, 
  RefreshCw, 
  ChevronDown, 
  ChevronRight, 
  Lightbulb, 
  Check,
  Edit2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Alternative {
  text: string;
  style: string;
  strengths?: string;
  bestFor?: string;
}

export interface SmartAnswerCardProps {
  suggestedAnswer: string;
  reasoning: string;
  confidenceScore: number;
  resumeEvidence: string[];
  alternatives: Alternative[];
  onSelectAnswer: (answer: string) => void;
  onRequestAlternatives: () => void;
  onProvideFeedback: (type: string, notes?: string) => void;
  isLoadingAlternatives?: boolean;
  className?: string;
}

export function SmartAnswerCard({
  suggestedAnswer,
  reasoning,
  confidenceScore,
  resumeEvidence,
  alternatives,
  onSelectAnswer,
  onRequestAlternatives,
  onProvideFeedback,
  isLoadingAlternatives = false,
  className
}: SmartAnswerCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string>(suggestedAnswer);
  const [isEditing, setIsEditing] = useState(false);
  const [editedAnswer, setEditedAnswer] = useState(suggestedAnswer);
  const [showReasoning, setShowReasoning] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  const getConfidenceVariant = (score: number): "default" | "secondary" | "outline" => {
    if (score >= 0.8) return 'default';
    if (score >= 0.6) return 'secondary';
    return 'outline';
  };

  const getConfidenceLabel = (score: number) => {
    if (score >= 0.8) return 'High Confidence';
    if (score >= 0.6) return 'Moderate Confidence';
    return 'Lower Confidence';
  };

  const handleSaveEdit = () => {
    setSelectedAnswer(editedAnswer);
    onSelectAnswer(editedAnswer);
    setIsEditing(false);
  };

  const handleSelectAlternative = (alternative: Alternative) => {
    setSelectedAnswer(alternative.text);
    setEditedAnswer(alternative.text);
    onSelectAnswer(alternative.text);
  };

  const handleFeedback = (type: string) => {
    onProvideFeedback(type);
    setFeedbackGiven(true);
    setTimeout(() => setFeedbackGiven(false), 2000);
  };

  return (
    <Card className={cn(
      "bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-primary/20",
      className
    )}>
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">AI-Powered Suggestion</span>
          </div>
          <Badge variant={getConfidenceVariant(confidenceScore)}>
            {getConfidenceLabel(confidenceScore)} ({Math.round(confidenceScore * 100)}%)
          </Badge>
        </div>

        {/* Main Answer */}
        <Card className="bg-background">
          <CardContent className="p-4">
            {isEditing ? (
              <div className="space-y-3">
                <Textarea
                  value={editedAnswer}
                  onChange={(e) => setEditedAnswer(e.target.value)}
                  className="min-h-[100px] resize-y"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveEdit}>
                    Save Changes
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditedAnswer(selectedAnswer);
                      setIsEditing(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-foreground leading-relaxed">{selectedAnswer}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit2 className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" onClick={() => onSelectAnswer(selectedAnswer)}>
                    <Check className="w-3 h-3 mr-1" />
                    Use This
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Why This Works */}
        <Collapsible open={showReasoning} onOpenChange={setShowReasoning}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium">Why This Works</span>
              </div>
              {showReasoning ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="mt-2 bg-background">
              <CardContent className="p-3">
                <p className="text-sm text-muted-foreground">{reasoning}</p>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Resume Evidence */}
        {resumeEvidence.length > 0 && (
          <Collapsible open={showEvidence} onOpenChange={setShowEvidence}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">
                    Resume Evidence ({resumeEvidence.length})
                  </span>
                </div>
                {showEvidence ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Card className="mt-2 bg-background">
                <CardContent className="p-3">
                  <ul className="space-y-2">
                    {resumeEvidence.map((evidence, idx) => (
                      <li key={idx} className="flex gap-2 text-sm text-muted-foreground">
                        <span className="text-green-600 mt-0.5">•</span>
                        <span>{evidence}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Alternatives */}
        <Collapsible open={showAlternatives} onOpenChange={setShowAlternatives}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">
                  Alternative Versions ({alternatives.length})
                </span>
              </div>
              {showAlternatives ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 space-y-3">
              {alternatives.map((alt, idx) => (
                <Card key={idx} className="bg-background">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-primary mb-1">{alt.style}</p>
                        <p className="text-sm text-muted-foreground">{alt.text}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleSelectAlternative(alt)}
                      >
                        Use This
                      </Button>
                    </div>
                    {alt.strengths && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Strengths:</span> {alt.strengths}
                      </p>
                    )}
                    {alt.bestFor && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Best for:</span> {alt.bestFor}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
              <Button
                variant="outline"
                className="w-full"
                onClick={onRequestAlternatives}
                disabled={isLoadingAlternatives}
              >
                <RefreshCw className={cn("w-4 h-4 mr-2", isLoadingAlternatives && "animate-spin")} />
                {isLoadingAlternatives ? 'Generating...' : 'Generate More Alternatives'}
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Feedback */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <span className="text-xs text-muted-foreground">Was this helpful?</span>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 hover:bg-green-100 dark:hover:bg-green-900/30"
              onClick={() => handleFeedback('helpful')}
            >
              <ThumbsUp className="w-4 h-4 text-muted-foreground hover:text-green-600" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 hover:bg-red-100 dark:hover:bg-red-900/30"
              onClick={() => handleFeedback('not_helpful')}
            >
              <ThumbsDown className="w-4 h-4 text-muted-foreground hover:text-red-600" />
            </Button>
            {feedbackGiven && (
              <span className="text-xs text-green-600 animate-in fade-in">
                Thanks for your feedback!
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default SmartAnswerCard;
