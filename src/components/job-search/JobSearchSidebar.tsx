import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Bookmark, Search, Filter, X } from 'lucide-react';
import { SavedSearches } from './SavedSearches';
import { SearchAnalyticsWidget } from './SearchAnalyticsWidget';
import { BooleanBuilderTool } from './v2/BooleanBuilderTool';

interface JobSearchSidebarProps {
  appliedFiltersCount: number;
  onClearFilters?: () => void;
  userId?: string | null;
  booleanString?: string;
  setBooleanString?: (value: string) => void;
}

export const JobSearchSidebar: React.FC<JobSearchSidebarProps> = ({
  appliedFiltersCount,
  onClearFilters,
  userId,
  booleanString = '',
  setBooleanString
}) => {
  return (
    <div className="space-y-4">
      {/* Boolean Builder - at top */}
      {setBooleanString && (
        <>
          <div>
            <h3 className="text-sm font-semibold mb-3">AI Boolean Search</h3>
            <BooleanBuilderTool 
              booleanString={booleanString}
              setBooleanString={setBooleanString}
            />
          </div>
          <Separator />
        </>
      )}

      {/* Active Filters Summary */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Active Filters
          </h3>
          {appliedFiltersCount > 0 && (
            <Badge variant="secondary">{appliedFiltersCount}</Badge>
          )}
        </div>
        {appliedFiltersCount > 0 ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={onClearFilters}
          >
            <X className="h-3 w-3 mr-2" />
            Clear All
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">No active filters</p>
        )}
      </Card>

      <Separator />

      {/* Saved Searches */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Bookmark className="h-4 w-4" />
          Saved Searches
        </h3>
        <ScrollArea className="h-[400px]">
          <SavedSearches
            onLoadSearch={(search) => {
              console.log('Load search:', search);
            }}
          />
        </ScrollArea>
      </div>

      <Separator />

      {/* Analytics Widget */}
      <SearchAnalyticsWidget userId={userId || null} />

      <Separator />

      {/* Search History */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Search className="h-4 w-4" />
          Recent Searches
        </h3>
        <div className="space-y-2">
          <Card className="p-3">
            <p className="text-xs text-muted-foreground text-center">
              Your search history will appear here
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};
