import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Target,
  TrendingUp,
  Award,
  Sparkles,
  Settings,
  AlertTriangle,
  Shield
} from "lucide-react";
import { VaultSectionDetailView } from '../vault-detail/VaultSectionDetailView';
import { VaultNuclearReset } from '../VaultNuclearReset';
import { V3VaultBuilderHero } from './V3VaultBuilderHero';
import { V3SectionCard } from './V3SectionCard';
import type { VaultData } from '@/hooks/useVaultData';
import { 
  getStrengthLevel, 
  getNextActionPrompt 
} from '@/lib/utils/vaultQualitativeHelpers';

interface VaultBuilderMainViewProps {
  vaultId: string;
  benchmark: any;
  stats: any;
  vaultData: VaultData;
  onVaultUpdated: () => void;
}

type SectionKey = 'work_experience' | 'skills' | 'leadership' | 'strategic_impact' | 'professional_resources';

export function VaultBuilderMainView({
  vaultId,
  benchmark,
  vaultData,
  onVaultUpdated
}: VaultBuilderMainViewProps) {
  const navigate = useNavigate();
  const [detailViewSection, setDetailViewSection] = useState<string | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);

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

  const layer1Sections = sections.filter(s => s.layer === 1);
  const layer2Sections = sections.filter(s => s.layer === 2);
  const layer1Avg = layer1Sections.length > 0
    ? layer1Sections.reduce((sum, s) => sum + s.percentage, 0) / layer1Sections.length
    : 0;

  const strengthLevel = getStrengthLevel(overallPercentage);
  const nextAction = getNextActionPrompt(overallPercentage, sections);

  return (
    <div className="container mx-auto py-8 space-y-12">
      <V3VaultBuilderHero
        vaultData={vaultData}
        overallPercentage={overallPercentage}
      />

      {showResetDialog && (
        <VaultNuclearReset
          vaultId={vaultId}
          onResetComplete={() => {
            setShowResetDialog(false);
            onVaultUpdated();
          }}
        />
      )}

      <Card className="border-primary/30 bg-gradient-to-br from-background via-primary/5 to-background">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold mb-1">Your Vault Progress</h2>
              <p className="text-base text-muted-foreground">{strengthLevel.description}</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="default" 
                size="sm"
                onClick={() => navigate('/career-intelligence')}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Intelligence Library
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/career-intelligence-builder')}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Guided Builder
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowResetDialog(true)}
                className="text-destructive hover:text-destructive"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Reset Vault
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Advanced
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate('/resume-data-audit')}>
                    <Shield className="h-4 w-4 mr-2" />
                    Verify Data
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-4xl font-bold">{Math.round(overallPercentage)}%</span>
              <Badge variant="outline" className={`text-base ${strengthLevel.textColor}`}>
                {strengthLevel.level}
              </Badge>
            </div>
            <Progress value={overallPercentage} className="h-3 mb-4" />
            
            <div className="grid grid-cols-3 gap-3">
              <div className={`text-center p-3 rounded-lg transition-colors ${overallPercentage >= 0 ? 'bg-primary/10 border border-primary/20' : 'bg-muted/30'}`}>
                <p className="text-sm font-medium">Developing</p>
                <p className="text-xs text-muted-foreground">0-60%</p>
              </div>
              <div className={`text-center p-3 rounded-lg transition-colors ${overallPercentage >= 60 ? 'bg-primary/10 border border-primary/20' : 'bg-muted/30'}`}>
                <p className="text-sm font-medium">Competitive</p>
                <p className="text-xs text-muted-foreground">60-85%</p>
              </div>
              <div className={`text-center p-3 rounded-lg transition-colors ${overallPercentage >= 85 ? 'bg-primary/10 border border-primary/20' : 'bg-muted/30'}`}>
                <p className="text-sm font-medium">Exceptional</p>
                <p className="text-xs text-muted-foreground">85%+</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-1">Next step:</p>
              <p className="text-base font-medium">{nextAction}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <div className="border-b pb-3">
          <h2 className="text-2xl font-semibold mb-1">Foundation Sections</h2>
          <p className="text-base text-muted-foreground">
            Complete these to unlock executive intelligence sections (currently {Math.round(layer1Avg)}% complete)
          </p>
          <p className="text-sm text-primary font-medium mt-2 flex items-center gap-1">
            <Sparkles className="h-4 w-4" />
            Click any section card below to start adding items
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {layer1Sections.map((section) => (
            <V3SectionCard
              key={section.key}
              title={section.title}
              description={section.description}
              icon={section.icon}
              percentage={section.percentage}
              current={section.current}
              target={section.target}
              isLocked={false}
              onClick={() => setDetailViewSection(section.key)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="border-b pb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold">Executive Intelligence</h2>
            {layer1Avg < 60 && (
              <Badge variant="outline">Unlocks at 60%</Badge>
            )}
          </div>
          <p className="text-base text-muted-foreground mt-1">
            Advanced sections that showcase leadership and strategic impact
          </p>
          {layer1Avg >= 60 && (
            <p className="text-sm text-primary font-medium mt-2 flex items-center gap-1">
              <Sparkles className="h-4 w-4" />
              Click any section card below to start adding items
            </p>
          )}
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {layer2Sections.map((section) => {
            const isLocked = layer1Avg < 60;
            return (
              <V3SectionCard
                key={section.key}
                title={section.title}
                description={section.description}
                icon={section.icon}
                percentage={section.percentage}
                current={section.current}
                target={section.target}
                isLocked={isLocked}
                onClick={() => setDetailViewSection(section.key)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
