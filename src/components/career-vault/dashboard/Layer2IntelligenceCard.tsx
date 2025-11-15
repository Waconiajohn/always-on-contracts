import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Sparkles, ArrowRight } from "lucide-react";
import type { VaultData } from "@/hooks/useVaultData";
import type { VaultStats } from "@/hooks/useVaultStats";

interface Layer2IntelligenceCardProps {
  vaultData: VaultData | undefined;
  stats: VaultStats | null;
  benchmark: any; // AI-generated benchmark from career_vault.benchmark_standard
  onSectionClick: (section: string) => void;
}

interface ExecutiveSection {
  name: string;
  description: string;
  percentage: number;
  impact: number;
  count: number;
  status: 'empty' | 'weak' | 'building' | 'strong';
  ctaText: string;
  section: string;
  benchmark: string;
}

export const Layer2IntelligenceCard = ({ vaultData, stats, benchmark, onSectionClick }: Layer2IntelligenceCardProps) => {
  if (!vaultData || !stats) return null;

  // Extract AI-generated benchmarks (with fallbacks for when benchmark isn't ready)
  const aiBenchmark = benchmark?.layer2_intelligence || null;

  const calculateExecutiveSections = (): ExecutiveSection[] => {
    const leadershipCount = stats.categoryCounts.leadershipPhilosophy || 0;
    const powerPhrasesWithMetrics = vaultData.powerPhrases?.filter(
      p => p.impact_metrics && Object.keys(p.impact_metrics).length > 0
    ).length || 0;
    // Professional resources will come from future extraction
    const professionalResourcesCount = 0;

    // Use AI benchmarks if available, otherwise fallback to simple calculations
    const leadershipTarget = aiBenchmark?.leadership?.target || 3;
    const strategicTarget = aiBenchmark?.strategic_impact?.target || 8;
    const resourcesTarget = aiBenchmark?.professional_resources?.target || 1;

    // Leadership Approach - based on leadership_philosophy entries
    const leadershipPercentage = leadershipCount > 0 
      ? Math.min((leadershipCount / leadershipTarget) * 100, 100) 
      : 0;

    // Strategic Impact - based on power phrases with metrics
    const strategicPercentage = powerPhrasesWithMetrics > 0 
      ? Math.min((powerPhrasesWithMetrics / strategicTarget) * 100, 100) 
      : 0;

    // Professional Development & Resources - NEW table
    const resourcesPercentage = professionalResourcesCount > 0 
      ? Math.min((professionalResourcesCount / resourcesTarget) * 100, 100) 
      : 0;

    // Professional Network - placeholder (could be enhanced later)
    const networkPercentage = 0; // Not yet implemented

    const getStatus = (percentage: number): ExecutiveSection['status'] => {
      if (percentage === 0) return 'empty';
      if (percentage < 40) return 'weak';
      if (percentage < 80) return 'building';
      return 'strong';
    };

    return [
      {
        name: 'Leadership Approach',
        description: 'How you lead, your management philosophy, decision-making style',
        percentage: leadershipPercentage,
        impact: 20,
        count: leadershipCount,
        status: getStatus(leadershipPercentage),
        ctaText: leadershipPercentage === 0 ? 'Start Building' : 'Enhance',
        section: 'leadership',
        benchmark: aiBenchmark?.leadership?.benchmark_rule || `Target: ${leadershipTarget} examples (you have ${leadershipCount}). ${aiBenchmark?.leadership?.focus_areas || 'Modern leadership: inclusive, data-driven, growth-focused'}`
      },
      {
        name: 'Strategic Impact',
        description: 'Business outcomes, financial impact, organizational change',
        percentage: strategicPercentage,
        impact: 25,
        count: powerPhrasesWithMetrics,
        status: getStatus(strategicPercentage),
        ctaText: strategicPercentage === 0 ? 'Add Achievements' : 'Quantify More',
        section: 'strategic-impact',
        benchmark: aiBenchmark?.strategic_impact?.benchmark_rule || `Target: ${strategicTarget} quantified achievements (you have ${powerPhrasesWithMetrics}). 80%+ should have metrics.`
      },
      {
        name: 'Professional Development & Resources',
        description: 'Training investments, enterprise systems, industry exposure',
        percentage: resourcesPercentage,
        impact: 15,
        count: professionalResourcesCount,
        status: getStatus(resourcesPercentage),
        ctaText: resourcesPercentage === 0 ? 'Start Now' : 'Add More',
        section: 'professional-resources',
        benchmark: aiBenchmark?.professional_resources?.benchmark_rule || `Enterprise-grade tools + $5K-$15K annual training investment`
      },
      {
        name: 'Professional Network',
        description: 'Industry relationships, cross-functional collaboration',
        percentage: networkPercentage,
        impact: 10,
        count: 0,
        status: 'empty',
        ctaText: 'Coming Soon',
        section: 'network',
        benchmark: 'Senior roles: direct work with VPs/C-suite + external network'
      }
    ];
  };

  const sections = calculateExecutiveSections();
  const overallCompletion = Math.round(
    sections.reduce((sum, s) => sum + s.percentage, 0) / sections.length
  );

  const getStatusColor = (status: ExecutiveSection['status']) => {
    switch (status) {
      case 'strong': return 'text-green-500';
      case 'building': return 'text-yellow-500';
      case 'weak': return 'text-orange-500';
      case 'empty': return 'text-red-500';
    }
  };

  const getHighestImpactSection = () => {
    return sections
      .filter(s => s.status === 'empty' || s.status === 'weak')
      .sort((a, b) => b.impact - a.impact)[0];
  };

  const prioritySection = getHighestImpactSection();

  return (
    <Card className="layer-2-intelligence border-border/50 bg-gradient-to-br from-background to-primary/5">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            What Makes You Stand Out
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            {overallCompletion}% complete
          </span>
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Beyond the basics—show leadership, impact, and what companies have invested in you.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {sections.map((section) => (
          <div key={section.section} className="space-y-2 group">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className={`h-4 w-4 ${getStatusColor(section.status)}`} />
                  <span className="font-medium text-sm sm:text-base">{section.name}</span>
                  <span className="text-xs text-muted-foreground">
                    +{section.impact} pts
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {section.description}
                </p>
                {/* Inline education - always visible */}
                <p className="text-xs text-muted-foreground">
                  💡 {section.benchmark}
                </p>
              </div>
              <Button 
                variant={section.status === 'empty' ? 'default' : 'outline'}
                size="sm"
                className="w-full sm:w-auto shrink-0"
                onClick={() => onSectionClick(section.section)}
                disabled={section.section === 'network'}
                aria-label={`${section.ctaText} for ${section.name}`}
              >
                {section.ctaText}
                {section.section !== 'network' && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </div>
            
            {/* Simplified progress bar */}
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <div 
                className={`h-1.5 rounded-full transition-all duration-300 ease-out ${
                  section.status === 'strong' ? 'bg-green-500' :
                  section.status === 'building' ? 'bg-blue-500' :
                  section.status === 'weak' ? 'bg-amber-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${section.percentage}%` }}
                role="progressbar"
                aria-valuenow={section.percentage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${section.name} completion: ${section.percentage}%`}
              />
            </div>
          </div>
        ))}

        {/* Empty state - only show if all sections are empty */}
        {sections.every(s => s.status === 'empty') && (
          <div className="mt-6 p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20 text-center">
            <Sparkles className="h-12 w-12 text-primary mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">Build Your Competitive Edge</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Most resumes list experience. Elite candidates show leadership, strategic impact, 
              and professional development. Stand out from the crowd.
            </p>
            <Button 
              onClick={() => onSectionClick(sections[0].section)}
              size="lg"
              className="w-full sm:w-auto"
              disabled={sections[0].section === 'network'}
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Priority action - only show if some sections exist */}
        {prioritySection && !sections.every(s => s.status === 'empty') && (
          <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">
                  🎯 Highest Impact Action
                </p>
                <p className="text-sm text-muted-foreground mb-2">
                  Complete "{prioritySection.name}" for +{prioritySection.impact} points.
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  Most candidates miss this—showing {prioritySection.description.toLowerCase()} 
                  proves companies have invested in you.
                </p>
                <Button 
                  onClick={() => onSectionClick(prioritySection.section)}
                  className="w-full sm:w-auto"
                  size="sm"
                  disabled={prioritySection.section === 'network'}
                >
                  {prioritySection.ctaText}
                  {prioritySection.section !== 'network' && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 p-3 bg-primary/5 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Benchmark:</strong> You're {overallCompletion < 50 ? 'missing' : 'building'} key executive 
            positioning data. Target is 80%+ to stand out to senior-level hiring managers.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
