import { Info, CheckCircle2, Sparkles, Target } from "lucide-react";

interface KnownDataItem {
  label: string;
  value: string | string[];
  source: 'resume' | 'previous_answer';
}

interface QuestionToExpand {
  prompt: string;
  placeholder: string;
  hint?: string;
}

interface PreFilledQuestionProps {
  context: string;
  knownData: KnownDataItem[];
  questionsToExpand: QuestionToExpand[];
  exampleAnswer: string;
}

export const PreFilledQuestion = ({ context, knownData, questionsToExpand, exampleAnswer }: PreFilledQuestionProps) => {
  return (
    <div className="space-y-6">
      {/* Context */}
      <div className="flex gap-3 items-start p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">Why I'm asking:</p>
          <p className="text-blue-800 dark:text-blue-200 text-sm">{context}</p>
        </div>
      </div>

      {/* What I Found on Your Resume */}
      {knownData && knownData.length > 0 && (
        <div className="p-5 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-green-700 dark:text-green-400" />
            <h3 className="font-semibold text-green-900 dark:text-green-100">What I Found on Your Resume:</h3>
          </div>
          <div className="space-y-3">
            {knownData.map((item, idx) => (
              <div key={idx} className="flex gap-3">
                <span className="font-medium text-green-800 dark:text-green-300 min-w-[140px]">{item.label}:</span>
                {Array.isArray(item.value) ? (
                  <ul className="space-y-1">
                    {item.value.map((v, i) => (
                      <li key={i} className="text-green-700 dark:text-green-200">• {v}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-green-700 dark:text-green-200">{item.value}</span>
                )}
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-green-600 dark:text-green-400 italic">
            ✓ Looks good? Great! Now let's expand on this with more detail below.
          </p>
        </div>
      )}

      {/* Now Let's Expand */}
      <div className="p-5 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-amber-700 dark:text-amber-400" />
          <h3 className="font-semibold text-amber-900 dark:text-amber-100">Now Let's Expand on This:</h3>
        </div>
        <ul className="space-y-3">
          {questionsToExpand.map((q, idx) => (
            <li key={idx} className="flex gap-2 items-start">
              <span className="text-amber-700 dark:text-amber-400 font-bold mt-0.5">{idx + 1}.</span>
              <div>
                <p className="text-amber-900 dark:text-amber-100 font-medium">{q.prompt}</p>
                {q.hint && <p className="text-xs text-amber-600 dark:text-amber-300 mt-1 italic">{q.hint}</p>}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Example */}
      <div className="p-4 bg-purple-50 dark:bg-purple-950 border-l-4 border-purple-600 dark:border-purple-400 rounded">
        <p className="font-medium text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
          <Target className="w-4 h-4" />
          Example of a Strong Answer:
        </p>
        <p className="text-purple-800 dark:text-purple-200 text-sm italic leading-relaxed">{exampleAnswer}</p>
      </div>
    </div>
  );
};
