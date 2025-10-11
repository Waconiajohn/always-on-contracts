import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ResumeUploadStep } from "@/components/career-vault/ResumeUploadStep";
import { InterviewStep } from "@/components/career-vault/InterviewStep";
import { BuildingStep } from "@/components/career-vault/BuildingStep";
import { ProgressHeader } from "@/components/career-vault/ProgressHeader";

interface InterviewPhase {
  phase: 'resume_understanding' | 'skills_translation' | 'hidden_gems' | 'complete';
  title: string;
  description: string;
  questions: string[];
  currentQuestionIndex: number;
}

const CorporateAssistantContent = () => {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string>("");
  const [vaultId, setVaultId] = useState<string | null>(null);
  const [step, setStep] = useState<'upload' | 'analyzing' | 'interview' | 'building'>('upload');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [currentResponse, setCurrentResponse] = useState("");
  const [interviewPhase, setInterviewPhase] = useState<InterviewPhase>({
    phase: 'resume_understanding',
    title: 'Understanding Your Experience',
    description: 'Let me learn more about your background',
    questions: [],
    currentQuestionIndex: 0
  });
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [aiTyping, setAiTyping] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [validationFeedback, setValidationFeedback] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [currentQuestionData, setCurrentQuestionData] = useState<any>(null);
  const [currentSubQuestion, setCurrentSubQuestion] = useState(0);
  const [subQuestionResponses, setSubQuestionResponses] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        checkExistingVault(user.id);
      }
    });
  }, []);

  const checkExistingVault = async (uid: string) => {
    const { data } = await supabase
      .from('career_vault')
      .select('*')
      .eq('user_id', uid)
      .maybeSingle();

    if (data) {
      setVaultId(data.id);
      setCompletionPercentage(data.interview_completion_percentage || 0);
      if (data.interview_completion_percentage === 100) {
        setStep('building');
      } else if (data.resume_raw_text) {
        setStep('interview');
        loadNextQuestion(data.id);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setResumeFile(file);
    setIsParsingFile(true);
    
    try {
      const fileName = file.name.toLowerCase();
      
      // All file types now go through backend
      if (fileName.endsWith('.txt') || fileName.endsWith('.pdf') || fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
        // Convert file to base64
        const arrayBuffer = await file.arrayBuffer();
        const base64Data = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        
        // Send to backend edge function
        const { data, error } = await supabase.functions.invoke('parse-resume', {
          body: { fileData: base64Data, fileName: file.name }
        });
        
        if (error) {
          throw new Error(error.message || 'Failed to parse file');
        }
        
        if (!data?.success) {
          throw new Error(data?.error || 'Failed to parse file');
        }
        
        setResumeText(data.text);
        toast({ 
          title: "File parsed successfully", 
          description: `Extracted ${data.text.length.toLocaleString()} characters from ${file.name}` 
        });
      } else {
        throw new Error('Unsupported file type. Please upload .txt, .pdf, .doc, or .docx');
      }
    } catch (error: any) {
      console.error('File upload error:', error);
      toast({ 
        title: "Unable to parse file", 
        description: error.message || 'An unexpected error occurred', 
        variant: "destructive" 
      });
      setResumeFile(null);
      setResumeText('');
    } finally {
      setIsParsingFile(false);
    }
  };

  const handleAnalyzeResume = async () => {
    if (!resumeText || !userId) return;

    setStep('analyzing');
    setAiTyping(true);

    try {
      // Sanitize resume text to remove null bytes and other problematic characters
      const sanitizedText = resumeText
        .replace(/\u0000/g, '') // Remove null bytes
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // Remove other control characters
        .trim();

      // Create or update Career Vault
      const { data: vault, error: wcError } = await supabase
        .from('career_vault')
        .upsert({
          user_id: userId,
          resume_raw_text: sanitizedText,
          interview_completion_percentage: 0
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (wcError) throw wcError;
      setVaultId(vault.id);

      // Call initial analysis edge function
      const { data: analysis, error: analysisError } = await supabase.functions.invoke('analyze-resume', {
        body: { 
          resumeText: sanitizedText,
          userId: userId
        }
      });

      if (analysisError) throw analysisError;

      // Update Career Vault with initial analysis
      await supabase
        .from('career_vault')
        .update({
          initial_analysis: analysis,
          overall_strength_score: analysis.strengthScore || 50
        })
        .eq('id', vault.id);

      setAiTyping(false);
      setStep('interview');
      await loadNextQuestion(vault.id);

      toast({
        title: "Resume Analyzed",
        description: "Let's start building your Career Vault!",
      });
    } catch (error: any) {
      console.error('Error analyzing resume:', error);
      toast({
        title: "Analysis Error",
        description: error.message,
        variant: "destructive",
      });
      setAiTyping(false);
    }
  };

  const loadNextQuestion = async (wcId: string) => {
    setAiTyping(true);
    
    try {
      // Get existing responses to determine next question
      const { data: responses } = await supabase
        .from('vault_interview_responses')
        .select('*')
        .eq('vault_id', wcId)
        .order('created_at', { ascending: true });

      const totalResponses = responses?.length || 0;
      const completion = Math.min((totalResponses / 25) * 100, 100);
      setCompletionPercentage(completion);

      if (completion >= 100) {
        setStep('building');
        await buildVaultIntelligence(wcId);
        return;
      }

      // Generate next question based on phase
      const { data: question, error } = await supabase.functions.invoke('generate-interview-question', {
        body: {
          vaultId: wcId,
          previousResponses: responses
        }
      });

      if (error) throw error;

      // Parse question data - could be structured object or text
      const questionData = question.question;
      if (typeof questionData === 'object' && questionData.context) {
        // Structured format
        setCurrentQuestionData(questionData);
        setCurrentSubQuestion(0);
        setSubQuestionResponses([]);
      } else {
        // Text format (fallback)
        setCurrentQuestionData({ question: questionData });
        setCurrentSubQuestion(0);
        setSubQuestionResponses([]);
      }

      setInterviewPhase({
        phase: question.phase,
        title: question.phaseTitle,
        description: question.phaseDescription,
        questions: [typeof questionData === 'string' ? questionData : JSON.stringify(questionData)],
        currentQuestionIndex: 0
      });

      await supabase
        .from('career_vault')
        .update({ interview_completion_percentage: completion })
        .eq('id', wcId);

    } catch (error: any) {
      console.error('Error loading question:', error);
      toast({
        title: "Error",
        description: "Failed to load next question",
        variant: "destructive",
      });
    } finally {
      setAiTyping(false);
    }
  };

  const handleNextSubQuestion = () => {
    if (!currentResponse.trim()) return;
    
    // Save current sub-question response
    const newResponses = [...subQuestionResponses];
    newResponses[currentSubQuestion] = currentResponse;
    setSubQuestionResponses(newResponses);
    setCurrentResponse("");
    
    // Move to next sub-question
    setCurrentSubQuestion(prev => prev + 1);
  };

  const handleSubmitResponse = async () => {
    if (!currentResponse.trim() || !vaultId) return;

    // For structured questions with sub-questions
    if (currentQuestionData?.questionsToExpand && currentQuestionData.questionsToExpand.length > 0) {
      // Save final sub-question response
      const allResponses = [...subQuestionResponses];
      allResponses[currentSubQuestion] = currentResponse;
      
      // Combine all responses with question labels
      const combinedResponse = allResponses
        .map((resp, idx) => {
          const q = currentQuestionData.questionsToExpand[idx];
          return `Q${idx + 1}: ${q.prompt}\nA: ${resp}`;
        })
        .join('\n\n');

      // Validate combined answer
      setIsValidating(true);
      try {
        const { data: validation, error: valError } = await supabase.functions.invoke('validate-interview-response', {
          body: {
            question: interviewPhase.questions[0],
            answer: combinedResponse
          }
        });

        if (valError) throw valError;

        setValidationFeedback(validation);

        if (!validation.is_sufficient) {
          setIsValidating(false);
          toast({
            title: "Great start!",
            description: "Your answers could be stronger. See the feedback below.",
          });
          return;
        }

        await supabase
          .from('vault_interview_responses')
          .insert({
            vault_id: vaultId,
            user_id: userId,
            question: interviewPhase.questions[0],
            response: combinedResponse,
            phase: interviewPhase.phase
          });

        setCurrentResponse("");
        setValidationFeedback(null);
        setCurrentSubQuestion(0);
        setSubQuestionResponses([]);
        await loadNextQuestion(vaultId);

      } catch (error: any) {
        console.error('Error submitting response:', error);
        toast({
          title: "Error",
          description: "Failed to save response",
          variant: "destructive",
        });
      } finally {
        setIsValidating(false);
      }
    } else {
      // Old format - single question
      setIsValidating(true);
      try {
        const { data: validation, error: valError } = await supabase.functions.invoke('validate-interview-response', {
          body: {
            question: interviewPhase.questions[0],
            answer: currentResponse
          }
        });

        if (valError) throw valError;

        setValidationFeedback(validation);

        if (!validation.is_sufficient) {
          setIsValidating(false);
          toast({
            title: "Great start!",
            description: "Your answer could be stronger. See the feedback below.",
          });
          return;
        }

        await supabase
          .from('vault_interview_responses')
          .insert({
            vault_id: vaultId,
            user_id: userId,
            question: interviewPhase.questions[0],
            response: currentResponse,
            phase: interviewPhase.phase
          });

        setCurrentResponse("");
        setValidationFeedback(null);
        await loadNextQuestion(vaultId);

      } catch (error: any) {
        console.error('Error submitting response:', error);
        toast({
          title: "Error",
          description: "Failed to save response",
          variant: "destructive",
        });
      } finally {
        setIsValidating(false);
      }
    }
  };

  const handleAcceptAnswer = async () => {
    // User wants to submit answer despite validation feedback
    if (!currentResponse.trim() || !vaultId) return;

    // For structured questions with sub-questions
    if (currentQuestionData?.questionsToExpand && currentQuestionData.questionsToExpand.length > 0) {
      const allResponses = [...subQuestionResponses];
      allResponses[currentSubQuestion] = currentResponse;
      
      const combinedResponse = allResponses
        .map((resp, idx) => {
          const q = currentQuestionData.questionsToExpand[idx];
          return `Q${idx + 1}: ${q.prompt}\nA: ${resp}`;
        })
        .join('\n\n');

      try {
        await supabase
          .from('vault_interview_responses')
          .insert({
            vault_id: vaultId,
            user_id: userId,
            question: interviewPhase.questions[0],
            response: combinedResponse,
            phase: interviewPhase.phase
          });

        setCurrentResponse("");
        setValidationFeedback(null);
        setCurrentSubQuestion(0);
        setSubQuestionResponses([]);
        await loadNextQuestion(vaultId);

      } catch (error: any) {
        console.error('Error submitting response:', error);
        toast({
          title: "Error",
          description: "Failed to save response",
          variant: "destructive",
        });
      }
    } else {
      try {
        await supabase
          .from('vault_interview_responses')
          .insert({
            vault_id: vaultId,
            user_id: userId,
            question: interviewPhase.questions[0],
            response: currentResponse,
            phase: interviewPhase.phase
          });

        setCurrentResponse("");
        setValidationFeedback(null);
        await loadNextQuestion(vaultId);

      } catch (error: any) {
        console.error('Error submitting response:', error);
        toast({
          title: "Error",
          description: "Failed to save response",
          variant: "destructive",
        });
      }
    }
  };

  const handleVoiceTranscript = (text: string) => {
    setCurrentResponse(prev => (prev ? `${prev} ${text}` : text));
  };

  const buildVaultIntelligence = async (wcId: string) => {
    setAiTyping(true);
    
    try {
      // Call intelligence edge functions in parallel
      await Promise.all([
        supabase.functions.invoke('generate-power-phrases', { body: { vaultId: wcId } }),
        supabase.functions.invoke('generate-transferable-skills', { body: { vaultId: wcId } }),
        supabase.functions.invoke('discover-hidden-competencies', { body: { vaultId: wcId } })
      ]);

      // Update totals
      const [phrases, skills, competencies] = await Promise.all([
        supabase.from('vault_power_phrases').select('id', { count: 'exact', head: true }).eq('vault_id', wcId),
        supabase.from('vault_transferable_skills').select('id', { count: 'exact', head: true }).eq('vault_id', wcId),
        supabase.from('vault_hidden_competencies').select('id', { count: 'exact', head: true }).eq('vault_id', wcId)
      ]);

      await supabase
        .from('career_vault')
        .update({
          total_power_phrases: phrases.count || 0,
          total_transferable_skills: skills.count || 0,
          total_hidden_competencies: competencies.count || 0
        })
        .eq('id', wcId);

      toast({
        title: "Career Vault Complete!",
        description: "Your career intelligence engine is ready.",
      });

    } catch (error: any) {
      console.error('Error building Career Vault:', error);
      toast({
        title: "Error",
        description: "Failed to build Career Vault intelligence",
        variant: "destructive",
      });
    } finally {
      setAiTyping(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Briefcase className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Your Corporate Assistant</h1>
        </div>
        <p className="text-muted-foreground">
          I'll help you build a comprehensive Career Vault of your skills, experience, and hidden talents
        </p>
      </div>

      {/* Progress Header */}
      {step !== 'upload' && (
        <ProgressHeader step={step} completionPercentage={completionPercentage} />
      )}

      {/* Step 1: Upload Resume */}
      {step === 'upload' && (
        <ResumeUploadStep
          resumeFile={resumeFile}
          resumeText={resumeText}
          isParsingFile={isParsingFile}
          onFileUpload={handleFileUpload}
          onResumeTextChange={setResumeText}
          onAnalyze={handleAnalyzeResume}
        />
      )}

      {/* Step 2: Analyzing */}
      {step === 'analyzing' && (
        <Card className="p-8">
          <div className="flex flex-col items-center text-center">
            <div className="animate-pulse mb-4">
              <Briefcase className="w-16 h-16 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Analyzing Your Resume...</h2>
            <p className="text-muted-foreground">
              I'm reading through your experience and preparing personalized questions
            </p>
          </div>
        </Card>
      )}

      {/* Step 3: Interview */}
      {step === 'interview' && (
        <InterviewStep
          interviewPhase={interviewPhase}
          completionPercentage={completionPercentage}
          aiTyping={aiTyping}
          currentQuestionData={currentQuestionData}
          currentSubQuestion={currentSubQuestion}
          currentResponse={currentResponse}
          validationFeedback={validationFeedback}
          isValidating={isValidating}
          isRecording={isRecording}
          onResponseChange={setCurrentResponse}
          onSubmitResponse={handleSubmitResponse}
          onAcceptAnswer={handleAcceptAnswer}
          onNextSubQuestion={handleNextSubQuestion}
          onSkip={() => loadNextQuestion(vaultId!)}
          onVoiceTranscript={handleVoiceTranscript}
          onToggleRecording={() => setIsRecording(!isRecording)}
        />
      )}

      {/* Step 4: Building Career Vault */}
      {step === 'building' && (
        <BuildingStep aiTyping={aiTyping} />
      )}
    </div>
  );
};

export default function CorporateAssistant() {
  return (
    <ProtectedRoute>
      <CorporateAssistantContent />
    </ProtectedRoute>
  );
}
