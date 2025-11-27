import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Info, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { IntelligenceCategoryCard } from './IntelligenceCategoryCard';

interface CategorySectionProps {
  title: string;
  icon: string;
  description: string;
  educationalContext: string;
  items: any[];
  category: string;
  defaultOpen?: boolean;
  onRefresh: () => void;
  onGenerateCategory?: () => void;
  workPositions?: any[];
  milestones?: any[];
}

export function CategorySection({
  title,
  icon,
  description,
  educationalContext,
  items,
  category,
  defaultOpen = false,
  onRefresh,
  onGenerateCategory,
  workPositions = [],
  milestones = []
}: CategorySectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultOpen);

  const qualityStats = {
    gold: items.filter(i => i.quality_tier === 'gold').length,
    silver: items.filter(i => i.quality_tier === 'silver').length,
    bronze: items.filter(i => i.quality_tier === 'bronze').length,
    assumed: items.filter(i => i.quality_tier === 'assumed').length
  };

  const getWorkContext = (item: any) => {
    if (item.source_work_position_id && workPositions.length > 0) {
      const position = workPositions.find(p => p.id === item.source_work_position_id);
      if (position) {
        return {
          company: position.company_name,
          title: position.job_title,
          type: 'position' as const
        };
      }
    }
    if (item.source_milestone_id && milestones.length > 0) {
      const milestone = milestones.find(m => m.id === item.source_milestone_id);
      if (milestone) {
        const position = workPositions.find(p => p.id === milestone.work_position_id);
        return {
          company: position?.company_name || 'Unknown',
          title: position?.job_title || 'Unknown',
          milestone: milestone.bullet_point,
          type: 'milestone' as const
        };
      }
    }
    return null;
  };

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader 
        className="cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{icon}</span>
            <div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-xs">
              {items.length} items
            </Badge>
            {qualityStats.gold > 0 && (
              <Badge className="bg-yellow-500 hover:bg-yellow-600 text-xs">
                🥇 {qualityStats.gold}
              </Badge>
            )}
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4 pt-4">
          {/* Educational Context */}
          <Alert className="bg-info/5 dark:bg-info/5 border-info/20 dark:border-info/10">
            <Info className="h-4 w-4 text-info" />
            <AlertDescription className="text-sm text-foreground dark:text-foreground">
              <strong>Why this matters:</strong> {educationalContext}
            </AlertDescription>
          </Alert>

          {/* Empty State */}
          {items.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="text-4xl mb-4">🤖</div>
              <h4 className="font-semibold text-lg">No {title} Yet</h4>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Generate professional insights using AI analysis
              </p>
              {onGenerateCategory && (
                <Button
                  onClick={onGenerateCategory}
                  className="mt-4 bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate with AI
                  <Badge variant="outline" className="ml-2 bg-accent/10 text-accent border-accent/20 text-[10px]">
                    Gemini 2.5 Flash
                  </Badge>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {items.map((item) => (
                <IntelligenceCategoryCard
                  key={item.id}
                  item={item}
                  category={category}
                  workContext={getWorkContext(item)}
                  onRefresh={onRefresh}
                />
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
