import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  ChevronDown, 
  ChevronRight, 
  Sparkles,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SmartAnswerCard, type Alternative } from './SmartAnswerCard';

export interface GapAnalysisItem {
  requirement: string;
  explanation?: string;
  gap?: string;
  relatedExperience?: string;
  suggestedLanguage: string;
  impact?: string;
  recommendation?: string;
}

export interface GapAnalysisData {
  highlyQualified: GapAnalysisItem[];
  partiallyQualified: GapAnalysisItem[];
  experienceGaps: GapAnalysisItem[];
}

export interface AISuggestion {
  id: string;
  suggestedAnswer: string;
  reasoning: string;
  confidenceScore: number;
  resumeEvidence: string[];
  alternatives: Alternative[];
}

interface GapAnalysisDisplayV2Props {
  gapAnalysis: GapAnalysisData;
  aiSuggestions?: Record<string, AISuggestion>;
  onEditSuggestion?: (category: string, index: number, newLanguage: string) => void;
  onSelectSuggestion?: (category: string, index: number, selected: boolean) => void;
  selectedSuggestions?: Record<string, Set<number>>;
  onRequestAISuggestions?: (category: string, index: number) => void;
  onSelectAIAnswer?: (suggestionId: string, answer: string) => void;
  onRequestAlternatives?: (suggestionId: string) => void;
  onProvideFeedback?: (suggestionId: string, feedbackType: string) => void;
  loadingAISuggestions?: Set<string>;
  loadingAlternatives?: Set<string>;
  className?: string;
}

