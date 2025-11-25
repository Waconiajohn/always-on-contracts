import { Target, Calendar, TrendingUp, Clock } from "lucide-react";
import { CollapsibleSection } from "./CollapsibleSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, differenceInDays } from "date-fns";

interface V3ActiveJobSearchProps {
  activeApplications: number;
  upcomingInterviews: number;
}

export function V3ActiveJobSearch({
  activeApplications,
  upcomingInterviews
}: V3ActiveJobSearchProps) {
  const navigate = useNavigate();

  // Don't show if no active job search
  if (activeApplications === 0 && upcomingInterviews === 0) {
    return null;
  }

  // Mock data for demonstration - would come from useUserContext
  const applicationsByStatus = {
    pending: Math.round(activeApplications * 0.4),
    screening: Math.round(activeApplications * 0.3),
    interview: Math.round(activeApplications * 0.2),
    offer: Math.round(activeApplications * 0.1)
  };

  const readyForFollowUp = Math.max(1, Math.round(activeApplications * 0.3));
  const nextInterviewDate = upcomingInterviews > 0 ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) : null;
  const daysUntilInterview = nextInterviewDate ? differenceInDays(nextInterviewDate, new Date()) : null;

  return (
    <CollapsibleSection
      title="🎯 Active Job Search"
      defaultOpen={upcomingInterviews > 0}
      className="mb-6"
    >
      <Alert className="mb-6 border-primary/20 bg-primary/5">
        <Info className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm">
          <span className="font-medium">Why this matters:</span> Active tracking ensures you follow up at optimal times. Gemini 2.5 Flash analyzes application timestamps and company response patterns to suggest perfect follow-up moments.
        </AlertDescription>
      </Alert>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Applications Tracker */}
        <div className="border border-border rounded-lg p-5 bg-card">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold">Applications Tracker</h3>
              <Badge variant="outline" className="mt-1">
                Gemini 2.5 Flash analyzes timing
              </Badge>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Target className="h-5 w-5 text-primary" />
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Pending Review</span>
              <span className="font-semibold">{applicationsByStatus.pending}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">In Screening</span>
              <span className="font-semibold">{applicationsByStatus.screening}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Interview Stage</span>
              <span className="font-semibold">{applicationsByStatus.interview}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Offers</span>
              <span className="font-semibold text-green-600">{applicationsByStatus.offer}</span>
            </div>
          </div>

          {readyForFollowUp > 0 && (
            <div className="pt-3 border-t border-border">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">AI Follow-up Suggestion</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {readyForFollowUp} application{readyForFollowUp > 1 ? 's' : ''} ready for follow-up based on optimal timing
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => navigate('/applications')}
              >
                Review Follow-ups
              </Button>
            </div>
          )}
        </div>

        {/* Interview Prep */}
        {upcomingInterviews > 0 && nextInterviewDate && (
          <div className="border border-primary/20 rounded-lg p-5 bg-gradient-to-br from-primary/5 to-background">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold">Interview Prep</h3>
                <Badge variant="outline" className="mt-1">
                  GPT-5 generates practice questions
                </Badge>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Next Interview</p>
                <p className="text-lg font-semibold">
                  {format(nextInterviewDate, 'MMM d, yyyy')}
                </p>
                <p className="text-sm text-primary">
                  {daysUntilInterview === 0 ? 'Today!' : daysUntilInterview === 1 ? 'Tomorrow' : `In ${daysUntilInterview} days`}
                </p>
              </div>

              <div className="pt-3 border-t border-border">
                <p className="text-sm font-medium mb-2">Vault Items to Review</p>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3 w-3" />
                    <span>Key achievements in similar roles</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3 w-3" />
                    <span>Leadership philosophy statements</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3 w-3" />
                    <span>Technical skills for this position</span>
                  </div>
                </div>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={() => navigate('/interview-prep')}
            >
              Start Interview Prep
            </Button>
          </div>
        )}

        {/* If no upcoming interviews, show applications only in full width */}
        {upcomingInterviews === 0 && (
          <div className="border border-border rounded-lg p-5 bg-card">
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-2">No Upcoming Interviews</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Keep applying to quality opportunities. Our AI will help you prepare when interviews are scheduled.
              </p>
              <Button
                variant="outline"
                onClick={() => navigate('/job-search')}
              >
                Find More Jobs
              </Button>
            </div>
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}
