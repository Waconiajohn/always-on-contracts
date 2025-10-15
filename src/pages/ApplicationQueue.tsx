import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, CheckCircle2, Clock, XCircle, Loader2, Sparkles } from "lucide-react";
import { useApplicationQueue } from "@/hooks/useApplicationQueue";
import { EnhancedQueueItem } from "@/components/EnhancedQueueItem";
import { EmptyState } from "@/components/EmptyState";
import { AISuggestionItem } from "@/components/AISuggestionItem";

export default function ApplicationQueue() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("my-queue");
  const [queueTab, setQueueTab] = useState("all");
  const { 
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
  } = useApplicationQueue();

  const filteredQueueItems = queueItems?.filter(item => {
    if (queueTab === "all") return true;
    if (queueTab === "pending") return item.status === "pending" || item.status === "new";
    if (queueTab === "approved") return item.status === "approved";
    if (queueTab === "rejected") return item.status === "rejected";
    return true;
  }) || [];

  const activeSuggestions = aiSuggestions?.filter(s => s.status === 'new') || [];

  const getMatchScoreBadge = (score: number) => {
    if (score >= 85) return { color: "bg-green-500", label: "Excellent Match" };
    if (score >= 70) return { color: "bg-blue-500", label: "Good Match" };
    if (score >= 50) return { color: "bg-yellow-500", label: "Moderate Match" };
    return { color: "bg-gray-500", label: "Low Match" };
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
    <div className="container mx-auto py-8 space-y-6">
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>My Queue</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending Review
              </CardDescription>
              <CardTitle className="text-3xl">{stats.pending}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Approved
              </CardDescription>
              <CardTitle className="text-3xl">{stats.approved}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Rejected
              </CardDescription>
              <CardTitle className="text-3xl">{stats.rejected}</CardTitle>
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

          {/* Bulk Actions */}
      {stats.total > 0 && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={bulkApproveHighMatches}
            disabled={(queueItems || []).filter(item => (item.match_score || 0) >= 85 && item.status !== "approved").length === 0}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Approve All High Matches (85%+)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearRejected}
            disabled={stats.rejected === 0}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Clear Rejected Items
          </Button>
        </div>
      )}

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

        {/* My Queue Tab */}
        <TabsContent value="my-queue" className="space-y-4 mt-6">
          <Tabs value={queueTab} onValueChange={setQueueTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">
                All ({stats.total})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({stats.pending})
              </TabsTrigger>
              <TabsTrigger value="approved">
                Approved ({stats.approved})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejected ({stats.rejected})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={queueTab} className="space-y-4 mt-6">
              {filteredQueueItems.length === 0 ? (
                <EmptyState
                  icon={Briefcase}
                  title={`No ${queueTab === "all" ? "" : queueTab} items in queue`}
                  description={
                    queueTab === "all"
                      ? "Add jobs from search results or promote AI suggestions to build your queue."
                      : `You don't have any ${queueTab} items yet.`
                  }
                  actionLabel="Search Jobs"
                  onAction={() => navigate("/job-search")}
                />
              ) : (
                <div className="space-y-4">
                  {filteredQueueItems.map((item) => {
                    const matchBadge = getMatchScoreBadge(item.match_score || 0);
                    return (
                      <div key={item.id} className="relative">
                        <Badge 
                          className={`absolute -top-2 -right-2 z-10 ${matchBadge.color} text-white`}
                        >
                          {Math.round(item.match_score || 0)}% - {matchBadge.label}
                        </Badge>
                        <EnhancedQueueItem
                          item={item}
                          onApprove={() => approveItem(item.id)}
                          onReject={() => rejectItem(item.id)}
                          isPending={false}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* AI Suggestions Tab */}
        <TabsContent value="ai-suggestions" className="space-y-4 mt-6">
          {activeSuggestions.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No AI suggestions yet"
              description="AI suggestions will appear here when we find jobs that match your Career Vault profile."
              actionLabel="Search Jobs"
              onAction={() => navigate("/job-search")}
            />
          ) : (
            <div className="space-y-4">
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                <p className="text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4 inline mr-2 text-primary" />
                  These jobs were automatically matched based on your Career Vault profile. 
                  Add promising matches to your queue or dismiss ones that don't fit.
                </p>
              </div>
              
              {activeSuggestions.map((suggestion) => (
                <AISuggestionItem
                  key={suggestion.id}
                  suggestion={suggestion}
                  onAddToQueue={addToManualQueue}
                  onDismiss={dismissSuggestion}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
