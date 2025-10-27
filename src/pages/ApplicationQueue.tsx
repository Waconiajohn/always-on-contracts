import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Loader2, Sparkles, Trash2 } from "lucide-react";
import { useApplicationQueue } from "@/hooks/useApplicationQueue";
import { EmptyState } from "@/components/EmptyState";
import { AISuggestionItem } from "@/components/AISuggestionItem";
import { SubscriptionGate } from "@/components/SubscriptionGate";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function ApplicationQueue() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("my-queue");
  const [statusFilter, setStatusFilter] = useState("all");
  const [suggestionFilter, setSuggestionFilter] = useState("all");
  const { 
    queueItems,
    aiSuggestions,
    loading, 
    stats,
    addToManualQueue,
    dismissSuggestion
  } = useApplicationQueue();

  const updateApplicationStatus = async (queueId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('application_queue')
        .update({ application_status: newStatus })
        .eq('id', queueId);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: `Application status changed to ${newStatus.replace('_', ' ')}`
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const deleteApplication = async (queueId: string) => {
    try {
      const { error } = await supabase
        .from('application_queue')
        .delete()
        .eq('id', queueId);

      if (error) throw error;

      toast({
        title: "Application removed",
        description: "Removed from your applications"
      });
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const filteredQueueItems = queueItems?.filter(item => {
    if (statusFilter === "all") return true;
    return item.application_status === statusFilter;
  }) || [];

  const filteredSuggestions = aiSuggestions?.filter(s => {
    if (s.status !== 'new') return false;
    if (suggestionFilter === "all") return true;
    if (suggestionFilter === "excellent") return (s.match_score || 0) >= 85;
    if (suggestionFilter === "strong") return (s.match_score || 0) >= 70 && (s.match_score || 0) < 85;
    return true;
  }) || [];

  const getMatchScoreBadge = (score: number) => {
    if (score >= 85) return { color: "bg-green-500 text-white", label: "Excellent" };
    if (score >= 70) return { color: "bg-blue-500 text-white", label: "Strong" };
    return { color: "bg-yellow-500 text-white", label: "Good" };
  };

  const statusCounts = {
    not_applied: queueItems?.filter(i => i.application_status === 'not_applied').length || 0,
    applied: queueItems?.filter(i => i.application_status === 'applied').length || 0,
    interviewing: queueItems?.filter(i => i.application_status === 'interviewing').length || 0,
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading your application queue...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-6 space-y-6 max-w-[1800px] mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Application Queue</h1>
            <p className="text-muted-foreground mt-2">
              Manage your manual queue and review AI-powered job suggestions
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/job-search")}
          >
            <Briefcase className="h-4 w-4 mr-2" />
            Find More Jobs
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <Card>
            <CardHeader className="pb-4">
              <CardDescription>Total Applications</CardDescription>
              <CardTitle className="text-4xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Not Applied</CardDescription>
              <CardTitle className="text-3xl">{statusCounts.not_applied}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Applied</CardDescription>
              <CardTitle className="text-3xl">{statusCounts.applied}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-primary/50">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                AI Suggestions
              </CardDescription>
              <CardTitle className="text-3xl text-primary">{stats.suggestions}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Main Tabs: My Queue vs AI Suggestions */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-queue">
            My Queue ({stats.total})
          </TabsTrigger>
          <TabsTrigger value="ai-suggestions">
            <Sparkles className="h-4 w-4 mr-2" />
            AI Suggestions ({stats.suggestions})
          </TabsTrigger>
        </TabsList>

        {/* My Applications Tab */}
        <TabsContent value="my-queue" className="space-y-4 mt-6">
          <div className="flex items-center gap-4 mb-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Applications</SelectItem>
                <SelectItem value="not_applied">Not Applied</SelectItem>
                <SelectItem value="applied">Applied</SelectItem>
                <SelectItem value="interviewing">Interviewing</SelectItem>
                <SelectItem value="offer">Offer</SelectItem>
                <SelectItem value="rejected_by_employer">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredQueueItems.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No applications yet"
              description="Add jobs from search results or AI suggestions to build your application list."
              actionLabel="Search Jobs"
              onAction={() => navigate("/job-search")}
            />
          ) : (
            <div className="space-y-4">
              {filteredQueueItems.map((item) => {
                const matchBadge = getMatchScoreBadge(item.match_score || 0);
                return (
                  <Card key={item.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-xl">{item.opportunity?.job_title}</CardTitle>
                            {item.match_score && item.match_score > 0 && (
                              <Badge className={matchBadge.color}>
                                {Math.round(item.match_score)}% {matchBadge.label}
                              </Badge>
                            )}
                          </div>
                          <CardDescription>
                            {item.opportunity?.location && <span className="mr-4">📍 {item.opportunity.location}</span>}
                            {item.source && <span className="text-xs">Source: {item.source}</span>}
                          </CardDescription>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 mt-4">
                        <Select 
                          value={item.application_status || 'not_applied'} 
                          onValueChange={(value) => updateApplicationStatus(item.id, value)}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="not_applied">Not Applied</SelectItem>
                            <SelectItem value="applied">Applied</SelectItem>
                            <SelectItem value="interviewing">Interviewing</SelectItem>
                            <SelectItem value="offer">Offer</SelectItem>
                            <SelectItem value="rejected_by_employer">Rejected by Employer</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button
                          variant="outline"
                          onClick={() => navigate('/agents/resume-builder', {
                            state: {
                              opportunityId: item.opportunity_id,
                              jobTitle: item.opportunity?.job_title,
                              jobDescription: item.opportunity?.job_description
                            }
                          })}
                        >
                          Create Resume
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteApplication(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* AI Suggestions Tab */}
        <TabsContent value="ai-suggestions" className="space-y-4 mt-6">
          <SubscriptionGate 
            featureName="AI Job Matching" 
            requiredTier="concierge_elite"
          >
            <div className="flex items-center gap-4 mb-4">
              <Select value={suggestionFilter} onValueChange={setSuggestionFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter suggestions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Suggestions</SelectItem>
                  <SelectItem value="excellent">Excellent (85%+)</SelectItem>
                  <SelectItem value="strong">Strong (70-84%)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filteredSuggestions.length === 0 ? (
              <EmptyState
                icon={Sparkles}
                title="No AI suggestions yet"
                description="AI suggestions will appear here when we find jobs that match your Career Vault profile. Our AI runs daily to discover new opportunities."
              />
            ) : (
              <div className="space-y-4">
                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                  <p className="text-sm text-muted-foreground">
                    <Sparkles className="h-4 w-4 inline mr-2 text-primary" />
                    These jobs were automatically matched based on your Career Vault profile. 
                    Add promising matches to your applications or dismiss ones that don't fit.
                  </p>
                </div>
                
                {filteredSuggestions.map((suggestion) => (
                  <AISuggestionItem
                    key={suggestion.id}
                    suggestion={suggestion}
                    onAddToQueue={addToManualQueue}
                    onDismiss={dismissSuggestion}
                  />
                ))}
              </div>
            )}
          </SubscriptionGate>
        </TabsContent>
      </Tabs>
    </div>
  );
}
