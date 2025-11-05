import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Rocket,
  Upload,
  Plus,
  Sparkles,
  RotateCcw,
  Loader2,
  Settings,
  ChevronDown,
  ChevronUp,
  Target,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface Mission {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string; // "+12 pts", "Unlocks 47 jobs", etc.
  estimatedTime: string; // "8 min", "15 min", etc.
  action: () => void;
  actionLabel: string;
}

interface StrategicCommandCenterProps {
  // Vault status
  strengthScore: number;
  level: 'Developing' | 'Solid' | 'Strong' | 'Elite' | 'Exceptional';
  totalItems: number;
  reviewProgress: number;
  autoPopulated: boolean;

  // Market context
  marketAverage?: number;
  eliteThreshold?: number;
  marketRank?: string;

  // Missions (top 3 by ROI)
  missions: Mission[];

  // Quick actions
  onManageResume: () => void;
  onAddDocument: () => void;
  onReanalyze: () => void;
  isReanalyzing?: boolean;
  hasResumeData?: boolean;

  // Advanced actions
  onResetVault: () => void;
  onExportData?: () => void;
}

export function StrategicCommandCenter({
  strengthScore,
  level,
  totalItems,
  reviewProgress,
  autoPopulated,
  marketAverage,
  eliteThreshold = 90,
  marketRank,
  missions,
  onManageResume,
  onAddDocument,
  onReanalyze,
  isReanalyzing = false,
  hasResumeData = true,
  onResetVault,
  onExportData,
}: StrategicCommandCenterProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [allMissionsOpen, setAllMissionsOpen] = useState(false);

  const getLevelColor = () => {
    if (level === 'Exceptional') return 'text-purple-600';
    if (level === 'Elite') return 'text-indigo-600';
    if (level === 'Strong') return 'text-blue-600';
    if (level === 'Solid') return 'text-green-600';
    return 'text-slate-600';
  };

  const getPriorityStyles = (priority: Mission['priority']) => {
    switch (priority) {
      case 'critical':
        return {
          border: 'border-l-4 border-red-600',
          bg: 'bg-red-50',
          badge: 'bg-red-600 text-white',
          icon: <AlertCircle className="h-5 w-5 text-red-600" />,
        };
      case 'high':
        return {
          border: 'border-l-4 border-amber-600',
          bg: 'bg-amber-50',
          badge: 'bg-amber-600 text-white',
          icon: <Target className="h-5 w-5 text-amber-600" />,
        };
      case 'medium':
        return {
          border: 'border-l-4 border-blue-600',
          bg: 'bg-blue-50',
          badge: 'bg-blue-600 text-white',
          icon: <TrendingUp className="h-5 w-5 text-blue-600" />,
        };
      default:
        return {
          border: 'border-l-4 border-slate-400',
          bg: 'bg-slate-50',
          badge: 'bg-slate-400 text-white',
          icon: <Sparkles className="h-5 w-5 text-slate-400" />,
        };
    }
  };

  const gapToElite = eliteThreshold - strengthScore;
  const topMissions = missions.slice(0, 3);
  const remainingMissions = missions.slice(3);

  return (
    <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50/50 to-blue-50/50 mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2 text-slate-900">
              <Rocket className="h-5 w-5 text-indigo-600" />
              Strategic Command Center
              {autoPopulated && (
                <Badge variant="secondary" className="text-xs">
                  AI Auto-Populated
                </Badge>
              )}
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {reviewProgress === 100 ? (
                <>✅ Onboarding Complete • {totalItems} items • Quality: {strengthScore}/100</>
              ) : (
                <>Review: {reviewProgress}% complete • {totalItems} items extracted</>
              )}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Strategic Position Summary */}
        <div className="p-4 bg-white/70 rounded-lg border border-indigo-200">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Target className="h-4 w-4 text-indigo-600" />
            Your Strategic Position
          </h3>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Vault Strength:</span>
              <span className={`font-semibold ${getLevelColor()}`}>
                {strengthScore}/100 ({level})
              </span>
            </div>

            {marketAverage && (
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Market Average:</span>
                <span className="font-medium text-slate-900">{marketAverage}/100</span>
              </div>
            )}

            {marketRank && (
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Your Ranking:</span>
                <span className="font-medium text-slate-900">{marketRank}</span>
              </div>
            )}

            {gapToElite > 0 && (
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-slate-600">Gap to Elite (90+):</span>
                <span className="font-semibold text-indigo-600">+{gapToElite} points</span>
              </div>
            )}
          </div>
        </div>

        {/* Active Missions */}
        {missions.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Rocket className="h-4 w-4 text-indigo-600" />
              Active Missions ({missions.length})
            </h3>

            {/* Top 3 missions */}
            <div className="space-y-2">
              {topMissions.map((mission, index) => {
                const styles = getPriorityStyles(mission.priority);
                return (
                  <div
                    key={mission.id}
                    className={`p-3 rounded-lg ${styles.bg} ${styles.border}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">{styles.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="font-semibold text-slate-900 flex items-center gap-2">
                            <span className="text-slate-400">#{index + 1}</span>
                            {mission.title}
                          </div>
                          <Badge className={`${styles.badge} text-xs flex-shrink-0`}>
                            {mission.priority.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-700 mb-2">{mission.description}</p>
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <div className="flex items-center gap-4 text-xs text-slate-600">
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              Impact: <strong className="text-slate-900">{mission.impact}</strong>
                            </span>
                            <span>
                              Time: <strong className="text-slate-900">{mission.estimatedTime}</strong>
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant={mission.priority === 'critical' ? 'default' : 'outline'}
                            onClick={mission.action}
                            className={
                              mission.priority === 'critical'
                                ? 'bg-red-600 hover:bg-red-700'
                                : ''
                            }
                          >
                            {mission.actionLabel}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Remaining missions (collapsed) */}
            {remainingMissions.length > 0 && (
              <Collapsible open={allMissionsOpen} onOpenChange={setAllMissionsOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full text-slate-600">
                    {allMissionsOpen ? (
                      <>
                        Hide {remainingMissions.length} more missions
                        <ChevronUp className="ml-2 h-4 w-4" />
                      </>
                    ) : (
                      <>
                        View {remainingMissions.length} more missions
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 mt-2">
                  {remainingMissions.map((mission, index) => {
                    const styles = getPriorityStyles(mission.priority);
                    return (
                      <div
                        key={mission.id}
                        className={`p-3 rounded-lg ${styles.bg} ${styles.border}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">{styles.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="font-semibold text-slate-900 flex items-center gap-2">
                                <span className="text-slate-400">#{index + 4}</span>
                                {mission.title}
                              </div>
                              <Badge className={`${styles.badge} text-xs flex-shrink-0`}>
                                {mission.priority.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-700 mb-2">{mission.description}</p>
                            <div className="flex items-center justify-between gap-4 flex-wrap">
                              <div className="flex items-center gap-4 text-xs text-slate-600">
                                <span>Impact: {mission.impact}</span>
                                <span>Time: {mission.estimatedTime}</span>
                              </div>
                              <Button size="sm" variant="outline" onClick={mission.action}>
                                {mission.actionLabel}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        )}

        {/* Quick Actions - Compact Grid */}
        <div className="pt-4 border-t border-slate-200">
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onManageResume}
              className="flex-col h-auto py-2 border-slate-300"
            >
              <Upload className="h-4 w-4 mb-1" />
              <span className="text-xs">Resume</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onAddDocument}
              className="flex-col h-auto py-2 border-slate-300"
            >
              <Plus className="h-4 w-4 mb-1" />
              <span className="text-xs">Add Docs</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onReanalyze}
              disabled={isReanalyzing || !hasResumeData}
              className="flex-col h-auto py-2 border-slate-300"
            >
              {isReanalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mb-1 animate-spin" />
                  <span className="text-xs">Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mb-1" />
                  <span className="text-xs">Re-Analyze</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Advanced Settings - Collapsed */}
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              <Settings className="h-4 w-4 mr-2" />
              Advanced Settings
              {advancedOpen ? (
                <ChevronUp className="ml-auto h-4 w-4" />
              ) : (
                <ChevronDown className="ml-auto h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-2 mt-2 pt-2 border-t border-slate-200">
            {onExportData && (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start border-slate-300"
                onClick={onExportData}
              >
                <Settings className="h-4 w-4 mr-2" />
                Export Vault Data
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={onResetVault}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Vault (Delete All Data)
            </Button>

            <p className="text-xs text-slate-500 pt-1 px-2">
              ⚠️ Resetting will permanently delete all {totalItems} items and restart the
              onboarding process.
            </p>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
