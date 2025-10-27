import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface QueueItem {
  id: string;
  user_id: string;
  opportunity_id: string;
  match_score: number | null;
  status: string | null;
  application_status: string | null;
  source: string | null;
  created_at: string | null;
  reviewed_at?: string | null;
  applied_at?: string | null;
  ai_customization_notes?: string | null;
  conversation_data?: any;
  opportunity?: {
    id: string;
    job_title: string;
    agency_id: string | null;
    location: string | null;
    contract_type: string | null;
    job_description: string | null;
    required_skills: string[] | null;
    external_url: string | null;
    posted_date: string | null;
    hourly_rate_min: number | null;
    hourly_rate_max: number | null;
    contract_duration_months: number | null;
    contract_confidence_score: number | null;
    quality_score: number | null;
  };
}

interface AISuggestion {
  id: string;
  user_id: string;
  opportunity_id: string;
  match_score: number | null;
  status: string | null;
  source: string | null;
  created_at: string | null;
  ai_recommendation?: string | null;
  matching_skills?: string[] | null;
  job_opportunities: {
    id: string;
    job_title: string;
    agency_id: string | null;
    location: string | null;
    contract_type: string | null;
    job_description: string | null;
    required_skills: string[] | null;
    external_url: string | null;
    posted_date: string | null;
    hourly_rate_min: number | null;
    hourly_rate_max: number | null;
    contract_duration_months: number | null;
    contract_confidence_score: number | null;
    quality_score: number | null;
  };
}

export const useApplicationQueue = () => {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [aiSuggestions, setAISuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchManualQueue = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('application_queue')
        .select(`
          *,
          job_opportunities (*)
        `)
        .eq('user_id', user.id)
        .eq('source', 'manual')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map job_opportunities to opportunity for component compatibility
      const mappedData = (data || []).map(item => ({
        ...item,
        opportunity: item.job_opportunities
      }));
      
      setQueueItems(mappedData as any);
    } catch (error: any) {
      console.error('Error fetching manual queue:', error);
      toast({
        title: "Error loading queue",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const fetchAISuggestions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('opportunity_matches')
        .select(`
          *,
          job_opportunities (*)
        `)
        .eq('user_id', user.id)
        .eq('source', 'ai_suggestion')
        .order('match_score', { ascending: false });

      if (error) throw error;
      
      // Map job_opportunities to opportunity for component compatibility
      const mappedData = (data || []).map(item => ({
        ...item,
        opportunity: item.job_opportunities
      }));
      
      setAISuggestions(mappedData as any);
    } catch (error: any) {
      console.error('Error fetching AI suggestions:', error);
      toast({
        title: "Error loading suggestions",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await Promise.all([fetchManualQueue(), fetchAISuggestions()]);
      setLoading(false);
    };

    initialize();

    // Set up real-time subscriptions
    const queueChannel = supabase
      .channel('application_queue_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'application_queue'
      }, () => {
        fetchManualQueue();
      })
      .subscribe();

    const suggestionsChannel = supabase
      .channel('opportunity_matches_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'opportunity_matches'
      }, () => {
        fetchAISuggestions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(queueChannel);
      supabase.removeChannel(suggestionsChannel);
    };
  }, []);

  const approveItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('application_queue')
        .update({ 
          status: 'approved',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: "Application approved",
        description: "Ready to submit when you're ready"
      });

      await fetchManualQueue();
    } catch (error: any) {
      console.error('Error approving item:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const rejectItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('application_queue')
        .update({ 
          status: 'rejected',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: "Application rejected",
        description: "Moved to rejected items"
      });

      await fetchManualQueue();
    } catch (error: any) {
      console.error('Error rejecting item:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const addToManualQueue = async (suggestionId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get the suggestion
      const suggestion = aiSuggestions.find(s => s.id === suggestionId);
      if (!suggestion) return;

      // Create application_queue entry
      const { error } = await supabase
        .from('application_queue')
        .insert({
          user_id: user.id,
          opportunity_id: suggestion.opportunity_id,
          match_score: suggestion.match_score || 0,
          application_status: 'not_applied',
          source: 'manual'
        });

      if (error) throw error;

      // Mark the suggestion as queued
      await supabase
        .from('opportunity_matches')
        .update({ status: 'queued' })
        .eq('id', suggestionId);
      
      // Log feedback
      await supabase
        .from('ai_match_feedback')
        .insert({
          match_id: suggestionId,
          user_id: user.id,
          action: 'added'
        });

      toast({
        title: "Added to My Applications",
        description: "Job moved to your applications for review"
      });

      await Promise.all([fetchManualQueue(), fetchAISuggestions()]);
    } catch (error: any) {
      console.error('Error adding to queue:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const dismissSuggestion = async (suggestionId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('opportunity_matches')
        .update({ status: 'dismissed' })
        .eq('id', suggestionId);

      if (error) throw error;
      
      // Log feedback
      await supabase
        .from('ai_match_feedback')
        .insert({
          match_id: suggestionId,
          user_id: user.id,
          action: 'dismissed'
        });

      toast({
        title: "Suggestion dismissed",
        description: "Job removed from suggestions"
      });

      await fetchAISuggestions();
    } catch (error: any) {
      console.error('Error dismissing suggestion:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const bulkApproveHighMatches = async () => {
    try {
      const highMatches = queueItems.filter(item => 
        (item.match_score || 0) >= 85 && item.status !== "approved"
      );

      if (highMatches.length === 0) {
        toast({
          title: "No items to approve",
          description: "No high-match items found"
        });
        return;
      }

      const { error } = await supabase
        .from('application_queue')
        .update({ 
          status: 'approved',
          reviewed_at: new Date().toISOString()
        })
        .in('id', highMatches.map(item => item.id));

      if (error) throw error;

      toast({
        title: "Bulk approval complete",
        description: `Approved ${highMatches.length} high-match applications`
      });

      await fetchManualQueue();
    } catch (error: any) {
      console.error('Error bulk approving:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const clearRejected = async () => {
    try {
      const { error } = await supabase
        .from('application_queue')
        .delete()
        .eq('status', 'rejected');

      if (error) throw error;

      toast({
        title: "Rejected items cleared",
        description: "All rejected applications have been removed"
      });

      await fetchManualQueue();
    } catch (error: any) {
      console.error('Error clearing rejected:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const stats = {
    total: queueItems.length,
    pending: queueItems.filter(item => item.status === "pending" || item.status === "new").length,
    approved: queueItems.filter(item => item.status === "approved").length,
    rejected: queueItems.filter(item => item.status === "rejected").length,
    suggestions: aiSuggestions.filter(s => s.status === 'new').length
  };

  return {
    queueItems,
    aiSuggestions,
    loading,
    stats,
    approveItem,
    rejectItem,
    addToManualQueue,
    dismissSuggestion,
    bulkApproveHighMatches,
    clearRejected
  };
};