import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, CheckCircle, XCircle, ExternalLink, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
                <Card key={item.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {item.job_opportunities.job_title}
                          <Badge variant="secondary">{Math.round(item.match_score)}% Match</Badge>
                        </CardTitle>
                        <CardDescription>
                          {item.job_opportunities.staffing_agencies?.agency_name} • {item.job_opportunities.location}
                        </CardDescription>
                      </div>
                      {activeTab === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(item.id)}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(item.id)}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-semibold">Rate:</span> $
                        {item.job_opportunities.hourly_rate_min}-
                        {item.job_opportunities.hourly_rate_max}/hr
                      </div>
                      <div>
                        <span className="font-semibold">Queued:</span>{" "}
                        {new Date(item.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    {item.ai_customization_notes && (
                      <div className="bg-muted p-4 rounded-md">
                        <p className="font-semibold text-sm mb-2">AI Customization Notes:</p>
                        <p className="text-sm">{item.ai_customization_notes}</p>
                      </div>
                    )}

                    {item.customized_resume_content && (
                      <div className="space-y-2">
                        <p className="font-semibold text-sm">Customized Resume Preview:</p>
                        <div className="bg-muted p-4 rounded-md space-y-2 text-sm">
                          {item.customized_resume_content.executive_summary && (
                            <div>
                              <span className="font-semibold">Summary:</span>{" "}
                              {item.customized_resume_content.executive_summary}
                            </div>
                          )}
                          {item.customized_resume_content.keywords && (
                            <div>
                              <span className="font-semibold">Keywords:</span>{" "}
                              {item.customized_resume_content.keywords.join(", ")}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {item.job_opportunities.external_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a
                          href={item.job_opportunities.external_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Original Posting
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}