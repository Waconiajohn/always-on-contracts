import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ResumeProgress {
  id: string;
  has_active_resume: boolean;
  active_resume_id?: string;
  last_resume_created_at?: string;
  total_resumes_created: number;
  wizard_step_completed: number;
  wizard_completed_at?: string;
}

export const useResumeProgress = () => {
  return useQuery({
    queryKey: ["resume-progress"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("resume_progress")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows found
      return data as ResumeProgress | null;
    },
  });
};
