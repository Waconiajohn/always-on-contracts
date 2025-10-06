import { supabase } from '@/integrations/supabase/client';

/**
 * Syncs confirmed skills from War Chest to user profile
 * This ensures the profile always reflects the latest confirmed skills
 */
export const syncWarChestSkillsToProfile = async (userId: string): Promise<void> => {
  try {
    // Get confirmed skills from War Chest
    const { data: confirmedSkills } = await supabase
      .from('war_chest_confirmed_skills')
      .select('skill_name')
      .eq('user_id', userId);

    if (!confirmedSkills || confirmedSkills.length === 0) {
      console.log('No confirmed skills found to sync');
      return;
    }

    // Extract skill names
    const skillNames = confirmedSkills.map(s => s.skill_name);

    // Update profile with confirmed skills
    const { error } = await supabase
      .from('profiles')
      .update({ 
        core_skills: skillNames,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error syncing skills to profile:', error);
      throw error;
    }

    console.log(`Synced ${skillNames.length} skills to profile`);
  } catch (error) {
    console.error('Failed to sync War Chest skills to profile:', error);
    throw error;
  }
};

/**
 * Gets War Chest completion status for a user
 */
export const getWarChestStatus = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('career_war_chest')
      .select('interview_completion_percentage, overall_strength_score')
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    return {
      completionPercentage: data?.interview_completion_percentage || 0,
      strengthScore: data?.overall_strength_score || 0,
      isComplete: (data?.interview_completion_percentage || 0) === 100
    };
  } catch (error) {
    console.error('Error getting War Chest status:', error);
    return {
      completionPercentage: 0,
      strengthScore: 0,
      isComplete: false
    };
  }
};
