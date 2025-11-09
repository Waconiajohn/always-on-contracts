import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, Square, Trash2, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VoiceNoteRecorderProps {
  vaultId: string;
  prompt?: string;
  category?: string;
  onComplete?: (transcript: string) => void;
}

/**
 * VOICE NOTE RECORDER
 *
 * Simple voice recording component for executives to fill vault gaps
 * without typing lengthy answers.
 *
 * Features:
 * - Browser-based speech recognition (free, fast)
 * - Real-time transcription display
 * - AI processing to extract intelligence from transcript
 * - Auto-saves to vault
 */
export const VoiceNoteRecorder = ({
  vaultId,
  prompt = "Tell me about a significant achievement from your career",
  category,
  onComplete
}: VoiceNoteRecorderProps) => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [interimTranscript, setInterimTranscript] = useState('');

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    // Check browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast({
        title: 'Speech Recognition Not Supported',
        description: 'Your browser does not support voice recording. Please use Chrome, Edge, or Safari.',
        variant: 'destructive'
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('[VOICE-RECORDER] Speech recognition started');
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPiece = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcriptPiece + ' ';
        } else {
          interim += transcriptPiece;
        }
      }

      if (final) {
        setTranscript(prev => prev + final);
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: any) => {
      console.error('[VOICE-RECORDER] Speech recognition error:', event.error);

      if (event.error === 'no-speech') {
        toast({
          title: 'No speech detected',
          description: 'Please speak into your microphone',
        });
      } else if (event.error === 'not-allowed') {
        toast({
          title: 'Microphone access denied',
          description: 'Please allow microphone access to use voice recording',
          variant: 'destructive'
        });
      }
    };

    recognition.onend = () => {
      console.log('[VOICE-RECORDER] Speech recognition ended');
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
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const startRecording = () => {
    if (!recognitionRef.current) {
      toast({
        title: 'Speech Recognition Not Available',
        description: 'Please use a supported browser (Chrome, Edge, Safari)',
        variant: 'destructive'
      });
      return;
    }

    try {
      recognitionRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast({
        title: 'Recording Started',
        description: 'Start speaking...'
      });
    } catch (error) {
      console.error('[VOICE-RECORDER] Error starting recording:', error);
      toast({
        title: 'Error',
        description: 'Failed to start recording',
        variant: 'destructive'
      });
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    toast({
      title: 'Recording Stopped',
      description: `Captured ${transcript.split(' ').length} words`
    });
  };

  const clearRecording = () => {
    setTranscript('');
    setInterimTranscript('');
    setRecordingTime(0);
  };

  const handleSubmit = async () => {
    if (!transcript.trim()) {
      toast({
        title: 'No transcript',
        description: 'Please record something first',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Extract intelligence from voice transcript using AI
      const { data, error } = await supabase.functions.invoke('extract-vault-intangibles', {
        body: {
          responseText: transcript,
          questionText: prompt,
          vaultId,
        }
      });

      if (error) throw error;

      toast({
        title: 'Intelligence Extracted!',
        description: `Added ${data.totalExtracted} items to your vault from this voice note`,
      });

      if (onComplete) {
        onComplete(transcript);
      }

      // Clear the recording
      clearRecording();
    } catch (error) {
      console.error('[VOICE-RECORDER] Error processing transcript:', error);
      toast({
        title: 'Processing Error',
        description: 'Failed to extract intelligence from your response',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const wordCount = transcript.split(' ').filter(w => w.length > 0).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Voice Note
            </CardTitle>
            <CardDescription>
              Speak your answer instead of typing
            </CardDescription>
          </div>
          {category && (
            <Badge variant="outline">{category}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Prompt */}
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
          <p className="text-sm font-medium text-primary">{prompt}</p>
        </div>

        {/* Recording Status */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-3">
            {isRecording ? (
              <>
                <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">Recording...</span>
              </>
            ) : (
              <>
                <div className="h-3 w-3 bg-gray-300 rounded-full" />
                <span className="text-sm text-muted-foreground">Ready to record</span>
              </>
            )}
          </div>
          <div className="text-sm font-mono">
            {formatTime(recordingTime)}
          </div>
        </div>

        {/* Transcript Display */}
        {(transcript || interimTranscript) && (
          <div className="p-4 bg-muted/50 rounded-lg border min-h-[120px] max-h-[240px] overflow-y-auto">
            <p className="text-sm whitespace-pre-wrap">
              {transcript}
              {interimTranscript && (
                <span className="text-muted-foreground italic">{interimTranscript}</span>
              )}
            </p>
            {wordCount > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {wordCount} words
              </p>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          {!isRecording ? (
            <Button
              onClick={startRecording}
              className="flex-1"
              size="lg"
            >
              <Mic className="h-4 w-4 mr-2" />
              Start Recording
            </Button>
          ) : (
            <Button
              onClick={stopRecording}
              variant="destructive"
              className="flex-1"
              size="lg"
            >
              <Square className="h-4 w-4 mr-2" />
              Stop Recording
            </Button>
          )}

          {transcript && !isRecording && (
            <>
              <Button
                onClick={clearRecording}
                variant="outline"
                size="lg"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isProcessing}
                size="lg"
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Answer
                  </>
                )}
              </Button>
            </>
          )}
        </div>

        {/* Hints */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>💡 Tip: Speak naturally and include specific details like numbers, dates, team sizes</p>
          <p>💡 You can pause and continue - AI will extract intelligence when you submit</p>
        </div>
      </CardContent>
    </Card>
  );
};
