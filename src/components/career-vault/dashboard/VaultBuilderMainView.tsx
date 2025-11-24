import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Shield
} from "lucide-react";
import { VaultSectionDetailView } from '../vault-detail/VaultSectionDetailView';
import { VaultNuclearReset } from '../VaultNuclearReset';
import { V3VaultBuilderOverview } from './V3VaultBuilderOverview';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  getStrengthLevel, 
  getSectionGuidance, 
  getQualityStatusText 
} from '@/lib/utils/vaultQualitativeHelpers';
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
  onVaultUpdated
}: VaultBuilderMainViewProps) {
  const navigate = useNavigate();
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

  const overallPercentage = Math.round(
    (benchmark.overall_current / benchmark.overall_target) * 100
  );

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
      {/* V3 Calm Overview - Replaces gamified stats */}
      <V3VaultBuilderOverview
        vaultData={vaultData}
        overallPercentage={overallPercentage}
        sections={sections.map(s => ({ key: s.key, percentage: s.percentage, layer: s.layer }))}
      />

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

      {/* Overall Progress - Redesigned without points/gamification */}
      <Card className="border-primary/20">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <Badge variant="outline" className="mb-2">Overall Vault Strength</Badge>
              <h3 className="text-2xl font-semibold">{getStrengthLevel(overallPercentage).level}</h3>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Advanced
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background z-50">
                <DropdownMenuItem 
                  onClick={() => navigate('/resume-data-audit')}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Verify Data
                </DropdownMenuItem>
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

          <div className="space-y-4">
            {/* Progress bar with qualitative milestones */}
            <div className="relative">
              <Progress value={overallPercentage} className="h-3" />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span className={overallPercentage >= 0 ? 'font-medium text-foreground' : ''}>Developing</span>
                <span className={overallPercentage >= 60 ? 'font-medium text-foreground' : ''}>Competitive (60%)</span>
                <span className={overallPercentage >= 85 ? 'font-medium text-foreground' : ''}>Exceptional (85%)</span>
              </div>
            </div>

            {/* Current status with context */}
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm">
                <span className="font-medium">Current status:</span>{' '}
                {overallPercentage}% complete
                {overallPercentage < 60 && (
                  <> - {Math.round(60 - overallPercentage)}% more to reach competitive threshold</>
                )}
                {overallPercentage >= 60 && overallPercentage < 85 && (
                  <> - {Math.round(85 - overallPercentage)}% more to reach exceptional status</>
                )}
                {overallPercentage >= 85 && (
                  <> - exceptional positioning achieved</>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Cards - Redesigned without emojis and gamification */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Build Your Vault Section by Section</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map((section) => {
            const items = getItemsForSection(section.key);
            const goldCount = items.filter((i: any) => i.quality_tier === 'gold').length;
            const silverCount = items.filter((i: any) => i.quality_tier === 'silver').length;
            const bronzeCount = items.filter((i: any) => i.quality_tier === 'bronze').length;
            const assumedCount = items.filter((i: any) => 
              !i.quality_tier || i.quality_tier === 'assumed'
            ).length;
            const isLocked = section.layer === 2 && overallPercentage < (section.unlockThreshold || 60);
            const qualityText = getQualityStatusText(goldCount, silverCount, bronzeCount, assumedCount);
            const guidanceText = getSectionGuidance(
              section.key, 
              section.percentage, 
              isLocked,
              section.current,
              section.target
            );

            return (
              <Card
                key={section.key}
                className={`
                  relative cursor-pointer transition-all duration-300 group
                  hover:ring-2 hover:ring-primary hover:shadow-md
                  ${isLocked ? 'opacity-60' : ''}
                  ${section.percentage >= 100 ? 'border-emerald-500/30' : ''}
                `}
                onClick={() => {
                  if (isLocked) return;
                  setDetailViewSection(section.key);
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <section.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{section.title}</h3>
                        <p className="text-xs text-muted-foreground">{section.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isLocked && <Lock className="h-4 w-4 text-muted-foreground" />}
                      {section.percentage >= 100 && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{section.current} items</span>
                      <span className="font-medium">{section.percentage}%</span>
                    </div>
                    <Progress value={section.percentage} className="h-2" />
                    
                    {/* Quality status and guidance */}
                    <div className="space-y-2">
                      {items.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {qualityText}
                        </p>
                      )}
                      <p className="text-xs text-foreground/70">
                        {isLocked && <Lock className="h-3 w-3 inline mr-1" />}
                        {guidanceText}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

    </div>
  );
}
