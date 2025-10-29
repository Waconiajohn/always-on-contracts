import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { QuestionBatchCard } from "./QuestionBatchCard";
import { CheckCircle2, Sparkles } from "lucide-react";

interface Question {
  id: string;
  type: string;
  category: string;
  question: string;
  inputType: string;
  options?: any[];
  followUp?: string;
  why: string;
  impactScore: number;
  priority: number;
}

interface QuestionBatch {
  category: string;
  questions: Question[];
  totalImpact: number;
}

interface IntelligentQuestionFlowProps {
  questionBatches: QuestionBatch[];
  onComplete: (responses: any[]) => void;
  vaultStrength: number;
}

export const IntelligentQuestionFlow = ({ 
  questionBatches, 
  onComplete,
  vaultStrength 
}: IntelligentQuestionFlowProps) => {
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [responses, setResponses] = useState<any[]>([]);
  const [estimatedStrength, setEstimatedStrength] = useState(vaultStrength);

  const currentBatch = questionBatches[currentBatchIndex];
  const progress = ((currentBatchIndex + 1) / questionBatches.length) * 100;

  const handleBatchComplete = (batchResponses: any[]) => {
    const allResponses = [...responses, ...batchResponses];
    setResponses(allResponses);

    // Calculate estimated strength boost
    const responseImpact = batchResponses.reduce((sum, r) => sum + (r.impactScore || 0), 0);
    setEstimatedStrength(prev => Math.min(100, prev + responseImpact));

    if (currentBatchIndex < questionBatches.length - 1) {
      setCurrentBatchIndex(prev => prev + 1);
    } else {
      onComplete(allResponses);
    }
  };

  const handleSkipBatch = () => {
    if (currentBatchIndex < questionBatches.length - 1) {
      setCurrentBatchIndex(prev => prev + 1);
    } else {
      onComplete(responses);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <div>
              <CardTitle className="text-xl">Building Your Career Intelligence</CardTitle>
              <CardDescription>
                Section {currentBatchIndex + 1} of {questionBatches.length}: {currentBatch.category}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {estimatedStrength}%
              </div>
              <p className="text-xs text-muted-foreground">Vault Strength</p>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>
      </Card>

      {/* Current Batch Questions */}
      <QuestionBatchCard
        batch={currentBatch}
        onComplete={handleBatchComplete}
        onSkip={handleSkipBatch}
      />

      {/* Completed Batches Indicator */}
      {currentBatchIndex > 0 && (
        <Card className="bg-accent/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">
                  {currentBatchIndex} {currentBatchIndex === 1 ? 'section' : 'sections'} completed
                </p>
                <p className="text-sm text-muted-foreground">
                  You're making great progress! {responses.length} responses captured.
                </p>
              </div>
              <Badge variant="secondary">
                <Sparkles className="w-3 h-3 mr-1" />
                +{Math.round(estimatedStrength - vaultStrength)} strength
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips Card */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-1">💡 Pro Tip</p>
              <p className="text-muted-foreground">
                {currentBatchIndex === 0 && "Be specific with numbers and results. Quantified achievements are more impactful."}
                {currentBatchIndex === 1 && "Don't undersell yourself. Hidden achievements from your past roles matter!"}
                {currentBatchIndex === 2 && "Soft skills differentiate you. Think of specific situations where you demonstrated these."}
                {currentBatchIndex > 2 && "You're almost done! These final questions will round out your profile."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
