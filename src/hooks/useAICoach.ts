import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AICoachContext {
  type: 'bullet' | 'question' | 'gap' | 'general';
  itemId?: string;
  positionId?: string;
  currentText: string;
  targetRole?: string;
  gapDetails?: any;
}

export type CoachingType = 'improve' | 'quantify' | 'expand';

export const useAICoach = (resumeId: string) => {
  const [isOpen, setIsOpen] = useState(false);
  const [context, setContext] = useState<AICoachContext | null>(null);
  const [suggestion, setSuggestion] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentCoachingType, setCurrentCoachingType] = useState<CoachingType>('improve');
  const { toast } = useToast();

  const openCoach = async (
    contextData: AICoachContext,
    coachingType: CoachingType = 'improve'
  ) => {
    setContext(contextData);
    setCurrentCoachingType(coachingType);
    setIsOpen(true);
    setIsLoading(true);
    setSuggestion('');

    try {
      const { data, error } = await supabase.functions.invoke('ai-coach', {
        body: { 
          resumeId, 
          context: contextData, 
          coachingType 
        }
      });

      if (error) throw error;
      
      if (data?.success) {
        setSuggestion(data.suggestedText);
      } else {
        throw new Error('Failed to get AI suggestion');
      }
    } catch (error: any) {
      console.error('AI Coach error:', error);
      toast({
        title: "AI Coach Error",
        description: error?.message || "Failed to get suggestion",
        variant: "destructive"
      });
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const switchCoachingType = async (newType: CoachingType) => {
    if (!context) return;
    
    setCurrentCoachingType(newType);
    setIsLoading(true);
    setSuggestion('');

    try {
      const { data, error } = await supabase.functions.invoke('ai-coach', {
        body: { 
          resumeId, 
          context, 
          coachingType: newType 
        }
      });

      if (error) throw error;
      
      if (data?.success) {
        setSuggestion(data.suggestedText);
      }
    } catch (error: any) {
      console.error('AI Coach error:', error);
      toast({
        title: "AI Coach Error",
        description: error?.message || "Failed to get suggestion",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const acceptSuggestion = async (onAccept: (text: string) => void) => {
    if (!context || !suggestion) return;

    try {
      // Update coaching history
      await supabase.functions.invoke('ai-coach', {
        body: {
          resumeId,
          context: { ...context, action: 'accept' },
          coachingType: currentCoachingType
        }
      });

      onAccept(suggestion);
      setIsOpen(false);
      setSuggestion('');
      setContext(null);

      toast({
        title: "Success",
        description: "AI suggestion applied"
      });
    } catch (error) {
      console.error('Error accepting suggestion:', error);
    }
  };

  const rejectSuggestion = () => {
    setIsOpen(false);
    setSuggestion('');
    setContext(null);
  };

  return {
    isOpen,
    setIsOpen,
    openCoach,
    switchCoachingType,
    acceptSuggestion,
    rejectSuggestion,
    suggestion,
    isLoading,
    context,
    currentCoachingType
  };
};
