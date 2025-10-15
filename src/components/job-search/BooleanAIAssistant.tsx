import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Copy, Check, RotateCcw, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BooleanStringPreview } from "./BooleanStringPreview";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  suggestions?: {
    type: 'titles' | 'skills' | 'exclude' | 'levels';
    options: string[];
  };
}

interface BooleanAIAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplySearch: (booleanString: string) => void;
}

export const BooleanAIAssistant = ({ open, onOpenChange, onApplySearch }: BooleanAIAssistantProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your Boolean Search Assistant. I'll help you create a powerful search string. Let's start - what job title are you looking for?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedSearch, setCopiedSearch] = useState<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading) return;

    const userMessage: Message = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-boolean-search', {
        body: { messages: [...messages, userMessage] }
      });

      if (error) throw error;

      if (data?.reply) {
        console.log('[BooleanAI] Raw AI response:', data.reply);
        const parsedMessage = parseAIResponse(data.reply);
        console.log('[BooleanAI] Parsed message:', parsedMessage);
        setMessages(prev => [...prev, parsedMessage]);
      }
    } catch (error) {
      console.error('Error generating boolean search:', error);
      toast.error('Failed to generate response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Parse AI response for structured suggestions
  const parseAIResponse = (content: string): Message => {
    const message: Message = { role: 'assistant', content };

    console.log('[BooleanAI] Parsing content:', content);

    // Check for [TITLES: ...] pattern
    const titlesMatch = content.match(/\[TITLES:\s*([^\]]+)\]/);
    if (titlesMatch) {
      console.log('[BooleanAI] Found TITLES:', titlesMatch[1]);
      const options = titlesMatch[1].split(',').map(s => s.trim());
      message.suggestions = { type: 'titles', options };
    }

    // Check for [SKILLS: ...] pattern
    const skillsMatch = content.match(/\[SKILLS:\s*([^\]]+)\]/);
    if (skillsMatch) {
      console.log('[BooleanAI] Found SKILLS:', skillsMatch[1]);
      const options = skillsMatch[1].split(',').map(s => s.trim());
      message.suggestions = { type: 'skills', options };
    }

    // Check for [EXCLUDE: ...] pattern
    const excludeMatch = content.match(/\[EXCLUDE:\s*([^\]]+)\]/);
    if (excludeMatch) {
      console.log('[BooleanAI] Found EXCLUDE:', excludeMatch[1]);
      const options = excludeMatch[1].split(',').map(s => s.trim());
      message.suggestions = { type: 'exclude', options };
    }

    // Check for [LEVELS: ...] pattern
    const levelsMatch = content.match(/\[LEVELS:\s*([^\]]+)\]/);
    if (levelsMatch) {
      console.log('[BooleanAI] Found LEVELS:', levelsMatch[1]);
      const options = levelsMatch[1].split(',').map(s => s.trim());
      message.suggestions = { type: 'levels', options };
    }

    console.log('[BooleanAI] Final parsed suggestions:', message.suggestions);

    return message;
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const extractBooleanString = (msgs: Message[]): string | null => {
    // Look through messages in reverse for [BOOLEAN: ...] marker
    for (let i = msgs.length - 1; i >= 0; i--) {
      const msg = msgs[i];
      if (msg.role === 'assistant') {
        const booleanMatch = msg.content.match(/\[BOOLEAN:\s*([^\]]+)\]/);
        if (booleanMatch) return booleanMatch[1].trim();

        // Fallback: Look for text in code blocks
        const codeMatch = msg.content.match(/```(?:text|sql|search)?\n(.*?)\n```/s);
        if (codeMatch) {
          const trimmed = codeMatch[1].trim();
          if (trimmed.includes('(') || trimmed.includes('"')) return trimmed;
        }

        // Look for lines with boolean operators
        const lines = msg.content.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.length > 30 && trimmed.length < 500) {
            if ((trimmed.startsWith('(') || trimmed.startsWith('"') || trimmed.startsWith("'")) &&
                (trimmed.includes(' AND ') || trimmed.includes(' OR ') || trimmed.includes(' NOT '))) {
              return trimmed;
            }
          }
        }
      }
    }
    return null;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSearch(text);
    setTimeout(() => setCopiedSearch(null), 2000);
    toast.success('Boolean search copied to clipboard!');
  };

  const handleApplySearch = () => {
    const booleanString = extractBooleanString(messages);
    if (booleanString) {
      onApplySearch(booleanString);
      onOpenChange(false);
      toast.success('Boolean search applied! Check the Advanced Filters section.', {
        duration: 4000,
      });
    }
  };

  const handleReset = () => {
    setMessages([{
      role: 'assistant',
      content: "Hi! I'm your Boolean Search Assistant. I'll help you create a powerful search string. Let's start - what job title are you looking for?"
    }]);
    setInput('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Boolean Search AI Assistant
          </DialogTitle>
          <DialogDescription>
            Let's build a powerful boolean search string together - just answer a few questions!
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0 gap-4">
          <div className="flex-1 overflow-y-auto border rounded-lg p-4 space-y-4 bg-muted/20">
            {messages.map((message, index) => (
              <div key={index} className="space-y-2">
                <div
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`rounded-lg px-4 py-2 max-w-[80%] ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="text-xs font-medium">AI Assistant</span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap text-sm">
                      {message.content.replace(/\[TITLES:.*?\]|\[SKILLS:.*?\]|\[EXCLUDE:.*?\]|\[LEVELS:.*?\]|\[BOOLEAN:.*?\]/g, '').trim()}
                    </p>
                    
                    {message.role === 'assistant' && extractBooleanString([message]) && (
                      <div className="mt-3 space-y-2">
                        <BooleanStringPreview booleanString={extractBooleanString([message])!} />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(extractBooleanString([message])!)}
                            className="flex-1"
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            {copiedSearch === extractBooleanString([message]) ? 'Copied!' : 'Copy'}
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleApplySearch}
                            className="flex-1"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Use This Search
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Render clickable suggestions with proper keys to prevent shaking */}
                {message.suggestions && (
                  <div className="flex flex-wrap gap-2 px-2">
                    {message.suggestions.options.map((option) => (
                      <Badge
                        key={`${message.suggestions?.type}-${option}`}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all hover:scale-105 active:scale-95"
                        onClick={() => handleSuggestionClick(option)}
                      >
                        {option}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-card border rounded-lg px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Type your answer or click a suggestion above..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              disabled={isLoading}
              className="flex-1"
            />
            <Button onClick={() => sendMessage()} disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={isLoading}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
