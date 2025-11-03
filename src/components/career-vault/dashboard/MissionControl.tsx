import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Rocket,
  Upload,
  Plus,
  Sparkles,
  PlayCircle,
  RotateCcw,
  Loader2,
  Settings,
  Download,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface MissionControlProps {
  // Status
  onboardingComplete: boolean;
  totalItems: number;
  strengthScore: number;
  reviewProgress: number;
  autoPopulated: boolean;

  // Primary action
  onPrimaryAction: () => void;
  primaryActionLabel?: string;

  // Secondary actions
  onManageResume: () => void;
  onAddDocument: () => void;
  onReanalyze: () => void;
  isReanalyzing?: boolean;
  hasResumeData?: boolean;

  // Advanced actions
  onResetVault: () => void;
  onExportData?: () => void;
}

export function MissionControl({
  onboardingComplete,
  totalItems,
  strengthScore,
  reviewProgress,
  autoPopulated,
  onPrimaryAction,
  primaryActionLabel,
  onManageResume,
  onAddDocument,
  onReanalyze,
  isReanalyzing = false,
  hasResumeData = true,
  onResetVault,
  onExportData,
}: MissionControlProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Determine primary action label
  const getPrimaryLabel = () => {
    if (primaryActionLabel) return primaryActionLabel;
    if (onboardingComplete) return 'Deploy Vault (Build Resume)';
    return 'Continue Review';
  };

  const getPrimaryDescription = () => {
    if (onboardingComplete) {
      return 'Use your vault to create targeted resumes for any job';
    }
    return `${100 - reviewProgress}% remaining`;
  };

  return (
    <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50/50 to-blue-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2 text-slate-900">
              <Rocket className="h-5 w-5 text-indigo-600" />
              Mission Control
              {autoPopulated && (
                <Badge variant="secondary" className="text-xs">
                  AI Auto-Populated
                </Badge>
              )}
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {onboardingComplete ? (
                <>
                  ✅ Onboarding: Complete • {totalItems} items • Quality: {strengthScore}/100
                </>
              ) : (
                <>
                  Review: {reviewProgress}% complete • {totalItems} items extracted
                </>
              )}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* PRIMARY ACTION - Full Width, Prominent */}
        <Button
          size="lg"
          className="w-full h-auto py-4 bg-indigo-600 hover:bg-indigo-700 text-white"
          onClick={onPrimaryAction}
        >
          <div className="flex items-center gap-3 w-full">
            {onboardingComplete ? (
              <Rocket className="h-6 w-6 flex-shrink-0" />
            ) : (
              <PlayCircle className="h-6 w-6 flex-shrink-0" />
            )}
            <div className="text-left flex-1">
              <div className="font-semibold">{getPrimaryLabel()}</div>
              <div className="text-xs opacity-90">{getPrimaryDescription()}</div>
            </div>
            <ArrowRight className="h-5 w-5 flex-shrink-0" />
          </div>
        </Button>

        {/* SECONDARY ACTIONS - Grid, Outline Style */}
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

        {/* ADVANCED ACTIONS - Collapsed */}
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
                <Download className="h-4 w-4 mr-2" />
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
              ⚠️ Resetting will permanently delete all {totalItems} items and restart the onboarding process.
            </p>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
