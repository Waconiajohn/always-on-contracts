import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X, ExternalLink, MapPin, DollarSign, Briefcase, Sparkles } from "lucide-react";

interface AISuggestion {
  id: string;
  match_score: number | null;
  ai_recommendation?: string | null;
  matching_skills?: string[] | null;
  job_opportunities: {
    id: string;
    job_title: string;
    location: string | null;
    job_description: string | null;
    external_url: string | null;
    hourly_rate_min: number | null;
    hourly_rate_max: number | null;
    contract_type: string | null;
    contract_duration_months: number | null;
    required_skills: string[] | null;
  };
}

interface AISuggestionItemProps {
  suggestion: AISuggestion;
  onAddToQueue: (id: string) => void;
  onDismiss: (id: string) => void;
}

export const AISuggestionItem = ({ suggestion, onAddToQueue, onDismiss }: AISuggestionItemProps) => {
  const { job_opportunities: job, match_score, ai_recommendation, matching_skills } = suggestion;

  const getMatchScoreColor = (score: number | null) => {
    if (!score) return "bg-muted";
    if (score >= 85) return "bg-green-500 text-white";
    if (score >= 70) return "bg-blue-500 text-white";
    if (score >= 50) return "bg-yellow-500 text-white";
    return "bg-muted";
  };

  const formatRate = (min?: number | null, max?: number | null) => {
    if (!min && !max) return null;
    if (min && max) return `$${min}-$${max}/hr`;
    if (min) return `$${min}+/hr`;
    return `Up to $${max}/hr`;
  };

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <Badge className={getMatchScoreColor(match_score)}>
                {Math.round(match_score || 0)}% AI Match
              </Badge>
            </div>
            <CardTitle className="text-xl">{job.job_title}</CardTitle>
            {job.location && (
              <CardDescription className="flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3" />
                {job.location}
              </CardDescription>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => onAddToQueue(suggestion.id)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add to Queue
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDismiss(suggestion.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* AI Recommendation */}
        {ai_recommendation && (
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-sm font-medium mb-1 flex items-center gap-2">
              <Sparkles className="h-3 w-3" />
              Why this matches:
            </p>
            <p className="text-sm text-muted-foreground">{ai_recommendation}</p>
          </div>
        )}

        {/* Job Details */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {formatRate(job.hourly_rate_min, job.hourly_rate_max) && (
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              {formatRate(job.hourly_rate_min, job.hourly_rate_max)}
            </div>
          )}
          {job.contract_type && (
            <div className="flex items-center gap-1">
              <Briefcase className="h-4 w-4" />
              {job.contract_type}
            </div>
          )}
          {job.contract_duration_months && (
            <Badge variant="secondary">
              {job.contract_duration_months} months
            </Badge>
          )}
        </div>

        {/* Matching Skills */}
        {matching_skills && matching_skills.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Matching Skills:</p>
            <div className="flex flex-wrap gap-2">
              {matching_skills.slice(0, 6).map((skill) => (
                <Badge key={skill} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {matching_skills.length > 6 && (
                <Badge variant="outline" className="text-xs">
                  +{matching_skills.length - 6} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Required Skills */}
        {job.required_skills && job.required_skills.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Required Skills:</p>
            <div className="flex flex-wrap gap-2">
              {job.required_skills.slice(0, 5).map((skill) => (
                <Badge key={skill} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {job.required_skills.length > 5 && (
                <Badge variant="secondary" className="text-xs">
                  +{job.required_skills.length - 5} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        {job.job_description && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {job.job_description}
          </p>
        )}

        {/* External Link */}
        {job.external_url && (
          <Button variant="outline" size="sm" asChild>
            <a href={job.external_url} target="_blank" rel="noopener noreferrer">
              View Full Details
              <ExternalLink className="ml-2 h-3 w-3" />
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
};