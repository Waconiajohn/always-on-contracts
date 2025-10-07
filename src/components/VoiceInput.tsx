import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, AlertCircle, Volume2 } from "lucide-react";
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
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const recognitionRef = useRef<any>(null);
  const [interimTranscript, setInterimTranscript] = useState("");

  // Request microphone permission upfront
  useEffect(() => {
    const requestPermission = async () => {
      try {
        // Check if browser supports speech recognition
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
          setIsSupported(false);
          return;
        }

        // Request microphone permission
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop()); // Stop the test stream
        setPermissionGranted(true);
        
        console.log('[VOICE] Microphone permission granted');
      } catch (error: any) {
        console.error('[VOICE] Permission error:', error);
        setPermissionGranted(false);
        
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          toast({
            title: "Microphone Access Denied",
            description: "Please allow microphone access in your browser settings to use voice input.",
            variant: "destructive",
          });
        }
      }
    };

    requestPermission();
  }, [toast]);

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

    recognition.onstart = () => {
      console.log('[VOICE] Recording started');
      // Play a beep sound on start
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      oscillator.frequency.value = 800;
      oscillator.connect(audioContext.destination);
      oscillator.start();
      setTimeout(() => oscillator.stop(), 100);
    };

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
        console.log('[VOICE] Final transcript:', final);
        onTranscript(final);
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: any) => {
      console.error('[VOICE] Recognition error:', event.error);
      
      if (event.error === 'not-allowed') {
        setPermissionGranted(false);
        toast({
          title: "Microphone Access Denied",
          description: "Please allow microphone access to use voice input.",
          variant: "destructive",
        });
      } else if (event.error === 'no-speech') {
        toast({
          title: "No speech detected",
          description: "Please speak clearly into your microphone.",
        });
      } else {
        toast({
          title: "Voice input error",
          description: `Error: ${event.error}. Please try again.`,
          variant: "destructive",
        });
      }
      
      // Stop recording on error
      if (isRecording) {
        onToggleRecording();
      }
    };

    recognition.onend = () => {
      console.log('[VOICE] Recording ended');
      // Play a beep sound on stop
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      oscillator.frequency.value = 400;
      oscillator.connect(audioContext.destination);
      oscillator.start();
      setTimeout(() => oscillator.stop(), 100);
      
      if (isRecording) {
        // Restart if we're still supposed to be recording
        try {
          recognition.start();
        } catch (error) {
          console.error('[VOICE] Restart error:', error);
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [toast, isRecording, onToggleRecording]);

  useEffect(() => {
    if (!recognitionRef.current || permissionGranted === false) return;

    if (isRecording) {
      try {
        console.log('[VOICE] Starting recognition...');
        recognitionRef.current.start();
      } catch (error) {
        console.error('[VOICE] Start error:', error);
      }
    } else {
      try {
        console.log('[VOICE] Stopping recognition...');
        recognitionRef.current.stop();
        setInterimTranscript("");
      } catch (error) {
        console.error('[VOICE] Stop error:', error);
      }
    }
  }, [isRecording, permissionGranted]);

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

  if (permissionGranted === false) {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled
        title="Microphone access denied. Please allow in browser settings."
      >
        <MicOff className="h-4 w-4 text-destructive" />
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 relative z-10">
      <Button
        type="button"
        variant={isRecording ? "default" : "outline"}
        size="icon"
        onClick={onToggleRecording}
        disabled={disabled || permissionGranted === null}
        className={isRecording ? "bg-green-600 hover:bg-green-700 border-green-600 text-white animate-pulse" : ""}
        title={isRecording ? "Click to stop recording" : "Click to start voice input"}
      >
        {isRecording ? (
          <Mic className="h-4 w-4 text-white" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>
      {isRecording && (
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-1 h-3 bg-green-600 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
            <div className="w-1 h-4 bg-green-600 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
            <div className="w-1 h-3 bg-green-600 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
          </div>
          <Volume2 className="h-4 w-4 text-green-600 animate-pulse" />
          <span className="text-sm font-medium text-green-600">
            {interimTranscript ? `"${interimTranscript}"` : "Listening... Click mic to stop"}
          </span>
        </div>
      )}
    </div>
  );
};
