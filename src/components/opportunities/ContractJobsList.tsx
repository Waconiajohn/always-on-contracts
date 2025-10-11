import { useMemo } from "react";
import { NavigateFunction } from "react-router-dom";
import { OpportunityMatch } from "@/types/opportunities";
import { JobCard } from "./JobCard";
import { JobsHeader } from "./JobsHeader";
import { EmptyJobsState } from "./EmptyJobsState";
import { ContractToolsCards } from "./ContractToolsCards";

interface ContractJobsListProps {
  jobs: OpportunityMatch[];
  displayLimit: number;
  setDisplayLimit: (limit: number | ((prev: number) => number)) => void;
  onStatusUpdate: (matchId: string, status: string) => void;
  matching: boolean;
  onMatch: () => void;
  navigate: NavigateFunction;
  getScoreColor: (score: number) => string;
  getStatusColor: (status: string) => "default" | "secondary" | "destructive" | "outline";
}

export const ContractJobsList = ({
  jobs,
  displayLimit,
  setDisplayLimit,
  onStatusUpdate,
  matching,
  onMatch,
  navigate,
  getScoreColor,
  getStatusColor,
}: ContractJobsListProps) => {
  const displayedJobs = useMemo(
    () => jobs.slice(0, displayLimit),
    [jobs, displayLimit]
  );

  if (jobs.length === 0) {
    return (
      <div className="space-y-6">
        <ContractToolsCards navigate={navigate} />
        <EmptyJobsState onMatch={onMatch} matching={matching} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ContractToolsCards navigate={navigate} />
      
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
