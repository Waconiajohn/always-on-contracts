/**
 * Extraction Observability Service
 * Comprehensive tracking, logging, and debugging for vault extraction
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export interface ExtractionSession {
  id: string;
  vault_id: string;
  user_id: string;
  extraction_version: string;
  started_at: Date;
  ended_at: Date | null;
  status: 'running' | 'completed' | 'failed';
  metadata: Record<string, any>;
  final_data?: Record<string, any>;
}

export interface ExtractionEvent {
  id?: string;
  session_id: string;
  event_type: string;
  event_data: Record<string, any>;
  timestamp?: Date;
}

export interface AIResponseCapture {
  session_id: string;
  pass_type: string;
  prompt_version: string;
  model_used: string;
  raw_response: string;
  parsed_data: any;
  token_usage: { prompt: number; completion: number; total: number };
  latency_ms: number;
  ai_reasoning: string | null;
  confidence_score: number;
}

export interface ValidationLog {
  session_id: string;
  validation_type: string;
  passed: boolean;
  confidence: number;
  issues: ValidationIssue[];
  recommendations: string[];
}

export interface ValidationIssue {
  rule: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  suggestedFix?: string;
  metadata?: Record<string, any>;
}

export interface ExtractionReport {
  sessionId: string;
  duration: number;
  status: string;
  qualityMetrics: {
    averageConfidence: number;
    itemCounts: Record<string, number>;
    validationResults: any;
    resumeCoverage: number;
  };
  performance: {
    totalTokensUsed: number;
    totalCost: number;
    averageLatency: number;
    retryCount: number;
  };
  aiInsights: {
    modelsUsed: string[];
    promptVersions: string[];
    reasoning: Array<{ pass: string; reasoning: string }>;
  };
  issues: ValidationIssue[];
  recommendations: string[];
}

export class ExtractionObservability {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Start a new extraction session
   */
  async startSession(config: {
    vaultId: string;
    userId: string;
    extractionVersion?: string;
    metadata?: Record<string, any>;
  }): Promise<ExtractionSession> {
    const session: Partial<ExtractionSession> = {
      vault_id: config.vaultId,
      user_id: config.userId,
      extraction_version: config.extractionVersion || 'v3',
      started_at: new Date(),
      status: 'running',
      metadata: config.metadata || {},
    };

    const { data, error } = await this.supabase
      .from('extraction_sessions')
      .insert(session)
      .select()
      .single();

    if (error) {
      console.error('Failed to create extraction session:', error);
      throw new Error(`Failed to create extraction session: ${error.message}`);
    }

    console.log(`✅ Started extraction session: ${data.id}`);
    return data as ExtractionSession;
  }

  /**
   * Log an event during extraction
   */
  async logEvent(
    sessionId: string,
    eventType: string,
    eventData: Record<string, any> = {}
  ): Promise<void> {
    const event: Partial<ExtractionEvent> = {
      session_id: sessionId,
      event_type: eventType,
      event_data: eventData,
    };

    const { error } = await this.supabase
      .from('extraction_events')
      .insert(event);

    if (error) {
      console.error(`Failed to log event ${eventType}:`, error);
      // Don't throw - observability failures shouldn't crash extraction
    } else {
      console.log(`📝 Event logged: ${eventType}`, eventData);
    }
  }

  /**
   * Log progress update
   */
  async logProgress(
    sessionId: string,
    pass: string,
    progress: { stage: string; percent: number; message: string }
  ): Promise<void> {
    await this.logEvent(sessionId, 'progress_update', {
      pass,
      ...progress,
    });
  }

  /**
   * Capture AI response for analysis
   */
  async captureAIResponse(
    sessionId: string,
    passType: string,
    response: any,
    metadata: {
      promptVersion: string;
      model: string;
      latency: number;
    }
  ): Promise<void> {
    // Extract reasoning from response if available
    const aiReasoning = this.extractReasoningFromResponse(response);

    // Calculate confidence from parsed data
    const confidenceScore = this.calculateResponseConfidence(response.parsedData);

    const capture: Partial<AIResponseCapture> = {
      session_id: sessionId,
      pass_type: passType,
      prompt_version: metadata.promptVersion,
      model_used: metadata.model,
      raw_response: typeof response.raw === 'string' ? response.raw : JSON.stringify(response.raw || response),
      parsed_data: response.parsedData || response.data || {},
      token_usage: response.usage || { prompt: 0, completion: 0, total: 0 },
      latency_ms: metadata.latency,
      ai_reasoning: aiReasoning,
      confidence_score: confidenceScore,
    };

    const { error } = await this.supabase
      .from('ai_response_captures')
      .insert(capture);

    if (error) {
      console.error('Failed to capture AI response:', error);
    } else {
      console.log(`🤖 AI response captured for ${passType} (confidence: ${confidenceScore.toFixed(1)}%)`);
    }
  }

  /**
   * Log validation results
   */
  async logValidation(
    sessionId: string,
    validationType: string,
    result: {
      passed: boolean;
      confidence: number;
      issues: ValidationIssue[];
      recommendations: string[];
    }
  ): Promise<void> {
    const log: Partial<ValidationLog> = {
      session_id: sessionId,
      validation_type: validationType,
      passed: result.passed,
      confidence: result.confidence,
      issues: result.issues,
      recommendations: result.recommendations,
    };

    const { error } = await this.supabase
      .from('extraction_validation_logs')
      .insert(log);

    if (error) {
      console.error('Failed to log validation:', error);
    } else {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} Validation ${validationType}: ${result.confidence}% confidence`);
    }
  }

  /**
   * Save checkpoint for recovery
   */
  async saveCheckpoint(
    sessionId: string,
    phase: string,
    checkpointData: Record<string, any>
  ): Promise<void> {
    const checkpoint = {
      session_id: sessionId,
      phase,
      checkpoint_data: checkpointData,
    };

    const { error } = await this.supabase
      .from('extraction_checkpoints')
      .insert(checkpoint);

    if (error) {
      console.error('Failed to save checkpoint:', error);
    } else {
      console.log(`💾 Checkpoint saved: ${phase}`);
    }
  }

  /**
   * End extraction session
   */
  async endSession(
    sessionId: string,
    status: 'completed' | 'failed' = 'completed',
    finalData?: Record<string, any>
  ): Promise<void> {
    const { error } = await this.supabase
      .from('extraction_sessions')
      .update({
        ended_at: new Date().toISOString(),
        status,
        final_data: finalData || {},
      })
      .eq('id', sessionId);

    if (error) {
      console.error('Failed to end session:', error);
    } else {
      const emoji = status === 'completed' ? '✅' : '❌';
      console.log(`${emoji} Extraction session ended: ${status}`);
    }
  }

  /**
   * Generate comprehensive extraction report
   */
  async generateReport(sessionId: string): Promise<ExtractionReport> {
    // Fetch session
    const { data: session, error: sessionError } = await this.supabase
      .from('extraction_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // Fetch events
    const { data: events } = await this.supabase
      .from('extraction_events')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true });

    // Fetch AI responses
    const { data: aiResponses } = await this.supabase
      .from('ai_response_captures')
      .select('*')
      .eq('session_id', sessionId);

    // Fetch validation logs
    const { data: validations } = await this.supabase
      .from('extraction_validation_logs')
      .select('*')
      .eq('session_id', sessionId);

    // Calculate metrics
    const duration = session.ended_at
      ? new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()
      : Date.now() - new Date(session.started_at).getTime();

    const totalTokens = (aiResponses || []).reduce(
      (sum, r) => sum + (r.token_usage?.total || 0),
      0
    );

    const totalCost = this.calculateCost(aiResponses || []);

    const averageLatency = (aiResponses || []).length > 0
      ? (aiResponses || []).reduce((sum, r) => sum + (r.latency_ms || 0), 0) / aiResponses.length
      : 0;

    const retryCount = (events || []).filter(e =>
      e.event_type === 'retry_attempt' || e.event_type === 'recovery_attempted'
    ).length;

    const averageConfidence = (aiResponses || []).length > 0
      ? (aiResponses || []).reduce((sum, r) => sum + (r.confidence_score || 0), 0) / aiResponses.length
      : 0;

    // Collect all validation issues
    const allIssues = (validations || []).flatMap(v => v.issues || []);

    // Generate recommendations
    const recommendations = this.generateRecommendations(allIssues, session, aiResponses || []);

    return {
      sessionId,
      duration,
      status: session.status,
      qualityMetrics: {
        averageConfidence,
        itemCounts: session.final_data?.itemCounts || {},
        validationResults: validations || [],
        resumeCoverage: session.final_data?.resumeCoverage || 0,
      },
      performance: {
        totalTokensUsed: totalTokens,
        totalCost,
        averageLatency,
        retryCount,
      },
      aiInsights: {
        modelsUsed: [...new Set((aiResponses || []).map(r => r.model_used))],
        promptVersions: [...new Set((aiResponses || []).map(r => r.prompt_version))],
        reasoning: (aiResponses || [])
          .filter(r => r.ai_reasoning)
          .map(r => ({ pass: r.pass_type, reasoning: r.ai_reasoning })),
      },
      issues: allIssues,
      recommendations,
    };
  }

  /**
   * Extract AI reasoning from response
   */
  private extractReasoningFromResponse(response: any): string | null {
    if (response.parsedData?.aiReasoning) return response.parsedData.aiReasoning;
    if (response.parsedData?.reasoning) return response.parsedData.reasoning;
    if (response.data?.aiReasoning) return response.data.aiReasoning;
    if (response.data?.reasoning) return response.data.reasoning;
    return null;
  }

  /**
   * Calculate confidence score from parsed data
   */
  private calculateResponseConfidence(parsedData: any): number {
    if (!parsedData) return 0;

    // If there's an explicit confidence field
    if (typeof parsedData.confidence === 'number') return parsedData.confidence;
    if (typeof parsedData.confidenceScore === 'number') return parsedData.confidenceScore;

    // Calculate based on item confidence scores
    if (Array.isArray(parsedData)) {
      const scores = parsedData
        .map(item => item.confidence_score || item.confidenceScore || 0)
        .filter(score => score > 0);

      if (scores.length > 0) {
        return scores.reduce((sum, score) => sum + score, 0) / scores.length;
      }
    }

    // Default
    return 75;
  }

  /**
   * Calculate cost from AI responses
   */
  private calculateCost(aiResponses: any[]): number {
    // Simplified cost calculation (adjust based on actual pricing)
    const COST_PER_1K_TOKENS = 0.002; // Example: $0.002 per 1K tokens

    const totalTokens = aiResponses.reduce(
      (sum, r) => sum + (r.token_usage?.total || 0),
      0
    );

    return (totalTokens / 1000) * COST_PER_1K_TOKENS;
  }

  /**
   * Generate recommendations based on issues
   */
  private generateRecommendations(
    issues: ValidationIssue[],
    session: any,
    aiResponses: any[]
  ): string[] {
    const recommendations: string[] = [];

    const criticalIssues = issues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      recommendations.push(
        `Found ${criticalIssues.length} critical issues that should be addressed immediately.`
      );
    }

    const lowConfidenceResponses = aiResponses.filter(r => r.confidence_score < 70);
    if (lowConfidenceResponses.length > 0) {
      recommendations.push(
        `${lowConfidenceResponses.length} extraction passes had low confidence (<70%). Consider manual review.`
      );
    }

    if (session.final_data?.itemCounts?.powerPhrases < 5) {
      recommendations.push(
        'Low number of power phrases extracted. Resume may need more quantified achievements.'
      );
    }

    return recommendations;
  }
}

/**
 * Factory function to create observability service
 */
export function createObservabilityService(
  supabaseUrl: string,
  supabaseKey: string
): ExtractionObservability {
  return new ExtractionObservability(supabaseUrl, supabaseKey);
}
