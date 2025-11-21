/**
 * Resume Builder Analytics & Telemetry
 */

import { supabase } from '@/integrations/supabase/client';

export interface AnalyticsEvent {
  event_type: string;
  event_data: Record<string, any>;
  user_id?: string;
  session_id: string;
  timestamp: number;
}

class ResumeAnalytics {
  private sessionId: string;
  private events: AnalyticsEvent[] = [];
  private flushInterval: number = 30000; // 30 seconds
  private maxBatchSize: number = 50;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startAutoFlush();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private startAutoFlush() {
    setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  /**
   * Track an event
   */
  async track(eventType: string, eventData: Record<string, any> = {}) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const event: AnalyticsEvent = {
        event_type: eventType,
        event_data: eventData,
        user_id: user?.id,
        session_id: this.sessionId,
        timestamp: Date.now()
      };

      this.events.push(event);

      // Log to console in development
      if (import.meta.env.DEV) {
        console.log('[Analytics]', eventType, eventData);
      }

      // Flush if batch is full
      if (this.events.length >= this.maxBatchSize) {
        await this.flush();
      }
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }

  /**
   * Flush events to backend
   */
  async flush() {
    if (this.events.length === 0) return;

    const eventsToSend = [...this.events];
    this.events = [];

    try {
      // Send to analytics endpoint (implement backend if needed)
      // For now, just log
      if (import.meta.env.DEV) {
        console.log('[Analytics] Flushing', eventsToSend.length, 'events');
      }

      // Could send to Supabase table or external analytics service
      // await supabase.from('analytics_events').insert(eventsToSend);
    } catch (error) {
      console.error('Failed to flush analytics:', error);
      // Restore events on failure
      this.events.unshift(...eventsToSend);
    }
  }

  // Predefined event tracking methods

  trackWizardStep(step: string, metadata: Record<string, any> = {}) {
    return this.track('wizard_step_view', { step, ...metadata });
  }

  trackJobAnalysis(metadata: Record<string, any>) {
    return this.track('job_analysis_complete', metadata);
  }

  trackVaultMatch(metadata: Record<string, any>) {
    return this.track('vault_match_complete', metadata);
  }

  trackFormatSelection(format: string, metadata: Record<string, any> = {}) {
    return this.track('format_selected', { format, ...metadata });
  }

  trackGenerationStart(mode: 'full' | 'section-by-section', metadata: Record<string, any> = {}) {
    return this.track('generation_start', { mode, ...metadata });
  }

  trackSectionGeneration(sectionType: string, metadata: Record<string, any>) {
    return this.track('section_generated', { section_type: sectionType, ...metadata });
  }

  trackVersionSelection(version: 'ideal' | 'personalized' | 'blended', metadata: Record<string, any> = {}) {
    return this.track('version_selected', { version, ...metadata });
  }

  trackError(errorType: string, errorMessage: string, metadata: Record<string, any> = {}) {
    return this.track('error_occurred', {
      error_type: errorType,
      error_message: errorMessage,
      ...metadata
    });
  }

  trackRetry(operation: string, attempt: number, metadata: Record<string, any> = {}) {
    return this.track('retry_attempt', { operation, attempt, ...metadata });
  }

  trackExport(format: string, metadata: Record<string, any> = {}) {
    return this.track('resume_exported', { export_format: format, ...metadata });
  }

  trackResumeComplete(metadata: Record<string, any>) {
    return this.track('resume_complete', metadata);
  }
}

// Export singleton instance
export const analytics = new ResumeAnalytics();

// Timing utilities
export class GenerationTimer {
  private startTime: number;
  private sectionType: string;
  private metadata: Record<string, any>;

  constructor(sectionType: string, metadata: Record<string, any> = {}) {
    this.startTime = Date.now();
    this.sectionType = sectionType;
    this.metadata = metadata;
  }

  async complete(additionalMetadata: Record<string, any> = {}) {
    const duration = Date.now() - this.startTime;
    await analytics.trackSectionGeneration(this.sectionType, {
      duration_ms: duration,
      ...this.metadata,
      ...additionalMetadata
    });
    return duration;
  }

  async fail(error: Error, operation: string) {
    const duration = Date.now() - this.startTime;
    await analytics.trackError('generation_failed', error.message, {
      section_type: this.sectionType,
      operation,
      duration_ms: duration,
      ...this.metadata
    });
  }
}

// Helper functions for common tracking patterns
export const trackVersionSelection = (version: 'ideal' | 'personalized' | 'blend', metadata: Record<string, any> = {}) => {
  return analytics.trackVersionSelection(version as 'ideal' | 'personalized' | 'blended', metadata);
};

export const trackSectionComplete = (sectionType: string, metadata: Record<string, any> = {}) => {
  return analytics.track('section_complete', { section_type: sectionType, ...metadata });
};

export const calculateVaultStrength = (vaultMatches: any[]): number => {
  if (!vaultMatches || vaultMatches.length === 0) return 0;

  const tierWeights: Record<string, number> = {
    gold: 1.0,
    silver: 0.8,
    bronze: 0.6,
    assumed: 0.4
  };

  const totalScore = vaultMatches.reduce((sum, match) => {
    const tierWeight = tierWeights[match.qualityTier] || 0.4;
    const freshnessMultiplier = (match.freshnessScore || 50) / 100;
    const matchMultiplier = (match.matchScore || 50) / 100;

    return sum + (tierWeight * freshnessMultiplier * matchMultiplier);
  }, 0);

  return Math.min(100, Math.round((totalScore / vaultMatches.length) * 100));
};
