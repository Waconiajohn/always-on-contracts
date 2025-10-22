import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Mic, HelpCircle } from "lucide-react";
import { VoiceInput } from "@/components/VoiceInput";

interface ClarifyingQuestionsProps {
  questions: Array<{
    id: string;
    text: string;
    type: 'multiple_choice' | 'text';
    options?: Array<{ value: string; label: string }>;
  }>;
  answers: Record<string, any>;
  onAnswerChange: (answers: Record<string, any>) => void;
  voiceContext: string;
  onVoiceTranscript: (text: string) => void;
  isRecording: boolean;
  onToggleRecording: () => void;
}

export const ClarifyingQuestions = ({
  questions,
  answers,
  onAnswerChange,
  voiceContext,
  onVoiceTranscript,
  isRecording,
  onToggleRecording
}: ClarifyingQuestionsProps) => {
  const handleAnswerChange = (questionId: string, value: any) => {
    onAnswerChange({ ...answers, [questionId]: value });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <HelpCircle className="h-5 w-5 text-blue-500" />
        <h3 className="font-semibold text-lg">Quick Questions</h3>
        <Badge variant="outline">Optional - improves results</Badge>
      </div>

      {questions.map((question, index) => (
        <Card key={question.id} className="p-4">
          <div className="space-y-3">
            <Label className="text-base font-medium">
              {index + 1}. {question.text}
            </Label>

            {question.type === 'multiple_choice' && question.options ? (
              <RadioGroup
                value={answers[question.id] || ''}
                onValueChange={(value) => handleAnswerChange(question.id, value)}
              >
                {question.options.map(option => (
                  <div key={option.value} className="flex items-center space-x-2 p-2 rounded hover:bg-accent">
                    <RadioGroupItem value={option.value} id={`${question.id}-${option.value}`} />
                    <Label htmlFor={`${question.id}-${option.value}`} className="flex-1 cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <Textarea
                value={answers[question.id] || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                placeholder="Type your answer..."
                rows={3}
              />
            )}
          </div>
        </Card>
      ))}

      <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-blue-600" />
            <Label className="text-base font-medium">Additional Context (Optional)</Label>
          </div>
          <p className="text-sm text-muted-foreground">
            Add nuance or clarification to your answers above.
          </p>
          <div className="flex gap-2 items-start">
            <Textarea
              value={voiceContext}
              onChange={(e) => onVoiceTranscript(e.target.value)}
              placeholder="Type or speak additional context..."
              rows={4}
              className="flex-1"
            />
            <VoiceInput
              onTranscript={onVoiceTranscript}
              isRecording={isRecording}
              onToggleRecording={onToggleRecording}
            />
          </div>
        </div>
      </Card>
    </div>
  );
};
