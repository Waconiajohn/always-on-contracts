import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Edit, 
  Trash2, 
  Sparkles, 
  TrendingUp,
  Calendar,
  Tag
} from 'lucide-react';
import { VaultItemEditor } from './VaultItemEditor';
import { AIEnhancementPanel } from './AIEnhancementPanel';
import { formatDistanceToNow } from 'date-fns';

interface VaultItemCardProps {
  item: any;
  itemType: 'power_phrase' | 'transferable_skill' | 'hidden_competency';
  vaultId: string;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onUpdate: () => void;
}

export function VaultItemCard({
  item,
  itemType,
  vaultId,
  isSelected,
  onSelect,
  onUpdate
}: VaultItemCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);

  const getQualityBadge = () => {
    const tier = item.quality_tier || 'assumed';
    const colors = {
      gold: 'bg-yellow-500 hover:bg-yellow-600',
      silver: 'bg-gray-400 hover:bg-gray-500',
      bronze: 'bg-orange-600 hover:bg-orange-700',
      assumed: 'bg-amber-500 hover:bg-amber-600'
    };

    const icons = {
      gold: '🥇',
      silver: '🥈',
      bronze: '🥉',
      assumed: '⚠️'
    };

    return (
      <Badge variant="secondary" className={colors[tier as keyof typeof colors]}>
        {icons[tier as keyof typeof icons]} {tier.charAt(0).toUpperCase() + tier.slice(1)}
      </Badge>
    );
  };

  const getContent = () => {
    return item.power_phrase || item.phrase || item.stated_skill || item.skill || 
           item.competency_area || item.inferred_capability || 'No content';
  };

  const getMetadata = () => {
    const confidence = item.confidence_score || item.ai_confidence || 0;
    const lastUpdated = item.last_updated_at || item.updated_at || item.created_at;
    
    return {
      confidence: Math.round(confidence * 100),
      lastUpdated: lastUpdated ? formatDistanceToNow(new Date(lastUpdated), { addSuffix: true }) : 'Unknown',
      source: item.source || 'Extracted from resume',
      usageCount: item.usage_count || 0
    };
  };

  const metadata = getMetadata();

  if (isEditing) {
    return (
      <VaultItemEditor
        item={item}
        itemType={itemType}
        vaultId={vaultId}
        onClose={() => setIsEditing(false)}
        onSave={() => {
          setIsEditing(false);
          onUpdate();
        }}
      />
    );
  }

  return (
    <Card className={`transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <CardContent className="p-4 space-y-3">
        {/* Header with checkbox and quality badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelect}
              className="mt-1"
            />
            <div className="flex-1 space-y-2">
              {getQualityBadge()}
              <p className="text-sm leading-relaxed">{getContent()}</p>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground pl-8">
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Confidence: {metadata.confidence}%
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {metadata.lastUpdated}
          </div>
          <div className="flex items-center gap-1 col-span-2">
            <Tag className="h-3 w-3" />
            {metadata.source}
          </div>
        </div>

        {/* Keywords if available */}
        {item.keywords && item.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1 pl-8">
            {item.keywords.slice(0, 5).map((keyword: string, idx: number) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {keyword}
              </Badge>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pl-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAIPanel(!showAIPanel)}
            className="bg-gradient-to-r from-purple-500/10 to-blue-500/10"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Enhance with AI
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>

        {/* AI Enhancement Panel */}
        {showAIPanel && (
          <AIEnhancementPanel
            item={item}
            itemType={itemType}
            vaultId={vaultId}
            onClose={() => setShowAIPanel(false)}
            onEnhanced={() => {
              setShowAIPanel(false);
              onUpdate();
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}
