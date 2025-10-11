import { Briefcase } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";

interface EmptyJobsStateProps {
  onMatch: () => void;
  matching: boolean;
}

export const EmptyJobsState = ({ onMatch, matching }: EmptyJobsStateProps) => {
  return (
    <EmptyState
      icon={Briefcase}
      title="No Opportunities Yet"
      description="Run AI matching to find personalized job opportunities based on your profile"
      actionLabel={matching ? "Finding Matches..." : "Find Matches"}
      onAction={onMatch}
    />
  );
};
