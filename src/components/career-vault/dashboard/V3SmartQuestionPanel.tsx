import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Clock, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import {
  runVaultStrategicAudit,
  submitSmartQuestionAnswer,
  type SmartQuestion,
} from "@/lib/services/vaultAnalysis";
import { trackSmartQuestion } from "@/lib/services/vaultTracking";

interface V3SmartQuestionPanelProps {
  vaultId: string;
  onVaultUpdated?: () => void;
}

/**
 * One smart question at a time, always visible on the right.
 * This replaces the big "gap filling flows" with a calm, ongoing improvement loop.
 */
export function V3SmartQuestionPanel({
  vaultId,
  onVaultUpdated,
}: V3SmartQuestionPanelProps) {
  const [questions, setQuestions] = useState<SmartQuestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [snoozedUntil, setSnoozedUntil] = useState<Date | null>(null);

  useEffect(() => {
    void loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vaultId]);

  const loadQuestions = async (forceRefresh = false) => {
    try {
      setInitializing(true);
      const audit = await runVaultStrategicAudit(vaultId, { forceRefresh });
      const smart = audit.smartQuestions || [];
      setQuestions(smart);
      setActiveIndex(0);
      
      // Track that questions were viewed
      if (smart.length > 0) {
        await trackSmartQuestion({
          action: 'viewed',
          questionCategory: smart[0].category,
          questionImpact: smart[0].impact,
          vaultId
        });
      }
    } catch (error) {
      console.error("[V3SmartQuestionPanel] error loading questions", error);
      toast.error("Could not load improvement suggestions.");
    } finally {
      setInitializing(false);
    }
  };

  const current = questions[activeIndex];

  const handleSubmit = async () => {
    if (!current || !answer.trim()) return;

    try {
      setLoading(true);

      const result = await submitSmartQuestionAnswer(
        vaultId,
        current.targetTable,
        answer,
        current
      );

      if (!result?.success) {
        toast.error("There was a problem saving that answer. Please try again.");
        return;
      }

      // Track successful answer
      await trackSmartQuestion({
        action: 'answered',
        questionCategory: current.category,
        questionImpact: current.impact,
        vaultId
      });

      toast.success("Answer saved and your Career Vault has been updated.");

      if (onVaultUpdated) {
        onVaultUpdated();
      }

      setAnswer("");

      // Move to next question; if none left, load a fresh batch
      if (activeIndex < questions.length - 1) {
        setActiveIndex((idx) => idx + 1);
      } else {
        await loadQuestions();
      }
    } catch (error) {
      console.error("[V3SmartQuestionPanel] error submitting answer", error);
      toast.error("Could not save your answer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    // Track skip action
    if (current) {
      await trackSmartQuestion({
        action: 'skipped',
        questionCategory: current.category,
        questionImpact: current.impact,
        vaultId
      });
    }

    if (activeIndex < questions.length - 1) {
      setActiveIndex((idx) => idx + 1);
      setAnswer("");
    } else {
      await loadQuestions();
      setAnswer("");
    }
  };

  const handleSnooze = async () => {
    if (!current) return;

    // Track snooze action
    await trackSmartQuestion({
      action: 'snoozed',
      questionCategory: current.category,
      questionImpact: current.impact,
      vaultId
    });

    // Snooze for 24 hours
    const snoozeUntil = new Date();
    snoozeUntil.setHours(snoozeUntil.getHours() + 24);
    setSnoozedUntil(snoozeUntil);

    toast.success("Question snoozed for 24 hours");

    // Move to next question
    if (activeIndex < questions.length - 1) {
      setActiveIndex((idx) => idx + 1);
      setAnswer("");
    } else {
      await loadQuestions();
      setAnswer("");
    }
  };

  // Show snooze message if snoozed
  if (snoozedUntil && snoozedUntil > new Date()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Questions Snoozed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            You'll see new improvement questions in{' '}
            {Math.ceil((snoozedUntil.getTime() - Date.now()) / (1000 * 60 * 60))} hours.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSnoozedUntil(null);
              void loadQuestions();
            }}
          >
            Show questions now
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (initializing) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-20 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 flex-1" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!current) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            Career Vault Status: Strong
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Your vault has no critical gaps right now. We'll automatically surface
            targeted questions as you:
          </p>
          <ul className="space-y-1 list-disc list-inside text-xs">
            <li>Add new roles or projects</li>
            <li>Update your career direction</li>
            <li>Upload additional resumes</li>
          </ul>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 w-full"
            onClick={() => loadQuestions(true)}
          >
            Refresh suggestions
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="smart-question-panel" className="border-primary/20 bg-gradient-to-br from-primary/5 to-background shadow-lg relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-primary/40" />
      <CardContent className="py-5 px-5 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Smart Question
              </div>
              <div className="text-base font-semibold">
                {activeIndex + 1} of {questions.length}
              </div>
              {current.category && (
                <div className="inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 bg-primary/10 rounded-full">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="text-[11px] font-medium text-primary">{current.category}</span>
                </div>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => loadQuestions(true)}
            disabled={loading || initializing}
            title="Get new questions"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {current.reasoning && (
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {current.reasoning}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm font-semibold leading-relaxed">{current.question}</p>
        </div>

        <textarea
          rows={4}
          className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Share your answer here. Be specific and include details..."
        />

        <div className="flex items-center justify-between gap-3 pt-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSkip}
              disabled={loading}
              className="text-xs"
            >
              Skip
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSnooze}
              disabled={loading}
              className="text-xs"
            >
              <Clock className="h-3 w-3 mr-1" />
              Snooze 24h
            </Button>
          </div>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={loading || !answer.trim()}
            className="px-6"
          >
            {loading && (
              <Loader2 className="h-3 w-3 mr-2 animate-spin" />
            )}
            Save Answer
          </Button>
        </div>

        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Each answer strengthens your vault and improves how we present your experience across all features.
        </p>
      </CardContent>
    </Card>
  );
}
