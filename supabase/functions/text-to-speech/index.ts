import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VOICE_PERSONAS = {
  mentor: {
    voiceId: '9BWtsMINqrJLrRacOk9x', // Aria - warm, encouraging
    name: 'Sarah (The Mentor)',
    stability: 0.75,
    similarity_boost: 0.75,
  },
  challenger: {
    voiceId: 'IKne3meq5aSn9XLyUdCD', // Charlie - direct, demanding
    name: 'Charlie (The Challenger)',
    stability: 0.5,
    similarity_boost: 0.8,
  },
  strategist: {
    voiceId: 'pFZP5JQG7iQjIQuC4Bku', // Lily - analytical, precise
    name: 'Lily (The Strategist)',
    stability: 0.65,
    similarity_boost: 0.75,
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, persona = 'mentor' } = await req.json();

    if (!text) {
      throw new Error('Text is required');
    }

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY not configured');
    }

    const voiceConfig = VOICE_PERSONAS[persona as keyof typeof VOICE_PERSONAS] || VOICE_PERSONAS.mentor;
    console.log(`[TTS] Generating speech with ${voiceConfig.name} for text length:`, text.length);

    // Call ElevenLabs API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceConfig.voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: voiceConfig.stability,
            similarity_boost: voiceConfig.similarity_boost,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[TTS] ElevenLabs API error:', response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    // Convert audio to base64
    const audioBuffer = await response.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

    console.log('[TTS] Successfully generated audio, size:', audioBuffer.byteLength);

    return new Response(
      JSON.stringify({ 
        audioContent: base64Audio,
        persona: voiceConfig.name,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[TTS] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
