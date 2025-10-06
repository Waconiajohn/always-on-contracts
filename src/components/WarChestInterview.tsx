import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Send, Sparkles, TrendingUp, CheckCircle2, CheckCircle, Volume2, VolumeX, UserCircle, Mic } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { VoiceInput } from './VoiceInput';
import { PreFilledQuestion } from './PreFilledQuestion';
import { GuidedPromptSelector } from './GuidedPromptSelector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { STARStoryBuilder } from './war-chest/STARStoryBuilder';
import { WorkingKnowledgeAssessment } from './war-chest/WorkingKnowledgeAssessment';

interface KnownDataItem {
  label: string;
  value: string | string[];
  source: 'resume' | 'previous_answer';
}

interface QuestionToExpand {
  prompt: string;
  placeholder: string;
  hint?: string;
  question_type?: 'text' | 'multiple_choice_with_custom' | 'star';
  answer_options?: string[];
  custom_input_prompt?: string;
}

interface QuestionData {
  context: string;
  knownData: KnownDataItem[];
  questionsToExpand: QuestionToExpand[];
  exampleAnswer: string;
}

interface InterviewResponse {
  question: QuestionData;
  phase: string;
  completionPercentage: number;
  isComplete: boolean;
}

interface ValidationResult {
  is_sufficient: boolean;
  quality_score: number;
  missing_elements: string[];
  follow_up_prompt: string;
  strengths: string[];
  guided_prompts?: any;
}

interface WarChestInterviewProps {
  onComplete: () => void;
}

type CoachPersona = 'mentor' | 'challenger' | 'strategist';

