import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { VoiceInput } from './VoiceInput';

interface Message {
  role: 'ai' | 'user';
  content: string;
  timestamp: Date;
}

interface WarChestInterviewProps {
  onComplete: () => void;
}

export const WarChestInterview = ({ onComplete }: WarChestInterviewProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<string>('discovery');
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const phaseLabels: Record<string, string> = {
    discovery: 'Discovery',
    deep_dive: 'Deep Dive',
    skills: 'Skills & Strengths',
    goals: 'Future Goals'
  };

  useEffect(() => {
    startInterview();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startInterview = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-interview-question', {
        body: { phase: 'discovery', isFirst: true }
      });

      if (error) throw error;

      if (data?.question) {
        setMessages([{
          role: 'ai',
          content: data.question,
          timestamp: new Date()
        }]);
        setCurrentPhase(data.phase || 'discovery');
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
    if (!userInput.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: userInput,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-interview-question', {
        body: {
          phase: currentPhase,
          previousResponse: userInput,
          conversationHistory: messages
        }
      });

      if (error) throw error;

      if (data?.isComplete) {
        setCompletionPercentage(100);
        toast({
          title: 'Interview Complete!',
          description: 'Your War Chest is being built...'
        });
        setTimeout(onComplete, 2000);
        return;
      }

      if (data?.question) {
        setMessages(prev => [...prev, {
          role: 'ai',
          content: data.question,
          timestamp: new Date()
        }]);
        
        if (data.phase) setCurrentPhase(data.phase);
        if (data.completionPercentage) setCompletionPercentage(data.completionPercentage);
      }
    } catch (error) {
      console.error('Error in interview:', error);
      toast({
        title: 'Error',
        description: 'Failed to process response. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = (transcript: string) => {
    setUserInput(prev => prev + ' ' + transcript);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="secondary">
          {phaseLabels[currentPhase] || 'In Progress'}
        </Badge>
        <span className="text-sm text-muted-foreground">
          {completionPercentage}% Complete
        </span>
      </div>

      <Progress value={completionPercentage} className="h-2" />

      <Card className="p-6 h-[500px] flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <span className="text-xs opacity-70 mt-2 block">
                  {msg.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-4">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex gap-2">
          <Textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Type your response... (Shift+Enter for new line)"
            className="min-h-[60px] resize-none"
            disabled={isLoading}
          />
          <div className="flex flex-col gap-2">
            <VoiceInput
              onTranscript={handleVoiceInput}
              isRecording={isRecording}
              onToggleRecording={toggleRecording}
              disabled={isLoading}
            />
            <Button
              size="icon"
              onClick={handleSubmit}
              disabled={!userInput.trim() || isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
