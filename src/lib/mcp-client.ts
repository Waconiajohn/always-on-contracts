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
 * @param action - Format: "server.tool" (e.g., "vault.create")
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
 * Career Vault MCP Tools
 */
export const careerVault = {
  create: async (resumeText?: string) => {
    return callMCPTool('vault.create', { resumeText });
  },

  get: async () => {
    return callMCPTool('vault.get', {});
  },

  addResponse: async (question: string, response: string, phase: string) => {
    return callMCPTool('vault.add_response', {
      question,
      response,
      phase
    });
  },

  generateQuestion: async (phase: string, previousResponses?: any[]) => {
    return callMCPTool('vault.generate_question', {
      phase,
      previousResponses
    });
  },

  getPowerPhrases: async () => {
    return callMCPTool('vault.get_power_phrases', {});
  },

  getTransferableSkills: async () => {
    return callMCPTool('vault.get_transferable_skills', {});
  },

  getHiddenCompetencies: async () => {
    return callMCPTool('vault.get_hidden_competencies', {});
  }
};

/**
 * Research Agent MCP Tools
 */
export const research = {
  scanSources: async (sources: string[]) => {
    return callMCPTool('research.scan_sources', { sources });
  },

  analyzeTrends: async (timeframe?: string, category?: string) => {
    return callMCPTool('research.analyze_trends', { timeframe, category });
  },

  createExperiment: async (
    name: string,
    description: string,
    hypothesis: string,
    controlVariant: string,
    testVariant: string
  ) => {
    return callMCPTool('research.create_experiment', {
      name,
      description,
      hypothesis,
      control_variant: controlVariant,
      test_variant: testVariant
    });
  },

  trackResults: async (experimentId: string, userId: string, outcome: any) => {
    return callMCPTool('research.track_results', {
      experimentId,
      userId,
      outcome
    });
  },

  getActiveExperiments: async () => {
    return callMCPTool('research.get_active_experiments', {});
  }
};

/**
 * Resume Intelligence MCP Tools
 */
export const resume = {
  analyze: async (userId: string, resumeText: string) => {
    return callMCPTool('resume.analyze_resume', { userId, resumeText });
  },

  matchToJob: async (userId: string, jobDescription: string) => {
    return callMCPTool('resume.match_to_job', { userId, jobDescription });
  },

  optimizeKeywords: async (userId: string, targetRole: string, industry?: string) => {
    return callMCPTool('resume.optimize_keywords', { userId, targetRole, industry });
  },

  generateVariants: async (userId: string, targetJobs: any[]) => {
    return callMCPTool('resume.generate_variants', { userId, targetJobs });
  }
};

/**
 * Application Automation MCP Tools
 */
export const application = {
  evaluateOpportunity: async (userId: string, opportunityId: string, matchScore: number) => {
    return callMCPTool('application.evaluate_opportunity', {
      userId,
      opportunityId,
      matchScore
    });
  },

  autoApply: async (userId: string, opportunityId: string, customizedResumeUrl?: string) => {
    return callMCPTool('application.auto_apply', {
      userId,
      opportunityId,
      customizedResumeUrl
    });
  },

  addToQueue: async (userId: string, opportunityId: string, matchScore: number, aiNotes?: string) => {
    return callMCPTool('application.add_to_queue', {
      userId,
      opportunityId,
      matchScore,
      aiNotes
    });
  },

  trackApplication: async (userId: string, opportunityId: string, status: string) => {
    return callMCPTool('application.track_application', {
      userId,
      opportunityId,
      status
    });
  },

  getDailyStats: async (userId: string) => {
    return callMCPTool('application.get_daily_stats', { userId });
  }
};

/**
 * Interview Prep MCP Tools
 */
