import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Lightbulb,
  Loader2,
  Plus,
  Target,
  TrendingUp,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type SectionKey = 'work_experience' | 'skills' | 'leadership' | 'strategic_impact' | 'professional_resources';

interface VaultSectionBuilderProps {
  vaultId: string;
  sectionKey: SectionKey;
  sectionTitle: string;
  sectionDescription: string;
  current: number;
  target: number;
  percentage: number;
  benchmarkData: any;
  onVaultUpdated: () => void;
}

/**
 * VaultSectionBuilder - Detailed section building experience
 *
 * Layout:
 * - Top: Section header with Current vs. Benchmark
 * - Left (60%): Creative questions and insights to uncover hidden expertise
 * - Right (40%): Quick add form for this section
 *
 * Philosophy:
 * - Help users realize they're better than they think
 * - Ask creative questions to uncover Six Sigma expert without certification
 * - Ask questions to reveal Manager doing VP-level work
 * - Show what's missing vs. best-in-class
 * - Make adding items feel productive and empowering
 */
export function VaultSectionBuilder({
  vaultId,
  sectionKey,
  sectionTitle,
  sectionDescription,
  current,
  target,
  percentage,
  benchmarkData,
  onVaultUpdated
}: VaultSectionBuilderProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const pointsNeeded = target - current;
  const isComplete = percentage >= 100;

  // Get creative insights for this section
  const getCreativeInsights = () => {
    switch (sectionKey) {
      case 'work_experience':
        return [
          {
            icon: Lightbulb,
            question: "Are you managing people without the 'manager' title?",
            insight: "Many professionals do manager or director-level work without the official title. If you're mentoring teammates, coordinating projects, or making decisions that affect the team's direction, that's leadership experience worth documenting.",
            color: "text-amber-600"
          },
          {
            icon: Target,
            question: "What's the dollar value of your work?",
            insight: "Even if you don't own a budget, your work has financial impact. Calculate: team size × average salary, or revenue your product generates, or cost savings from your improvements. These numbers make your impact tangible.",
            color: "text-blue-600"
          },
          {
            icon: TrendingUp,
            question: "What improved because you were there?",
            insight: "Best-in-class professionals quantify everything. Think: Did processes get faster? Did quality improve? Did customer satisfaction increase? Even a 10% improvement is worth highlighting.",
            color: "text-green-600"
          }
        ];

      case 'skills':
        return [
          {
            icon: Lightbulb,
            question: "What do you do that others ask you about?",
            insight: "If colleagues regularly ask for your help with something, you're an expert in that area. This includes tools you use daily, methodologies you've mastered (Agile, Six Sigma), or technical skills you've developed over time.",
            color: "text-amber-600"
          },
          {
            icon: CheckCircle2,
            question: "What have you learned on the job (not in school)?",
            insight: "You don't need a certification to be an expert. If you've used a skill for 2+ years and can teach it to others, you're proficient. Examples: Excel power user, conflict resolution, data analysis, project coordination.",
            color: "text-purple-600"
          },
          {
            icon: Target,
            question: "What tools do you use every single week?",
            insight: "Best-in-class professionals list every tool explicitly. Even 'obvious' tools matter: Slack, Excel, Google Analytics, Salesforce, Figma, Jira. ATS systems search for specific tool names.",
            color: "text-blue-600"
          }
        ];

      case 'leadership':
        return [
          {
            icon: Lightbulb,
            question: "How do you help others succeed?",
            insight: "Leadership isn't just about managing direct reports. Do you mentor junior teammates? Run training sessions? Help resolve conflicts? These are all leadership contributions worth documenting.",
            color: "text-amber-600"
          },
          {
            icon: TrendingUp,
            question: "What's your leadership philosophy in one sentence?",
            insight: "Best-in-class candidates can articulate their approach. Example: 'I lead by empowering team members to own their work while maintaining accountability through regular check-ins.' Be specific about your style.",
            color: "text-green-600"
          }
        ];

      case 'strategic_impact':
        return [
          {
            icon: Target,
            question: "What business problem did you solve?",
            insight: "Strategic impact means connecting your work to business outcomes. Did you reduce costs? Increase revenue? Improve efficiency? Reduce customer churn? Quantify the before/after impact.",
            color: "text-blue-600"
          },
          {
            icon: TrendingUp,
            question: "What would have happened if you hadn't done this work?",
            insight: "Sometimes your impact is preventing problems. Avoided downtime, prevented customer loss, caught issues before they became critical. These 'defensive' achievements are strategic impact.",
            color: "text-green-600"
          }
        ];

      case 'professional_resources':
        return [
          {
            icon: Lightbulb,
            question: "What frameworks or methodologies do you follow?",
            insight: "Best-in-class professionals name their frameworks explicitly: Agile/Scrum, Six Sigma, Design Thinking, OKRs, LEAN, Design Sprints. If you follow these practices (even informally), list them.",
            color: "text-amber-600"
          },
          {
            icon: CheckCircle2,
            question: "Who are the experts you learn from?",
            insight: "Your professional network includes: industry mentors, online communities, professional associations, thought leaders you follow. These connections demonstrate you stay current in your field.",
            color: "text-purple-600"
          }
        ];

      default:
        return [];
    }
  };

  const insights = getCreativeInsights();

  // Get what's missing from benchmark
  const getMissingItems = () => {
    const missing = [
      ...(benchmarkData.missing || []),
      ...(benchmarkData.critical_missing || []),
      ...(benchmarkData.focus_areas || []),
      ...(benchmarkData.missing_metrics || []),
      ...(benchmarkData.expected_tools || []),
      ...(benchmarkData.examples || [])
    ];
    return missing.slice(0, 5); // Show top 5
  };

  const missingItems = getMissingItems();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(formData).length === 0) return;

    setLoading(true);
    try {
      let table: string;
      let insertData: any = { vault_id: vaultId };

      switch (sectionKey) {
        case 'work_experience':
          table = 'vault_power_phrases';
          insertData = {
            ...insertData,
            phrase_text: formData.phrase_text,
            category: 'work_experience',
            quality_tier: 'silver'
          };
          break;

        case 'skills':
          table = 'vault_technical_skills';
          insertData = {
            ...insertData,
            skill_name: formData.skill_name,
            proficiency_level: formData.proficiency_level || 'intermediate',
            years_of_experience: formData.years_of_experience || 0
          };
          break;

        case 'leadership':
          table = 'vault_leadership_philosophy';
          insertData = {
            ...insertData,
            philosophy_statement: formData.philosophy_statement,
            quality_tier: 'silver'
          };
          break;

        case 'strategic_impact':
          table = 'vault_power_phrases';
          insertData = {
            ...insertData,
            phrase_text: formData.impact_statement,
            category: 'strategic_impact',
            quality_tier: 'gold'
          };
          break;

        case 'professional_resources':
          table = 'vault_professional_network';
          insertData = {
            ...insertData,
            resource_name: formData.resource_name,
            resource_type: formData.resource_type || 'tool'
          };
          break;

        default:
          throw new Error('Unknown section');
      }

      const { error } = await supabase.from(table as any).insert(insertData);

      if (error) throw error;

      toast.success('Added to your Career Vault!', {
        description: `+${Math.round(target / 10)} points toward ${sectionTitle}`
      });

      setFormData({});
      onVaultUpdated();
    } catch (error) {
      console.error('Error adding to vault:', error);
      toast.error('Failed to add item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <Card className="border-2">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-1">{sectionTitle}</CardTitle>
              <p className="text-muted-foreground text-sm">{sectionDescription}</p>
            </div>
            {isComplete && (
              <Badge className="bg-green-600 text-white">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Complete
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current vs. Benchmark */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-1">
                Your Current
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-500">
                {current}
              </p>
            </div>

            <div className="text-center p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1">
                Gap
              </p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-500">
                {pointsNeeded}
              </p>
            </div>

            <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-xs text-green-700 dark:text-green-400 uppercase tracking-wide mb-1">
                Best-in-Class
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-500">
                {target}
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold">{percentage}%</span>
            </div>
            <Progress value={percentage} className="h-2" />
          </div>

          {/* Benchmark Standard */}
          {benchmarkData.benchmark_rule && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Best-in-Class Standard
              </p>
              <p className="text-sm">{benchmarkData.benchmark_rule}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content: Insights + Quick Add */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Creative Insights (3/5) */}
        <div className="lg:col-span-3 space-y-4">
          <h3 className="text-lg font-semibold">
            You're Probably Better Than You Think
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Most professionals underestimate their expertise. These questions help you give yourself proper credit:
          </p>

          {insights.map((insight, idx) => {
            const Icon = insight.icon;
            return (
              <Card key={idx} className="border-l-4" style={{ borderLeftColor: insight.color.replace('text-', '') }}>
                <CardContent className="pt-4">
                  <div className="flex gap-3">
                    <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${insight.color}`} />
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-2">
                        {insight.question}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {insight.insight}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* What's Missing */}
          {missingItems.length > 0 && (
            <Card className="bg-amber-50/50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4 text-amber-600" />
                  Missing from Best-in-Class Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {missingItems.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-amber-600 mt-1">•</span>
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Quick Add Form (2/5) */}
        <div className="lg:col-span-2">
          <Card className="sticky top-6 border-2 border-primary/20">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add to {sectionTitle}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <SectionForm
                  sectionKey={sectionKey}
                  formData={formData}
                  setFormData={setFormData}
                />

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormData({})}
                    disabled={loading || Object.keys(formData).length === 0}
                  >
                    Clear
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={loading || Object.keys(formData).length === 0}
                  >
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Add to Vault
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/**
 * SectionForm - Dynamic form based on section type
 */
function SectionForm({
  sectionKey,
  formData,
  setFormData
}: {
  sectionKey: SectionKey;
  formData: Record<string, any>;
  setFormData: (data: Record<string, any>) => void;
}) {
  switch (sectionKey) {
    case 'work_experience':
      return (
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Achievement or Responsibility
            </label>
            <Textarea
              placeholder="Led 8-person team with $1.2M budget, increased customer satisfaction by 25%"
              value={formData.phrase_text || ''}
              onChange={(e) => setFormData({ ...formData, phrase_text: e.target.value })}
              rows={3}
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Include numbers: team size, budget, % improvement, dollar impact
            </p>
          </div>
        </div>
      );

    case 'skills':
      return (
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-2 block">Skill Name</label>
            <Input
              placeholder="e.g., Python, Salesforce, Project Management"
              value={formData.skill_name || ''}
              onChange={(e) => setFormData({ ...formData, skill_name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Years</label>
              <Input
                type="number"
                placeholder="3"
                value={formData.years_of_experience || ''}
                onChange={(e) => setFormData({ ...formData, years_of_experience: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Level</label>
              <select
                value={formData.proficiency_level || 'intermediate'}
                onChange={(e) => setFormData({ ...formData, proficiency_level: e.target.value })}
                className="w-full text-sm rounded-md border border-input bg-background px-3 py-2"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
            </div>
          </div>
        </div>
      );

    case 'leadership':
      return (
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Your Leadership Approach
            </label>
            <Textarea
              placeholder="I lead by empowering team members to own their work while maintaining accountability through regular 1:1s and clear goals"
              value={formData.philosophy_statement || ''}
              onChange={(e) => setFormData({ ...formData, philosophy_statement: e.target.value })}
              rows={4}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Be specific about your style and methods
            </p>
          </div>
        </div>
      );

    case 'strategic_impact':
      return (
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Strategic Achievement
            </label>
            <Textarea
              placeholder="Reduced operational costs by 30% ($450K annually) through automation and process redesign"
              value={formData.impact_statement || ''}
              onChange={(e) => setFormData({ ...formData, impact_statement: e.target.value })}
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Focus on business outcomes: revenue, cost savings, efficiency, customer impact
            </p>
          </div>
        </div>
      );

    case 'professional_resources':
      return (
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Tool or Resource
            </label>
            <Input
              placeholder="e.g., Jira, Agile/Scrum, AWS"
              value={formData.resource_name || ''}
              onChange={(e) => setFormData({ ...formData, resource_name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Type</label>
            <select
              value={formData.resource_type || 'tool'}
              onChange={(e) => setFormData({ ...formData, resource_type: e.target.value })}
              className="w-full text-sm rounded-md border border-input bg-background px-3 py-2"
            >
              <option value="tool">Tool/Software</option>
              <option value="framework">Framework/Methodology</option>
              <option value="certification">Certification</option>
              <option value="network">Professional Network</option>
            </select>
          </div>
        </div>
      );

    default:
      return null;
  }
}
