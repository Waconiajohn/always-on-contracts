import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';

interface VaultSearchFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  qualityStats: {
    gold: number;
    silver: number;
    bronze: number;
    assumed: number;
    needsReview: number;
  };
}

export function VaultSearchFilter({
  searchTerm,
  onSearchChange,
  qualityStats
}: VaultSearchFilterProps) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search your vault items..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Quick filters:</span>
        <Badge variant="outline" className="cursor-pointer hover:bg-yellow-500/10">
          🥇 Gold ({qualityStats.gold})
        </Badge>
        <Badge variant="outline" className="cursor-pointer hover:bg-gray-500/10">
          🥈 Silver ({qualityStats.silver})
        </Badge>
        <Badge variant="outline" className="cursor-pointer hover:bg-orange-500/10">
          🥉 Bronze ({qualityStats.bronze})
        </Badge>
        {qualityStats.needsReview > 0 && (
          <Badge variant="destructive" className="cursor-pointer">
            ⚠️ Review ({qualityStats.needsReview})
          </Badge>
        )}
      </div>
    </div>
  );
}
