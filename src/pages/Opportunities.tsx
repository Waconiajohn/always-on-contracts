import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { AppNav } from "@/components/AppNav";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { OpportunityMatch, JobType } from "@/types/opportunities";
import { FullTimeJobsList } from "@/components/opportunities/FullTimeJobsList";
import { ContractJobsList } from "@/components/opportunities/ContractJobsList";
import { EmptyJobsState } from "@/components/opportunities/EmptyJobsState";
import { BooleanSearchBuilder } from "@/components/opportunities/BooleanSearchBuilder";

const OpportunitiesContent = () => {
  const [opportunities, setOpportunities] = useState<OpportunityMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [matching, setMatching] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(10);
  const [activeTab, setActiveTab] = useState<JobType>("full-time");
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchOpportunities = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("opportunity_matches")
        .select(`
          *,
          job_opportunities (*)
        `)
        .order("match_score", { ascending: false });

      if (error) throw error;
      setOpportunities(data || []);
    } catch (error) {
      console.error("Error fetching opportunities:", error);
      toast({
        title: "Error",
        description: "Failed to load opportunities",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const syncExternalJobs = async () => {
    setSyncing(true);
    try {
      const { error } = await supabase.functions.invoke("sync-external-jobs");
      if (error) throw error;

      toast({
        title: "Sync Started",
        description: "External jobs are being synced. This may take a few minutes.",
      });

      setTimeout(fetchOpportunities, 5000);
    } catch (error) {
      console.error("Error syncing jobs:", error);
      toast({
        title: "Error",
        description: "Failed to sync external jobs",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const runAIMatching = async () => {
    setMatching(true);
    try {
      const { error } = await supabase.functions.invoke("match-opportunities");
      if (error) throw error;

      toast({
        title: "AI Matching Complete",
        description: "Your personalized job matches are ready!",
      });

      await fetchOpportunities();
    } catch (error) {
      console.error("Error running AI matching:", error);
      toast({
        title: "Error",
        description: "Failed to generate matches",
        variant: "destructive",
      });
    } finally {
      setMatching(false);
    }
  };

  const clearAndRematch = async () => {
    try {
      const { error } = await supabase
        .from("opportunity_matches")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (error) throw error;

      toast({
        title: "Matches Cleared",
        description: "Running fresh AI matching...",
      });

      await runAIMatching();
    } catch (error) {
      console.error("Error clearing matches:", error);
      toast({
        title: "Error",
        description: "Failed to clear matches",
        variant: "destructive",
      });
    }
  };

  const updateOpportunityStatus = async (matchId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("opportunity_matches")
        .update({ status })
        .eq("id", matchId);

      if (error) throw error;

      setOpportunities((prev) =>
        prev.map((opp) => (opp.id === matchId ? { ...opp, status } : opp))
      );

      toast({
        title: "Status Updated",
        description: `Marked as ${status}`,
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return "bg-green-500 text-white hover:bg-green-600";
    if (score >= 60) return "bg-blue-500 text-white hover:bg-blue-600";
    return "bg-yellow-500 text-white hover:bg-yellow-600";
  };

  const getStatusColor = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "applied":
        return "secondary";
      case "interview":
        return "default";
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  const fullTimeJobs = useMemo(
    () => opportunities.filter((o) => !o.job_opportunities.contract_type || o.job_opportunities.contract_type === "permanent"),
    [opportunities]
  );

  const contractJobs = useMemo(
    () => opportunities.filter((o) => o.job_opportunities.contract_type && o.job_opportunities.contract_type !== "permanent"),
    [opportunities]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex w-full">
        <div className="flex-1">
          <AppNav />
          <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex w-full">
      <div className="flex-1">
        <AppNav />
        <main className="container mx-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Sidebar - Boolean Search Builder */}
            <div className="lg:col-span-3">
              <BooleanSearchBuilder />
            </div>

            {/* Main Content */}
            <div className="lg:col-span-9 space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-4xl font-bold">Job Board - Browse & Discover</h1>
                  <p className="text-muted-foreground mt-2">
                    AI-powered job matching based on your Career Vault profile
                  </p>
                  {opportunities.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      💡 Click "Add to Queue" on jobs you want to pursue. AI will generate custom resumes for review.
                    </p>
                  )}
                </div>
            <div className="flex gap-2">
              <Button
                onClick={syncExternalJobs}
                disabled={syncing}
                variant="outline"
              >
                {syncing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Sync Jobs
              </Button>
              <Button onClick={runAIMatching} disabled={matching}>
                {matching ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                AI Match
              </Button>
              {opportunities.length > 0 && (
                <Button onClick={clearAndRematch} variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear & Re-match
                </Button>
              )}
                </div>
              </div>

              {opportunities.length === 0 ? (
            <EmptyJobsState onMatch={runAIMatching} matching={matching} />
          ) : (
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as JobType)}>
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="full-time">
                  Full-Time ({fullTimeJobs.length})
                </TabsTrigger>
                <TabsTrigger value="contract">
                  Contract ({contractJobs.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="full-time" className="mt-6">
                <FullTimeJobsList
                  jobs={fullTimeJobs}
                  displayLimit={displayLimit}
                  setDisplayLimit={setDisplayLimit}
                  onStatusUpdate={updateOpportunityStatus}
                  matching={matching}
                  onMatch={runAIMatching}
                  getScoreColor={getScoreColor}
                  getStatusColor={getStatusColor}
                />
              </TabsContent>

              <TabsContent value="contract" className="mt-6">
                <ContractJobsList
                  jobs={contractJobs}
                  displayLimit={displayLimit}
                  setDisplayLimit={setDisplayLimit}
                  onStatusUpdate={updateOpportunityStatus}
                  matching={matching}
                  onMatch={runAIMatching}
                  navigate={navigate}
                  getScoreColor={getScoreColor}
                  getStatusColor={getStatusColor}
                />
              </TabsContent>
            </Tabs>
          )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default function Opportunities() {
  return (
    <ProtectedRoute>
      <OpportunitiesContent />
    </ProtectedRoute>
  );
}
