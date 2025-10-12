import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type JourneyState = 
  | 'getting-started' 
  | 'building-momentum' 
  | 'vault-complete-first-time' 
  | 'actively-deploying' 
  | 'interview-phase';

interface JourneyStateData {
  state: JourneyState;
  vaultCompletion: number;
  activeApplications: number;
  recentApplications: number;
  upcomingInterviews: number;
  celebrationSeen: boolean;
  isLoading: boolean;
}

export const useJourneyState = () => {
  const [data, setData] = useState<JourneyStateData>({
    state: 'getting-started',
    vaultCompletion: 0,
    activeApplications: 0,
    recentApplications: 0,
    upcomingInterviews: 0,
    celebrationSeen: false,
    isLoading: true,
  });

  useEffect(() => {
    fetchJourneyState();
  }, []);

  const fetchJourneyState = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all data in parallel
      const [vaultData, profileData, applicationsData, interviewsData, recentAppsData] = await Promise.all([
        supabase
          .from('career_vault')
          .select('interview_completion_percentage')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('profiles')
          .select('vault_completion_celebration_seen')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('application_tracking')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .in('status', ['pending', 'submitted']),
        supabase
          .from('job_projects')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .not('interview_date', 'is', null)
          .gte('interview_date', new Date().toISOString()),
        supabase
          .from('application_tracking')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      ]);

      const vaultCompletion = vaultData.data?.interview_completion_percentage || 0;
      const celebrationSeen = profileData.data?.vault_completion_celebration_seen || false;
      const activeApplications = applicationsData.count || 0;
      const upcomingInterviews = interviewsData.count || 0;
      const recentApplications = recentAppsData.count || 0;

      // Determine journey state
      let state: JourneyState = 'getting-started';
      
      if (upcomingInterviews > 0 && vaultCompletion === 100) {
        state = 'interview-phase';
      } else if (activeApplications > 0 || recentApplications > 0) {
        state = 'actively-deploying';
      } else if (vaultCompletion === 100 && !celebrationSeen) {
        state = 'vault-complete-first-time';
      } else if (vaultCompletion === 100) {
        state = 'actively-deploying';
      } else if (vaultCompletion >= 30) {
        state = 'building-momentum';
      }

      setData({
        state,
        vaultCompletion,
        activeApplications,
        recentApplications,
        upcomingInterviews,
        celebrationSeen,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching journey state:', error);
      setData(prev => ({ ...prev, isLoading: false }));
    }
  };

  const markCelebrationSeen = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('profiles')
      .update({ vault_completion_celebration_seen: true })
      .eq('user_id', user.id);

    setData(prev => ({ ...prev, celebrationSeen: true, state: 'actively-deploying' }));
  };

  return { ...data, refresh: fetchJourneyState, markCelebrationSeen };
};
