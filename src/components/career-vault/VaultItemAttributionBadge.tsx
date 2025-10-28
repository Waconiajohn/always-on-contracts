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

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className={`${getQualityColor(vaultItem.qualityTier)} cursor-help text-xs`}>
              {getQualityIcon(vaultItem.qualityTier)}
              <span className="ml-1">{vaultItem.category}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs space-y-1">
              <p className="font-semibold">From: {vaultItem.category}</p>
              <p className="text-muted-foreground">{vaultItem.excerpt.substring(0, 60)}...</p>
              <p className="text-xs">Quality: {vaultItem.qualityTier}</p>
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
        <p className="text-xs font-medium">{vaultItem.category}</p>
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