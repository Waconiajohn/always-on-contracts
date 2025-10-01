import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnhancedQueueItem } from "@/components/EnhancedQueueItem";

interface QueueItem {
  id: string;
  opportunity_id: string;
  match_score: number;
  status: string;
  created_at: string;
  customized_resume_content: any;
  ai_customization_notes: string;
  job_opportunities: {
    job_title: string;
    location: string;
    hourly_rate_min: number;
    hourly_rate_max: number;
    job_description: string;
    external_url: string;
    staffing_agencies: {
      agency_name: string;
    };
  };
}

export default function ApplicationQueue() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    fetchQueue();
  }, [activeTab]);

  const fetchQueue = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("application_queue")
        .select(`
          *,
          job_opportunities (
            job_title,
            location,
            hourly_rate_min,
            hourly_rate_max,
            job_description,
            external_url,
            staffing_agencies (
              agency_name
            )
          )
        `)
        .eq("user_id", user.id)
        .eq("status", activeTab)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setQueueItems(data || []);
    } catch (error) {
      console.error("Error fetching queue:", error);
      toast({
        title: "Error",
        description: "Failed to load application queue",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("application_queue")
        .update({ status: "approved", reviewed_at: new Date().toISOString() })
        .eq("id", itemId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Application approved and will be submitted",
      });

      fetchQueue();
    } catch (error) {
      console.error("Error approving application:", error);
      toast({
        title: "Error",
        description: "Failed to approve application",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("application_queue")
        .update({ status: "rejected", reviewed_at: new Date().toISOString() })
        .eq("id", itemId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Application rejected",
      });

      fetchQueue();
    } catch (error) {
      console.error("Error rejecting application:", error);
      toast({
        title: "Error",
        description: "Failed to reject application",
        variant: "destructive",
      });
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <Button
        variant="ghost"
        onClick={() => navigate("/dashboard")}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Application Queue</h1>
          <p className="text-muted-foreground mt-2">
            Review and approve automated job applications
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending">Pending Review</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="applied">Applied</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4 mt-6">
            {queueItems.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No applications in this category</p>
                </CardContent>
              </Card>
            ) : (
              queueItems.map((item) => (
                <EnhancedQueueItem
                  key={item.id}
                  item={item}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  isPending={activeTab === "pending"}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}