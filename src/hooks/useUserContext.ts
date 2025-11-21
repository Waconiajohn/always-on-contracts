import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface UserContext {
  userId: string | null;
  userName: string;
  vaultCompletion: number;
  activeApplications: number;
  upcomingInterviews: number;
  offers: number;
  loading: boolean;
}

export function useUserContext(): UserContext {
  const [context, setContext] = useState<UserContext>({
    userId: null,
    userName: "",
    vaultCompletion: 0,
    activeApplications: 0,
    upcomingInterviews: 0,
    offers: 0,
    loading: true
  });

  useEffect(() => {
    fetchContext();
  }, []);

  const fetchContext = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setContext(prev => ({ ...prev, loading: false }));
        return;
      }

      // 1. User Profile
      const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || "Professional";

      // 2. Vault Stats
      const { data: vault } = await supabase
        .from('career_vault')
        .select('review_completion_percentage')
        .eq('user_id', user.id)
        .single();

      // 3. Applications Stats (Count by status)
      let activeAppsCount = 0;
      let interviewsCount = 0;
      let offersCount = 0;

      try {
        // Query application_queue for general stats
        const { count: apps } = await supabase
          .from('application_queue')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .neq('status', 'rejected');
        
        if (apps !== null) activeAppsCount = apps;

        // For interviews and offers, we might need to check specific status values
        // Assuming 'interview' or 'offer' might be part of the status string
        const { count: interviews } = await supabase
          .from('application_queue')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .ilike('status', '%interview%');

        if (interviews !== null) interviewsCount = interviews;
        
        const { count: offers } = await supabase
            .from('application_queue')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .ilike('status', '%offer%');
            
        if (offers !== null) offersCount = offers;

      } catch (e) {
        console.warn("Could not fetch application stats, using defaults", e);
      }

      setContext({
        userId: user.id,
        userName,
        vaultCompletion: vault?.review_completion_percentage || 0,
        activeApplications: activeAppsCount,
        upcomingInterviews: interviewsCount,
        offers: offersCount,
        loading: false
      });

    } catch (error) {
      console.error("Error fetching user context:", error);
      setContext(prev => ({ ...prev, loading: false }));
    }
  };

  return context;
}
