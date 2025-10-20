/**
 * Analytics tracking for resume generation events
 * Stores events in Supabase for analysis and monitoring
 */

import { supabase } from "@/integrations/supabase/client";

export type GenerationEvent =
  | 'generation_started'
  | 'generation_completed'
  | 'generation_failed'
  | 'research_completed'
  | 'ideal_generated'
  | 'personalized_generated'
  | 'version_selected'
  | 'section_completed'
  | 'resume_exported';

export interface EventMetadata {
  // Generation context
  section_type?: string;
  section_id?: string;
  job_title?: string;
  industry?: string;

  // Generation results
  vault_items_used?: number;
  vault_strength?: number;
  generation_time_ms?: number;

  // User choices
  version_chosen?: 'ideal' | 'personalized' | 'custom';
  edited?: boolean;

  // Error details
  error_message?: string;
  error_operation?: string;

  // ATS/Quality metrics
  ats_match_score?: number;
  content_length?: number;

  // Export details
  export_format?: 'pdf' | 'docx' | 'json';
}

/**
 * Track a generation event
 */
export const trackGenerationEvent = async (
  event: GenerationEvent,
  metadata: EventMetadata = {}
): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.warn('Cannot track event: user not authenticated');
      return;
    }

    await supabase.from('resume_generation_analytics').insert({
      user_id: user.id,
      event_type: event,
      metadata
    } as any);
  } catch (error) {
    // Don't throw - analytics should never break the app
    console.error('Failed to track event:', error);
  }
};

/**
 * Track generation timing (start to finish)
 */
export class GenerationTimer {
  private startTime: number;
  private section_type: string;
  private metadata: EventMetadata;

  constructor(section_type: string, metadata: EventMetadata = {}) {
    this.startTime = Date.now();
    this.section_type = section_type;
    this.metadata = metadata;
  }

  async complete(additionalMetadata: EventMetadata = {}) {
    const generation_time_ms = Date.now() - this.startTime;

    await trackGenerationEvent('generation_completed', {
      ...this.metadata,
      ...additionalMetadata,
      section_type: this.section_type,
      generation_time_ms
    });
  }

  async fail(error: Error, error_operation: string) {
    const generation_time_ms = Date.now() - this.startTime;

    await trackGenerationEvent('generation_failed', {
      ...this.metadata,
      section_type: this.section_type,
      generation_time_ms,
      error_message: error.message,
      error_operation
    });
  }
}

/**
 * Track user selection between ideal and personalized versions
 */
export const trackVersionSelection = async (
  version: 'ideal' | 'personalized' | 'custom',
  context: {
    section_type: string;
    vault_items_used: number;
    vault_strength?: number;
    ats_match_score?: number;
  }
): Promise<void> => {
  await trackGenerationEvent('version_selected', {
    version_chosen: version,
    ...context
  });
};

/**
 * Track section completion
 */
export const trackSectionComplete = async (
  section_type: string,
  metadata: {
    edited: boolean;
    content_length: number;
    vault_items_used: number;
  }
): Promise<void> => {
  await trackGenerationEvent('section_completed', {
    section_type,
    ...metadata
  });
};

/**
 * Track resume export
 */
export const trackResumeExport = async (
  format: 'pdf' | 'docx' | 'json',
  metadata: {
    sections_completed: number;
    total_sections: number;
    job_title?: string;
  }
): Promise<void> => {
  await trackGenerationEvent('resume_exported', {
    export_format: format,
    ...metadata
  });
};

/**
 * Calculate vault strength score
 * Returns 0-100 based on quality of Career Vault data
 */
export const calculateVaultStrength = (vaultItems: any[]): number => {
  if (vaultItems.length === 0) return 0;

  let score = 0;
  let maxScore = 0;

  vaultItems.forEach(item => {
    // Each item can contribute up to 10 points
    maxScore += 10;

    // Has content (2 points)
    if (item.content && item.content.trim().length > 0) {
      score += 2;
    }

    // Not assumed data (3 points)
    if (!item.isAssumed) {
      score += 3;
    }

    // Has quantified results (3 points)
    if (item.content && /\d+[%$M]/.test(item.content)) {
      score += 3;
    }

    // Has reasonable length (2 points)
    if (item.content && item.content.length > 50) {
      score += 2;
    }
  });

  return Math.min(100, Math.round((score / maxScore) * 100));
};
