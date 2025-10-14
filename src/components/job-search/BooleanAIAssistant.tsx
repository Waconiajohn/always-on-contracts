import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Sparkles, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface BooleanAIAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplySearch: (booleanString: string) => void;
}

export const BooleanAIAssistant = ({ open, onOpenChange, onApplySearch }: BooleanAIAssistantProps) => {
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your Boolean Search Assistant. I'll help you create a powerful search string to find your perfect job. Let's start simple - what job title are you looking for?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedSearch, setCopiedSearch] = useState<string | null>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) {
      console.log('[Boolean AI] Cannot send - input empty or loading:', { input, isLoading });
      return;
    }

    console.log('[Boolean AI] Sending message...');
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      console.log('[Boolean AI] Sending message:', userMessage);
      
      const { data, error } = await supabase.functions.invoke('generate-boolean-search', {
        body: { messages: [...messages, userMessage] }
      });

      console.log('[Boolean AI] Response:', { data, error });

      if (error) {
        console.error('[Boolean AI] Supabase error:', error);
        throw error;
      }

      if (data?.error) {
        console.error('[Boolean AI] Data error:', data.error);
        throw new Error(data.error);
      }

      if (!data?.reply) {
        console.error('[Boolean AI] No reply in data:', data);
        throw new Error('No reply received from AI');
      }

      const assistantMessage: Message = { role: 'assistant', content: data.reply };
      console.log('[Boolean AI] Adding assistant message:', assistantMessage);
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error: any) {
      console.error('[Boolean AI] Error in sendMessage:', error);
      toast({
        title: "Assistant error",
        description: error.message || "Failed to get response from AI assistant",
        variant: "destructive"
      });
      
      // Remove user message on error and restore input
      setMessages(prev => prev.slice(0, -1));
      setInput(userMessage.content);
    } finally {
      setIsLoading(false);
    }
  };

  const extractBooleanString = (content: string): string | null => {
    // Look for text in code blocks first (highest priority)
    const codeMatch = content.match(/```(?:text|sql|search)?\n(.*?)\n```/s);
    if (codeMatch) {
      const trimmed = codeMatch[1].trim();
      if (trimmed.includes('(') || trimmed.includes('"')) return trimmed;
    }

    // Look for text in quotes that has both operators AND parentheses/quotes (likely a boolean string)
    const quotedMatch = content.match(/"([^"]*\([^)]*\).*?)"/);
    if (quotedMatch) return quotedMatch[1];

    // Look for lines that START with operators or parentheses (actual boolean strings)
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      // Only match if it starts with parentheses or quotes and contains operators
      if (trimmed.length > 30 && trimmed.length < 500) {
        if ((trimmed.startsWith('(') || trimmed.startsWith('"') || trimmed.startsWith("'")) &&
            (trimmed.includes(' AND ') || trimmed.includes(' OR ') || trimmed.includes(' NOT '))) {
          return trimmed;
        }
      }
    }

    return null;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSearch(text);
    setTimeout(() => setCopiedSearch(null), 2000);
    toast({
      title: "Copied!",
      description: "Boolean search copied to clipboard"
    });
  };

  const handleApplySearch = (booleanString: string) => {
    onApplySearch(booleanString);
    onOpenChange(false);
    toast({
      title: "Search applied!",
      description: "Your boolean search has been set"
    });
  };

  const handleReset = () => {
    setMessages([{
      role: 'assistant',
      content: "Hi! I'm your Boolean Search Assistant. I'll help you create a powerful search string to find your perfect job. Let's start simple - what job title are you looking for?"
    }]);
    setInput('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col gap-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Boolean Search AI Assistant
          </DialogTitle>
          <DialogDescription>
            Answer a few questions and I'll build a powerful boolean search string for you
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 pr-4 -mr-4">
          <div ref={scrollRef} className="space-y-4 py-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  msg.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  
                  {/* If assistant message contains a boolean string, show action buttons */}
                  {msg.role === 'assistant' && extractBooleanString(msg.content) && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const booleanStr = extractBooleanString(msg.content);
                          if (booleanStr) copyToClipboard(booleanStr);
                        }}
                        className="flex-1"
                      >
                        {copiedSearch === extractBooleanString(msg.content) ? (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          const booleanStr = extractBooleanString(msg.content);
                          if (booleanStr) handleApplySearch(booleanStr);
                        }}
                        className="flex-1"
                      >
                        Use This Search
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2 pt-4 border-t">
          <Input
            placeholder="Type your answer..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            disabled={isLoading}
          />
          <Button onClick={sendMessage} disabled={isLoading || !input.trim()}>
            Send
          </Button>
          <Button variant="outline" onClick={handleReset} disabled={isLoading}>
            Reset
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
