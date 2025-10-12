import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SlidersHorizontal, X, Filter } from "lucide-react";

interface SearchFiltersProps {
  dateFilter: string;
  setDateFilter: (value: string) => void;
  remoteType: string;
  setRemoteType: (value: string) => void;
  employmentType: string;
  setEmploymentType: (value: string) => void;
  salaryRange: string;
  setSalaryRange: (value: string) => void;
  experienceLevel: string;
  setExperienceLevel: (value: string) => void;
  showAllFilters: boolean;
  setShowAllFilters: (show: boolean) => void;
  onClearFilters: () => void;
  appliedFiltersCount: number;
}

export const SearchFilters = ({
  dateFilter,
  setDateFilter,
  remoteType,
  setRemoteType,
  employmentType,
  setEmploymentType,
  salaryRange,
  setSalaryRange,
  experienceLevel,
  setExperienceLevel,
  showAllFilters,
  setShowAllFilters,
  onClearFilters,
  appliedFiltersCount,
}: SearchFiltersProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
            {appliedFiltersCount > 0 && (
              <Badge variant="secondary">{appliedFiltersCount}</Badge>
            )}
          </CardTitle>
          {appliedFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={onClearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Date Posted</Label>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="3d">Last 3 days</SelectItem>
              <SelectItem value="week">Last week</SelectItem>
              <SelectItem value="any">Anytime</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Remote Type</Label>
          <Select value={remoteType} onValueChange={setRemoteType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="remote">Remote</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
              <SelectItem value="onsite">On-site</SelectItem>
            </SelectContent>
          </Select>
        </div>


        {showAllFilters && (
          <>
            <div>
              <Label>Employment Type</Label>
              <Select value={employmentType} onValueChange={setEmploymentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Minimum Salary</Label>
              <Select value={salaryRange} onValueChange={setSalaryRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="50000">$50,000+</SelectItem>
                  <SelectItem value="75000">$75,000+</SelectItem>
                  <SelectItem value="100000">$100,000+</SelectItem>
                  <SelectItem value="150000">$150,000+</SelectItem>
                  <SelectItem value="200000">$200,000+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Experience Level</Label>
              <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="entry">Entry Level</SelectItem>
                  <SelectItem value="mid">Mid Level</SelectItem>
                  <SelectItem value="senior">Senior Level</SelectItem>
                  <SelectItem value="lead">Lead/Principal</SelectItem>
                  <SelectItem value="executive">Executive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAllFilters(!showAllFilters)}
          className="w-full"
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          {showAllFilters ? "Show Less" : "More Filters"}
        </Button>
      </CardContent>
    </Card>
  );
};
