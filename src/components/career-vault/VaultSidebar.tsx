import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Target, Plus, Mic, FileText, Award, Sparkles } from 'lucide-react';

interface VaultSidebarProps {
  completionPercentage: number;
  totalItems: number;
  strengthScore: number;
  onQuickAction?: (action: string) => void;
}

export const VaultSidebar: React.FC<VaultSidebarProps> = ({
  completionPercentage,
  totalItems,
  strengthScore,
  onQuickAction,
}) => {
  const quickActions = [
    { icon: FileText, label: 'Add Achievement', action: 'achievement' },
    { icon: Sparkles, label: 'Add Power Phrase', action: 'power-phrase' },
    { icon: Award, label: 'Add Skill', action: 'skill' },
    { icon: Mic, label: 'Voice Note', action: 'voice-note' },
  ];

  return (
    <div className="space-y-4">
      {/* Vault Stats */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Target className="h-4 w-4" />
            Vault Progress
          </h3>
          <span className="text-2xl font-bold text-primary">
            {completionPercentage}%
          </span>
        </div>
        <Progress value={completionPercentage} className="mb-3" />
        <div className="grid grid-cols-2 gap-2 text-center text-xs">
          <div>
            <p className="text-muted-foreground">Total Items</p>
            <p className="text-lg font-bold">{totalItems}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Strength</p>
            <p className="text-lg font-bold">{strengthScore}</p>
          </div>
        </div>
      </Card>

      <Separator />

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Quick Actions
        </h3>
        <div className="space-y-2">
          {quickActions.map((action) => (
            <Button
              key={action.action}
              variant="outline"
              className="w-full justify-start"
              size="sm"
              onClick={() => onQuickAction?.(action.action)}
            >
              <action.icon className="h-4 w-4 mr-2" />
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Next Milestone */}
      <Card className="p-4 bg-primary/5 border-primary/20">
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
          <Award className="h-4 w-4 text-primary" />
          Next Milestone
        </h3>
        <p className="text-xs text-muted-foreground mb-2">
          {completionPercentage < 25
            ? 'Complete 25% to unlock Resume Builder'
            : completionPercentage < 50
            ? 'Complete 50% to unlock Interview Prep'
            : completionPercentage < 75
            ? 'Complete 75% to unlock LinkedIn Builder'
            : completionPercentage < 100
            ? 'Complete 100% to unlock all features'
            : '🎉 All milestones unlocked!'}
        </p>
        <Progress
          value={completionPercentage % 25 === 0 ? 100 : (completionPercentage % 25) * 4}
          className="h-2"
        />
      </Card>
    </div>
  );
};
