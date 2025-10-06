import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Target, TrendingUp, Users, Zap } from 'lucide-react';

interface GuidedPrompt {
  question: string;
  options: string[];
}

interface GuidedPromptsData {
  specificity?: GuidedPrompt;
  quantification?: GuidedPrompt;
  context?: GuidedPrompt;
  impact?: GuidedPrompt;
}

interface GuidedPromptSelectorProps {
  guidedPrompts: GuidedPromptsData;
  onApply: (selectedOptions: string[]) => void;
  onSkip: () => void;
  skipAttempts?: number;
}

const categoryIcons = {
  specificity: Zap,
  quantification: TrendingUp,
  context: Users,
  impact: Target,
};

const categoryColors = {
  specificity: 'text-purple-600 dark:text-purple-400',
  quantification: 'text-blue-600 dark:text-blue-400',
  context: 'text-green-600 dark:text-green-400',
  impact: 'text-orange-600 dark:text-orange-400',
};

export function GuidedPromptSelector({ 
  guidedPrompts, 
  onApply, 
  onSkip,
  skipAttempts = 0 
}: GuidedPromptSelectorProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    specificity: true,
    quantification: true,
    context: true,
    impact: true,
  });

  const handleCheckboxChange = (category: string, option: string, checked: boolean) => {
    setSelectedOptions(prev => {
      const categoryOptions = prev[category] || [];
      if (checked) {
        return { ...prev, [category]: [...categoryOptions, option] };
      } else {
        return { ...prev, [category]: categoryOptions.filter(o => o !== option) };
      }
    });
  };

  const handleApply = () => {
    const allSelected = Object.values(selectedOptions).flat();
    if (allSelected.length > 0) {
      onApply(allSelected);
    }
  };

  const toggleSection = (category: string) => {
    setOpenSections(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const totalSelected = Object.values(selectedOptions).flat().length;
  const categories = Object.keys(guidedPrompts) as Array<keyof typeof guidedPrompts>;

  return (
    <Card className="p-4 mt-4 bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold text-lg">Let's strengthen your answer</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Select options that apply to add more detail
            </p>
          </div>
          {totalSelected > 0 && (
            <Badge variant="secondary" className="shrink-0">
              {totalSelected} selected
            </Badge>
          )}
        </div>

        <div className="space-y-3">
          {categories.map((category) => {
            const prompt = guidedPrompts[category];
            if (!prompt) return null;

            const Icon = categoryIcons[category];
            const colorClass = categoryColors[category];
            const isOpen = openSections[category];
            const categorySelected = (selectedOptions[category] || []).length;

            return (
              <Collapsible
                key={category}
                open={isOpen}
                onOpenChange={() => toggleSection(category)}
              >
                <Card className="overflow-hidden">
                  <CollapsibleTrigger className="w-full p-3 flex items-center justify-between hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Icon className={`h-5 w-5 ${colorClass}`} />
                      <div className="text-left">
                        <p className="font-medium capitalize">{category}</p>
                        <p className="text-xs text-muted-foreground">{prompt.question}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {categorySelected > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {categorySelected}
                        </Badge>
                      )}
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="p-3 pt-0 space-y-2">
                      {prompt.options.map((option, idx) => {
                        const isChecked = (selectedOptions[category] || []).includes(option);
                        return (
                          <label
                            key={idx}
                            className="flex items-start gap-3 p-2 rounded-md hover:bg-accent/50 cursor-pointer transition-colors"
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) =>
                                handleCheckboxChange(category, option, checked as boolean)
                              }
                              className="mt-0.5"
                            />
                            <span className="text-sm flex-1">{option}</span>
                          </label>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleApply}
            disabled={totalSelected === 0}
            className="flex-1"
          >
            Apply Selected ({totalSelected})
          </Button>
          <Button
            onClick={onSkip}
            variant="outline"
            className="flex-1"
          >
            {skipAttempts > 0 
              ? "I've shared what I remember" 
              : "Skip for now"}
          </Button>
        </div>

        {skipAttempts > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            You can enhance this response later from your War Chest Dashboard
          </p>
        )}
      </div>
    </Card>
  );
}
