import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Calendar, Building2 } from "lucide-react";
import { format } from "date-fns";

interface MilestoneMetric {
  metric: string;
  value: string | number;
  context?: string;
}

interface ResumeMilestone {
  id: string;
  vault_id?: string;
  user_id?: string;
  milestone_title?: string;
  title?: string;
  organization?: string;
  company_name?: string | null;
  date_start?: string | null;
  date_end?: string | null;
  description?: string | null;
  achievements?: string[] | null;
  skills_used?: string[] | null;
  metrics?: MilestoneMetric[] | null;
  metric_type?: string | null;
  metric_value?: string | null;
  context?: string | null;
  confidence_score?: number | null;
  quality_tier?: string | null;
}

interface MilestonesListProps {
  milestones: ResumeMilestone[];
}

const QUALITY_COLORS: Record<string, string> = {
  gold: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  silver: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
  bronze: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  assumed: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
};

export function MilestonesList({ milestones }: MilestonesListProps) {
  if (milestones.length === 0) {
    return null;
  }

  const sortedMilestones = [...milestones].sort((a, b) => {
    const dateA = a.date_end || a.date_start || '0';
    const dateB = b.date_end || b.date_start || '0';
    return dateB.localeCompare(dateA);
  });

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Career Milestones</h3>
        <Badge variant="secondary" className="ml-auto">
          {milestones.length} {milestones.length === 1 ? 'Milestone' : 'Milestones'}
        </Badge>
      </div>

      <div className="grid gap-4">
        {sortedMilestones.map((milestone) => {
          const title = milestone.milestone_title || milestone.title || 'Untitled Milestone';
          const company = milestone.organization || milestone.company_name;
          const qualityColor = QUALITY_COLORS[milestone.quality_tier || 'assumed'];

          return (
            <Card key={milestone.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="mt-1 p-2 rounded-lg bg-primary/10">
                  <Trophy className="h-5 w-5 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{title}</h4>
                      {company && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                          <Building2 className="h-3 w-3" />
                          <span>{company}</span>
                        </div>
                      )}
                      {milestone.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {milestone.description}
                        </p>
                      )}
                    </div>
                    
                    {milestone.quality_tier && (
                      <Badge variant="outline" className={qualityColor}>
                        {milestone.quality_tier}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                    {(milestone.date_start || milestone.date_end) && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {milestone.date_start && format(new Date(milestone.date_start), 'MMM yyyy')}
                          {milestone.date_start && milestone.date_end && ' - '}
                          {milestone.date_end && format(new Date(milestone.date_end), 'MMM yyyy')}
                        </span>
                      </div>
                    )}
                    
                    {milestone.metric_value && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        <span className="font-medium">{milestone.metric_value}</span>
                      </div>
                    )}
                  </div>

                  {milestone.achievements && milestone.achievements.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs font-medium mb-1">Key Achievements:</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {milestone.achievements.slice(0, 3).map((achievement, i) => (
                          <li key={i} className="line-clamp-1">• {achievement}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {milestone.skills_used && milestone.skills_used.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {milestone.skills_used.slice(0, 5).map((skill, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {milestone.skills_used.length > 5 && (
                        <Badge variant="secondary" className="text-xs">
                          +{milestone.skills_used.length - 5} more
                        </Badge>
                      )}
                    </div>
                  )}

                  {milestone.metrics && milestone.metrics.length > 0 && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-xs font-medium mb-1">Metrics:</p>
                      <div className="flex flex-wrap gap-2">
                        {milestone.metrics.map((metric, i) => (
                          <div key={i} className="text-xs">
                            <span className="font-medium">{metric.metric}:</span>{' '}
                            <span className="text-muted-foreground">{metric.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </Card>
  );
}
