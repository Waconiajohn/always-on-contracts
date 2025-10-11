import { useMemo } from "react";
import { OpportunityMatch } from "@/types/opportunities";
import { JobCard } from "./JobCard";
import { JobsHeader } from "./JobsHeader";
import { EmptyJobsState } from "./EmptyJobsState";

interface FullTimeJobsListProps {
  jobs: OpportunityMatch[];
  displayLimit: number;
  setDisplayLimit: (limit: number | ((prev: number) => number)) => void;
  onStatusUpdate: (matchId: string, status: string) => void;
  matching: boolean;
  onMatch: () => void;
  getScoreColor: (score: number) => string;
  getStatusColor: (status: string) => "default" | "secondary" | "destructive" | "outline";
}

export const FullTimeJobsList = ({
  jobs,
  displayLimit,
  setDisplayLimit,
  onStatusUpdate,
  matching,
  onMatch,
  getScoreColor,
  getStatusColor,
}: FullTimeJobsListProps) => {
  const displayedJobs = useMemo(
    () => jobs.slice(0, displayLimit),
    [jobs, displayLimit]
  );

  if (jobs.length === 0) {
    return <EmptyJobsState onMatch={onMatch} matching={matching} />;
  }

  return (
    <div className="space-y-6">
      <JobsHeader
        jobCount={jobs.length}
        displayLimit={displayLimit}
        onLoadMore={() => setDisplayLimit((prev) => prev + 10)}
        onShowLess={() => setDisplayLimit(10)}
      />
      
      <div className="grid gap-6">
        {displayedJobs.map((match) => (
          <JobCard
            key={match.id}
            match={match}
            onStatusUpdate={onStatusUpdate}
            getScoreColor={getScoreColor}
            getStatusColor={getStatusColor}
          />
        ))}
      </div>
    </div>
  );
};
