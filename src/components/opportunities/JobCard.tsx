import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, MapPin, DollarSign, Calendar, Sparkles } from "lucide-react";
import { OpportunityMatch } from "@/types/opportunities";

interface JobCardProps {
  match: OpportunityMatch;
  onStatusUpdate: (matchId: string, status: string) => void;
  getScoreColor: (score: number) => string;
  getStatusColor: (status: string) => "default" | "secondary" | "destructive" | "outline";
}

export const JobCard = ({ match, onStatusUpdate, getScoreColor, getStatusColor }: JobCardProps) => {
  const job = match.job_opportunities;
  const matchScore = match.match_score ?? 0;
  const status = match.status ?? 'new';

  return (
    <Card key={match.id} className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-xl">{job.job_title}</CardTitle>
              {job.contract_confidence_score && job.contract_confidence_score >= 80 && (
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="h-3 w-3" />
                  Verified
                </Badge>
              )}
            </div>
            <CardDescription className="text-base">
              {job.agency_id ? 'Agency Opportunity' : 'Direct Hire'}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={getScoreColor(matchScore)}>
              {matchScore}% Match
            </Badge>
            <Badge variant={getStatusColor(status)}>
              {status}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {job.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {job.location}
            </div>
          )}
          {job.hourly_rate_min && job.hourly_rate_max && (
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              ${job.hourly_rate_min}-${job.hourly_rate_max}/hr
            </div>
          )}
          {job.contract_duration_months && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {job.contract_duration_months} months
            </div>
          )}
        </div>

        {job.job_description && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {job.job_description}
          </p>
        )}

        {job.required_skills && job.required_skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {job.required_skills.slice(0, 6).map((skill, idx) => (
              <Badge key={idx} variant="outline">
                {skill}
              </Badge>
            ))}
            {job.required_skills.length > 6 && (
              <Badge variant="outline">+{job.required_skills.length - 6} more</Badge>
            )}
          </div>
        )}

        {match.ai_recommendation && (
          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm">
              <span className="font-semibold">AI Insight: </span>
              {match.ai_recommendation}
            </p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {job.external_url && (
            <Button asChild className="flex-1">
              <a href={job.external_url} target="_blank" rel="noopener noreferrer">
                View Job <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          )}
          {status === "new" && (
            <Button
              variant="outline"
              onClick={() => onStatusUpdate(match.id, "applied")}
            >
              Mark Applied
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
