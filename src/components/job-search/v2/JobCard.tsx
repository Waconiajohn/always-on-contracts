import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, DollarSign, Briefcase, Clock, FileText, Star, StarOff, ChevronDown, ChevronUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface JobCardProps {
  job: any;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onGenerateResume: (job: any) => void;
  onAddToQueue: (job: any) => void;
  onSaveJob: (job: any) => void;
  onUnsaveJob: (job: any) => void;
  isSaved: boolean;
  contractOnly: boolean;
}

export function JobCard({
  job,
  isExpanded,
  onToggleExpand,
  onGenerateResume,
  onAddToQueue,
  onSaveJob,
  onUnsaveJob,
  isSaved,
  contractOnly
}: JobCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400 border-green-200 bg-green-50";
    if (score >= 60) return "text-blue-600 dark:text-blue-400 border-blue-200 bg-blue-50";
    return "text-yellow-600 dark:text-yellow-400 border-yellow-200 bg-yellow-50";
  };

  const formatSalary = (min?: number | null, max?: number | null) => {
    if (!min && !max) return null;
    if (min && max) return `$${(min / 1000).toFixed(0)}k-$${(max / 1000).toFixed(0)}k`;
    if (min) return `$${(min / 1000).toFixed(0)}k+`;
    if (max) return `Up to $${(max / 1000).toFixed(0)}k`;
    return null;
  };

  return (
    <Card className="hover:border-primary/50 transition-all duration-200 group">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-4">
            {/* Company Logo Placeholder or Logic */}
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-xl font-bold text-muted-foreground uppercase">
              {job.company?.charAt(0) || "C"}
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">
                  {job.title}
                </h3>
                {job.match_score && job.match_score > 0 && (
                  <Badge variant="outline" className={getScoreColor(job.match_score)}>
                    {job.match_score}% Match
                  </Badge>
                )}
                {contractOnly && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">Contract</Badge>
                )}
              </div>
              <p className="text-lg text-muted-foreground font-medium">{job.company}</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => isSaved ? onUnsaveJob(job) : onSaveJob(job)}
            className="text-muted-foreground hover:text-yellow-500"
            title={isSaved ? "Remove from saved" : "Save for later"}
          >
            {isSaved ? (
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            ) : (
              <StarOff className="h-5 w-5" />
            )}
          </Button>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4 pl-[4rem]">
          {job.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {job.location}
            </div>
          )}
          {formatSalary(job.salary_min, job.salary_max) && (
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              {formatSalary(job.salary_min, job.salary_max)}
            </div>
          )}
          {job.employment_type && (
            <div className="flex items-center gap-1 capitalize">
              <Briefcase className="h-4 w-4" />
              {job.employment_type.replace('_', ' ')}
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {(() => {
              try {
                const date = new Date(job.posted_date);
                if (isNaN(date.getTime())) return 'Recently';
                return formatDistanceToNow(date, { addSuffix: true });
              } catch {
                return 'Recently';
              }
            })()}
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4 pl-[4rem]">
          <Badge variant="outline" className="text-xs font-normal">{job.source}</Badge>
          {job.remote_type && (
            <Badge variant="secondary" className="text-xs font-normal capitalize">
              {job.remote_type}
            </Badge>
          )}
        </div>

        {job.description && (
          <div className="mb-4 relative pl-[4rem]">
            <p className={`text-sm text-muted-foreground leading-relaxed transition-all ${
              isExpanded ? '' : 'line-clamp-2'
            }`}>
              {job.description}
            </p>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleExpand(job.id)}
              className="h-auto p-0 text-xs text-primary hover:text-primary/80 mt-1"
            >
              {isExpanded ? (
                <span className="flex items-center">Show Less <ChevronUp className="h-3 w-3 ml-1" /></span>
              ) : (
                <span className="flex items-center">Read More <ChevronDown className="h-3 w-3 ml-1" /></span>
              )}
            </Button>
          </div>
        )}

        <div className="flex flex-wrap gap-3 pl-[4rem] pt-2 border-t mt-4">
          <Button 
            onClick={() => onGenerateResume(job)} 
            className="gap-2 shadow-sm"
          >
            <FileText className="h-4 w-4" />
            Generate Resume
          </Button>
          <Button onClick={() => onAddToQueue(job)} variant="secondary" className="gap-2">
            Add to Applications
          </Button>
          {job.apply_url && (
            <Button variant="outline" asChild className="ml-auto">
              <a href={job.apply_url} target="_blank" rel="noopener noreferrer">
                Apply Externally
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
