import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, AlertCircle, Volume2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  isRecording: boolean;
  onToggleRecording: () => void;
  onRecordingStateChange?: (recording: boolean) => void;
  disabled?: boolean;
}

export const VoiceInput = ({ onTranscript, isRecording, onToggleRecording, onRecordingStateChange, disabled }: VoiceInputProps) => {
  const { toast } = useToast();
  const [isSupported, setIsSupported] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [micStatus, setMicStatus] = useState<'idle' | 'requesting' | 'recording' | 'error'>('idle');
  const recognitionRef = useRef<any>(null);
  const [interimTranscript, setInterimTranscript] = useState("");

  // PHASE 3 FIX: Explicit microphone permission request
  const requestMicPermission = async () => {
    setMicStatus('requesting');
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        setIsSupported(false);
        setMicStatus('error');
        return false;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissionGranted(true);
      setMicStatus('idle');

      logger.debug('Microphone permission granted');
      toast({
        title: "Microphone Ready",
        description: "Click the mic button to start recording",
      });
      return true;
    } catch (error: any) {
      logger.error('Voice input permission error', error);
      setPermissionGranted(false);
      setMicStatus('error');
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        toast({
          title: "Microphone Access Denied",
          description: "Please allow microphone access in your browser settings to use voice input.",
          variant: "destructive",
        });
      }
      return false;
    }
  };

  // Request permission on mount
  useEffect(() => {
    requestMicPermission();
  }, []);

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
      logger.debug('Voice recording started');
      setMicStatus('recording');
      onRecordingStateChange?.(true);
      
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
        logger.debug('Voice transcript received', { transcript: final });
        onTranscript(final);
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: any) => {
      logger.error('Voice recognition error', new Error(event.error));
      setMicStatus('error');
      onRecordingStateChange?.(false);
      
      if (event.error === 'not-allowed') {
        setPermissionGranted(false);
        toast({
          title: "Microphone Access Denied",
          description: "Please allow microphone access in browser settings.",
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
      logger.debug('Voice recording ended');
      setMicStatus('idle');
      onRecordingStateChange?.(false);
      
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
          setMicStatus('recording');
          recognition.start();
        } catch (error) {
          logger.error('Voice recognition restart error', error);
          setMicStatus('error');
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
        logger.debug('Starting voice recognition');
        recognitionRef.current.start();
      } catch (error) {
        logger.error('Voice recognition start error', error);
      }
    } else {
      try {
        logger.debug('Stopping voice recognition');
        recognitionRef.current.stop();
        setInterimTranscript("");
      } catch (error) {
        logger.error('Voice recognition stop error', error);
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

  // PHASE 3 FIX: Better visual feedback based on mic status
  const getButtonColor = () => {
    if (micStatus === 'recording') return "bg-green-600 hover:bg-green-700 border-green-600";
    if (micStatus === 'requesting') return "bg-yellow-500 hover:bg-yellow-600 border-yellow-500";
    if (micStatus === 'error') return "bg-red-500 hover:bg-red-600 border-red-500";
    return "";
  };

  return (
    <div className="flex items-center gap-2 relative">
      <Button
        type="button"
        variant={micStatus === 'recording' ? "default" : "outline"}
        size="icon"
        onClick={onToggleRecording}
        disabled={disabled || permissionGranted === null || micStatus === 'requesting'}
        className={`${getButtonColor()} ${micStatus === 'recording' ? 'animate-pulse' : ''}`}
        title={
          micStatus === 'requesting' ? "Requesting microphone access..." :
          micStatus === 'recording' ? "Click to stop recording" :
          micStatus === 'error' ? "Microphone error" :
          "Click to start voice input"
        }
      >
        {micStatus === 'requesting' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : micStatus === 'recording' ? (
          <Mic className="h-4 w-4 text-white" />
        ) : micStatus === 'error' ? (
          <MicOff className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>
      {micStatus === 'recording' && (
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
