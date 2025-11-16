import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import {
  runVaultStrategicAudit,
  submitSmartQuestionAnswer,
  type SmartQuestion,
} from "@/lib/services/vaultStrategicAudit";

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
    if (activeIndex < questions.length - 1) {
      setActiveIndex((idx) => idx + 1);
      setAnswer("");
    } else {
      await loadQuestions();
      setAnswer("");
    }
  };

  if (initializing) {
    return (
      <Card>
        <CardContent className="py-6 flex items-center justify-center text-muted-foreground gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Finding your highest-impact questions…</span>
        </CardContent>
      </Card>
    );
  }

  if (!current) {
    return (
      <Card>
        <CardContent className="py-6 space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-medium">
            <Sparkles className="h-4 w-4 text-blue-500" />
            <span>Your Career Vault is in good shape</span>
          </div>
          <p>
            There are no urgent gaps right now. As you add roles, projects, or
            change your target, we&apos;ll surface new quick questions here.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={loadQuestions}
          >
            Refresh suggestions
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardContent className="py-4 px-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-500" />
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Next best improvement
            </div>
            <div className="text-sm font-medium">
              Question {activeIndex + 1} of {questions.length}
            </div>
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
          placeholder="Type a brief answer here (2–6 sentences is perfect)."
        />

        <div className="flex items-center justify-between gap-2 mt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSkip}
            disabled={loading}
          >
            Skip for now
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={loading || !answer.trim()}
          >
            {loading && (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            )}
            Save answer
          </Button>
        </div>

        <p className="text-[11px] text-muted-foreground">
          Each answer strengthens how we describe your experience, quantify your
          impact, and match you to the right roles.
        </p>
      </CardContent>
    </Card>
  );
}
