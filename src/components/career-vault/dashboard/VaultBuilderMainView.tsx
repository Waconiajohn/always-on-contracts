import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Target,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  Lock,
  Award,
  Settings,
  AlertTriangle,
  Info,
  Zap
} from "lucide-react";
import { VaultSectionBuilder } from './VaultSectionBuilder';
import { VaultSectionDetailView } from '../vault-detail/VaultSectionDetailView';
import { VaultNuclearReset } from '../VaultNuclearReset';
import { VaultQuickStats } from '../VaultQuickStats';
import { WorkHistoryTimeline } from '../WorkHistoryTimeline';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { VaultData } from '@/hooks/useVaultData';

interface VaultBuilderMainViewProps {
  vaultId: string;
  benchmark: any;
  stats: any;
  vaultData: VaultData;
  onVaultUpdated: () => void;
}

type SectionKey = 'work_experience' | 'skills' | 'leadership' | 'strategic_impact' | 'professional_resources';

/**
 * VaultBuilderMainView - Complete Redesign with Full Data Flow
 */
export function VaultBuilderMainView({
  vaultId,
  benchmark,
  vaultData,
  stats,
  onVaultUpdated
}: VaultBuilderMainViewProps) {
  const [activeSection, setActiveSection] = useState<SectionKey>('work_experience');
  const [detailViewSection, setDetailViewSection] = useState<string | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);

  // Map section keys to actual vault data items - FIXES DATA FLOW ISSUE
  function getItemsForSection(sectionKey: SectionKey) {
    switch(sectionKey) {
      case 'work_experience':
        return vaultData.powerPhrases;
      case 'skills':
        return vaultData.transferableSkills;
      case 'leadership':
        return [
          ...vaultData.leadershipPhilosophy,
          ...vaultData.softSkills.filter((s: any) => s.category === 'leadership')
        ];
      case 'strategic_impact':
        return vaultData.hiddenCompetencies.filter((c: any) => 
          c.competency_area === 'strategic' || c.competency_area === 'business_impact'
        );
      case 'professional_resources':
        return [
          ...vaultData.executivePresence,
          ...vaultData.personalityTraits,
          ...vaultData.workStyle,
          ...vaultData.values
        ];
    }
  }

  // Smart progress message based on completion
  function getProgressMessage(percentage: number, current: number, target: number): string {
    if (percentage === 0) return "Ready to start";
    if (percentage < 25) return "Just getting started";
    if (percentage < 50) return "Building momentum";
    if (percentage < 75) return "Halfway there!";
    if (percentage < 90) return "Almost complete";
    if (percentage < 100) return `Just ${target - current} more`;
    return "Complete! ✓";
  }

  const overallPercentage = Math.round(
    (benchmark.overall_current / benchmark.overall_target) * 100
  );
  const pointsNeeded = benchmark.overall_target - benchmark.overall_current;

  const sections: Array<{
    key: SectionKey;
    title: string;
    description: string;
    layer: 1 | 2;
    icon: any;
    current: number;
    target: number;
    percentage: number;
    unlockThreshold?: number;
    benchmarkData: any;
  }> = [
    {
      key: 'work_experience',
      title: 'Work Experience',
      description: 'Roles, achievements, and quantified impact',
      layer: 1,
      icon: Target,
      current: benchmark.layer1_foundations.work_experience.current,
      target: benchmark.layer1_foundations.work_experience.target,
      percentage: benchmark.layer1_foundations.work_experience.percentage,
      benchmarkData: benchmark.layer1_foundations.work_experience
    },
    {
      key: 'skills',
      title: 'Skills & Expertise',
      description: 'Technical skills, tools, and certifications',
      layer: 1,
      icon: Award,
      current: benchmark.layer1_foundations.skills.current,
      target: benchmark.layer1_foundations.skills.target,
      percentage: benchmark.layer1_foundations.skills.percentage,
      benchmarkData: benchmark.layer1_foundations.skills
    },
    {
      key: 'leadership',
      title: 'Leadership Approach',
      description: 'How you lead, manage, and develop teams',
      layer: 2,
      icon: TrendingUp,
      current: benchmark.layer2_intelligence.leadership.current,
      target: benchmark.layer2_intelligence.leadership.target,
      percentage: benchmark.layer2_intelligence.leadership.percentage,
      unlockThreshold: 60,
      benchmarkData: benchmark.layer2_intelligence.leadership
    },
    {
      key: 'strategic_impact',
      title: 'Strategic Impact',
      description: 'Business results and measurable outcomes',
      layer: 2,
      icon: Sparkles,
      current: benchmark.layer2_intelligence.strategic_impact.current,
      target: benchmark.layer2_intelligence.strategic_impact.target,
      percentage: benchmark.layer2_intelligence.strategic_impact.percentage,
      unlockThreshold: 60,
      benchmarkData: benchmark.layer2_intelligence.strategic_impact
    },
    {
      key: 'professional_resources',
      title: 'Professional Resources',
      description: 'Executive presence, work style, values',
      layer: 2,
      icon: Sparkles,
      current: benchmark.layer2_intelligence.professional_resources.current,
      target: benchmark.layer2_intelligence.professional_resources.target,
      percentage: benchmark.layer2_intelligence.professional_resources.percentage,
      unlockThreshold: 60,
      benchmarkData: benchmark.layer2_intelligence.professional_resources
    }
  ];

  // If in detail view, show VaultSectionDetailView with ACTUAL ITEMS (not empty array)
  if (detailViewSection) {
    const section = sections.find(s => s.key === detailViewSection);
    if (!section) return null;

    const items = getItemsForSection(section.key);

    return (
      <VaultSectionDetailView
        sectionKey={section.key}
        sectionTitle={section.title}
        items={items}
        benchmarkData={section.benchmarkData}
        vaultId={vaultId}
        onBack={() => setDetailViewSection(null)}
        onItemUpdate={onVaultUpdated}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Quick Stats Overview */}
      <VaultQuickStats 
        totalItems={stats.totalItems}
        interviewProgress={vaultData.vault?.interview_completion_percentage || 0}
        strengthScore={stats.strengthScore.total}
        lastUpdated={vaultData.vault?.last_updated_at}
        workPositionsCount={stats.workPositionsCount}
        educationCount={stats.educationCount}
      />

      {/* Work History Timeline */}
      <WorkHistoryTimeline workPositions={vaultData.workPositions} />

      {/* Nuclear Reset Dialog */}
      {showResetDialog && (
        <VaultNuclearReset
          vaultId={vaultId}
          onResetComplete={() => {
            setShowResetDialog(false);
            onVaultUpdated();
          }}
        />
      )}

      {/* Overall Progress Hero with Advanced Menu */}
      <Card className="bg-gradient-to-br from-primary/5 via-background to-primary/5 border-primary/20">
        <CardContent className="pt-8 pb-8">
          <div className="flex items-start justify-between mb-6">
            <Badge variant="outline">Overall Market Readiness</Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Advanced
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => setShowResetDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Nuclear Reset Vault
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="text-center space-y-6">
            <div>
              <h2 className="text-4xl font-bold mb-2">{overallPercentage}%</h2>
              <p className="text-muted-foreground">
                {pointsNeeded > 0 
                  ? `${pointsNeeded} points to reach benchmark` 
                  : 'You\'ve reached the benchmark! 🎉'
                }
              </p>
            </div>

            {/* Three-column progress: Current | Gap | Benchmark */}
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="text-center p-4 bg-background rounded-lg border">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Current</p>
                <p className="text-3xl font-bold text-blue-600">{benchmark.overall_current}</p>
                <p className="text-xs text-muted-foreground mt-1">points</p>
              </div>
              <div className="text-center p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1">Gap</p>
                <p className="text-3xl font-bold text-amber-600">{pointsNeeded}</p>
                <p className="text-xs text-amber-600 mt-1">needed</p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-xs text-green-700 dark:text-green-400 uppercase tracking-wide mb-1">Benchmark</p>
                <p className="text-3xl font-bold text-green-600">{benchmark.overall_target}</p>
                <p className="text-xs text-green-600 mt-1">target</p>
              </div>
            </div>

            <Progress value={overallPercentage} className="h-3 max-w-2xl mx-auto" />
          </div>
        </CardContent>
      </Card>

      {/* Section Navigation Cards with Enhanced UI */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Build Your Vault Section by Section</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map((section) => {
            const items = getItemsForSection(section.key);
            const goldCount = items.filter((i: any) => i.quality_tier === 'gold').length;
            const silverCount = items.filter((i: any) => i.quality_tier === 'silver').length;
            const bronzeCount = items.filter((i: any) => i.quality_tier === 'bronze').length;
            const isLocked = section.layer === 2 && overallPercentage < (section.unlockThreshold || 60);

            return (
              <Card
                key={section.key}
                className={`
                  relative cursor-pointer transition-all duration-300 group
                  ${section.key === activeSection ? 'ring-2 ring-primary shadow-lg scale-105' : ''}
                  ${isLocked ? 'opacity-50' : ''}
                  ${section.percentage >= 100 ? 'bg-green-500/5' : ''}
                `}
                onClick={() => {
                  if (isLocked) return;
                  setActiveSection(section.key);
                }}
              >
                {section.percentage >= 100 && (
                  <div className="absolute inset-0 bg-green-500/5 rounded-lg animate-pulse" />
                )}
                <CardContent className="p-6 relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${
                        section.key === activeSection ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}>
                        <section.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{section.title}</h3>
                        <p className="text-xs text-muted-foreground">{section.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isLocked && <Lock className="h-5 w-5 text-muted-foreground" />}
                      {section.percentage >= 100 && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{section.current} / {section.target}</span>
                      <span className="font-medium">{section.percentage}%</span>
                    </div>
                    <Progress value={section.percentage} className="h-2" />
                    
                    {/* Quality breakdown mini-bars */}
                    {items.length > 0 && (
                      <>
                        <div className="flex gap-1 h-1">
                          {goldCount > 0 && <div className="bg-yellow-500/50 rounded" style={{ flex: goldCount }} />}
                          {silverCount > 0 && <div className="bg-gray-400/50 rounded" style={{ flex: silverCount }} />}
                          {bronzeCount > 0 && <div className="bg-orange-500/50 rounded" style={{ flex: bronzeCount }} />}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] text-muted-foreground">
                            {goldCount}🥇 {silverCount}🥈 {bronzeCount}🥉
                          </p>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setDetailViewSection(section.key);
                            }}
                            className="h-6 text-xs px-2"
                          >
                            View All ({section.current})
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Active Section Builder with Enhanced Progress Display */}
      {(() => {
        const section = sections.find(s => s.key === activeSection);
        if (!section) return null;

        const isLocked = section.layer === 2 && overallPercentage < (section.unlockThreshold || 60);
        const items = getItemsForSection(section.key);

        if (isLocked) {
          return (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <Lock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Section Locked</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Reach {section.unlockThreshold}% overall completion to unlock Layer 2 sections.
                  You're currently at {overallPercentage}%.
                </p>
              </CardContent>
            </Card>
          );
        }

        const goldCount = items.filter((i: any) => i.quality_tier === 'gold').length;
        const silverCount = items.filter((i: any) => i.quality_tier === 'silver').length;
        const bronzeCount = items.filter((i: any) => i.quality_tier === 'bronze').length;
        const assumedCount = items.filter((i: any) => i.quality_tier === 'assumed').length;

        return (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-2xl font-bold">{section.title}</h2>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-5 w-5">
                            <Info className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-sm">
                            Top performers in {benchmark.role} roles typically have {section.target} items 
                            in this category. {section.benchmarkData.rationale}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-muted-foreground">{section.description}</p>
                </div>
                <Badge variant="secondary" className="text-sm">
                  {section.current} / {section.target} items
                </Badge>
              </div>

              {/* Batch actions indicator */}
              {items.length > 5 && (
                <Badge variant="secondary" className="mb-4">
                  <Zap className="h-3 w-3 mr-1" />
                  {items.length} items available for AI batch enhancement
                </Badge>
              )}

              {/* Enhanced progress section with smart messaging and quality breakdown */}
              <div className="bg-muted/50 p-4 rounded-lg space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {getProgressMessage(section.percentage, section.current, section.target)}
                  </span>
                  <span className="text-2xl font-bold">{section.percentage}%</span>
                </div>
                <Progress value={section.percentage} className="h-3" />
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{section.current} items</span>
                  <span>{section.target - section.current} more to benchmark</span>
                </div>
                
                {/* Real-time quality distribution */}
                {items.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 pt-3 border-t">
                    <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded">
                      <p className="text-xl font-bold text-yellow-600">{goldCount}</p>
                      <p className="text-[10px] text-yellow-700 dark:text-yellow-400">Gold</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-950/20 rounded">
                      <p className="text-xl font-bold text-gray-600">{silverCount}</p>
                      <p className="text-[10px] text-gray-700 dark:text-gray-400">Silver</p>
                    </div>
                    <div className="text-center p-2 bg-orange-50 dark:bg-orange-950/20 rounded">
                      <p className="text-xl font-bold text-orange-600">{bronzeCount}</p>
                      <p className="text-[10px] text-orange-700 dark:text-orange-400">Bronze</p>
                    </div>
                    <div className="text-center p-2 bg-red-50 dark:bg-red-950/20 rounded">
                      <p className="text-xl font-bold text-red-600">{assumedCount}</p>
                      <p className="text-[10px] text-red-700 dark:text-red-400">Review</p>
                    </div>
                  </div>
                )}
              </div>

              <VaultSectionBuilder
                vaultId={vaultId}
                sectionKey={section.key}
                sectionTitle={section.title}
                sectionDescription={section.description}
                current={section.current}
                target={section.target}
                percentage={section.percentage}
                benchmarkData={section.benchmarkData}
                onVaultUpdated={onVaultUpdated}
              />
            </CardContent>
          </Card>
        );
      })()}
    </div>
  );
}
