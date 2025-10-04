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
  singleQuestion?: QuestionToExpand;
  questionsToExpand?: QuestionToExpand[];
  exampleAnswer: string;
  questionNumber?: number;
  totalQuestions?: number;
}

export const PreFilledQuestion = ({ 
  context, 
  knownData, 
  singleQuestion, 
  questionsToExpand,
  exampleAnswer,
  questionNumber,
  totalQuestions 
}: PreFilledQuestionProps) => {
  const questions = singleQuestion ? [singleQuestion] : (questionsToExpand || []);
  
  return (
    <div className="space-y-5">
      {/* Context */}
      <div className="flex gap-3 items-start p-4 bg-primary/5 rounded-lg border border-primary/20">
        <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-medium text-foreground mb-1">Why I'm asking:</p>
          <p className="text-muted-foreground text-sm leading-relaxed">{context}</p>
        </div>
      </div>

      {/* What I Found on Your Resume */}
      {knownData && knownData.length > 0 && (
        <div className="p-4 bg-muted/50 rounded-lg border border-border">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground text-sm">What I found on your resume:</h3>
          </div>
          <div className="space-y-2.5">
            {knownData.map((item, idx) => (
              <div key={idx} className="flex gap-3 text-sm">
                <span className="font-medium text-foreground min-w-[120px]">{item.label}:</span>
                {Array.isArray(item.value) ? (
                  <ul className="space-y-0.5 flex-1">
                    {item.value.map((v, i) => (
                      <li key={i} className="text-muted-foreground">• {v}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-muted-foreground flex-1">{item.value}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Question */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground text-sm">
              {singleQuestion ? 'Please expand on this:' : 'Now let\'s expand on this:'}
            </h3>
          </div>
          {questionNumber && totalQuestions && (
            <span className="text-xs text-muted-foreground font-medium">
              Question {questionNumber} of {totalQuestions}
            </span>
          )}
        </div>
        
        {questions.map((q, idx) => (
          <div key={idx} className={idx > 0 ? 'mt-3 pt-3 border-t border-border' : ''}>
            <p className="text-foreground font-medium leading-relaxed">{q.prompt}</p>
            {q.hint && (
              <p className="text-xs text-muted-foreground mt-1.5 italic leading-relaxed">{q.hint}</p>
            )}
          </div>
        ))}
      </div>

      {/* Example */}
      <div className="p-4 bg-primary/5 border-l-4 border-primary rounded">
        <p className="font-medium text-foreground mb-2 flex items-center gap-2 text-sm">
          <Target className="w-4 h-4" />
          Example of a strong answer:
        </p>
        <p className="text-muted-foreground text-sm italic leading-relaxed">{exampleAnswer}</p>
      </div>
    </div>
  );
};
