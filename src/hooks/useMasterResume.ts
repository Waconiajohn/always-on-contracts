import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MasterResume, MasterResumeHistory, StructuredResumeData } from "@/types/master-resume";
import { toast } from "sonner";

export function useMasterResume() {
  const queryClient = useQueryClient();

  const { data: masterResume, isLoading, error } = useQuery({
    queryKey: ["master-resume"],
    queryFn: async (): Promise<MasterResume | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("master_resume")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        return {
          ...data,
          structured_data: (data.structured_data || {}) as StructuredResumeData
        };
      }
      return null;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (content: string): Promise<MasterResume> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

      const { data, error } = await supabase
        .from("master_resume")
        .insert({
          user_id: user.id,
          content,
          word_count: wordCount,
          structured_data: {},
        })
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        structured_data: (data.structured_data || {}) as StructuredResumeData
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-resume"] });
      toast.success("Master Resume created!");
    },
    onError: (error) => {
      console.error("Error creating master resume:", error);
      toast.error("Failed to create Master Resume");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      content,
      structured_data
    }: {
      content: string;
      structured_data?: StructuredResumeData;
    }): Promise<MasterResume> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const updateData: Record<string, unknown> = { content };
      if (structured_data) {
        updateData.structured_data = structured_data;
      }

      const { data, error } = await supabase
        .from("master_resume")
        .update(updateData)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        structured_data: (data.structured_data || {}) as StructuredResumeData
      };
    },
    onMutate: async ({ content, structured_data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["master-resume"] });

      // Snapshot the previous value
      const previousResume = queryClient.getQueryData<MasterResume | null>(["master-resume"]);

      // Optimistically update the cache
      if (previousResume) {
        queryClient.setQueryData<MasterResume>(["master-resume"], {
          ...previousResume,
          content,
          structured_data: structured_data || previousResume.structured_data,
          updated_at: new Date().toISOString(),
        });
      }

      return { previousResume };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousResume) {
        queryClient.setQueryData(["master-resume"], context.previousResume);
      }
      console.error("Error updating master resume:", error);
      toast.error("Failed to update Master Resume");
    },
    onSuccess: () => {
      toast.success("Master Resume updated!");
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["master-resume"] });
    },
  });

  const enrichMutation = useMutation({
    mutationFn: async (newContent: string): Promise<MasterResume> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Append new content to existing content
      const existingContent = masterResume?.content || "";
      const enrichedContent = existingContent + "\n\n" + newContent;

      const { data, error } = await supabase
        .from("master_resume")
        .update({ 
          content: enrichedContent,
          last_enriched_at: new Date().toISOString()
        })
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        structured_data: (data.structured_data || {}) as StructuredResumeData
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-resume"] });
      toast.success("Master Resume enriched with new content!");
    },
    onError: (error) => {
      console.error("Error enriching master resume:", error);
      toast.error("Failed to enrich Master Resume");
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (historyItem: MasterResumeHistory): Promise<MasterResume> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("master_resume")
        .update({
          content: historyItem.content,
          structured_data: JSON.parse(JSON.stringify(historyItem.structured_data || {}))
        })
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        structured_data: (data.structured_data || {}) as StructuredResumeData
      };
    },
    onMutate: async (historyItem) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["master-resume"] });

      // Snapshot the previous value
      const previousResume = queryClient.getQueryData<MasterResume | null>(["master-resume"]);

      // Optimistically update the cache with historical content
      if (previousResume) {
        queryClient.setQueryData<MasterResume>(["master-resume"], {
          ...previousResume,
          content: historyItem.content,
          structured_data: historyItem.structured_data || previousResume.structured_data,
          updated_at: new Date().toISOString(),
        });
      }

      return { previousResume };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousResume) {
        queryClient.setQueryData(["master-resume"], context.previousResume);
      }
      console.error("Error restoring master resume:", error);
      toast.error("Failed to restore version");
    },
    onSuccess: (_, variables) => {
      toast.success(`Restored to Version ${variables.version}`);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["master-resume"] });
      queryClient.invalidateQueries({ queryKey: ["master-resume-history"] });
    },
  });

  return {
    masterResume,
    isLoading,
    error,
    createMasterResume: createMutation.mutate,
    updateMasterResume: updateMutation.mutate,
    enrichMasterResume: enrichMutation.mutate,
    restoreVersion: restoreMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isEnriching: enrichMutation.isPending,
    isRestoring: restoreMutation.isPending,
  };
}

export function useMasterResumeHistory() {
  const { data: history, isLoading } = useQuery({
    queryKey: ["master-resume-history"],
    queryFn: async (): Promise<MasterResumeHistory[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("master_resume_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        structured_data: (item.structured_data || {}) as StructuredResumeData
      }));
    },
  });

  return { history, isLoading };
}
