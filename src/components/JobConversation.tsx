import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Sparkles, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CriticalQualification {
  qualification: string;
  importance: string;
  question: string;
}

interface JobConversationProps {
  qualifications: CriticalQualification[];
  onComplete: (responses: Record<string, string>) => void;
  matchScore: number;
}

export const JobConversation: React.FC<JobConversationProps> = ({
  qualifications,
  onComplete,
  matchScore,
}) => {
  const { toast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [currentResponse, setCurrentResponse] = useState('');

  const currentQual = qualifications[currentIndex];
  const isLastQuestion = currentIndex === qualifications.length - 1;
  const answeredCount = Object.keys(responses).length;

  const handleNext = () => {
    if (!currentResponse.trim()) {
      toast({
        title: "Response required",
        description: "Please provide an answer before continuing",
        variant: "destructive",
      });
      return;
    }

    const newResponses = {
      ...responses,
      [currentQual.qualification]: currentResponse,
    };

    setResponses(newResponses);
    setCurrentResponse('');

    if (isLastQuestion) {
      onComplete(newResponses);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSkip = () => {
    if (isLastQuestion) {
      onComplete(responses);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <Badge variant="default" className="text-lg px-3 py-1">
            {matchScore}% Match
          </Badge>
          <span className="text-sm text-muted-foreground">
            Question {currentIndex + 1} of {qualifications.length}
          </span>
        </div>
        <CardTitle className="text-2xl flex items-center gap-3">
          <MessageSquare className="h-7 w-7 text-primary" />
          Let's Optimize Your Application
        </CardTitle>
        <CardDescription>
          These are the critical qualifications for this role. Share your relevant experience to create a perfectly tailored resume.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Indicator */}
        <div className="flex gap-2">
          {qualifications.map((_, index) => (
            <div
              key={index}
              className={`h-2 flex-1 rounded-full transition-colors ${
                index < currentIndex
                  ? 'bg-primary'
                  : index === currentIndex
                  ? 'bg-primary/50'
                  : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Current Question */}
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <h3 className="font-semibold text-lg">{currentQual.qualification}</h3>
            <p className="text-sm text-muted-foreground">{currentQual.importance}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {currentQual.question}
            </label>
            <Textarea
              placeholder="Share specific examples of your experience with this qualification. Include measurable results when possible..."
              value={currentResponse}
              onChange={(e) => setCurrentResponse(e.target.value)}
              rows={6}
              className="resize-none"
            />
          </div>
        </div>

        {/* Answered Summary */}
        {answeredCount > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            You've answered {answeredCount} question{answeredCount > 1 ? 's' : ''}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={handleNext} className="flex-1">
            {isLastQuestion ? 'Complete & Generate Resume' : 'Next Question'}
          </Button>
          <Button onClick={handleSkip} variant="outline">
            Skip
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