export const WarChestInterview = ({ onComplete }: WarChestInterviewProps) => {
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null);
  const [currentSubQuestionIndex, setCurrentSubQuestionIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<string>('discovery');
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [validationFeedback, setValidationFeedback] = useState<string>('');
  const [qualityScore, setQualityScore] = useState<number>(0);
  const [warChestId, setWarChestId] = useState<string>('');
  const [guidedPrompts, setGuidedPrompts] = useState<any>(null);
  const [skipAttempts, setSkipAttempts] = useState<number>(0);
  const [enhancedStrongAnswer, setEnhancedStrongAnswer] = useState<string>('');
  const [showAcceptButton, setShowAcceptButton] = useState<boolean>(false);
  const [currentResponseId, setCurrentResponseId] = useState<string>('');
  const [intelligenceExtracted, setIntelligenceExtracted] = useState({
    powerPhrases: 0,
    transferableSkills: 0,
    hiddenCompetencies: 0
  });
  
  // New state for checkbox-driven answers
  const [questionType, setQuestionType] = useState<'text' | 'multiple_choice_with_custom' | 'star'>('text');
  const [answerOptions, setAnswerOptions] = useState<string[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [customAnswerText, setCustomAnswerText] = useState('');
  const [dynamicQuestionCount, setDynamicQuestionCount] = useState(50);
  const [completenessScore, setCompletenessScore] = useState(0);
  const [resumeText, setResumeText] = useState('');
  
  // Audio/voice state (kept for backward compatibility, made optional)
  const [selectedPersona, setSelectedPersona] = useState<CoachPersona>('mentor');
  const [voiceEnabled, setVoiceEnabled] = useState(false); // Disabled by default
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const { toast } = useToast();

  const personas = {
    mentor: { name: 'The Mentor', voice: 'Sarah', description: 'Supportive & encouraging', icon: '🤝' },
    challenger: { name: 'The Challenger', voice: 'Charlie', description: 'Direct & probing', icon: '⚡' },
    strategist: { name: 'The Strategist', voice: 'Lily', description: 'Strategic & analytical', icon: '🎯' }
  };

  const phaseLabels: Record<string, string> = {
    discovery: '🔍 Discovery',
    deep_dive: '🎯 Deep Dive', 
    skills: '⚡ Skills & Strengths',
    future: '🚀 Future Goals'
  };

  useEffect(() => {
    startInterview();
    calculateDynamicQuestionCount();
  }, []);

  const calculateDynamicQuestionCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase.functions.invoke('calculate-completeness-score', {
        body: { user_id: user.id }
      });

      if (data) {
        setDynamicQuestionCount(data.recommended_question_count || 50);
        setCompletenessScore(data.completeness_percentage || 0);
      }
    } catch (error) {
      console.error('Error calculating question count:', error);
    }
  };

  const playQuestionAudio = async (text: string) => {
    if (!voiceEnabled) return;
    
    setIsPlayingAudio(true);
    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { 
          text,
          voice: personas[selectedPersona].voice,
          persona: selectedPersona
        }
      });

      if (error) {
        console.error('TTS error:', error);
        throw new Error(error.message || 'Failed to generate speech');
      }

      if (data?.error) {
        console.error('TTS API error:', data.error);
        throw new Error(data.error);
      }

      if (!data?.audioContent) {
        throw new Error('No audio content received');
      }

      // Convert base64 to audio blob
      const audioBlob = new Blob(
        [Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))],
        { type: 'audio/mpeg' }
      );
      const audioUrl = URL.createObjectURL(audioBlob);

      // Play audio
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setIsPlayingAudio(false);
      audioRef.current.onerror = () => {
        setIsPlayingAudio(false);
        toast({
          title: "Audio playback failed",
          description: "Unable to play audio. Please try again.",
          variant: "destructive"
        });
      };
      await audioRef.current.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlayingAudio(false);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Check for specific error types
      if (errorMessage.includes('quota_exceeded') || errorMessage.includes('credits')) {
        toast({
          title: "Voice credits exhausted",
          description: "The text-to-speech service has run out of credits. Voice is temporarily unavailable.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Audio playback failed",
          description: errorMessage,
          variant: "destructive"
        });
      }
    }
  };

  const startInterview = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get war chest ID
      const { data: warChest } = await supabase
        .from('career_war_chest')
        .select('id, resume_raw_text')
        .eq('user_id', user.id)
        .single();

      if (warChest) {
        setWarChestId(warChest.id);
        setResumeText(warChest.resume_raw_text || '');
      }

      // Get confirmed skills for context
      const { data: confirmedSkills } = await supabase
        .from('war_chest_confirmed_skills')
        .select('*')
        .eq('user_id', user.id);

      const { data, error } = await supabase.functions.invoke('generate-interview-question', {
        body: { 
          phase: 'discovery', 
          isFirst: true,
          generate_answer_options: true,
          confirmed_skills: confirmedSkills || []
        }
      });

      if (error) throw error;

      if (data?.question) {
        setCurrentQuestion(data.question);
        setCurrentPhase(data.phase || 'discovery');
        setCompletionPercentage(data.completionPercentage || 0);
        
        // Extract answer options if provided
        const firstSubQuestion = data.question.questionsToExpand[0];
        if (firstSubQuestion?.answer_options) {
          setQuestionType('multiple_choice_with_custom');
          setAnswerOptions(firstSubQuestion.answer_options);
        } else if (firstSubQuestion?.question_type === 'star') {
          setQuestionType('star');
        } else {
          setQuestionType('text');
        }
      }
    } catch (error) {
      console.error('Error starting interview:', error);
      toast({
        title: 'Error',
        description: 'Failed to start interview. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!currentQuestion) return;

    const currentSubQuestion = currentQuestion.questionsToExpand[currentSubQuestionIndex];
    
    // Prepare answer based on question type
    let answerToValidate: any;
    if (questionType === 'multiple_choice_with_custom') {
      if (selectedOptions.length === 0 && !customAnswerText.trim()) {
        toast({
          title: 'Please provide an answer',
          description: 'Select at least one option or add custom text',
          variant: 'destructive'
        });
        return;
      }
      answerToValidate = {
        selected_options: selectedOptions,
        custom_text: customAnswerText
      };
    } else if (questionType === 'star') {
      if (!userInput.trim()) return;
      answerToValidate = userInput;
    } else {
      if (!userInput.trim()) return;
      answerToValidate = userInput;
    }
    
    setIsValidating(true);
    setValidationFeedback('');

    try {
      // Step 1: Validate response quality
      const { data: validation, error: validationError } = await supabase.functions.invoke(
        'validate-interview-response',
        {
          body: {
            question: currentSubQuestion.prompt,
            answer: answerToValidate
          }
        }
      ) as { data: ValidationResult; error: any };

      if (validationError) throw validationError;

      setQualityScore(validation.quality_score);
      
      // Quality >= 70: Response is good enough - show Accept button
      if (validation.quality_score >= 70) {
        setShowAcceptButton(true);
        setGuidedPrompts(null); // Don't show guided prompts
        setValidationFeedback(validation.follow_up_prompt || `Great answer! (${validation.quality_score}/100) You can continue or enhance it further.`);
        
        // Fetch enhanced strong answer for reference
        fetchEnhancedAnswer(currentSubQuestion.prompt, userInput, validation);
        
        toast({
          title: '✅ Strong Answer!',
          description: `Quality: ${validation.quality_score}/100. You can continue or add more details.`,
        });
        setIsValidating(false);
        return;
      }

      // Quality < 70: Show guided prompts if available
      setGuidedPrompts(validation.guided_prompts || null);
      setShowAcceptButton(false);

      // If response is insufficient and we have room for improvement
      if (!validation.is_sufficient && skipAttempts < 2) {
        setValidationFeedback(validation.follow_up_prompt);
        toast({
          title: 'Let\'s add more detail',
          description: 'Select options below or add more to your answer',
          variant: 'default'
        });
        setIsValidating(false);
        return;
      }

      // If skip attempts >= 2, allow progression even with low score
      if (skipAttempts >= 2) {
        toast({
          title: 'Moving forward',
          description: 'You can enhance this response later from your Dashboard',
        });
      }

      // Step 2: Save response to database
      if (warChestId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        // Format response based on question type
        let responseToSave = '';
        if (questionType === 'multiple_choice_with_custom') {
          const selectedText = selectedOptions.length > 0 ? selectedOptions.join('; ') : '';
          const customText = customAnswerText.trim();
          responseToSave = selectedText + (customText ? `\n\nAdditional details: ${customText}` : '');
        } else {
          responseToSave = userInput;
        }
        
        const { data: savedResponse } = await supabase
          .from('war_chest_interview_responses')
          .insert([{
            war_chest_id: warChestId,
            user_id: user.id,
            question: currentSubQuestion.prompt,
            response: responseToSave,
            quality_score: validation.quality_score,
            validation_feedback: validation as any,
            phase: currentPhase,
          }])
          .select()
          .single();

        if (savedResponse) {
          setCurrentResponseId(savedResponse.id);
        }

        // Step 3: Extract intelligence in real-time
        const { data: extracted } = await supabase.functions.invoke(
          'extract-war-chest-intelligence',
          {
            body: {
              responseText: responseToSave,
              questionText: currentSubQuestion.prompt,
              warChestId
            }
          }
        );

        if (extracted?.extracted) {
          const newExtracted = {
            powerPhrases: intelligenceExtracted.powerPhrases + (extracted.extracted.powerPhrases || 0),
            transferableSkills: intelligenceExtracted.transferableSkills + (extracted.extracted.transferableSkills || 0),
            hiddenCompetencies: intelligenceExtracted.hiddenCompetencies + (extracted.extracted.hiddenCompetencies || 0)
          };
          setIntelligenceExtracted(newExtracted);

          if (extracted.extracted.powerPhrases > 0 || extracted.extracted.transferableSkills > 0) {
            toast({
              title: '✨ Intelligence Extracted',
              description: `Found ${extracted.extracted.powerPhrases} power phrases, ${extracted.extracted.transferableSkills} skills`,
            });
          }
        }
      }

      // Check if we need to move to next sub-question or next main question
      if (currentSubQuestionIndex < currentQuestion.questionsToExpand.length - 1) {
        // Move to next sub-question
        setCurrentSubQuestionIndex(currentSubQuestionIndex + 1);
        setUserInput('');
        setValidationFeedback('');
        setGuidedPrompts(null);
        setSkipAttempts(0);
        
        // Reset state for next sub-question
        const nextSubQuestion = currentQuestion.questionsToExpand[currentSubQuestionIndex + 1];
        if (nextSubQuestion?.answer_options) {
          setQuestionType('multiple_choice_with_custom');
          setAnswerOptions(nextSubQuestion.answer_options);
        } else if (nextSubQuestion?.question_type === 'star') {
          setQuestionType('star');
        } else {
          setQuestionType('text');
        }
        setSelectedOptions([]);
        setCustomAnswerText('');
        
        setIsValidating(false);
        return;
      }

      // All sub-questions answered, get next main question
      setIsLoading(true);
      setCurrentSubQuestionIndex(0);

      // Get user and confirmed skills for context
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      const { data: confirmedSkills } = await supabase
        .from('war_chest_confirmed_skills')
        .select('*')
        .eq('user_id', currentUser.id);

      const { data, error } = await supabase.functions.invoke('generate-interview-question', {
        body: {
          phase: currentPhase,
          previousResponse: userInput,
          generate_answer_options: true,
          confirmed_skills: confirmedSkills || []
        }
      });

      if (error) throw error;

      if (data?.isComplete) {
        setCompletionPercentage(100);
        toast({
          title: '🎉 Interview Complete!',
          description: 'Your War Chest has been built with rich career intelligence.'
        });
        setTimeout(onComplete, 2000);
        return;
      }

      if (data?.question) {
        setCurrentQuestion(data.question);
        setCurrentPhase(data.phase);
        setCompletionPercentage(data.completionPercentage);
        setUserInput('');
        setValidationFeedback('');
        setGuidedPrompts(null);
        setSkipAttempts(0);
        
        // Set question type for new question
        const firstSubQuestion = data.question.questionsToExpand[0];
        if (firstSubQuestion?.answer_options) {
          setQuestionType('multiple_choice_with_custom');
          setAnswerOptions(firstSubQuestion.answer_options);
        } else if (firstSubQuestion?.question_type === 'star') {
          setQuestionType('star');
        } else {
          setQuestionType('text');
        }
        setSelectedOptions([]);
        setCustomAnswerText('');
      }

    } catch (error) {
      console.error('Error processing response:', error);
      toast({
        title: 'Error',
        description: 'Failed to process response. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
      setIsValidating(false);
    }
  };

  const handleVoiceInput = (transcript: string) => {
    setUserInput(prev => prev + ' ' + transcript);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const handleApplyGuidedOptions = async (selectedOptions: string[]) => {
    if (!currentQuestion) return;
    
    const currentSubQuestion = currentQuestion.questionsToExpand[currentSubQuestionIndex];
    
    // Check if any non-skip option was selected
    const hasRealOptions = selectedOptions.some(opt => 
      !opt.toLowerCase().includes("don't remember") && 
      !opt.toLowerCase().includes("can't recall")
    );
    
    if (!hasRealOptions) {
      // User only selected "don't remember" options - treat as skip
      handleSkipGuidedPrompts();
      return;
    }

    const optionsText = selectedOptions.join('; ');
    const enhancedAnswer = `${userInput}\n\nAdditional context: ${optionsText}`;
    setUserInput(enhancedAnswer);
    setValidationFeedback('');
    setGuidedPrompts(null);
    
    toast({
      title: 'Details added',
      description: 'Revalidating your enhanced response...',
    });

    // Automatically revalidate the enhanced answer
    setIsValidating(true);
    try {
      const { data: validationData, error: validationError } = await supabase.functions.invoke(
        'validate-interview-response',
        {
          body: {
            question: currentSubQuestion.prompt,
            answer: enhancedAnswer
          }
        }
      );

      if (validationError) throw validationError;

      const validation = validationData as ValidationResult;
      setQualityScore(validation.quality_score);

      if (validation.is_sufficient && validation.quality_score >= 70) {
        // Good enough - save and proceed
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        if (warChestId) {
          await supabase
            .from('war_chest_interview_responses')
            .insert([{
              war_chest_id: warChestId,
              user_id: user.id,
              question: currentSubQuestion.prompt,
              response: enhancedAnswer,
              quality_score: validation.quality_score,
              validation_feedback: validation as any,
              phase: currentPhase,
            }]);
        }

        // Move to next question
        if (currentSubQuestionIndex < currentQuestion.questionsToExpand.length - 1) {
          setCurrentSubQuestionIndex(currentSubQuestionIndex + 1);
          
          // Reset state for next sub-question
          const nextSubQuestion = currentQuestion.questionsToExpand[currentSubQuestionIndex + 1];
          if (nextSubQuestion?.answer_options) {
            setQuestionType('multiple_choice_with_custom');
            setAnswerOptions(nextSubQuestion.answer_options);
          } else if (nextSubQuestion?.question_type === 'star') {
            setQuestionType('star');
          } else {
            setQuestionType('text');
          }
          setSelectedOptions([]);
          setCustomAnswerText('');
        } else {
          setCompletionPercentage(Math.min(100, completionPercentage + 10));
          const { data } = await supabase.functions.invoke('generate-interview-question', {
            body: { 
              phase: currentPhase,
              generate_answer_options: true
            }
          });
          if (data?.question) {
            setCurrentQuestion(data.question);
            setCurrentSubQuestionIndex(0);
            
            // Set question type for new question
            const firstSubQuestion = data.question.questionsToExpand[0];
            if (firstSubQuestion?.answer_options) {
              setQuestionType('multiple_choice_with_custom');
              setAnswerOptions(firstSubQuestion.answer_options);
            } else if (firstSubQuestion?.question_type === 'star') {
              setQuestionType('star');
            } else {
              setQuestionType('text');
            }
            setSelectedOptions([]);
            setCustomAnswerText('');
          }
        }

        setUserInput('');
        setQualityScore(0);
        toast({
          title: 'Great!',
          description: 'Your enhanced response looks good. Moving forward.',
        });
      } else {
        // Still needs improvement
        setValidationFeedback(validation.follow_up_prompt);
        if (validation.guided_prompts) {
          setGuidedPrompts(validation.guided_prompts);
        }
      }
    } catch (error) {
      console.error('Error revalidating:', error);
      toast({
        title: 'Error',
        description: 'Failed to validate enhanced response. Please try submitting again.',
        variant: 'destructive'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const fetchEnhancedAnswer = async (question: string, currentAnswer: string, validationFeedback: any) => {
    try {
      const { data } = await supabase.functions.invoke('update-strong-answer', {
        body: { question, currentAnswer, validationFeedback }
      });
      
      if (data?.enhanced_answer) {
        setEnhancedStrongAnswer(data.enhanced_answer);
      }
    } catch (error) {
      console.error('Error fetching enhanced answer:', error);
    }
  };

  const handleAcceptAndContinue = async () => {
    if (!currentQuestion || !warChestId) return;
    
    setIsLoading(true);
    const currentSubQuestion = currentQuestion.questionsToExpand[currentSubQuestionIndex];
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Format response based on question type
      let responseToSave = '';
      if (questionType === 'multiple_choice_with_custom') {
        const selectedText = selectedOptions.length > 0 ? selectedOptions.join('; ') : '';
        const customText = customAnswerText.trim();
        responseToSave = selectedText + (customText ? `\n\nAdditional details: ${customText}` : '');
      } else {
        responseToSave = userInput;
      }

      // Save the response
      await supabase
        .from('war_chest_interview_responses')
        .insert([{
          war_chest_id: warChestId,
          user_id: user.id,
          question: currentSubQuestion.prompt,
          response: responseToSave,
          quality_score: qualityScore,
          validation_feedback: validationFeedback as any,
          phase: currentPhase,
        }]);

      // Extract intelligence
      await supabase.functions.invoke('extract-war-chest-intelligence', {
        body: {
          war_chest_id: warChestId,
          response_text: responseToSave
        }
      });

      // Move to next question
      if (currentSubQuestionIndex < currentQuestion.questionsToExpand.length - 1) {
        setCurrentSubQuestionIndex(currentSubQuestionIndex + 1);
        
        // Reset state for next sub-question
        const nextSubQuestion = currentQuestion.questionsToExpand[currentSubQuestionIndex + 1];
        if (nextSubQuestion?.answer_options) {
          setQuestionType('multiple_choice_with_custom');
          setAnswerOptions(nextSubQuestion.answer_options);
        } else if (nextSubQuestion?.question_type === 'star') {
          setQuestionType('star');
          setAnswerOptions([]);
        } else {
          setQuestionType('text');
          setAnswerOptions([]);
        }
        setSelectedOptions([]);
        setCustomAnswerText('');
      } else {
        setCompletionPercentage(Math.min(100, completionPercentage + 10));
        const { data } = await supabase.functions.invoke('generate-interview-question', {
          body: { 
            phase: currentPhase,
            generate_answer_options: true,
            confirmed_skills: []
          }
        });
        if (data?.question) {
          setCurrentQuestion(data.question);
          setCurrentSubQuestionIndex(0);
          
          // Set question type for new question
          const firstSubQuestion = data.question.questionsToExpand[0];
          if (firstSubQuestion?.answer_options) {
            setQuestionType('multiple_choice_with_custom');
            setAnswerOptions(firstSubQuestion.answer_options);
          } else if (firstSubQuestion?.question_type === 'star') {
            setQuestionType('star');
          } else {
            setQuestionType('text');
          }
          setSelectedOptions([]);
          setCustomAnswerText('');
        }
      }

      setUserInput('');
      setQualityScore(0);
      setShowAcceptButton(false);
      setValidationFeedback('');
      setEnhancedStrongAnswer('');
      setSkipAttempts(0);
      
      toast({
        title: 'Saved!',
        description: 'Moving to next question.',
      });
    } catch (error) {
      console.error('Error saving response:', error);
      toast({
        title: 'Error',
        description: 'Failed to save response',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipRemainingSubQuestions = async () => {
    if (!currentQuestion) return;
    
    setIsLoading(true);
    try {
      setCompletionPercentage(Math.min(100, completionPercentage + 10));
      const { data } = await supabase.functions.invoke('generate-interview-question', {
        body: { phase: currentPhase }
      });
      
      if (data?.question) {
        setCurrentQuestion(data.question);
        setCurrentSubQuestionIndex(0);
        setUserInput('');
        setQualityScore(0);
        setShowAcceptButton(false);
        setValidationFeedback('');
        setGuidedPrompts(null);
        setSkipAttempts(0);
        
        // Reset state for new question type
        const firstSubQuestion = data.question.questionsToExpand[0];
        if (firstSubQuestion?.answer_options) {
          setQuestionType('multiple_choice_with_custom');
          setAnswerOptions(firstSubQuestion.answer_options);
        } else if (firstSubQuestion?.question_type === 'star') {
          setQuestionType('star');
          setAnswerOptions([]);
        } else {
          setQuestionType('text');
          setAnswerOptions([]);
        }
        setSelectedOptions([]);
        setCustomAnswerText('');
        
        toast({
          title: 'Skipped',
          description: 'Moving to next topic.',
        });
      }
    } catch (error) {
      console.error('Error skipping:', error);
      toast({
        title: 'Error',
        description: 'Failed to skip',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipGuidedPrompts = () => {
    const newSkipAttempts = skipAttempts + 1;
    setSkipAttempts(newSkipAttempts);
    setGuidedPrompts(null);
    
    if (newSkipAttempts >= 2) {
      // Allow progression
      handleSubmit();
    } else {
      toast({
        title: 'Noted',
        description: 'You can enhance this later. Click Submit to continue.',
      });
    }
  };

  if (!currentQuestion) {
    return (
      <Card className="p-6 flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Card>
    );
  }

  const totalQuestions = currentQuestion.questionsToExpand.length;
  const currentQuestionNum = currentSubQuestionIndex + 1;

  return (
    <div className="space-y-4">
      {/* Persona Selection & Voice Controls */}
      <Card className="p-5 bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <div className="p-2 bg-background rounded-full">
              <UserCircle className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Select Your AI Coach</p>
                <Select value={selectedPersona} onValueChange={(v) => setSelectedPersona(v as CoachPersona)}>
                  <SelectTrigger className="w-full sm:w-[240px] bg-background border-primary/20 hover:border-primary/40">
                    <SelectValue>
                      <span className="flex items-center gap-2">
                        <span className="text-lg">{personas[selectedPersona].icon}</span>
                        <span className="font-medium">{personas[selectedPersona].name}</span>
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-background border-primary/20">
                    {Object.entries(personas).map(([key, persona]) => (
                      <SelectItem key={key} value={key} className="cursor-pointer">
                        <div className="flex items-center gap-3 py-1">
                          <span className="text-xl">{persona.icon}</span>
                          <div>
                            <p className="font-medium">{persona.name}</p>
                            <p className="text-xs text-muted-foreground">{persona.description}</p>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                {personas[selectedPersona].description} • Questions will be spoken aloud
              </p>
            </div>
          </div>
          <Button
            variant={voiceEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className="gap-2 shrink-0"
          >
            {voiceEnabled ? (
              <>
                <Volume2 className="h-4 w-4" />
                Voice On
              </>
            ) : (
              <>
                <VolumeX className="h-4 w-4" />
                Voice Off
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Header with phase and progress */}
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="text-base py-2 px-4">
          {phaseLabels[currentPhase] || 'In Progress'}
        </Badge>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">
            {completionPercentage}% Complete
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Question {currentQuestionNum} of {totalQuestions}
          </div>
        </div>
      </div>

      <Progress value={completionPercentage} className="h-2" />

      {/* Intelligence counter */}
      {(intelligenceExtracted.powerPhrases > 0 || intelligenceExtracted.transferableSkills > 0) && (
        <Alert className="bg-primary/5 border-primary/20">
          <TrendingUp className="h-4 w-4" />
          <AlertDescription className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              {intelligenceExtracted.powerPhrases} Power Phrases
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {intelligenceExtracted.transferableSkills} Skills
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {intelligenceExtracted.hiddenCompetencies} Competencies
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Question display */}
      <Card className="p-6">
        {/* Prominent Play Question Button */}
        <div className="mb-4 flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{personas[selectedPersona].icon}</div>
            <div>
              <p className="font-semibold text-sm">
                {isPlayingAudio ? 'Speaking now...' : 'Click to hear the question'}
              </p>
              <p className="text-xs text-muted-foreground">
                {personas[selectedPersona].name} • {voiceEnabled ? 'Voice enabled' : 'Voice disabled'}
              </p>
            </div>
          </div>
          <Button
            onClick={() => playQuestionAudio(currentQuestion.questionsToExpand[currentSubQuestionIndex].prompt)}
            disabled={isPlayingAudio || !voiceEnabled}
            size="lg"
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            {isPlayingAudio ? (
              <>
                <Volume2 className="h-5 w-5 animate-pulse" />
                Speaking...
              </>
            ) : (
              <>
                <Volume2 className="h-5 w-5" />
                Play Question
              </>
            )}
          </Button>
        </div>
        
        <PreFilledQuestion
          context={currentQuestion.context}
          knownData={currentQuestion.knownData}
          singleQuestion={currentQuestion.questionsToExpand[currentSubQuestionIndex]}
          exampleAnswer={enhancedStrongAnswer || currentQuestion.exampleAnswer}
          questionNumber={currentQuestionNum}
          totalQuestions={totalQuestions}
        />

        {/* Accept and Continue - when quality >= 70 */}
        {showAcceptButton && qualityScore >= 70 && (
          <Alert className="mt-4 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <AlertDescription className="space-y-3">
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                ✅ {validationFeedback}
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={handleAcceptAndContinue}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Accept & Continue
                    </>
                  )}
                </Button>
                {qualityScore >= 80 && currentSubQuestionIndex < totalQuestions - 1 && (
                  <Button
                    onClick={handleSkipRemainingSubQuestions}
                    variant="outline"
                    className="gap-2"
                    disabled={isLoading}
                  >
                    Skip Remaining Sub-Questions
                  </Button>
                )}
                <Button
                  onClick={() => {
                    setShowAcceptButton(false);
                    setValidationFeedback('');
                    toast({
                      title: 'Continue editing',
                      description: 'Add more details to strengthen your answer further',
                    });
                  }}
                  variant="ghost"
                  className="gap-2"
                >
                  Add More Details
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Validation feedback */}
        {validationFeedback && !guidedPrompts && !showAcceptButton && (
          <>
            <Alert className="mt-4 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
              <AlertDescription className="text-sm">
                💡 {validationFeedback}
              </AlertDescription>
            </Alert>
            <Alert className="mt-2 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <AlertDescription className="text-sm font-medium flex items-center gap-2">
                <Mic className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-pulse" />
                Click the microphone to continue speaking and add more detail to your answer
              </AlertDescription>
            </Alert>
          </>
        )}

        {/* Guided Prompts Selector - only show when quality < 70 */}
        {guidedPrompts && !showAcceptButton && qualityScore < 70 && (
          <GuidedPromptSelector
            guidedPrompts={guidedPrompts}
            onApply={handleApplyGuidedOptions}
            onSkip={handleSkipGuidedPrompts}
            skipAttempts={skipAttempts}
          />
        )}

        {/* Quality score */}
        {qualityScore > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Response Quality:</span>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                  {qualityScore}/100
                </div>
                {qualityScore < 70 && (
                  <span className="text-xs px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                    Add more detail
                  </span>
                )}
                {qualityScore >= 70 && qualityScore < 90 && (
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                    Good progress
                  </span>
                )}
                {qualityScore >= 90 && (
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                    Excellent!
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="mt-6 space-y-3">
          {/* Checkbox-driven answers */}
          {questionType === 'multiple_choice_with_custom' && (
            <div className="space-y-4">
              <div className="space-y-3">
                {answerOptions.map((option, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => {
                      if (selectedOptions.includes(option)) {
                        setSelectedOptions(selectedOptions.filter(o => o !== option));
                      } else {
                        setSelectedOptions([...selectedOptions, option]);
                      }
                    }}
                  >
                    <Checkbox
                      checked={selectedOptions.includes(option)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedOptions([...selectedOptions, option]);
                        } else {
                          setSelectedOptions(selectedOptions.filter(o => o !== option));
                        }
                      }}
                      className="mt-0.5"
                    />
                    <Label className="flex-1 cursor-pointer leading-relaxed">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>

              {/* Custom input field */}
              <div className="border-t pt-4 space-y-2">
                <Label className="text-sm font-medium">
                  {currentQuestion.questionsToExpand[currentSubQuestionIndex]?.custom_input_prompt || 'Add other experiences:'}
                </Label>
                <Textarea
                  value={customAnswerText}
                  onChange={(e) => setCustomAnswerText(e.target.value)}
                  placeholder="Type additional details or use the microphone..."
                  className="min-h-[100px] resize-none"
                  disabled={isLoading || isValidating}
                />
                <div className="flex gap-2 justify-between items-center">
                  <VoiceInput
                    onTranscript={(text) => setCustomAnswerText(prev => prev + ' ' + text)}
                    isRecording={isRecording}
                    onToggleRecording={toggleRecording}
                    disabled={isLoading || isValidating}
                  />
                  <Button
                    onClick={handleSubmit}
                    disabled={(selectedOptions.length === 0 && !customAnswerText.trim()) || isLoading || isValidating}
                    className="gap-2"
                  >
                    {isValidating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Validating...
                      </>
                    ) : isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Submit Answer
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* STAR Story Builder */}
          {questionType === 'star' && (
            <STARStoryBuilder
              onComplete={(story) => {
                setUserInput(story);
                handleSubmit();
              }}
              resumeContext={resumeText}
              skillName={currentQuestion.questionsToExpand[currentSubQuestionIndex].prompt}
            />
          )}

          {/* Traditional text input */}
          {questionType === 'text' && (
            <>
              <Textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder={currentQuestion.questionsToExpand[currentSubQuestionIndex].placeholder}
                className="min-h-[120px] resize-none"
                disabled={isLoading || isValidating}
              />

              <div className="flex gap-2 justify-end">
                <VoiceInput
                  onTranscript={handleVoiceInput}
                  isRecording={isRecording}
                  onToggleRecording={toggleRecording}
                  disabled={isLoading || isValidating}
                />
                <Button
                  onClick={handleSubmit}
                  disabled={!userInput.trim() || isLoading || isValidating}
                  className="gap-2"
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Validating...
                    </>
                  ) : isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      {currentSubQuestionIndex < totalQuestions - 1 ? 'Next' : 'Continue'}
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};
