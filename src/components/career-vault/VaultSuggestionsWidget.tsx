import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Clock, TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react';

interface Suggestion {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  impactScore: number;
  action: () => void;
  priority: 'high' | 'medium' | 'low';
}

interface VaultSuggestionsWidgetProps {
  assumedCount: number;
  weakPhrasesCount: number;
  staleItemsCount: number;
  onVerifyAssumed: () => void;
  onAddMetrics: () => void;
  onUpdateStale: () => void;
}

export const VaultSuggestionsWidget = ({
  assumedCount,
  weakPhrasesCount,
  staleItemsCount,
  onVerifyAssumed,
  onAddMetrics,
  onUpdateStale
}: VaultSuggestionsWidgetProps) => {
  const suggestions: Suggestion[] = [];

  if (assumedCount > 0) {
    suggestions.push({
      id: 'verify',
      title: `Verify ${assumedCount} AI-assumed items`,
      description: 'Quick quiz to upgrade assumed items to Gold quality',
      estimatedTime: '5 min',
      impactScore: assumedCount * 5,
      action: onVerifyAssumed,
      priority: 'high'
    });
  }

  if (weakPhrasesCount > 0) {
    suggestions.push({
      id: 'metrics',
      title: `Add metrics to ${weakPhrasesCount} power phrases`,
      description: 'Transform vague bullets into quantified achievements',
      estimatedTime: '10 min',
      impactScore: weakPhrasesCount * 3,
      action: onAddMetrics,
      priority: 'high'
    });
  }

  if (staleItemsCount > 0) {
    suggestions.push({
      id: 'update',
      title: `Update ${staleItemsCount} stale items`,
      description: 'Items older than 6 months may not reflect current skills',
      estimatedTime: '15 min',
      impactScore: staleItemsCount * 2,
      action: onUpdateStale,
      priority: 'medium'
    });
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  if (suggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-success" />
            Vault Health Excellent!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <CheckCircle className="h-12 w-12 text-success mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Your vault is in great shape. Keep building!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          💡 Vault Improvement Suggestions
        </CardTitle>
        <CardDescription>
          Quick actions to strengthen your vault
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {suggestions.map((suggestion) => (
            <div 
              key={suggestion.id}
              className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getPriorityIcon(suggestion.priority)}
                    <h4 className="font-semibold text-sm">{suggestion.title}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    {suggestion.description}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {suggestion.estimatedTime}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +{suggestion.impactScore} points
                    </Badge>
                  </div>
                </div>
                <Button 
                  size="sm"
                  onClick={suggestion.action}
                  className="whitespace-nowrap"
                >
                  Start
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};