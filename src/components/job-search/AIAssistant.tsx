import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VoiceInput } from "@/components/VoiceInput";
import { Brain, Send } from "lucide-react";
import { useRef, useEffect } from "react";

interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AIAssistantProps {
  messages: AIMessage[];
  input: string;
  setInput: (input: string) => void;
  isTyping: boolean;
  isRecording: boolean;
  onSendMessage: () => void;
  onVoiceTranscript: (text: string) => void;
  onToggleRecording: () => void;
}

export const AIAssistant = ({
  messages,
  input,
  setInput,
  isTyping,
  isRecording,
  onSendMessage,
  onVoiceTranscript,
  onToggleRecording,
}: AIAssistantProps) => {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <Card className="p-6 flex flex-col h-[calc(100vh-300px)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 rounded-full bg-primary/10">
          <Brain className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h2 className="font-semibold">Search Assistant</h2>
          <p className="text-sm text-muted-foreground">AI co-pilot</p>
        </div>
      </div>

      <ScrollArea className="flex-1 pr-4 mb-4">
        <div className="space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground ml-8'
                  : 'bg-muted mr-8'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          ))}
          {isTyping && (
            <div className="bg-muted p-3 rounded-lg mr-8">
              <p className="text-sm text-muted-foreground">Typing...</p>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </ScrollArea>

      <div className="space-y-2">
        <div className="relative">
          <Textarea
            placeholder="Ask about jobs, skills, or your search..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            className="pr-12 resize-none"
            rows={3}
          />
          <div className="absolute right-2 bottom-2">
            <VoiceInput
              onTranscript={onVoiceTranscript}
              onToggleRecording={onToggleRecording}
              isRecording={isRecording}
            />
          </div>
        </div>
        <Button onClick={onSendMessage} disabled={!input.trim() || isTyping} className="w-full">
          <Send className="h-4 w-4 mr-2" />
          Send Message
        </Button>
      </div>
    </Card>
  );
};
