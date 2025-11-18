import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  ChevronRight,
  Target,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Lock,
  Award
} from "lucide-react";
import { VaultSectionBuilder } from './VaultSectionBuilder';

interface VaultBuilderMainViewProps {
  vaultId: string;
  vault: any;
  benchmark: any;
  stats: any;
  onVaultUpdated: () => void;
}

type SectionKey = 'work_experience' | 'skills' | 'leadership' | 'strategic_impact' | 'professional_resources';

/**
 * VaultBuilderMainView - Complete Redesign
 *
 * Philosophy:
 * - PRIMARY experience is vault building, not stats viewing
 * - Show Current vs. Best-in-Class Benchmark side-by-side
 * - Help users discover hidden expertise through creative questions
 * - Section-by-section, resume-native flow
 * - Celebrate progress and proximity to benchmark
 *
 * Layout:
 * - Top: Overall progress hero (Current | Gap | Benchmark)
 * - Main: Active section with Current vs. Benchmark comparison + builder
 * - Bottom: Section navigation (with progress indicators)
 */
export function VaultBuilderMainView({
  vaultId,
  vault,
  benchmark,
  stats,
  onVaultUpdated
}: VaultBuilderMainViewProps) {
  const [activeSection, setActiveSection] = useState<SectionKey>('work_experience');

  // Calculate overall progress
  const overallPercentage = Math.round(
    (benchmark.overall_current / benchmark.overall_target) * 100
  );
  const pointsNeeded = benchmark.overall_target - benchmark.overall_current;

  // Define sections with benchmark data
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
      description: 'Tools, frameworks, and network',
      layer: 2,
      icon: CheckCircle2,
      current: benchmark.layer2_intelligence.professional_resources.current,
      target: benchmark.layer2_intelligence.professional_resources.target,
      percentage: benchmark.layer2_intelligence.professional_resources.percentage,
      unlockThreshold: 75,
      benchmarkData: benchmark.layer2_intelligence.professional_resources
    }
  ];

  const activeData = sections.find(s => s.key === activeSection);
  const isLocked = activeData?.unlockThreshold && overallPercentage < activeData.unlockThreshold;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Hero: Overall Progress - Current vs. Benchmark */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-1">
                Building Your Career Vault
              </h1>
              <p className="text-muted-foreground">
                {benchmark.role} • {benchmark.level} • {benchmark.industry}
              </p>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {overallPercentage}% Complete
            </Badge>
          </div>

          {/* Three-Column Progress: Current | Gap | Benchmark */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 bg-background rounded-lg border">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Your Current Profile
              </p>
              <p className="text-3xl font-bold text-blue-600">
                {benchmark.overall_current}
              </p>
              <p className="text-xs text-muted-foreground mt-1">points</p>
            </div>

            <div className="text-center p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1">
                Gap to Close
              </p>
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-500">
                {pointsNeeded}
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                points needed
              </p>
            </div>

            <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-xs text-green-700 dark:text-green-400 uppercase tracking-wide mb-1">
                Best-in-Class Target
              </p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-500">
                {benchmark.overall_target}
              </p>
              <p className="text-xs text-green-600 dark:text-green-500 mt-1">points</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={overallPercentage} className="h-3" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                {overallPercentage < 60 && "Complete foundations to unlock advanced sections"}
                {overallPercentage >= 60 && overallPercentage < 85 && "Great progress! You're closer than you think"}
                {overallPercentage >= 85 && "You're market ready! Keep refining for best results"}
              </span>
              <span className="font-medium">
                {benchmark.overall_current} / {benchmark.overall_target}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Navigation - Horizontal Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {sections.map((section) => {
          const Icon = section.icon;
          const locked = section.unlockThreshold && overallPercentage < section.unlockThreshold;
          const isActive = activeSection === section.key;
          const isComplete = section.percentage >= 100;

          return (
            <button
              key={section.key}
              onClick={() => !locked && setActiveSection(section.key)}
              disabled={locked}
              className={`
                relative p-4 rounded-lg border-2 text-left transition-all
                ${isActive
                  ? 'border-primary bg-primary/5 shadow-md'
                  : locked
                  ? 'border-muted bg-muted/20 opacity-50 cursor-not-allowed'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50 cursor-pointer'
                }
              `}
            >
              {/* Status Icon */}
              <div className="flex items-start justify-between mb-2">
                <Icon className={`h-5 w-5 ${
                  locked ? 'text-muted-foreground' :
                  isComplete ? 'text-green-600' :
                  isActive ? 'text-primary' :
                  'text-muted-foreground'
                }`} />
                {locked && <Lock className="h-4 w-4 text-muted-foreground" />}
                {isComplete && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              </div>

              {/* Title */}
              <h3 className="font-semibold text-sm mb-1 line-clamp-1">
                {section.title}
              </h3>

              {/* Progress */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {section.current}/{section.target}
                  </span>
                  <span className={`font-medium ${
                    isComplete ? 'text-green-600' :
                    section.percentage > 50 ? 'text-primary' :
                    'text-muted-foreground'
                  }`}>
                    {section.percentage}%
                  </span>
                </div>
                <Progress value={section.percentage} className="h-1.5" />
              </div>

              {/* Layer Badge */}
              {section.layer === 2 && (
                <Badge variant="secondary" className="absolute top-2 right-2 text-[10px] px-1.5 py-0">
                  L2
                </Badge>
              )}

              {/* Lock Message */}
              {locked && (
                <p className="text-[10px] text-muted-foreground mt-2">
                  Unlocks at {section.unlockThreshold}%
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Content: Active Section Builder */}
      {activeData && !isLocked && (
        <VaultSectionBuilder
          vaultId={vaultId}
          sectionKey={activeSection}
          sectionTitle={activeData.title}
          sectionDescription={activeData.description}
          current={activeData.current}
          target={activeData.target}
          percentage={activeData.percentage}
          benchmarkData={activeData.benchmarkData}
          onVaultUpdated={onVaultUpdated}
        />
      )}

      {/* Locked Section Message */}
      {isLocked && activeData && (
        <Card>
          <CardContent className="py-12 text-center">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {activeData.title} Unlocks at {activeData.unlockThreshold}%
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-4">
              Complete your foundational sections (Work Experience and Skills) to unlock advanced vault building.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm">
              <span className="text-muted-foreground">Current progress:</span>
              <span className="font-semibold text-lg">{overallPercentage}%</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">
                {activeData.unlockThreshold! - overallPercentage}% to unlock
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
