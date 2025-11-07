import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Sparkles } from 'lucide-react';

interface QuickActionsBarProps {
  onAddMetrics: () => void;
  onModernize: () => void;
}

export const QuickActionsBar = ({ onAddMetrics, onModernize }: QuickActionsBarProps) => {
  return (
    <Card className="p-4 mb-6">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Quick Actions:</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onAddMetrics}>
            <Plus className="h-4 w-4 mr-2" />
            Add Metrics
          </Button>
          <Button variant="outline" size="sm" onClick={onModernize}>
            <Sparkles className="h-4 w-4 mr-2" />
            Modernize Language
          </Button>
        </div>
      </div>
    </Card>
  );
};
