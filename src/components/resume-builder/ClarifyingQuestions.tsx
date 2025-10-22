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
      <div className="flex items-center gap-3 mb-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <HelpCircle className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg">Quick Questions</h3>
          <Badge variant="outline" className="mt-1 bg-muted/50">
            Optional - improves results
          </Badge>
        </div>
      </div>

      {questions.map((question, index) => (
        <Card 
          key={question.id} 
          className="p-5 hover:shadow-md transition-shadow bg-gradient-to-br from-card to-card/50"
        >
          <div className="space-y-4">
            <Label className="text-base font-medium flex items-start gap-2">
              <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                {index + 1}
              </span>
              <span className="flex-1">{question.text}</span>
            </Label>

            {question.type === 'multiple_choice' && question.options ? (
              <RadioGroup
                value={answers[question.id] || ''}
                onValueChange={(value) => handleAnswerChange(question.id, value)}
                className="space-y-2"
              >
                {question.options.map(option => (
                  <div 
                    key={option.value} 
                    className="flex items-center space-x-3 p-3 rounded-md hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all cursor-pointer"
                  >
                    <RadioGroupItem value={option.value} id={`${question.id}-${option.value}`} />
                    <Label 
                      htmlFor={`${question.id}-${option.value}`} 
                      className="flex-1 cursor-pointer font-normal"
                    >
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
                className="resize-none"
              />
            )}
          </div>
        </Card>
      ))}

      <Card className="p-5 bg-accent/5 border-accent/20">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
              <Mic className="h-5 w-5 text-accent" />
            </div>
            <div>
              <Label className="text-base font-medium">Additional Context (Optional)</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Add nuance or clarification to your answers above.
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <Textarea
              value={voiceContext}
              onChange={(e) => onVoiceTranscript(e.target.value)}
              placeholder="Type or speak additional context..."
              rows={4}
              className="flex-1 resize-none"
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