export const interview = {
  generateQuestions: async (userId: string, jobDescription: string, interviewType?: string) => {
    return callMCPTool('interview.generate_questions', { userId, jobDescription, interviewType });
  },

  validateResponse: async (question: string, response: string, context?: any) => {
    return callMCPTool('interview.validate_response', { question, response, context });
  },

  buildStarStory: async (userId: string, situation?: string, task?: string, action?: string, result?: string) => {
    return callMCPTool('interview.build_star_story', { userId, situation, task, action, result });
  },

  getStarStories: async (userId: string) => {
    return callMCPTool('interview.get_star_stories', { userId });
  },

  mockInterview: async (userId: string, jobDescription: string, sessionType?: string) => {
    return callMCPTool('interview.mock_interview', { userId, jobDescription, sessionType });
  }
};

/**
 * Agency Matcher MCP Tools
 */
export const agency = {
  matchAgencies: async (userId: string, targetRoles?: string[], industries?: string[], location?: string) => {
    return callMCPTool('agency.match_agencies', { userId, targetRoles, industries, location });
  },

  getAgencyInsights: async (agencyId: string) => {
    return callMCPTool('agency.get_agency_insights', { agencyId });
  },

  trackOutreach: async (userId: string, agencyId: string, outreachType: string, notes?: string) => {
    return callMCPTool('agency.track_outreach', { userId, agencyId, outreachType, notes });
  },

  getOutreachHistory: async (userId: string) => {
    return callMCPTool('agency.get_outreach_history', { userId });
  },

  rateAgency: async (userId: string, agencyId: string, rating: number, reviewText?: string) => {
    return callMCPTool('agency.rate_agency', { userId, agencyId, rating, reviewText });
  }
};

/**
 * Networking Orchestrator MCP Tools
 */
export const networking = {
  generateEmail: async (userId: string, recipientRole: string, context: string, templateType?: string) => {
    return callMCPTool('networking.generate_email', { userId, recipientRole, context, templateType });
  },

  scheduleFollowUp: async (userId: string, contactInfo: any, followUpDate: string, notes?: string) => {
    return callMCPTool('networking.schedule_follow_up', { userId, contactInfo, followUpDate, notes });
  },

  trackInteraction: async (userId: string, contactName: string, interactionType: string, notes?: string, outcome?: string) => {
    return callMCPTool('networking.track_interaction', { userId, contactName, interactionType, notes, outcome });
  },

  getTemplates: async (userId: string, templateType?: string) => {
    return callMCPTool('networking.get_templates', { userId, templateType });
  },

  saveTemplate: async (userId: string, templateName: string, templateType: string, content: string) => {
    return callMCPTool('networking.save_template', { userId, templateName, templateType, content });
  }
};

/**
 * Market Intelligence MCP Tools
 */
export const market = {
  getMarketRates: async (role: string, location?: string, yearsExperience?: number) => {
    return callMCPTool('market.get_market_rates', { role, location, yearsExperience });
  },

  analyzeTrends: async (industry: string, timeframe?: string, metrics?: string[]) => {
    return callMCPTool('market.analyze_trends', { industry, timeframe, metrics });
  },

  getSalaryInsights: async (userId: string, targetRole: string, targetIndustry?: string) => {
    return callMCPTool('market.get_salary_insights', { userId, targetRole, targetIndustry });
  },

  compareOffers: async (offers: any[]) => {
    return callMCPTool('market.compare_offers', { offers });
  },

  getCompetitivePosition: async (userId: string) => {
    return callMCPTool('market.get_competitive_position', { userId });
  }
};

/**
 * Job Scraper MCP Tools
 */
export const jobScraper = {
  scrapeJobs: async (query: string, location?: string, sources?: string[], maxResults?: number) => {
    return callMCPTool('jobs.scrape_jobs', { query, location, sources, maxResults });
  },

  monitorJobs: async (userId: string, searchCriteria: any, frequency?: string) => {
    return callMCPTool('jobs.monitor_jobs', { userId, searchCriteria, frequency });
  },

  enrichJob: async (jobId: string, companyName?: string) => {
    return callMCPTool('jobs.enrich_job', { jobId, companyName });
  },

  deduplicateJobs: async (sessionId: string) => {
    return callMCPTool('jobs.deduplicate_jobs', { sessionId });
  },

  getScrapeStatus: async (sessionId: string) => {
    return callMCPTool('jobs.get_scrape_status', { sessionId });
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
