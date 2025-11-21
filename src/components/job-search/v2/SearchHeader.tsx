import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

interface SearchHeaderProps {
  query: string;
  setQuery: (q: string) => void;
  location: string;
  setLocation: (l: string) => void;
  radius: string;
  setRadius: (r: string) => void;
  onSearch: () => void;
  isSearching: boolean;
  suggestedTitles: any[];
}

export function SearchHeader({
  query,
  setQuery,
  location,
  setLocation,
  radius,
  setRadius,
  onSearch,
  isSearching,
  suggestedTitles
}: SearchHeaderProps) {
  
  const handleChipClick = (title: string) => {
    setQuery(title);
    // Context-aware auto-run logic
    if (location && location.length > 2) {
      // If location is set, run search immediately
      // Use timeout to allow state update to propagate
      setTimeout(() => onSearch(), 0);
    } else {
      // Otherwise focus location input (implementation detail: user will naturally move there)
      const locInput = document.getElementById('location-input');
      if (locInput) locInput.focus();
    }
  };

  return (
    <div className="space-y-6 mb-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Find Your Next Role</h1>
        <p className="text-muted-foreground">Aggregating listings from 50+ sources in real time</p>
      </div>

      <Card className="border-2 border-primary/10 shadow-lg">
        <CardContent className="p-6 space-y-4">
          <div className="grid md:grid-cols-[1fr_1fr_auto] gap-4">
            {/* Keyword Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Job title, keywords, or company"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                className="pl-9 h-12 text-lg"
              />
            </div>

            {/* Location & Radius */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location-input"
                  placeholder="City, state, or 'Remote'"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                  className="pl-9 h-12 text-lg"
                />
              </div>
              <Select value={radius} onValueChange={setRadius}>
                <SelectTrigger className="w-[100px] h-12">
                  <SelectValue placeholder="Radius" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 mi</SelectItem>
                  <SelectItem value="25">25 mi</SelectItem>
                  <SelectItem value="50">50 mi</SelectItem>
                  <SelectItem value="100">100 mi</SelectItem>
                  <SelectItem value="200">200 mi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search Button */}
            <Button 
              size="lg" 
              onClick={onSearch} 
              disabled={isSearching}
              className="h-12 px-8 text-lg"
            >
              {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Search'}
            </Button>
          </div>

          {/* Vault Chips */}
          {suggestedTitles && suggestedTitles.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wide">
                <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded">Career Vault</span>
                Recommended for you
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestedTitles.slice(0, 6).map((item: any, idx: number) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors py-1.5 px-3 text-sm font-normal"
                    onClick={() => handleChipClick(item.title)}
                  >
                    {item.title}
                    {item.confidence && <span className="ml-1.5 opacity-50 text-xs">{item.confidence}%</span>}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
