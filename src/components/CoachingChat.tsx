import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { personaMemory } from "@/lib/mcp-client";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface CoachingChatProps {
  coachPersonality: string;
  onBack: () => void;
}

export function CoachingChat({ coachPersonality, onBack }: CoachingChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const coachNames: Record<string, string> = {
    robert: 'Robert',
    sophia: 'Sophia',
    nexus: 'Nexus'
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Load persona memories
        const memories = await personaMemory.recall(coachPersonality as 'robert' | 'sophia' | 'nexus', 10);
        console.log(`Loaded ${memories.data?.length || 0} memories for ${coachPersonality}`);

        // Load existing session for this coach
        const { data: sessions, error } = await supabase
          .from('agent_sessions')
          .select('*')
          .eq('coach_personality', coachPersonality)
          .eq('status', 'active')
          .order('last_accessed', { ascending: false })
          .limit(1);

        if (error) throw error;

        if (sessions && sessions.length > 0) {
          const session = sessions[0];
          setSessionId(session.id);
          
          // Load conversation history
          const config = session.configuration as any;
          const history = config?.conversationHistory || [];
          if (history.length > 0) {
            setMessages(history);
            return;
          }
        }

        // If no session or history, send initial greeting with context from memories
        const greetings: Record<string, string> = {
          robert: "Hello, I'm Robert. I'm here to help you position yourself strategically for your next executive role. What brings you here today?",
          sophia: "Hi there, I'm Sophia. I help executives like you develop authentic narratives that resonate. What would you like to work on?",
          nexus: "Greetings, I'm Nexus. I use data-driven insights to optimize your career strategy. What can I analyze for you today?"
        };
        
        setMessages([{ 
          role: 'assistant', 
          content: greetings[coachPersonality] || greetings.robert 
        }]);

      } catch (error) {
        console.error('Error loading session:', error);
        toast.error("Failed to load previous conversation");
      }
    };

    loadSession();
  }, [coachPersonality]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('executive-coaching', {
        body: {
          sessionId,
          message: userMessage,
          coachPersonality,
          intensityLevel: 'moderate',
          conversationHistory: messages
        }
      });

      if (error) throw error;

      setSessionId(data.sessionId);
      const assistantMessage = data.message;
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: assistantMessage 
      }]);

      // Store important memories from the conversation
      try {
        // Analyze user message for key information
        if (userMessage.toLowerCase().includes('goal') || userMessage.toLowerCase().includes('want to')) {
          await personaMemory.remember(
            coachPersonality as 'robert' | 'sophia' | 'nexus',
            'goal',
            userMessage,
            8
          );
        } else if (userMessage.toLowerCase().includes('concern') || userMessage.toLowerCase().includes('worried')) {
          await personaMemory.remember(
            coachPersonality as 'robert' | 'sophia' | 'nexus',
            'concern',
            userMessage,
            7
          );
        } else {
          // Store as general fact
          await personaMemory.remember(
            coachPersonality as 'robert' | 'sophia' | 'nexus',
            'fact',
            userMessage,
            5
          );
        }

        // Track progress if relevant
        if (userMessage.toLowerCase().includes('completed') || userMessage.toLowerCase().includes('finished')) {
          await personaMemory.trackProgress(
            coachPersonality as 'robert' | 'sophia' | 'nexus',
            'Session task',
            100,
            userMessage
          );
        }
      } catch (memoryError) {
        console.error('Error storing memory:', memoryError);
        // Don't fail the whole message if memory storage fails
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="h-[calc(100vh-12rem)]">
      <CardHeader className="flex flex-row items-center gap-4 border-b">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <CardTitle>Coaching with {coachNames[coachPersonality]}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Your AI career strategist
          </p>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex flex-col h-[calc(100%-5rem)]">
        <ScrollArea className="flex-1 p-6" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message... (Shift+Enter for new line)"
              className="min-h-[60px] resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-[60px] w-[60px]"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
