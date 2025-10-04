import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  isRecording: boolean;
  onToggleRecording: () => void;
  disabled?: boolean;
}

export const VoiceInput = ({ onTranscript, isRecording, onToggleRecording, disabled }: VoiceInputProps) => {
  const { toast } = useToast();
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const [interimTranscript, setInterimTranscript] = useState("");

  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    // Initialize recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript + ' ';
        } else {
          interim += transcript;
        }
      }

      if (final) {
        onTranscript(final);
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        toast({
          title: "Microphone Access Denied",
          description: "Please allow microphone access to use voice input.",
          variant: "destructive",
        });
      }
      onToggleRecording();
    };

    recognition.onend = () => {
      if (isRecording) {
        // Restart if we're still supposed to be recording
        recognition.start();
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (!recognitionRef.current) return;

    if (isRecording) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting recognition:', error);
      }
    } else {
      try {
        recognitionRef.current.stop();
        setInterimTranscript("");
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
  }, [isRecording]);

  if (!isSupported) {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled
        title="Voice input requires Chrome, Edge, or Safari"
      >
        <AlertCircle className="h-4 w-4 text-muted-foreground" />
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant={isRecording ? "destructive" : "outline"}
        size="icon"
        onClick={onToggleRecording}
        disabled={disabled}
        className={isRecording ? "animate-pulse" : ""}
        title={isRecording ? "Stop recording" : "Start voice input"}
      >
        {isRecording ? (
          <MicOff className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>
      {isRecording && (
        <span className="text-xs text-muted-foreground animate-pulse">
          Listening{interimTranscript ? `: "${interimTranscript}"` : "..."}
        </span>
      )}
    </div>
  );
};
