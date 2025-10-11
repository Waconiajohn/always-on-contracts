import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Briefcase, CheckCircle2, XCircle, ExternalLink, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface QueuedApplication {
  id: string;
  opportunity_id: string;
  match_score: number;
  status: string;
  created_at: string;
  customized_resume_content: any;
  opportunity: any;
}

export const ApplicationQueue = () => {
  const { toast } = useToast();
  const [queue, setQueue] = useState<QueuedApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<QueuedApplication | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadQueue();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('queue-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'application_queue'
        },
        () => {
          loadQueue();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadQueue = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('application_queue')
        .select(`
          *,
          opportunity:job_opportunities(*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('match_score', { ascending: false })
        .limit(20);

      if (error) throw error;

      setQueue((data || []).map(item => ({
        ...item,
        created_at: item.created_at || new Date().toISOString()
      })));
    } catch (error) {
      console.error('Error loading queue:', error);
      toast({
        title: "Failed to load queue",
        description: "Please refresh the page",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (item: QueuedApplication) => {
    setActionLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Move to application tracking
      const { error: trackingError } = await supabase
        .from('application_tracking')
        .insert({
          opportunity_id: item.opportunity_id,
          user_id: user.id,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          application_method: 'auto_apply'
        });

      if (trackingError) throw trackingError;

      // Update queue status
      const { error: queueError } = await supabase
        .from('application_queue')
        .update({ status: 'approved', reviewed_at: new Date().toISOString() })
        .eq('id', item.id);

      if (queueError) throw queueError;

      toast({
        title: "Application approved",
        description: "Your application has been submitted"
      });

      loadQueue();
    } catch (error) {
      console.error('Error approving:', error);
      toast({
        title: "Approval failed",
        description: "Failed to submit application",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
      setSelectedApp(null);
    }
  };

  const handleReject = async (item: QueuedApplication) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('application_queue')
        .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
        .eq('id', item.id);

      if (error) throw error;

      toast({
        title: "Application rejected",
        description: "Item removed from queue"
      });

      loadQueue();
    } catch (error) {
      console.error('Error rejecting:', error);
      toast({
        title: "Action failed",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
      setSelectedApp(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3 animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (queue.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Application Queue
          </CardTitle>
          <CardDescription>
            Review and approve auto-generated applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No pending applications. The agent will add new matches here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Application Queue
              </CardTitle>
              <CardDescription>
                Review and approve {queue.length} pending application{queue.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <Badge variant="secondary">{queue.length} Pending</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-3">
              {queue.map((item) => {
                const opp = item.opportunity as any;
                return (
                  <Card key={item.id} className="border-2 hover:border-primary/50 transition-all">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base mb-1">
                            {opp?.job_title || 'Unknown Position'}
                          </CardTitle>
                          <CardDescription>
                            {opp?.company_name} • {opp?.location}
                          </CardDescription>
                        </div>
                        <Badge 
                          variant={item.match_score >= 90 ? "default" : "secondary"}
                          className="ml-2"
                        >
                          {Math.round(item.match_score)}% Match
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Added {new Date(item.created_at).toLocaleDateString()}</span>
                        {item.customized_resume_content && (
                          <Badge variant="outline" className="text-xs">
                            <FileText className="h-3 w-3 mr-1" />
                            Resume customized
                          </Badge>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => setSelectedApp(item)}
                          className="flex-1"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Review & Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(item)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                        {opp?.external_url && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(opp.external_url, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <AlertDialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Review Application</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedApp && (
                <div className="space-y-3 mt-4">
                  <div>
                    <p className="font-semibold">{(selectedApp.opportunity as any)?.job_title}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedApp.opportunity as any)?.company_name}
                    </p>
                  </div>
                  <div>
                    <Badge variant="outline">
                      {Math.round(selectedApp.match_score)}% Match Score
                    </Badge>
                  </div>
                  <p className="text-sm">
                    This application has been automatically customized for this position. 
                    Approving will submit your application immediately.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedApp && handleApprove(selectedApp)}
              disabled={actionLoading}
            >
              {actionLoading ? "Submitting..." : "Approve & Submit"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
