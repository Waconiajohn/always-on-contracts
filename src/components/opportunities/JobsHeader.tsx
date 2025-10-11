import { Button } from "@/components/ui/button";

interface JobsHeaderProps {
  jobCount: number;
  displayLimit: number;
  onLoadMore: () => void;
  onShowLess: () => void;
}

export const JobsHeader = ({
  jobCount,
  displayLimit,
  onLoadMore,
  onShowLess,
}: JobsHeaderProps) => {
  if (jobCount === 0) return null;

  return (
    <div className="flex justify-between items-center mb-6">
      <p className="text-muted-foreground">
        Showing {Math.min(displayLimit, jobCount)} of {jobCount} matches
      </p>
      <div className="flex gap-2">
        {displayLimit < jobCount && (
          <Button onClick={onLoadMore} variant="outline" size="sm">
            Load More
          </Button>
        )}
        {displayLimit > 10 && (
          <Button onClick={onShowLess} variant="ghost" size="sm">
            Show Less
          </Button>
        )}
      </div>
    </div>
  );
};
