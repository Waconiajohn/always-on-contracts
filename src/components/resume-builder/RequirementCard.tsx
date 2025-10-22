import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Check, Loader2, Database, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RequirementNeed } from "./RequirementNeed";
import { VaultMatchesDisplay } from "./VaultMatchesDisplay";
import { ClarifyingQuestions } from "./ClarifyingQuestions";
import { CreativeOptions } from "./CreativeOptions";
import { FinalEdit } from "./FinalEdit";

interface RequirementCardProps {
  requirement: {
    id: string;
    text: string;
    source: 'job_description' | 'industry_standard' | 'job_title_standard';
    priority: 'required' | 'preferred' | 'nice_to_have';
    atsKeywords: string[];
  };
  vaultMatches: any[];
  matchStatus: 'perfect_match' | 'partial_match' | 'complete_gap';
  currentIndex: number;
  totalCount: number;
  onComplete: (response: any) => void;
  onSkip: () => void;
  jobContext: any;
}

export const RequirementCard = ({
  requirement,
  vaultMatches,
  matchStatus,
  currentIndex,
  totalCount,
  onComplete,
  onSkip,
  jobContext
}: RequirementCardProps) => {
  const [step, setStep] = useState<'need' | 'questions' | 'options' | 'edit'>('need');
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [voiceContext, setVoiceContext] = useState<string>('');
  const [options, setOptions] = useState<any[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const handleVoiceTranscript = (transcript: string) => {
    setVoiceContext(prev => prev ? `${prev} ${transcript}` : transcript);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  // Generate clarifying questions
  const generateQuestions = async () => {
    if (matchStatus === 'perfect_match') {
      // Skip questions, go straight to options
      setStep('options');
      await generateOptions();
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-requirement-questions', {
        body: {
          requirement: requirement.text,
          vaultMatches,
          matchStatus,
          jobContext
        }
      });

      if (error) throw error;
      
      if (data?.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        setStep('questions');
      } else {
        // No questions needed, go straight to options
        setStep('options');
        await generateOptions();
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      toast.error('Failed to generate questions. Moving to options...');
      setStep('options');
      await generateOptions();
    } finally {
      setGenerating(false);
    }
  };

  // Generate creative options
  const generateOptions = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-requirement-options', {
        body: {
          requirement: requirement.text,
          requirementSource: requirement.source,
          requirementPriority: requirement.priority,
          vaultMatches,
          answers,
          voiceContext,
          jobContext,
          matchStatus,
          atsKeywords: requirement.atsKeywords
        }
      });

      if (error) throw error;
      
      if (data?.options && data.options.length > 0) {
        setOptions(data.options);
        setStep('options');
      } else {
        toast.error('No options generated. Please try again or skip.');
      }
    } catch (error) {
      console.error('Error generating options:', error);
      toast.error('Failed to generate options. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectOption = (index: number) => {
    setSelectedOption(index);
    setEditedContent(options[index].content);
    setStep('edit');
  };

  const handleComplete = () => {
    onComplete({
      requirement,
      answers,
      voiceContext,
      selectedOption,
      editedContent,
      options
    });
  };

  const getPriorityColor = () => {
    switch (requirement.priority) {
      case 'required': return 'bg-red-500';
      case 'preferred': return 'bg-orange-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <Card className="max-w-4xl mx-auto shadow-lg">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant="outline">
            Requirement {currentIndex} of {totalCount}
          </Badge>
          <Badge className={getPriorityColor()}>
            {requirement.priority}
          </Badge>
        </div>
        <Progress value={(currentIndex / totalCount) * 100} className="h-2" />
      </CardHeader>

      <CardContent className="space-y-6">
        {/* STEP 1: Show the need */}
        {step === 'need' && (
          <>
            <RequirementNeed
              requirement={requirement}
              atsKeywords={requirement.atsKeywords}
            />
            <VaultMatchesDisplay
              vaultMatches={vaultMatches}
              matchStatus={matchStatus}
              requirement={requirement}
            />
            <div className="flex gap-3">
              {matchStatus === 'perfect_match' ? (
                <Button 
                  onClick={() => { setStep('options'); generateOptions(); }} 
                  className="flex-1"
                  disabled={generating}
                >
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'See Suggested Content'
                  )}
                </Button>
              ) : (
                <Button 
                  onClick={generateQuestions} 
                  className="flex-1"
                  disabled={generating}
                >
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Answer Quick Questions'
                  )}
                </Button>
              )}
              <Button onClick={onSkip} variant="outline">
                Skip This
              </Button>
            </div>
          </>
        )}

        {/* STEP 2: Clarifying questions */}
        {step === 'questions' && (
          <>
            <ClarifyingQuestions
              questions={questions}
              answers={answers}
              onAnswerChange={setAnswers}
              voiceContext={voiceContext}
              onVoiceTranscript={handleVoiceTranscript}
              isRecording={isRecording}
              onToggleRecording={toggleRecording}
            />
            <div className="flex gap-3">
              <Button 
                onClick={generateOptions} 
                disabled={generating} 
                className="flex-1"
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Options...
                  </>
                ) : (
                  'Generate Personalized Options'
                )}
              </Button>
              <Button onClick={onSkip} variant="outline">
                Skip
              </Button>
            </div>
          </>
        )}

        {/* STEP 3: Creative options */}
        {step === 'options' && options.length > 0 && (
          <>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Creative Solutions</h3>
              <p className="text-sm text-muted-foreground">
                Choose the approach that best represents your experience:
              </p>
              <CreativeOptions
                options={options}
                onSelectOption={handleSelectOption}
              />
            </div>
          </>
        )}

        {/* STEP 4: Final edit */}
        {step === 'edit' && selectedOption !== null && (
          <>
            <FinalEdit
              content={editedContent}
              onChange={setEditedContent}
              originalOption={options[selectedOption]}
              requirement={requirement}
            />
            <Alert>
              <Database className="h-4 w-4" />
              <AlertTitle>Save to Career Vault?</AlertTitle>
              <AlertDescription>
                Adding this to your Career Vault will make future resumes even stronger and help with interview prep.
              </AlertDescription>
            </Alert>
            <div className="flex gap-3">
              <Button onClick={handleComplete} className="flex-1">
                <Check className="mr-2 h-4 w-4" />
                Add to Resume
              </Button>
              <Button onClick={() => setStep('options')} variant="ghost">
                See Other Options
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
