import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface OnboardingStatus {
  hasResume: boolean;
  hasCompletedInterview: boolean;
  hasReviewedVault: boolean;
  isOnboardingComplete: boolean;
  loading: boolean;
}

export const useOnboarding = () => {
  const [status, setStatus] = useState<OnboardingStatus>({
    hasResume: false,
    hasCompletedInterview: false,
    hasReviewedVault: false,
    isOnboardingComplete: false,
    loading: true,
  });

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setStatus(prev => ({ ...prev, loading: false }));
        return;
      }

      // Check for resume upload
      const { data: resumes } = await supabase
        .from("resumes")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);

      const hasResume = (resumes?.length || 0) > 0;

      // Check for profile completion
      const { data: profile } = await supabase
        .from("profiles")
        .select("strategy_customized")
        .eq("user_id", user.id)
        .single();

      const hasCompletedInterview = profile?.strategy_customized || false;

      // Check for career vault review (assuming they've accessed it)
      const hasReviewedVault = localStorage.getItem(`vault_reviewed_${user.id}`) === "true";
      
      // Simple onboarding completion check based on key milestones
      const isOnboardingComplete = hasResume && hasCompletedInterview;

      setStatus({
        hasResume,
        hasCompletedInterview,
        hasReviewedVault,
        isOnboardingComplete,
        loading: false,
      });
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      setStatus(prev => ({ ...prev, loading: false }));
    }
  };

  const markOnboardingComplete = async () => {
    try {
      setStatus(prev => ({ ...prev, isOnboardingComplete: true }));
    } catch (error) {
      console.error("Error marking onboarding complete:", error);
    }
  };

  const markVaultReviewed = () => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        localStorage.setItem(`vault_reviewed_${user.id}`, "true");
        setStatus(prev => ({ ...prev, hasReviewedVault: true }));
      }
    });
  };

  return {
    ...status,
    markOnboardingComplete,
    markVaultReviewed,
    refresh: checkOnboardingStatus,
  };
};