export function GapAnalysisDisplayV2({
  gapAnalysis,
  aiSuggestions = {},
  onEditSuggestion,
  onSelectSuggestion,
  selectedSuggestions = {},
  onRequestAISuggestions,
  onSelectAIAnswer,
  onRequestAlternatives,
  onProvideFeedback,
  loadingAISuggestions = new Set(),
  loadingAlternatives = new Set(),
  className
}: GapAnalysisDisplayV2Props) {
  const [expandedSections, setExpandedSections] = useState({
    highlyQualified: true,
    partiallyQualified: true,
    experienceGaps: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const renderRequirementCard = (
    item: GapAnalysisItem,
    index: number,
    category: string,
    icon: React.ReactNode,
    iconBgColor: string
  ) => {
    const isSelected = selectedSuggestions[category]?.has(index) ?? false;
    const requirementKey = `${category}-${index}`;
    const aiSuggestion = aiSuggestions[requirementKey];
    const isLoadingSuggestion = loadingAISuggestions.has(requirementKey);
    const isLoadingAlts = loadingAlternatives.has(aiSuggestion?.id || '');

    return (
      <Card
        key={index}
        className={cn(
          "transition-all",
          isSelected && "border-primary ring-2 ring-primary/20"
        )}
      >
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className={cn("flex-shrink-0 rounded-full p-2 h-fit", iconBgColor)}>
              {icon}
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h4 className="font-semibold text-foreground">{item.requirement}</h4>
                {item.explanation && (
                  <p className="text-sm text-muted-foreground mt-1">{item.explanation}</p>
                )}
                {item.gap && (
                  <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                    <span className="font-medium">Gap: </span>
                    {item.gap}
                  </p>
                )}
                {item.relatedExperience && (
                  <p className="text-sm text-primary mt-1">
                    <span className="font-medium">Related Experience: </span>
                    {item.relatedExperience}
                  </p>
                )}
                {item.impact && (
                  <p className="text-sm text-muted-foreground mt-1">
                    <span className="font-medium">Impact: </span>
                    <Badge 
                      variant={
                        item.impact === 'high' ? 'destructive' :
                        item.impact === 'medium' ? 'secondary' : 'outline'
                      }
                      className="ml-1"
                    >
                      {item.impact}
                    </Badge>
                  </p>
                )}
                {item.recommendation && (
                  <p className="text-sm text-muted-foreground mt-1">
                    <span className="font-medium">Recommendation: </span>
                    {item.recommendation}
                  </p>
                )}
              </div>

              {/* AI Suggestion Button */}
              {onRequestAISuggestions && !aiSuggestion && (
                <Button
                  onClick={() => onRequestAISuggestions(category, index)}
                  disabled={isLoadingSuggestion}
                  className="bg-gradient-to-r from-primary to-accent text-primary-foreground"
                >
                  {isLoadingSuggestion ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  {isLoadingSuggestion ? 'Generating AI Suggestion...' : 'Get AI-Powered Answer'}
                </Button>
              )}

              {/* AI Suggestion Card */}
              {aiSuggestion && onSelectAIAnswer && onRequestAlternatives && onProvideFeedback && (
                <SmartAnswerCard
                  suggestedAnswer={aiSuggestion.suggestedAnswer}
                  reasoning={aiSuggestion.reasoning}
                  confidenceScore={aiSuggestion.confidenceScore}
                  resumeEvidence={aiSuggestion.resumeEvidence}
                  alternatives={aiSuggestion.alternatives}
                  onSelectAnswer={(answer) => onSelectAIAnswer(aiSuggestion.id, answer)}
                  onRequestAlternatives={() => onRequestAlternatives(aiSuggestion.id)}
                  onProvideFeedback={(type) => onProvideFeedback(aiSuggestion.id, type)}
                  isLoadingAlternatives={isLoadingAlts}
                />
              )}

              {/* Manual Suggestion */}
              {item.suggestedLanguage && !aiSuggestion && (
                <Card className="bg-muted/50">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Suggested Resume Language
                      </label>
                      {onSelectSuggestion && (
                        <Button
                          size="sm"
                          variant={isSelected ? 'default' : 'outline'}
                          onClick={() => onSelectSuggestion(category, index, !isSelected)}
                        >
                          {isSelected ? 'Selected' : 'Select'}
                        </Button>
                      )}
                    </div>
                    <Textarea
                      className="w-full text-sm"
                      value={item.suggestedLanguage}
                      onChange={(e) => onEditSuggestion?.(category, index, e.target.value)}
                      rows={3}
                      readOnly={!onEditSuggestion}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const sectionConfigs = [
    {
      key: 'highlyQualified' as const,
      title: 'Highly Qualified',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      hoverColor: 'hover:bg-green-100 dark:hover:bg-green-900/30',
      icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
      iconBg: 'bg-green-100 dark:bg-green-900/40',
      cardIcon: <CheckCircle2 className="w-4 h-4 text-green-600" />,
      items: gapAnalysis.highlyQualified
    },
    {
      key: 'partiallyQualified' as const,
      title: 'Partially Qualified',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      hoverColor: 'hover:bg-orange-100 dark:hover:bg-orange-900/30',
      icon: <AlertCircle className="w-5 h-5 text-orange-600" />,
      iconBg: 'bg-orange-100 dark:bg-orange-900/40',
      cardIcon: <AlertCircle className="w-4 h-4 text-orange-600" />,
      items: gapAnalysis.partiallyQualified
    },
    {
      key: 'experienceGaps' as const,
      title: 'Experience Gaps',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      hoverColor: 'hover:bg-red-100 dark:hover:bg-red-900/30',
      icon: <XCircle className="w-5 h-5 text-red-600" />,
      iconBg: 'bg-red-100 dark:bg-red-900/40',
      cardIcon: <XCircle className="w-4 h-4 text-red-600" />,
      items: gapAnalysis.experienceGaps
    }
  ];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <h3 className="font-semibold text-foreground mb-2">Gap Analysis Complete</h3>
          <p className="text-sm text-muted-foreground">
            Review the analysis below to understand where you match the job requirements,
            where you have partial qualifications, and where gaps exist. Select the suggested
            language you'd like to incorporate into your optimized resume.
          </p>
        </CardContent>
      </Card>

      {/* Sections */}
      <div className="space-y-4">
        {sectionConfigs.map((section) => (
          <Collapsible
            key={section.key}
            open={expandedSections[section.key]}
            onOpenChange={() => toggleSection(section.key)}
          >
            <Card className="overflow-hidden">
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-between rounded-none h-auto py-3 px-4",
                    section.bgColor,
                    section.hoverColor
                  )}
                >
                  <div className="flex items-center gap-2">
                    {section.icon}
                    <h3 className="font-semibold text-foreground">
                      {section.title} ({section.items?.length || 0})
                    </h3>
                  </div>
                  {expandedSections[section.key] ? (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="p-4 space-y-3">
                  {section.items?.length > 0 ? (
                    section.items.map((item, index) =>
                      renderRequirementCard(
                        item,
                        index,
                        section.key,
                        section.cardIcon,
                        section.iconBg
                      )
                    )
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No {section.title.toLowerCase()} requirements identified.
                    </p>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </div>
    </div>
  );
}

export default GapAnalysisDisplayV2;
