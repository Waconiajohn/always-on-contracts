import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, X, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface VaultSearchBarProps {
  onSearch: (query: string, filters: SearchFilters) => void;
  onClear: () => void;
}

interface SearchFilters {
  qualityTier?: string;
  category?: string;
  dateRange?: string;
  usageCount?: string;
}

export const VaultSearchBar = ({ onSearch, onClear }: VaultSearchBarProps) => {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});

  const handleSearch = () => {
    onSearch(query, filters);
  };

  const handleClear = () => {
    setQuery('');
    setFilters({});
    onClear();
  };

  const addQuickFilter = (key: keyof SearchFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onSearch(query, newFilters);
  };

  const removeFilter = (key: keyof SearchFilters) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    setFilters(newFilters);
    onSearch(query, newFilters);
  };

  const activeFiltersCount = Object.keys(filters).length;

  return (
    <Card className="p-4 space-y-3">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vault items... (AI-powered)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10 pr-10"
          />
          {query && (
            <Button
              size="sm"
              variant="ghost"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Button onClick={handleSearch}>
          <Sparkles className="h-4 w-4 mr-2" />
          Search
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
        >
          Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
        </Button>
      </div>

      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <div className="flex gap-2 flex-wrap">
          {Object.entries(filters).map(([key, value]) => (
            <Badge key={key} variant="secondary" className="gap-1">
              {key}: {value}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => removeFilter(key as keyof SearchFilters)}
              />
            </Badge>
          ))}
          <Button variant="ghost" size="sm" onClick={handleClear}>
            Clear all
          </Button>
        </div>
      )}

      {/* Quick Filters */}
      <div className="flex gap-2 flex-wrap text-sm">
        <span className="text-muted-foreground">Quick filters:</span>
        <Badge
          variant="outline"
          className="cursor-pointer hover:bg-accent"
          onClick={() => addQuickFilter('qualityTier', 'gold')}
        >
          Gold Only
        </Badge>
        <Badge
          variant="outline"
          className="cursor-pointer hover:bg-accent"
          onClick={() => addQuickFilter('qualityTier', 'assumed')}
        >
          Needs Review
        </Badge>
        <Badge
          variant="outline"
          className="cursor-pointer hover:bg-accent"
          onClick={() => addQuickFilter('dateRange', 'recent')}
        >
          Recently Added
        </Badge>
        <Badge
          variant="outline"
          className="cursor-pointer hover:bg-accent"
          onClick={() => addQuickFilter('usageCount', 'unused')}
        >
          Not Used Yet
        </Badge>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="grid md:grid-cols-3 gap-4 pt-3 border-t">
          <div>
            <label className="text-sm font-medium mb-2 block">Quality Tier</label>
            <div className="space-y-1">
              {['gold', 'silver', 'bronze', 'assumed'].map((tier) => (
                <Button
                  key={tier}
                  size="sm"
                  variant={filters.qualityTier === tier ? 'default' : 'outline'}
                  className="w-full"
                  onClick={() => addQuickFilter('qualityTier', tier)}
                >
                  {tier.charAt(0).toUpperCase() + tier.slice(1)}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Category</label>
            <div className="space-y-1">
              {['Power Phrase', 'Skill', 'Competency', 'Soft Skill'].map((cat) => (
                <Button
                  key={cat}
                  size="sm"
                  variant={filters.category === cat ? 'default' : 'outline'}
                  className="w-full"
                  onClick={() => addQuickFilter('category', cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Date Range</label>
            <div className="space-y-1">
              {['recent', 'this-month', 'last-3-months', 'older'].map((range) => (
                <Button
                  key={range}
                  size="sm"
                  variant={filters.dateRange === range ? 'default' : 'outline'}
                  className="w-full"
                  onClick={() => addQuickFilter('dateRange', range)}
                >
                  {range.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
