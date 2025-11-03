import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, AlertCircle, TrendingUp, RefreshCw, ArrowRight } from 'lucide-react';

export interface QuickWin {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  points: number;
  timeEstimate: string;
  action: () => void;
  actionLabel: string;
  icon?: React.ReactNode;
}

interface QuickWinsPanelProps {
  quickWins: QuickWin[];
  maxVisible?: number;
}

export function QuickWinsPanel({ quickWins, maxVisible = 3 }: QuickWinsPanelProps) {
  const visibleWins = quickWins.slice(0, maxVisible);
  const totalPoints = visibleWins.reduce((sum, win) => sum + win.points, 0);
  const totalTime = visibleWins.reduce((sum, win) => {
    const minutes = parseInt(win.timeEstimate);
    return sum + (isNaN(minutes) ? 5 : minutes);
  }, 0);

  if (quickWins.length === 0) {
    return (
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardContent className="p-6 text-center">
          <div className="mb-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-3">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Your Vault is Optimized!
          </h3>
          <p className="text-sm text-slate-600">
            No quick wins available right now. Your vault is in excellent shape.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getPriorityIcon = (priority: QuickWin['priority']) => {
    if (priority === 'critical' || priority === 'high') {
      return <AlertCircle className="h-4 w-4" />;
    }
    return <Target className="h-4 w-4" />;
  };

  const getPriorityColor = (priority: QuickWin['priority']) => {
    if (priority === 'critical') return 'bg-rose-600 text-white';
    if (priority === 'high') return 'bg-amber-600 text-white';
    if (priority === 'medium') return 'bg-blue-600 text-white';
    return 'bg-slate-500 text-white';
  };

  const getPriorityBg = (priority: QuickWin['priority']) => {
    if (priority === 'critical') return 'bg-rose-50 border-rose-200';
    if (priority === 'high') return 'bg-amber-50 border-amber-200';
    if (priority === 'medium') return 'bg-blue-50 border-blue-200';
    return 'bg-slate-50 border-slate-200';
  };

  return (
    <Card className="border-indigo-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-900">
              <Target className="h-5 w-5 text-indigo-600" />
              Quick Wins Available ({visibleWins.length})
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Boost your vault strength by +{totalPoints} points in ~{totalTime} min
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {visibleWins.map((win, idx) => (
          <div
            key={win.id}
            className={`flex items-start gap-3 p-4 rounded-lg border ${getPriorityBg(win.priority)}`}
          >
            <div className="flex-shrink-0 mt-1">
              <Badge className={getPriorityColor(win.priority)}>
                #{idx + 1}
              </Badge>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 mb-1">
                {win.icon && <div className="flex-shrink-0 mt-0.5">{win.icon}</div>}
                <h4 className="font-semibold text-slate-900">{win.title}</h4>
              </div>
              <p className="text-sm text-slate-700 mb-2">{win.description}</p>
              <div className="flex items-center gap-4 text-xs text-slate-600">
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-indigo-600" />
                  <span className="font-medium text-indigo-600">+{win.points} points</span>
                </span>
                <span className="flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" />
                  {win.timeEstimate}
                </span>
              </div>
            </div>

            <div className="flex-shrink-0">
              <Button
                size="sm"
                onClick={win.action}
                className="whitespace-nowrap"
              >
                {win.actionLabel}
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}

        {quickWins.length > maxVisible && (
          <p className="text-xs text-center text-slate-500 pt-2">
            +{quickWins.length - maxVisible} more opportunities available in Vault Health
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Helper hook to generate quick wins from vault data
export function useQuickWins({
  assumedCount,
  weakPhrasesCount,
  staleItemsCount,
  onVerifyAssumed,
  onAddMetrics,
  onRefreshStale,
}: {
  assumedCount: number;
  weakPhrasesCount: number;
  staleItemsCount: number;
  onVerifyAssumed: () => void;
  onAddMetrics: () => void;
  onRefreshStale: () => void;
}): QuickWin[] {
  const wins: QuickWin[] = [];

  // Priority 1: Verify assumed items (biggest impact)
  if (assumedCount > 0) {
    wins.push({
      id: 'verify-assumed',
      title: `Verify ${assumedCount} Assumed Items`,
      description: 'These AI-inferred items need your confirmation to upgrade quality tier',
      priority: assumedCount > 20 ? 'critical' : 'high',
      points: Math.round(assumedCount * 0.67), // Assumed (0.4x) → Silver (0.8x) = +0.4 weight per item
      timeEstimate: `${Math.ceil(assumedCount / 2)} min`,
      action: onVerifyAssumed,
      actionLabel: 'Verify Now',
      icon: <AlertCircle className="h-4 w-4 text-amber-600" />,
    });
  }

  // Priority 2: Add metrics to power phrases
  if (weakPhrasesCount > 0) {
    wins.push({
      id: 'add-metrics',
      title: `Add Metrics to ${weakPhrasesCount} Phrases`,
      description: 'Quantify impact with numbers (%, $, time saved) for stronger resume bullets',
      priority: 'medium',
      points: Math.round(weakPhrasesCount * 0.75), // Quantification bonus
      timeEstimate: `${Math.ceil(weakPhrasesCount * 2)} min`,
      action: onAddMetrics,
      actionLabel: 'Add Metrics',
      icon: <TrendingUp className="h-4 w-4 text-blue-600" />,
    });
  }

  // Priority 3: Refresh stale items
  if (staleItemsCount > 0) {
    wins.push({
      id: 'refresh-stale',
      title: `Refresh ${staleItemsCount} Stale Items`,
      description: 'Items older than 6 months need updating to maintain vault freshness',
      priority: 'low',
      points: Math.round(staleItemsCount * 0.27), // Freshness: 0.7x → 1.0x = +0.3 weight
      timeEstimate: '5 min',
      action: onRefreshStale,
      actionLabel: 'Refresh',
      icon: <RefreshCw className="h-4 w-4 text-slate-600" />,
    });
  }

  // Sort by points (highest impact first)
  return wins.sort((a, b) => b.points - a.points);
}
