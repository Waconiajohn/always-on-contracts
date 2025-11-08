import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, Sparkles } from 'lucide-react';

interface AIProgressStage {
  id: string;
  label: string;
  duration: number; // milliseconds
  status: 'pending' | 'active' | 'complete';
}

interface AIProgressIndicatorProps {
  stages: { id: string; label: string; duration: number }[];
  onComplete?: () => void;
}

export function AIProgressIndicator({ stages, onComplete }: AIProgressIndicatorProps) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [stageStatuses, setStageStatuses] = useState<AIProgressStage[]>(
    stages.map((stage, index) => ({
      ...stage,
      status: index === 0 ? 'active' : 'pending',
    }))
  );

  useEffect(() => {
    if (currentStageIndex >= stages.length) {
      onComplete?.();
      return;
    }

    const currentStage = stages[currentStageIndex];
    const timer = setTimeout(() => {
      // Mark current stage as complete
      setStageStatuses((prev) =>
        prev.map((stage, index) => {
          if (index === currentStageIndex) return { ...stage, status: 'complete' };
          if (index === currentStageIndex + 1) return { ...stage, status: 'active' };
          return stage;
        })
      );
      setCurrentStageIndex(currentStageIndex + 1);
    }, currentStage.duration);

    return () => clearTimeout(timer);
  }, [currentStageIndex, stages, onComplete]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-2 text-purple-600">
        <Sparkles className="w-5 h-5 animate-pulse" />
        <h3 className="text-lg font-semibold">AI Processing</h3>
      </div>

      <div className="space-y-3">
        {stageStatuses.map((stage) => (
          <div key={stage.id} className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {stage.status === 'complete' ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : stage.status === 'active' ? (
                <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
              )}
            </div>
            <div className="flex-1">
              <p
                className={`text-sm font-medium ${
                  stage.status === 'complete'
                    ? 'text-green-700'
                    : stage.status === 'active'
                    ? 'text-purple-700'
                    : 'text-slate-400'
                }`}
              >
                {stage.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-6">
        <p className="text-sm text-slate-600">
          💡 <strong>Unlike job boards</strong>, we analyze transferable skills and market trends—not just
          keywords
        </p>
      </div>
    </div>
  );
}
