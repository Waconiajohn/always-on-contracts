import { useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Shield, Zap, Rocket, Check, AlertTriangle, Copy, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useOptimizerStore } from '@/stores/optimizerStore';

export interface BulletTierOption {
  bullet: string;
  emphasis: string;
  requiresConfirmation?: boolean;
  confirmationFields?: string[];
}

export interface BulletTiers {
  conservative: BulletTierOption;
  strong: BulletTierOption;
  aggressive: BulletTierOption;
}

interface BulletTierSelectorProps {
  tiers: BulletTiers;
  requirementId: string;
  onSelectTier?: (tier: 'conservative' | 'strong' | 'aggressive', bullet: string) => void;
  className?: string;
}

const TIER_CONFIG = {
  conservative: {
    label: 'Conservative',
    description: 'Evidence-backed only',
    icon: Shield,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    hoverColor: 'hover:border-blue-400',
  },
  strong: {
    label: 'Strong',
    description: 'Inferred + verify details',
    icon: Zap,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
    hoverColor: 'hover:border-amber-400',
  },
  aggressive: {
    label: 'Aggressive',
    description: 'Benchmark-style',
    icon: Rocket,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    borderColor: 'border-purple-200 dark:border-purple-800',
    hoverColor: 'hover:border-purple-400',
  },
};

export function BulletTierSelector({ 
  tiers, 
  requirementId, 
  onSelectTier,
  className 
}: BulletTierSelectorProps) {
  const { toast } = useToast();
  const addStagedBullet = useOptimizerStore(state => state.addStagedBullet);
  const stagedBullets = useOptimizerStore(state => state.stagedBullets);
  
  const [selectedTier, setSelectedTier] = useState<'conservative' | 'strong' | 'aggressive' | null>(null);
  const [copiedTier, setCopiedTier] = useState<string | null>(null);

  const handleSelectTier = (tier: 'conservative' | 'strong' | 'aggressive') => {
    setSelectedTier(tier);
    onSelectTier?.(tier, tiers[tier].bullet);
  };

  const handleCopy = async (tier: 'conservative' | 'strong' | 'aggressive') => {
    try {
      await navigator.clipboard.writeText(tiers[tier].bullet);
      setCopiedTier(tier);
      toast({
        title: 'Copied!',
        description: `${TIER_CONFIG[tier].label} bullet copied to clipboard`,
      });
      setTimeout(() => setCopiedTier(null), 2000);
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Please select and copy manually',
        variant: 'destructive'
      });
    }
  };

  const handleAddToResume = (tier: 'conservative' | 'strong' | 'aggressive') => {
    const bullet = tiers[tier].bullet;
    const isAlreadyStaged = stagedBullets.some(b => b.text === bullet);
    
    if (isAlreadyStaged) {
      toast({
        title: 'Already added',
        description: 'This bullet is already in your resume draft',
      });
      return;
    }

    addStagedBullet({
      text: bullet,
      requirementId,
      sectionHint: 'experience'
    });
    
    setSelectedTier(tier);
    toast({
      title: 'Added to Resume Draft',
      description: `${TIER_CONFIG[tier].label} bullet added`,
    });
  };

  const tierOrder: Array<'conservative' | 'strong' | 'aggressive'> = ['conservative', 'strong', 'aggressive'];

  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        Choose your bullet style:
      </p>
      
      <div className="grid gap-3">
        {tierOrder.map((tier) => {
          const config = TIER_CONFIG[tier];
          const tierData = tiers[tier];
          const Icon = config.icon;
          const isSelected = selectedTier === tier;
          const isCopied = copiedTier === tier;
          const isStaged = stagedBullets.some(b => b.text === tierData.bullet);

          return (
            <motion.div
              key={tier}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: tierOrder.indexOf(tier) * 0.1 }}
              className={cn(
                "p-4 rounded-xl border-2 transition-all cursor-pointer",
                config.bgColor,
                config.borderColor,
                config.hoverColor,
                isSelected && "ring-2 ring-primary ring-offset-2"
              )}
              onClick={() => handleSelectTier(tier)}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={cn("p-1.5 rounded-lg", config.bgColor)}>
                    <Icon className={cn("h-4 w-4", config.color)} />
                  </div>
                  <div>
                    <span className={cn("font-semibold text-sm", config.color)}>
                      {config.label}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {config.description}
                    </span>
                  </div>
                </div>
                
                {tierData.requiresConfirmation && (
                  <Badge variant="outline" className="text-xs gap-1 border-amber-300 text-amber-700 bg-amber-50">
                    <AlertTriangle className="h-3 w-3" />
                    Confirm Details
                  </Badge>
                )}
              </div>

              {/* Bullet Text */}
              <p className="text-sm leading-relaxed mb-3 pl-8">{tierData.bullet}</p>

              {/* Emphasis */}
              {tierData.emphasis && (
                <p className="text-xs text-muted-foreground pl-8 italic mb-3">
                  "{tierData.emphasis}"
                </p>
              )}

              {/* Confirmation Fields */}
              {tierData.confirmationFields && tierData.confirmationFields.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pl-8 mb-3">
                  {tierData.confirmationFields.map((field, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      Verify: {field}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pl-8">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(tier);
                  }}
                >
                  {isCopied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                  {isCopied ? 'Copied!' : 'Copy'}
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  disabled={isStaged}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToResume(tier);
                  }}
                >
                  {isStaged ? <Check className="h-3 w-3 mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
                  {isStaged ? 'Added!' : 'Add to Resume'}
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
