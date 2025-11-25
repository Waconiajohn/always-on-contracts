import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Sparkles, MapPin, FileText } from 'lucide-react';
import { AIEnhancementPanel } from '@/components/career-vault/vault-detail/AIEnhancementPanel';

interface IntelligenceCategoryCardProps {
  item: any;
  category: string;
  workContext: {
    company: string;
    title: string;
    milestone?: string;
    type: 'position' | 'milestone';
  } | null;
  onRefresh: () => void;
}

export function IntelligenceCategoryCard({
  item,
  category,
  workContext,
  onRefresh
}: IntelligenceCategoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);

  const getContent = () => {
    return item.power_phrase || item.phrase || item.stated_skill || 
           item.skill || item.competency_area || item.inferred_capability ||
           item.trait_name || item.trait || item.style_preference ||
           item.value_name || item.specific_behavior || '';
  };

  const getQualityBadgeColor = (tier: string) => {
    switch (tier) {
      case 'gold': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'silver': return 'bg-gray-400 hover:bg-gray-500';
      case 'bronze': return 'bg-orange-500 hover:bg-orange-600';
      default: return 'bg-muted hover:bg-muted';
    }
  };

  const getItemType = () => {
    if (category === 'achievements') return 'power_phrase';
    if (category === 'skills') return 'transferable_skill';
    if (category === 'competencies') return 'hidden_competency';
    if (category === 'strengths') return 'soft_skill';
    if (category === 'leadership') return 'leadership';
    if (category === 'executive') return 'executive_presence';
    if (category === 'personality') return 'personality';
    if (category === 'workstyle') return 'workstyle';
    if (category === 'values') return 'values';
    if (category === 'behavioral') return 'behavioral';
    return 'power_phrase';
  };

  if (showAIPanel) {
    return (
      <AIEnhancementPanel
        item={item}
        itemType={getItemType()}
        vaultId={item.vault_id}
        onClose={() => setShowAIPanel(false)}
        onEnhanced={() => {
          setShowAIPanel(false);
          onRefresh();
        }}
      />
    );
  }

  return (
    <Card className="border-border hover:border-primary/50 transition-colors">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with quality badge */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <p className="text-sm leading-relaxed">{getContent()}</p>
              
              {/* Work Context Badge */}
              {workContext && (
                <Badge variant="outline" className="text-xs">
                  <MapPin className="h-3 w-3 mr-1" />
                  {workContext.company} • {workContext.title}
                </Badge>
              )}
            </div>

            <div className="flex flex-col items-end gap-2">
              <Badge className={getQualityBadgeColor(item.quality_tier)}>
                {item.quality_tier === 'gold' && '🥇'}
                {item.quality_tier === 'silver' && '🥈'}
                {item.quality_tier === 'bronze' && '🥉'}
                {' '}{item.quality_tier}
              </Badge>
              
              {item.confidence_score && (
                <Badge variant="secondary" className="text-xs">
                  {Math.round(item.confidence_score * 100)}% confidence
                </Badge>
              )}
            </div>
          </div>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="space-y-2 pt-3 border-t animate-in fade-in slide-in-from-top-2">
              {workContext?.milestone && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Original Resume Bullet:</p>
                      <p className="text-sm italic">{workContext.milestone}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {item.enhancement_notes && (
                <div className="text-xs text-muted-foreground bg-purple-50/50 dark:bg-purple-900/10 rounded p-2">
                  <strong>AI Reasoning:</strong> {item.enhancement_notes}
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                Last updated: {new Date(item.last_updated_at || item.created_at).toLocaleDateString()}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex-1"
            >
              <Eye className="h-3 w-3 mr-2" />
              {isExpanded ? 'Hide' : 'View'} Details
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAIPanel(true)}
              className="flex-1 border-purple-200 hover:bg-purple-50 hover:text-purple-700"
            >
              <Sparkles className="h-3 w-3 mr-2" />
              Enhance with AI
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
