import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface QueueItem {
  id: string;
  user_id: string;
  opportunity_id: string;
  match_score: number;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  applied_at: string | null;
  customized_resume_url: string | null;
  ai_customization_notes: string | null;
  keyword_analysis: any;
  critical_qualifications: string[];
  conversation_data: any;
  networking_contacts: any[];
  networking_initiated: boolean;
  opportunity: {
    id: string;
    job_title: string;
    company_name: string;
    location: string;
    hourly_rate_min: number | null;
    hourly_rate_max: number | null;
    job_description: string;
    external_url: string;
    required_skills: string[];
    posted_date: string;
  };
}

export function useApplicationQueue() {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchQueueItems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // First, get items from opportunity_matches
      const { data: matches, error: matchesError } = await supabase
        .from("opportunity_matches")
        .select(`
          id,
          user_id,
          opportunity_id,
          match_score,
          status,
          created_at,
          applied_date,
          opportunity:job_opportunities(
            id,
            job_title,
            location,
            hourly_rate_min,
            hourly_rate_max,
            job_description,
            external_url,
            required_skills,
            posted_date,
            agency_id
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (matchesError) throw matchesError;

      // Then get items from application_queue
      const { data: queueData, error: queueError } = await supabase
        .from("application_queue")
        .select(`
          id,
          user_id,
          opportunity_id,
          match_score,
          status,
          created_at,
          reviewed_at,
          applied_at,
          customized_resume_url,
          ai_customization_notes,
          keyword_analysis,
          critical_qualifications,
          conversation_data,
          networking_contacts,
          networking_initiated,
          opportunity:job_opportunities(
            id,
            job_title,
            location,
            hourly_rate_min,
            hourly_rate_max,
            job_description,
            external_url,
            required_skills,
            posted_date,
            agency_id
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (queueError) throw queueError;

      // Merge and format the data
      const formattedItems: QueueItem[] = [];
      
      // Add queue items
      if (queueData) {
        formattedItems.push(...queueData.map(item => ({
          ...item,
          created_at: item.created_at || new Date().toISOString(),
          match_score: item.match_score || 0,
          status: item.status || "pending",
          critical_qualifications: item.critical_qualifications || [],
          networking_contacts: Array.isArray(item.networking_contacts) ? item.networking_contacts : [],
          networking_initiated: item.networking_initiated || false,
          opportunity: {
            ...item.opportunity,
            location: item.opportunity?.location || "Remote",
            job_title: item.opportunity?.job_title || "Unknown Position",
            job_description: item.opportunity?.job_description || "",
            external_url: item.opportunity?.external_url || "",
            required_skills: item.opportunity?.required_skills || [],
            posted_date: item.opportunity?.posted_date || new Date().toISOString(),
            hourly_rate_min: item.opportunity?.hourly_rate_min || null,
            hourly_rate_max: item.opportunity?.hourly_rate_max || null,
            company_name: "Company" // Simplified - we'll handle company info separately
          }
        })));
      }

      // Add match items that aren't in queue yet
      if (matches) {
        const queueOpportunityIds = new Set(queueData?.map(q => q.opportunity_id) || []);
        const newMatches = matches
          .filter(match => !queueOpportunityIds.has(match.opportunity_id))
          .map(match => ({
            id: match.id,
            user_id: match.user_id,
            opportunity_id: match.opportunity_id,
            match_score: match.match_score || 0,
            status: match.status || "new",
            created_at: match.created_at || new Date().toISOString(),
            reviewed_at: null,
            applied_at: match.applied_date,
            customized_resume_url: null,
            ai_customization_notes: null,
            keyword_analysis: {},
            critical_qualifications: [],
            conversation_data: {},
            networking_contacts: [],
            networking_initiated: false,
            opportunity: {
              id: match.opportunity?.id || "",
              job_title: match.opportunity?.job_title || "Unknown Position",
              company_name: "Company", // Simplified - we'll handle company info separately
              location: match.opportunity?.location || "Remote",
              hourly_rate_min: match.opportunity?.hourly_rate_min || null,
              hourly_rate_max: match.opportunity?.hourly_rate_max || null,
              job_description: match.opportunity?.job_description || "",
              external_url: match.opportunity?.external_url || "",
              required_skills: match.opportunity?.required_skills || [],
              posted_date: match.opportunity?.posted_date || new Date().toISOString()
            }
          }));
        
        formattedItems.push(...newMatches);
      }

      setQueueItems(formattedItems);
    } catch (error: any) {
      console.error("Error fetching queue items:", error);
      toast({
        title: "Error",
        description: "Failed to load application queue",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueItems();

    // Set up real-time subscription
    const channel = supabase
      .channel("application_queue_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "opportunity_matches"
        },
        () => fetchQueueItems()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "application_queue"
        },
        () => fetchQueueItems()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const approveItem = async (itemId: string) => {
    try {
      const item = queueItems.find(i => i.id === itemId);
      if (!item) return;

      // Check if item exists in application_queue
      const { data: existingQueue } = await supabase
        .from("application_queue")
        .select("id")
        .eq("opportunity_id", item.opportunity_id)
        .single();

      if (existingQueue) {
        // Update existing queue item
        const { error } = await supabase
          .from("application_queue")
          .update({ 
            status: "approved",
            reviewed_at: new Date().toISOString()
          })
          .eq("id", existingQueue.id);

        if (error) throw error;
      } else {
        // Create new queue item from opportunity_match
        const { error } = await supabase
          .from("application_queue")
          .insert({
            user_id: item.user_id,
            opportunity_id: item.opportunity_id,
            match_score: item.match_score,
            status: "approved",
            reviewed_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      // Update opportunity_match status
      await supabase
        .from("opportunity_matches")
        .update({ status: "approved" })
        .eq("id", itemId);

      toast({
        title: "Success",
        description: "Application approved and ready for customization"
      });

      fetchQueueItems();
    } catch (error: any) {
      console.error("Error approving item:", error);
      toast({
        title: "Error",
        description: "Failed to approve application",
        variant: "destructive"
      });
    }
  };

  const rejectItem = async (itemId: string) => {
    try {
      const item = queueItems.find(i => i.id === itemId);
      if (!item) return;

      // Update in both tables if exists
      await supabase
        .from("opportunity_matches")
        .update({ status: "rejected" })
        .eq("id", itemId);

      const { data: existingQueue } = await supabase
        .from("application_queue")
        .select("id")
        .eq("opportunity_id", item.opportunity_id)
        .single();

      if (existingQueue) {
        await supabase
          .from("application_queue")
          .update({ status: "rejected" })
          .eq("id", existingQueue.id);
      }

      toast({
        title: "Item rejected",
        description: "Application has been removed from your queue"
      });

      fetchQueueItems();
    } catch (error: any) {
      console.error("Error rejecting item:", error);
      toast({
        title: "Error",
        description: "Failed to reject application",
        variant: "destructive"
      });
    }
  };

  const bulkApproveHighMatches = async () => {
    try {
      const highMatches = queueItems.filter(
        item => item.match_score >= 85 && item.status !== "approved"
      );

      for (const item of highMatches) {
        await approveItem(item.id);
      }

      toast({
        title: "Success",
        description: `Approved ${highMatches.length} high-match opportunities`
      });
    } catch (error: any) {
      console.error("Error bulk approving:", error);
      toast({
        title: "Error",
        description: "Failed to approve all items",
        variant: "destructive"
      });
    }
  };

  const clearRejected = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("opportunity_matches")
        .delete()
        .eq("user_id", user.id)
        .eq("status", "rejected");

      await supabase
        .from("application_queue")
        .delete()
        .eq("user_id", user.id)
        .eq("status", "rejected");

      toast({
        title: "Success",
        description: "Rejected items cleared"
      });

      fetchQueueItems();
    } catch (error: any) {
      console.error("Error clearing rejected:", error);
      toast({
        title: "Error",
        description: "Failed to clear rejected items",
        variant: "destructive"
      });
    }
  };

  const stats = {
    total: queueItems.length,
    pending: queueItems.filter(i => i.status === "pending" || i.status === "new").length,
    approved: queueItems.filter(i => i.status === "approved").length,
    rejected: queueItems.filter(i => i.status === "rejected").length
  };

  return {
    queueItems,
    loading,
    stats,
    approveItem,
    rejectItem,
    bulkApproveHighMatches,
    clearRejected
  };
}
