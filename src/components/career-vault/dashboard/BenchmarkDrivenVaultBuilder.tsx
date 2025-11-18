import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Lock,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface BenchmarkSection {
  name: string;
  target: number;
  current: number;
  percentage: number;
  missing?: string[];
  details?: string;
  examples?: string[];
  focus_areas?: string[];
  critical_missing?: string[];
  missing_metrics?: string[];
  expected_tools?: string[];
}

interface BenchmarkDrivenVaultBuilderProps {
  vaultId: string;
  benchmark: any;
  onVaultUpdated?: () => void;
}

type SectionKey = 'work_experience' | 'skills' | 'leadership' | 'strategic_impact' | 'professional_resources';

/**
 * Benchmark-Driven Vault Builder
 *
 * Replaces random Smart Questions with a structured, section-by-section
 * vault building experience that follows resume structure and shows
 * clear benchmark progress.
 */
export function BenchmarkDrivenVaultBuilder({
  vaultId,
  benchmark,
  onVaultUpdated
}: BenchmarkDrivenVaultBuilderProps) {
  const [expandedSection, setExpandedSection] = useState<SectionKey | null>('work_experience');
  const [loading, setLoading] = useState(false);

  // Calculate overall progress
  const overallPercentage = Math.round(
    (benchmark.overall_current / benchmark.overall_target) * 100
  );

  // Define sections in order
  const sections: Array<{
    key: SectionKey;
    title: string;
    layer: 1 | 2;
    data: BenchmarkSection;
    unlockThreshold?: number;
  }> = [
    {
      key: 'work_experience',
      title: 'Work Experience',
      layer: 1,
      data: {
        name: 'Work Experience',
        ...benchmark.layer1_foundations.work_experience
      }
    },
    {
      key: 'skills',
      title: 'Skills & Expertise',
      layer: 1,
      data: {
        name: 'Skills & Expertise',
        ...benchmark.layer1_foundations.skills
      }
    },
    {
      key: 'leadership',
      title: 'Leadership Approach',
      layer: 2,
      data: {
        name: 'Leadership Approach',
        ...benchmark.layer2_intelligence.leadership
      },
      unlockThreshold: 60
    },
    {
      key: 'strategic_impact',
      title: 'Strategic Impact',
      layer: 2,
      data: {
        name: 'Strategic Impact',
        ...benchmark.layer2_intelligence.strategic_impact
      },
      unlockThreshold: 60
    },
    {
      key: 'professional_resources',
      title: 'Professional Resources',
      layer: 2,
      data: {
        name: 'Professional Resources',
        ...benchmark.layer2_intelligence.professional_resources
      },
      unlockThreshold: 75
    }
  ];

  const toggleSection = (key: SectionKey) => {
    setExpandedSection(expandedSection === key ? null : key);
  };

  const isSectionLocked = (unlockThreshold?: number) => {
    return unlockThreshold ? overallPercentage < unlockThreshold : false;
  };

  const handleSubmit = async (sectionKey: SectionKey, data: any) => {
    setLoading(true);
    try {
      // Handle different section types
      let table: 'vault_power_phrases' | 'vault_transferable_skills' | 'vault_leadership_philosophy' | 'vault_hidden_competencies' | 'vault_professional_network' | 'vault_technical_skills' = 'vault_power_phrases';
      let insertData: any = {
        vault_id: vaultId
      };

      switch (sectionKey) {
        case 'work_experience':
          table = 'vault_power_phrases';
          insertData = {
            ...insertData,
            phrase_text: data.phrase_text,
            category: 'work_experience',
            quality_tier: 'silver'
          };
          break;
        case 'skills':
          table = 'vault_technical_skills';
          insertData = {
            ...insertData,
            skill_name: data.skill_name,
            proficiency_level: data.proficiency_level || 'intermediate',
            years_of_experience: data.years_of_experience
          };
          break;
        case 'leadership':
          table = 'vault_leadership_philosophy';
          insertData = {
            ...insertData,
            philosophy_statement: data.philosophy_statement,
            quality_tier: 'silver'
          };
          break;
        case 'strategic_impact':
          table = 'vault_power_phrases';
          insertData = {
            ...insertData,
            phrase_text: data.impact_statement,
            category: 'strategic_impact',
            quality_tier: 'gold'
          };
          break;
        case 'professional_resources':
          table = 'vault_professional_network';
          insertData = {
            ...insertData,
            resource_name: data.resource_name,
            resource_type: data.resource_type || 'tool'
          };
          break;
      }

      const { error } = await supabase.from(table as any).insert(insertData);

      if (error) throw error;

      toast.success('Added to your Career Vault!');

      if (onVaultUpdated) {
        onVaultUpdated();
      }
    } catch (error) {
      console.error('Error adding to vault:', error);
      toast.error('Failed to add item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Overall Progress */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Building Your Career Vault
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-semibold">{overallPercentage}%</span>
          </div>
          <Progress value={overallPercentage} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {overallPercentage < 60
              ? "Complete foundations to unlock advanced sections"
              : overallPercentage < 85
              ? "Great progress! Keep building to reach market ready"
              : "You're market ready! Keep refining for best results"}
          </p>
        </CardContent>
      </Card>

      {/* Section List */}
      <div className="space-y-2">
        {sections.map((section) => {
          const isLocked = isSectionLocked(section.unlockThreshold);
          const isExpanded = expandedSection === section.key;
          const isComplete = section.data.percentage >= 100;
          const needsWork = section.data.percentage < 100 && section.data.percentage > 0;

          return (
            <Card
              key={section.key}
              className={`
                ${isExpanded ? 'ring-2 ring-primary' : ''}
                ${isLocked ? 'opacity-60' : ''}
              `}
            >
              <CardHeader
                className="pb-3 cursor-pointer"
                onClick={() => !isLocked && toggleSection(section.key)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1">
                    {isLocked ? (
                      <Lock className="h-4 w-4 text-muted-foreground mt-0.5" />
                    ) : isComplete ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                    ) : needsWork ? (
                      <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-muted-foreground mt-0.5" />
                    )}

                    <div className="flex-1">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        {section.title}
                        {section.layer === 2 && (
                          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                            Layer 2
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {section.data.current}/{section.data.target} items
                        </span>
                        <Progress
                          value={section.data.percentage}
                          className="h-1.5 flex-1 max-w-[100px]"
                        />
                        <span className="text-xs font-medium">
                          {section.data.percentage}%
                        </span>
                      </div>
                      {isLocked && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Unlocks at {section.unlockThreshold}% overall progress
                        </p>
                      )}
                    </div>
                  </div>

                  {!isLocked && (
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>

              {isExpanded && !isLocked && (
                <CardContent className="pt-0 space-y-4">
                  {/* Benchmark Context */}
                  {section.data.details && (
                    <div className="p-3 bg-muted/50 rounded-lg text-xs">
                      <p className="font-medium mb-1">Benchmark Standard:</p>
                      <p className="text-muted-foreground">{section.data.details}</p>
                    </div>
                  )}

                  {/* Missing Items */}
                  {([
                    ...(section.data.missing || []),
                    ...(section.data.critical_missing || []),
                    ...(section.data.focus_areas || []),
                    ...(section.data.missing_metrics || []),
                    ...(section.data.expected_tools || [])
                  ].length > 0) && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium">What's Missing:</p>
                      <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                        {(section.data.missing ||
                          section.data.critical_missing ||
                          section.data.focus_areas ||
                          section.data.missing_metrics ||
                          section.data.expected_tools)?.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Quick Add Form */}
                  <div className="border-t pt-4">
                    <SectionQuickAddForm
                      sectionKey={section.key}
                      onSubmit={(data) => handleSubmit(section.key, data)}
                      loading={loading}
                    />
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Quick Add Form - Dynamic form based on section type
 */
function SectionQuickAddForm({
  sectionKey,
  onSubmit,
  loading
}: {
  sectionKey: SectionKey;
  onSubmit: (data: any) => void;
  loading: boolean;
}) {
  const [formData, setFormData] = useState<Record<string, any>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({});
  };

  const renderForm = () => {
    switch (sectionKey) {
      case 'work_experience':
        return (
          <>
            <div className="space-y-2">
              <label className="text-xs font-medium">
                Add a quantified achievement or responsibility:
              </label>
              <Textarea
                placeholder="e.g., Led 12-person team with $2.5M budget"
                value={formData.phrase_text || ''}
                onChange={(e) => setFormData({ ...formData, phrase_text: e.target.value })}
                rows={2}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Include numbers: team size, budget, % improvement, etc.
              </p>
            </div>
          </>
        );

      case 'skills':
        return (
          <>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium">Skill Name:</label>
                <Input
                  placeholder="e.g., JavaScript, Python, Project Management"
                  value={formData.skill_name || ''}
                  onChange={(e) => setFormData({ ...formData, skill_name: e.target.value })}
                  className="text-sm mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium">Years:</label>
                  <Input
                    type="number"
                    placeholder="5"
                    value={formData.years_of_experience || ''}
                    onChange={(e) => setFormData({ ...formData, years_of_experience: parseInt(e.target.value) || 0 })}
                    className="text-sm mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">Level:</label>
                  <select
                    value={formData.proficiency_level || 'intermediate'}
                    onChange={(e) => setFormData({ ...formData, proficiency_level: e.target.value })}
                    className="w-full text-sm mt-1 rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
              </div>
            </div>
          </>
        );

      case 'leadership':
        return (
          <>
            <div className="space-y-2">
              <label className="text-xs font-medium">
                Describe your leadership approach:
              </label>
              <Textarea
                placeholder="e.g., I lead by empowering team members to own their areas while maintaining clear accountability..."
                value={formData.philosophy_statement || ''}
                onChange={(e) => setFormData({ ...formData, philosophy_statement: e.target.value })}
                rows={3}
                className="text-sm"
              />
            </div>
          </>
        );

      case 'strategic_impact':
        return (
          <>
            <div className="space-y-2">
              <label className="text-xs font-medium">
                Add a strategic achievement with measurable impact:
              </label>
              <Textarea
                placeholder="e.g., Reduced operational costs by 30% ($450K annually) through process automation"
                value={formData.impact_statement || ''}
                onChange={(e) => setFormData({ ...formData, impact_statement: e.target.value })}
                rows={2}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Focus on business impact: revenue, cost savings, efficiency gains, customer satisfaction
              </p>
            </div>
          </>
        );

      case 'professional_resources':
        return (
          <>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium">Tool or Resource:</label>
                <Input
                  placeholder="e.g., Jira, Salesforce, AWS"
                  value={formData.resource_name || ''}
                  onChange={(e) => setFormData({ ...formData, resource_name: e.target.value })}
                  className="text-sm mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Type:</label>
                <select
                  value={formData.resource_type || 'tool'}
                  onChange={(e) => setFormData({ ...formData, resource_type: e.target.value })}
                  className="w-full text-sm mt-1 rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="tool">Tool/Software</option>
                  <option value="framework">Framework/Methodology</option>
                  <option value="certification">Certification</option>
                  <option value="network">Professional Network</option>
                </select>
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {renderForm()}
      <div className="flex gap-2 justify-end pt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setFormData({})}
          disabled={loading}
        >
          Clear
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={loading || Object.keys(formData).length === 0}
        >
          {loading && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
          Add to Vault
        </Button>
      </div>
    </form>
  );
}
