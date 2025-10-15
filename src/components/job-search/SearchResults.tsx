import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bookmark, ExternalLink, MapPin, DollarSign, Clock, Building, Plus } from "lucide-react";

interface JobListing {
  id: string;
  job_title: string;
  company_name: string;
  company_logo_url?: string | null;
  location?: string | null;
  remote_type?: string | null;
  employment_type?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_period?: string | null;
  job_description?: string | null;
  posted_date?: string | null;
  apply_url?: string | null;
  match_score?: number | null;
  source: string;
}

interface SearchResultsProps {
  jobs: JobListing[];
  onSaveJob: (jobId: string) => void;
  onAddToQueue?: (job: JobListing) => void;
}

const formatSalary = (min?: number | null, max?: number | null, period?: string | null) => {
  if (!min && !max) return null;
  const formatted = min && max ? `$${min.toLocaleString()} - $${max.toLocaleString()}` : 
                    min ? `$${min.toLocaleString()}+` :
                    max ? `Up to $${max.toLocaleString()}` : null;
  return formatted ? `${formatted} ${period || 'annual'}` : null;
};

const getMatchColor = (score?: number | null) => {
  if (!score) return "bg-muted";
  if (score >= 80) return "bg-green-500 text-white";
  if (score >= 60) return "bg-blue-500 text-white";
  return "bg-yellow-500 text-white";
};

const formatPostedDate = (date?: string | null) => {
  if (!date) return null;
  const posted = new Date(date);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
};

export const SearchResults = ({ jobs, onSaveJob, onAddToQueue }: SearchResultsProps) => {
  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No jobs found. Try adjusting your filters or search query.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <Card key={job.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3 flex-1">
                {job.company_logo_url && (
                  <img 
                    src={job.company_logo_url} 
                    alt={`${job.company_name} logo`}
                    className="h-12 w-12 rounded object-contain"
                  />
                )}
                <div className="flex-1">
                  <CardTitle className="text-xl mb-1">{job.job_title}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    {job.company_name}
                  </CardDescription>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-2">
                {job.match_score && (
                  <Badge className={getMatchColor(job.match_score)}>
                    {job.match_score}% Match
                  </Badge>
                )}
                <Badge variant="outline">{job.source}</Badge>
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
              {job.remote_type && (
                <Badge variant="secondary">{job.remote_type}</Badge>
              )}
              {job.employment_type && (
                <Badge variant="secondary">{job.employment_type}</Badge>
              )}
              {formatSalary(job.salary_min, job.salary_max, job.salary_period) && (
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  {formatSalary(job.salary_min, job.salary_max, job.salary_period)}
                </div>
              )}
              {job.posted_date && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatPostedDate(job.posted_date)}
                </div>
              )}
            </div>

            {job.job_description && (
              <p className="text-sm text-muted-foreground line-clamp-3">
                {job.job_description}
              </p>
            )}

            <div className="flex gap-2 pt-2">
              {job.apply_url && (
                <Button asChild className="flex-1">
                  <a href={job.apply_url} target="_blank" rel="noopener noreferrer">
                    Apply Now
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              )}
              {onAddToQueue && (
                <Button 
                  variant="secondary" 
                  onClick={() => onAddToQueue(job)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Queue
                </Button>
              )}
              <Button variant="outline" onClick={() => onSaveJob(job.id)}>
                <Bookmark className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
