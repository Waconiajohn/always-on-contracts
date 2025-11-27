import { supabase } from '@/integrations/supabase/client';

export interface LinkedInActionTelemetry {
  user_id: string;
  action_type: 'profile_section_accepted' | 'blog_post_used' | 'networking_message_sent' | 'series_generated';
  content_type: string; // e.g., 'headline', 'about', 'blog_post', 'connection_request'
  content_variant?: string; // e.g., 'direct', 'warm', 'brief'
  metadata: {
    // Only aggregate data - NO TEXT CONTENT
    hadWarnings?: boolean;
    atsKeywordCount?: number;
    characterLength?: number;
    wordCount?: number;
    seriesLength?: number;
    scenario?: string;
    [key: string]: any;
  };
}

export async function trackLinkedInAction(telemetry: LinkedInActionTelemetry) {
  try {
    // Validate: ensure no text content in metadata
    const hasTextContent = Object.values(telemetry.metadata).some(
      v => typeof v === 'string' && v.length > 50
    );
    
    if (hasTextContent) {
      console.warn('[Telemetry] Blocked: metadata contains potential text content');
      return;
    }

    // Add performance metadata
    const enrichedTelemetry = {
      ...telemetry,
      metadata: {
        ...telemetry.metadata,
        timestamp: Date.now(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
      },
      created_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('linkedin_usage_telemetry')
      .insert(enrichedTelemetry);
    
    if (error) {
      console.warn('[Telemetry] Failed to log:', error);
    } else {
      console.log('[Telemetry] Action tracked:', telemetry.action_type);
    }
  } catch (err) {
    // Never let telemetry break user experience
    console.warn('[Telemetry] Error:', err);
  }
}
