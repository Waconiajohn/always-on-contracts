import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ChevronDown, ChevronUp, Save } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SavedSearches } from "@/components/job-search/SavedSearches";

interface SearchControlsProps {
  dateFilter: string;
  setDateFilter: (d: string) => void;
  remoteType: string;
  setRemoteType: (r: string) => void;
  employmentType: string;
  setEmploymentType: (e: string) => void;
  contractOnly: boolean;
  setContractOnly: (c: boolean) => void;
  showAdvanced: boolean;
  setShowAdvanced: (s: boolean) => void;
  activeSavedSearchName: string | null;
  // Props for SavedSearches component integration
  onLoadSearch: (search: any) => void;
  currentBooleanString: string;
  currentSearchQuery: string;
  currentLocation: string;
}

export function SearchControls({
  dateFilter,
  setDateFilter,
  remoteType,
  setRemoteType,
  employmentType,
  setEmploymentType,
  contractOnly,
  setContractOnly,
  showAdvanced,
  setShowAdvanced,
  activeSavedSearchName,
  onLoadSearch,
  currentBooleanString,
  currentSearchQuery,
  currentLocation
}: SearchControlsProps) {
  
  const appliedFiltersCount = [
    dateFilter !== '30d', // assuming 30d is default
    remoteType !== 'any',
    employmentType !== 'any',
    contractOnly
  ].filter(Boolean).length;

  return (
    <div className="space-y-4 mb-6">
      {activeSavedSearchName && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-2 rounded-lg w-fit">
          <Save className="h-4 w-4" />
          Active Saved Search: <span className="font-medium text-foreground">{activeSavedSearchName}</span>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-4 p-4 bg-card rounded-lg border shadow-sm">
        {/* Primary Filters */}
        <div className="space-y-1 min-w-[140px]">
          <Label className="text-xs text-muted-foreground">Posted</Label>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="3d">Last 3 days</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="14d">Last 14 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="any">Any time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1 min-w-[140px]">
          <Label className="text-xs text-muted-foreground">Remote</Label>
          <Select value={remoteType} onValueChange={setRemoteType}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Location</SelectItem>
              <SelectItem value="remote">Remote Only</SelectItem>
              <SelectItem value="local">Hybrid/Onsite</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1 min-w-[140px]">
          <Label className="text-xs text-muted-foreground">Type</Label>
          <Select value={employmentType} onValueChange={setEmploymentType}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Type</SelectItem>
              <SelectItem value="full-time">Full-time</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
              <SelectItem value="freelance">Freelance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2 pb-2 h-9">
          <Switch
            id="contract-only"
            checked={contractOnly}
            onCheckedChange={setContractOnly}
          />
          <Label htmlFor="contract-only" className="text-sm cursor-pointer">Contract Only</Label>
        </div>

        <div className="flex-1" />

        {/* Advanced Toggle */}
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-9">
              {showAdvanced ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
              More Filters {appliedFiltersCount > 0 && <Badge variant="secondary" className="ml-2 text-[10px] h-5">{appliedFiltersCount}</Badge>}
            </Button>
          </CollapsibleTrigger>
        </Collapsible>
      </div>

      {/* Advanced Drawer */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleContent className="pt-2">
          <SavedSearches 
            onLoadSearch={onLoadSearch}
            currentBooleanString={currentBooleanString}
            currentSearchQuery={currentSearchQuery}
            currentLocation={currentLocation}
            currentFilters={{
              datePosted: dateFilter,
              contractOnly,
              remoteType,
              employmentType
            }}
          />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
