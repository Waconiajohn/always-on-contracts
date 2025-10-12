import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

type ActivityType = 'resume' | 'application' | 'match' | 'interview' | 'profile' | 'vault';

/**
 * Logs user activity to track engagement and populate activity feed
 */
export const logActivity = async (
  activityType: ActivityType,
  description: string,
  metadata?: Record<string, any>
): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('user_activities')
      .insert({
        user_id: user.id,
        activity_type: activityType,
        activity_description: description,
        metadata: metadata || {},
      });

    if (error) {
      logger.error('Failed to log activity', error);
    }
  } catch (error) {
    logger.error('Error logging activity', error);
  }
};

/**
 * Convenience functions for common activities
 */
export const activityLogger = {
  resume: {
    customized: (jobTitle: string) => 
      logActivity('resume', `Resume customized for ${jobTitle}`),
    optimized: () => 
      logActivity('resume', 'Resume optimized and updated'),
    generated: (type: string) => 
      logActivity('resume', `New ${type} resume generated`),
  },
  
  application: {
    submitted: (jobTitle: string, company: string) => 
      logActivity('application', `Applied to ${jobTitle} at ${company}`),
    queued: (jobTitle: string) => 
      logActivity('application', `${jobTitle} added to application queue`),
    reviewed: (count: number) => 
      logActivity('application', `Reviewed ${count} application${count !== 1 ? 's' : ''}`),
  },
  
  match: {
    found: (count: number) => 
      logActivity('match', `${count} new job match${count !== 1 ? 'es' : ''} found`),
    scored: (jobTitle: string, score: number) => 
      logActivity('match', `Matched ${score}% with ${jobTitle}`),
  },
  
  interview: {
    scheduled: (jobTitle: string, company: string) => 
      logActivity('interview', `Interview scheduled: ${jobTitle} at ${company}`),
    prepared: (jobTitle: string) => 
      logActivity('interview', `Interview prep completed for ${jobTitle}`),
    completed: (jobTitle: string) => 
      logActivity('interview', `Interview completed for ${jobTitle}`),
  },
  
  profile: {
    updated: () => 
      logActivity('profile', 'Profile information updated'),
    skillsAdded: (count: number) => 
      logActivity('profile', `Added ${count} new skill${count !== 1 ? 's' : ''} to profile`),
  },
  
  vault: {
    completed: () => 
      logActivity('vault', 'Career Vault completed at 100%'),
    progressUpdate: (percentage: number) => 
      logActivity('vault', `Career Vault progress: ${percentage}%`),
    skillsConfirmed: (count: number) => 
      logActivity('vault', `Confirmed ${count} skill${count !== 1 ? 's' : ''} in vault`),
  },
};
