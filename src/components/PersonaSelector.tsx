import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Star, Volume2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { validateInput, invokeEdgeFunction, TextToSpeechSchema } from '@/lib/edgeFunction';

export interface Persona {
  id: string;
  name: string;
  description: string;
  voiceId?: string;
  writingStyle?: string;
  style?: string;
  emailTone?: string;
}

interface PersonaSelectorProps {
  personas: Persona[];
  recommendedPersona: string;
  reasoning: string;
  confidence: number;
  selectedPersona: string | null;
  onSelectPersona: (personaId: string) => void;
  agentType: 'resume' | 'interview' | 'networking';
}

export const PersonaSelector = ({
  personas,
  recommendedPersona,
  reasoning,
  confidence,
  selectedPersona,
  onSelectPersona,
  agentType
}: PersonaSelectorProps) => {
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);

  const getPersonaDetails = (persona: Persona) => {
    if (agentType === 'resume') return persona.writingStyle;
    if (agentType === 'interview') return persona.style;
    if (agentType === 'networking') return persona.emailTone;
    return persona.description;
  };

  const playVoicePreview = async (voiceId: string, personaId: string) => {
    setPlayingVoice(personaId);
    
    try {
      const sampleText = agentType === 'resume' 
        ? "Let me craft your executive summary with strategic impact."
        : "Here's how you should approach this interview question.";

      const validatedInput = validateInput(TextToSpeechSchema, {
        text: sampleText,
        voiceId
      });

      const { data, error } = await invokeEdgeFunction(
        supabase,
        'text-to-speech',
        validatedInput,
        { suppressErrorToast: true }
      );

      if (error) throw error;

      // Play audio
      const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
      audio.play();
      audio.onended = () => setPlayingVoice(null);
    } catch (error) {
      // Error already handled by invokeEdgeFunction (with suppressErrorToast)
      setPlayingVoice(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Recommendation */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3 mb-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Star className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold">AI Recommendation</h3>
                <Badge variant="outline" className="text-xs">
                  {confidence}% confident
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{reasoning}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Persona Selection */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Choose Your {agentType === 'resume' ? 'Writing' : agentType === 'interview' ? 'Coaching' : 'Networking'} Persona</h3>
        <div className="grid gap-3">
          {personas.map((persona) => {
            const isRecommended = persona.id === recommendedPersona;
            const isSelected = persona.id === selectedPersona;

            return (
              <Card
                key={persona.id}
                className={`cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : isRecommended
                    ? 'border-primary/50 bg-primary/[0.02]'
                    : 'hover:border-primary/30'
                }`}
                onClick={() => onSelectPersona(persona.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{persona.name}</h4>
                        {isRecommended && (
                          <Badge variant="secondary" className="text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Recommended
                          </Badge>
                        )}
                        {isSelected && (
                          <Check className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {persona.description}
                      </p>
                      <p className="text-xs text-muted-foreground italic">
                        {getPersonaDetails(persona)}
                      </p>
                    </div>

                    {persona.voiceId && agentType !== 'networking' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          playVoicePreview(persona.voiceId!, persona.id);
                        }}
                        disabled={playingVoice === persona.id}
                      >
                        <Volume2 className={`h-4 w-4 ${playingVoice === persona.id ? 'animate-pulse' : ''}`} />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
