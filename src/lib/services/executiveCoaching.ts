import { supabase } from "@/integrations/supabase/client";

export type CoachPersona = 'robert' | 'sophia' | 'nexus';
export type IntensityLevel = 'basic' | 'moderate' | 'super_intensive';

interface CoachingSessionConfig {
  persona: CoachPersona;
  intensity: IntensityLevel;
  candidateContext: {
    currentTitle?: string;
    yearsExperience?: number;
    targetRole?: string;
    keySkills?: string[];
  };
}

export const COACH_PERSONAS = {
  robert: {
    name: "Robert Chen",
    role: "Executive Career Strategist",
    style: "Direct, results-oriented, focuses on quantifiable achievements",
    systemPrompt: `You are Robert Chen, a no-nonsense executive career strategist with 20+ years of experience. 
You focus on measurable results, leadership impact, and strategic thinking. 
You push candidates to quantify everything and think like executives.`
  },
  sophia: {
    name: "Sophia Martinez",
    role: "Leadership Development Coach",
    style: "Empathetic, narrative-driven, focuses on leadership stories",
    systemPrompt: `You are Sophia Martinez, an empathetic leadership coach who believes in the power of storytelling.
You help executives articulate their leadership journey and impact through compelling narratives.
You focus on emotional intelligence, team dynamics, and transformational leadership.`
  },
  nexus: {
    name: "Nexus AI",
    role: "Data-Driven Career Analyst",
    style: "Analytical, comprehensive, focuses on market trends and optimization",
    systemPrompt: `You are Nexus, an advanced AI career analyst with access to comprehensive market data.
You provide data-driven insights, industry trends, and optimization strategies.
You focus on ATS compatibility, keyword optimization, and competitive positioning.`
  }
};

/**
 * Generates a coaching response from the selected AI coach persona
 * @param config - Configuration for the coaching session including persona, intensity, and context
 * @param userMessage - The user's current message
 * @param conversationHistory - Array of previous messages in the conversation
 * @returns Promise<string> - The coach's response
 */
export async function generateCoachingResponse(
  config: CoachingSessionConfig,
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  sessionId?: string
): Promise<{ response: string; sessionId: string }> {
  
  try {
    // Enrich the system prompt with candidate context
    const contextualizedHistory = [
      ...conversationHistory
    ];

    const { data, error } = await supabase.functions.invoke('executive-coaching', {
      body: {
        sessionId,
        message: userMessage,
        coachPersonality: config.persona,
        intensityLevel: config.intensity,
        conversationHistory: contextualizedHistory,
        candidateContext: config.candidateContext
      }
    });

    if (error) {
      throw error;
    }

    if (!data.message) {
      throw new Error('No response from coaching service');
    }

    return {
      response: data.message,
      sessionId: data.sessionId
    };

  } catch (error) {
    console.error('Coaching response error:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Failed to generate coaching response'
    );
  }
}

/**
 * Get persona information for display purposes
 */
export function getPersonaInfo(persona: CoachPersona) {
  return COACH_PERSONAS[persona];
}

/**
 * Get all available coach personas
 */
export function getAllPersonas() {
  return Object.entries(COACH_PERSONAS).map(([key, value]) => ({
    id: key as CoachPersona,
    ...value
  }));
}
