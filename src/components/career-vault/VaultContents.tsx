import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Plus, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface CategoryData {
  name: string;
  description: string;
  icon: string;
  count: number;
  isEmpty: boolean;
}

interface VaultContentsProps {
  categories: {
    core: CategoryData[];
    leadership: CategoryData[];
    culture: CategoryData[];
  };
  onAddItem: (category: string) => void;
  onViewCategory: (category: string) => void;
}

export const VaultContents = ({
  categories,
  onAddItem,
  onViewCategory
}: VaultContentsProps) => {
  const [showAll, setShowAll] = useState(false);

  const renderCategory = (cat: CategoryData) => (
    <div key={cat.name} className="p-4 border rounded-lg hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3 flex-1">
          <span className="text-2xl">{cat.icon}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold">{cat.name}</h4>
              {cat.isEmpty ? (
                <Badge variant="outline" className="text-xs">Empty</Badge>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <Badge variant="secondary" className="text-xs">{cat.count} item{cat.count !== 1 ? 's' : ''}</Badge>
                </>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{cat.description}</p>
          </div>
        </div>
        {cat.isEmpty ? (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onAddItem(cat.name)}
            className="gap-2 whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            Add First
          </Button>
        ) : (
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => onViewCategory(cat.name)}
            className="gap-2 whitespace-nowrap"
          >
            <Eye className="h-4 w-4" />
            View & Edit
          </Button>
        )}
      </div>
    </div>
  );

  const visibleLeadership = showAll ? categories.leadership : categories.leadership.slice(0, 2);
  const visibleCulture = showAll ? categories.culture : categories.culture.slice(0, 2);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-1">What's in Your Vault</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Career intelligence organized by use case
      </p>

      {/* Core Intelligence (Resume) */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
          Core Intelligence (Resume Building Blocks)
        </h4>
        <div className="space-y-3">
          {categories.core.map(renderCategory)}
        </div>
      </div>

      {/* Leadership Intelligence (Interview) */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
          Leadership Intelligence (Interview Depth)
        </h4>
        <div className="space-y-3">
          {visibleLeadership.map(renderCategory)}
        </div>
      </div>

      {/* Culture Fit Intelligence */}
      {showAll && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            Culture Fit Intelligence (Intangibles)
          </h4>
          <div className="space-y-3">
            {visibleCulture.map(renderCategory)}
          </div>
        </div>
      )}

      {/* Show More/Less Toggle */}
      <div className="mt-4 text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(!showAll)}
          className="gap-2"
        >
          {showAll ? (
            <>
              Show Less
              <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              Show All {categories.leadership.length + categories.culture.length} Categories
              <ChevronDown className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};
