import { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, ArrowLeft, User, Bot } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CoachingChatProps {
  coachPersonality: string;
  onBack: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const COACH_PERSONALITIES = {
  robert: {
    name: 'Robert',
    role: 'Strategic Career Coach',
    systemPrompt: 'You are Robert, a strategic career coach who provides direct, actionable advice. You challenge assumptions and push for excellence while being supportive.'
  },
  sophia: {
    name: 'Sophia',
    role: 'Empathetic Career Mentor',
    systemPrompt: 'You are Sophia, an empathetic career mentor who builds confidence through understanding. You validate feelings while guiding toward growth.'
  },
  nexus: {
    name: 'Nexus',
    role: 'AI Career Strategist',
    systemPrompt: 'You are Nexus, an advanced AI career strategist. You provide data-driven insights and innovative strategies for career advancement.'
  }
};

export function CoachingChat({ coachPersonality, onBack }: CoachingChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const coach = COACH_PERSONALITIES[coachPersonality as keyof typeof COACH_PERSONALITIES] || COACH_PERSONALITIES.robert;

  useEffect(() => {
    loadPersonaMemories();
    initializeSession();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadPersonaMemories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: memories } = await supabase
        .from('persona_memories')
        .select('*')
        .eq('user_id', user.id)
        .eq('persona_id', coachPersonality)
        .order('importance', { ascending: false })
        .limit(5);

      if (memories && memories.length > 0) {
        const welcomeMessage = `Welcome back! I remember our previous conversations about ${memories.map(m => m.content.substring(0, 50)).join(', ')}... How can I help you today?`;
        setMessages([{
          role: 'assistant',
          content: welcomeMessage,
          timestamp: new Date()
        }]);
      } else {
        setMessages([{
          role: 'assistant',
          content: `Hello! I'm ${coach.name}, your ${coach.role}. How can I support your career journey today?`,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Error loading memories:', error);
    }
  };

  const initializeSession = () => {
    setSessionId(`session_${Date.now()}`);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const { data, error } = await supabase.functions.invoke('executive-coaching', {
        body: {
          message: input,
          conversationHistory,
          sessionId,
          config: {
            persona: coachPersonality,
            intensity: 'balanced',
            focus_area: 'general'
          }
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Store important exchanges in persona memories
      await storeMemory(input, data.response);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const storeMemory = async (userInput: string, assistantResponse: string) => {
    // Store if either input OR response is substantial
    if (userInput.length < 20 && assistantResponse.length < 50) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('persona_memories').insert({
        user_id: user.id,
        persona_id: coachPersonality,
        memory_type: 'coaching_exchange',
        content: JSON.stringify({
          user: userInput,
          coach: assistantResponse.slice(0, 500),
          timestamp: new Date().toISOString()
        }),
        importance: assistantResponse.length > 200 ? 8 : 5
      });
    } catch (error) {
      console.error('Error storing memory:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="h-[calc(100vh-200px)] flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <CardTitle>{coach.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{coach.role}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-4">
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`rounded-lg px-4 py-3 max-w-[80%] ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {message.role === 'user' && (
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="rounded-lg px-4 py-3 bg-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <div className="flex gap-2">
            <Textarea
              placeholder="Type your message... (Shift+Enter for new line)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              rows={2}
              className="resize-none"
            />
            <Button 
              onClick={sendMessage} 
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-auto"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
