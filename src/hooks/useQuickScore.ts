import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface QuickScoreResult {
  id: string;
  overall_score: number;
  scored_at: string;
  tier_name: string;
  tier_emoji?: string;
  tier_message?: string;
  jd_match_score?: number;
  industry_benchmark_score?: number;
  ats_compliance_score?: number;
  human_voice_score?: number;
  target_role?: string;
  target_industry?: string;
}

export const useQuickScore = () => {
  return useQuery({
    queryKey: ["quick-score"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("quick_score_results")
        .select("*")
        .eq("user_id", user.id)
        .order("scored_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as QuickScoreResult | null;
    },
  });
};
