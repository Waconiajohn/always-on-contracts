import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Star, AlertTriangle, Eye, RefreshCw } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface VaultItemAttributionBadgeProps {
  vaultItem: {
    id: string;
    category: string;
    qualityTier: string;
    excerpt: string;
  };
  onView?: () => void;
  onSwap?: () => void;
  compact?: boolean;
}

export const VaultItemAttributionBadge = ({
  vaultItem,
  onView,
  onSwap,
  compact = false
}: VaultItemAttributionBadgeProps) => {
  const getQualityIcon = (tier: string) => {
    switch (tier) {
      case 'gold':
        return <Trophy className="h-3 w-3 text-tier-gold" />;
      case 'silver':
        return <Star className="h-3 w-3 text-tier-silver" />;
      case 'bronze':
        return <Star className="h-3 w-3 text-tier-bronze" />;
      default:
        return <AlertTriangle className="h-3 w-3 text-tier-assumed" />;
    }
  };

  const getQualityColor = (tier: string) => {
    switch (tier) {
      case 'gold':
        return 'bg-tier-gold-bg text-tier-gold border-tier-gold';
      case 'silver':
        return 'bg-tier-silver-bg text-tier-silver border-tier-silver';
      case 'bronze':
        return 'bg-tier-bronze-bg text-tier-bronze border-tier-bronze';
      default:
        return 'bg-tier-assumed-bg text-tier-assumed border-tier-assumed';
    }
  };

  const getCategoryDisplay = (category: string) => {
    const categoryMap: Record<string, string> = {
      'power_phrases': 'Power Phrase',
      'work_positions': 'Work Experience',
      'technical_skills': 'Technical Skill',
      'soft_skills': 'Soft Skill',
      'leadership': 'Leadership',
      'achievements': 'Achievement',
      'certifications': 'Certification',
      'projects': 'Project',
      'education': 'Education'
    };
    return categoryMap[category] || category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className={`${getQualityColor(vaultItem.qualityTier)} cursor-help text-xs max-w-full`}>
              {getQualityIcon(vaultItem.qualityTier)}
              <span className="ml-1 truncate">{vaultItem.excerpt.substring(0, 50)}...</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="text-xs space-y-1">
              <p className="font-semibold">{getCategoryDisplay(vaultItem.category)}</p>
              <p className="text-muted-foreground">{vaultItem.excerpt.substring(0, 120)}...</p>
              <p className="text-xs capitalize">Quality: {vaultItem.qualityTier}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex items-center gap-2 p-2 border rounded-lg bg-muted/30">
      <Badge className={`${getQualityColor(vaultItem.qualityTier)} text-xs`}>
        {getQualityIcon(vaultItem.qualityTier)}
        <span className="ml-1 capitalize">{vaultItem.qualityTier}</span>
      </Badge>
      
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium">{getCategoryDisplay(vaultItem.category)}</p>
        <p className="text-xs text-muted-foreground truncate">
          {vaultItem.excerpt}
        </p>
      </div>

      <div className="flex gap-1">
        {onView && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-6 w-6 p-0"
                  onClick={onView}
                >
                  <Eye className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View in Vault</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {onSwap && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-6 w-6 p-0"
                  onClick={onSwap}
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Swap with different vault item</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
};