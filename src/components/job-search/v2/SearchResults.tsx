import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { SavedJobsList } from "@/components/job-search/SavedJobsList";
import { JobCard } from "./JobCard";

interface SearchResultsProps {
  jobs: any[];
  isSearching: boolean;
  isLoadingMore: boolean;
  searchTime: number | null;
  booleanString: string;
  activeSavedSearchName: string | null;
  basicSearchCount: number | null;
  booleanSearchCount: number | null;
  expandedJobIds: Set<string>;
  savedJobIds: Set<string>;
  contractOnly: boolean;
  searchQuery: string;
  nextPageToken: string | null;
  
  // Actions
  onLoadMore: () => void;
  onToggleExpand: (id: string) => void;
  onGenerateResume: (job: any) => void;
  onAddToQueue: (job: any) => void;
  onSaveJob: (job: any) => void;
  onUnsaveJob: (job: any) => void;
}

export function SearchResults({
  jobs,
  isSearching,
  isLoadingMore,
  searchTime,
  booleanString,
  activeSavedSearchName,
  basicSearchCount,
  booleanSearchCount,
  expandedJobIds,
  savedJobIds,
  contractOnly,
  searchQuery,
  nextPageToken,
  onLoadMore,
  onToggleExpand,
  onGenerateResume,
  onAddToQueue,
  onSaveJob,
  onUnsaveJob
}: SearchResultsProps) {

  // Search Progress
  if (isSearching) {
    return (
      <Card className="mb-6 border-primary">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Loader2 className="h-5 w-5 animate-spin" />
            <div className="flex-1">
              <p className="font-medium">Searching 50+ sources...</p>
              <p className="text-sm text-muted-foreground mt-1">Aggregating results in real-time</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Results Header */}
      {jobs.length > 0 && (
        <div className="mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Found {jobs.length} jobs {searchTime && `in ${(searchTime / 1000).toFixed(1)}s`}
            </p>
          </div>
          
          {/* Boolean Search Comparison Banner */}
          {booleanString && activeSavedSearchName && booleanSearchCount !== null && basicSearchCount !== null && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Badge className="shrink-0">
                    🎯 AI Boolean Search
                  </Badge>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Basic search: {basicSearchCount} jobs → Boolean search: {booleanSearchCount} jobs
                      {booleanSearchCount > basicSearchCount && (
                        <span className="text-primary ml-2">
                          (+{booleanSearchCount - basicSearchCount} more jobs found)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Using: <code className="text-xs bg-background/50 px-1 rounded">{booleanString.length > 80 ? booleanString.slice(0, 80) + '...' : booleanString}</code>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Results Tabs */}
      <Tabs defaultValue="results" className="space-y-4">
        <TabsList>
          <TabsTrigger value="results">
            Search Results ({jobs.length})
          </TabsTrigger>
          <TabsTrigger value="saved">
            Saved Jobs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="results">
          <div className="space-y-4">
            {jobs.map((job) => (
              <JobCard 
                key={job.id}
                job={job}
                isExpanded={expandedJobIds.has(job.id)}
                onToggleExpand={onToggleExpand}
                onGenerateResume={onGenerateResume}
                onAddToQueue={onAddToQueue}
                onSaveJob={onSaveJob}
                onUnsaveJob={onUnsaveJob}
                isSaved={savedJobIds.has(job.id)}
                contractOnly={contractOnly}
              />
            ))}

            {/* Load More Button */}
            {!isSearching && nextPageToken && jobs.length > 0 && (
              <div className="flex justify-center pt-6">
                <Button
                  onClick={onLoadMore}
                  disabled={isLoadingMore}
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading more jobs...
                    </>
                  ) : (
                    <>
                      Load More Results
                      <span className="ml-2 text-xs text-muted-foreground">
                        (Page 2+)
                      </span>
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Empty State */}
            {!isSearching && jobs.length === 0 && searchQuery && (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    No jobs found. Try adjusting your search or filters.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="saved">
          <SavedJobsList />
        </TabsContent>
      </Tabs>
    </>
  );
}
