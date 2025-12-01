import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useInterviewPrepStatus = () => {
  return useQuery({
    queryKey: ["interview-prep-status"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { hasInterviewPrep: false, count: 0 };

      const { error, count } = await supabase
        .from("interview_prep_sessions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (error && error.code !== "PGRST116") throw error;
      
      return {
        hasInterviewPrep: (count || 0) > 0,
        count: count || 0
      };
    },
  });
};
