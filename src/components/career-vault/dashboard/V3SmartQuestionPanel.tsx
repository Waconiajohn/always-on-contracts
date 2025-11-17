import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  runVaultStrategicAudit,
  submitSmartQuestionAnswer,
  type SmartQuestion,
} from "@/lib/services/vaultStrategicAudit";
import { trackSmartQuestion } from "@/lib/services/vaultTelemetry";

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

  const loadQuestions = async () => {
    try {
      setInitializing(true);
      const audit = await runVaultStrategicAudit(vaultId);
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
            onClick={loadQuestions}
          >
            Refresh suggestions
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="smart-question-panel" className="shadow-sm">
      <CardContent className="py-4 px-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-500" />
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Focused improvement
            </div>
            <div className="text-sm font-medium">
              Question {activeIndex + 1} of {questions.length}
            </div>
            {current.category && (
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Focus area: {current.category}
              </div>
            )}
          </div>
        </div>

        {current.reasoning && (
          <p className="text-xs text-muted-foreground">
            {current.reasoning}
          </p>
        )}

        <p className="text-sm font-semibold">{current.question}</p>

        <textarea
          rows={3}
          className="w-full rounded-md border px-3 py-2 text-sm"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="A short, factual answer is ideal. Bullet points are fine."
        />

        <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSkip}
              disabled={loading}
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
          >
            {loading && (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            )}
            Save and update vault
          </Button>
        </div>

        <p className="text-[11px] text-muted-foreground">
          Each answer helps us present your experience more clearly, quantify your
          impact, and match you to the right roles.
        </p>
      </CardContent>
    </Card>
  );
}
