import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ModuleId, TIER_MODULES, getModulesForTier } from "@/config/modules";

export interface ModuleAccessState {
  quick_score: boolean;
  resume_jobs_studio: boolean;
  career_vault: boolean;
  linkedin_pro: boolean;
  interview_mastery: boolean;
}

interface UseModuleAccessReturn {
  modules: ModuleAccessState;
  loading: boolean;
  hasModule: (moduleId: ModuleId) => boolean;
  tier: string | null;
  refetch: () => Promise<void>;
}

const DEFAULT_ACCESS: ModuleAccessState = {
  quick_score: true, // Always free
  resume_jobs_studio: false,
  career_vault: false,
  linkedin_pro: false,
  interview_mastery: false,
};

export function useModuleAccess(): UseModuleAccessReturn {
  const { user } = useAuth();
  const [modules, setModules] = useState<ModuleAccessState>(DEFAULT_ACCESS);
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState<string | null>(null);

  const fetchAccess = async () => {
    if (!user) {
      setModules(DEFAULT_ACCESS);
      setTier(null);
      setLoading(false);
      return;
    }

    try {
      // First check subscription tier from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('user_id', user.id)
        .single();

      const subscriptionTier = profile?.subscription_tier || 'free';
      setTier(subscriptionTier);

      // Get modules from tier
      const tierModules = getModulesForTier(subscriptionTier as keyof typeof TIER_MODULES);

      // Also check module_access table for individual purchases
      const { data: moduleAccess } = await supabase
        .from('module_access')
        .select('module, access_type, expires_at')
        .eq('user_id', user.id);

      // Build access state
      const accessState: ModuleAccessState = {
        quick_score: true, // Always free
        resume_jobs_studio: tierModules.includes('resume_jobs_studio'),
        career_vault: tierModules.includes('career_vault'),
        linkedin_pro: tierModules.includes('linkedin_pro'),
        interview_mastery: tierModules.includes('interview_mastery'),
      };

      // Override with individual module purchases
      if (moduleAccess) {
        for (const access of moduleAccess) {
          const isExpired = access.expires_at && new Date(access.expires_at) < new Date();
          if (!isExpired && access.module in accessState) {
            accessState[access.module as ModuleId] = true;
          }
        }
      }

      setModules(accessState);
    } catch (error) {
      console.error('Error fetching module access:', error);
      setModules(DEFAULT_ACCESS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccess();
  }, [user?.id]);

  const hasModule = (moduleId: ModuleId): boolean => {
    return modules[moduleId] ?? false;
  };

  return {
    modules,
    loading,
    hasModule,
    tier,
    refetch: fetchAccess,
  };
}
