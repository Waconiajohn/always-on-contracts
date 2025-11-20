import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Calendar } from "lucide-react";
import type { WorkPosition } from "@/types/vault";

interface WorkHistoryTimelineProps {
  workPositions: WorkPosition[];
}

export const WorkHistoryTimeline = ({ workPositions }: WorkHistoryTimelineProps) => {
  if (!workPositions || workPositions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Work History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No work history available. Upload your resume to extract your work experience.</p>
        </CardContent>
      </Card>
    );
  }

  // Sort by start date (most recent first)
  const sortedPositions = [...workPositions].sort((a, b) => {
    const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
    const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
    return dateB - dateA;
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "?";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Work History ({workPositions.length} positions)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {sortedPositions.map((position) => (
            <div key={position.id} className="relative pl-8 pb-6 border-l-2 border-border last:pb-0">
              <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-primary" />
              
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-lg">{position.job_title}</h3>
                    <p className="text-muted-foreground">{position.company_name}</p>
                  </div>
                  {position.is_current && (
                    <Badge variant="default" className="shrink-0">Current</Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {formatDate(position.start_date || null)} - {position.is_current ? 'Present' : formatDate(position.end_date || null)}
                  </span>
                </div>
                
                {position.description && (
                  <p className="text-sm text-muted-foreground mt-2">{position.description}</p>
                )}
                
                {position.team_size && (
                  <Badge variant="outline" className="mt-2">
                    Team Size: {position.team_size}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
