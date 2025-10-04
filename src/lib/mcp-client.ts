import { supabase } from "@/integrations/supabase/client";

/**
 * MCP Client Library
 * Provides reusable functions for calling MCP servers from frontend
 */

export interface MCPToolParams {
  [key: string]: any;
}

export interface MCPToolResponse {
  success?: boolean;
  data?: any;
  error?: string;
  [key: string]: any;
}

/**
 * Call an MCP tool via the orchestrator
 * @param action - Format: "server.tool" (e.g., "warchest.create")
 * @param params - Tool parameters
 */
export async function callMCPTool(
  action: string,
  params: MCPToolParams = {}
): Promise<MCPToolResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('orchestrator-agent', {
      body: {
        action,
        params
      }
    });

    if (error) {
      throw new Error(error.message || 'MCP call failed');
    }

    return data;
  } catch (error) {
    console.error(`MCP tool call error (${action}):`, error);
    throw error;
  }
}

/**
 * War Chest MCP Tools
 */
export const warChest = {
  create: async (resumeText?: string) => {
    return callMCPTool('warchest.create', { resumeText });
  },

  get: async () => {
    return callMCPTool('warchest.get', {});
  },

  addResponse: async (question: string, response: string, phase: string) => {
    return callMCPTool('warchest.add_response', {
      question,
      response,
      phase
    });
  },

  generateQuestion: async (phase: string, previousResponses?: any[]) => {
    return callMCPTool('warchest.generate_question', {
      phase,
      previousResponses
    });
  },

  getPowerPhrases: async () => {
    return callMCPTool('warchest.get_power_phrases', {});
  },

  getTransferableSkills: async () => {
    return callMCPTool('warchest.get_transferable_skills', {});
  },

  getHiddenCompetencies: async () => {
    return callMCPTool('warchest.get_hidden_competencies', {});
  }
};

/**
 * Persona Memory MCP Tools
 */
export const personaMemory = {
  remember: async (
    persona: 'robert' | 'sophia' | 'nexus',
    memoryType: 'fact' | 'preference' | 'goal' | 'concern' | 'progress' | 'mood',
    content: string,
    importance?: number
  ) => {
    return callMCPTool('persona-memory.remember', {
      persona,
      memoryType,
      content,
      importance
    });
  },

  recall: async (persona: 'robert' | 'sophia' | 'nexus', limit?: number) => {
    return callMCPTool('persona-memory.recall', {
      persona,
      limit
    });
  },

  handoff: async (
    fromPersona: 'robert' | 'sophia' | 'nexus',
    toPersona: 'robert' | 'sophia' | 'nexus',
    context: string
  ) => {
    return callMCPTool('persona-memory.handoff', {
      fromPersona,
      toPersona,
      context
    });
  },

  trackProgress: async (
    persona: 'robert' | 'sophia' | 'nexus',
    goal: string,
    progress: number,
    notes?: string
  ) => {
    return callMCPTool('persona-memory.track_progress', {
      persona,
      goal,
      progress,
      notes
    });
  },

  analyzeMood: async (
    persona: 'robert' | 'sophia' | 'nexus',
    conversationText: string
  ) => {
    return callMCPTool('persona-memory.analyze_mood', {
      persona,
      conversationText
    });
  }
};

/**
 * Health check for MCP servers
 */
export async function healthCheck(serverName: string): Promise<{ status: string }> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${serverName}/health`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        }
      }
    );

    if (!response.ok) {
      return { status: 'down' };
    }

    return await response.json();
  } catch (error) {
    console.error(`Health check failed for ${serverName}:`, error);
    return { status: 'down' };
  }
}
