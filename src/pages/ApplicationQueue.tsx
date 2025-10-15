import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react";
import { useApplicationQueue } from "@/hooks/useApplicationQueue";
import { EnhancedQueueItem } from "@/components/EnhancedQueueItem";
import { EmptyState } from "@/components/EmptyState";

export default function ApplicationQueue() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const { 
    queueItems, 
    loading, 
    stats,
    approveItem,
    rejectItem,
    bulkApproveHighMatches,
    clearRejected
  } = useApplicationQueue();

  const filteredItems = queueItems.filter(item => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return item.status === "pending" || item.status === "new";
    if (activeTab === "approved") return item.status === "approved";
    if (activeTab === "rejected") return item.status === "rejected";
    return true;
  });

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
              Review, customize, and prepare your job applications before submitting
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
            <CardHeader className="pb-3">
              <CardDescription>Total Items</CardDescription>
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
        </div>
      </div>

      {/* Bulk Actions */}
      {stats.total > 0 && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={bulkApproveHighMatches}
            disabled={queueItems.filter(item => item.match_score >= 85 && item.status !== "approved").length === 0}
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

      {/* Tabs and Queue Items */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
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

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          {filteredItems.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title={`No ${activeTab === "all" ? "" : activeTab} items in queue`}
              description={
                activeTab === "all"
                  ? "Start by searching for jobs and adding them to your queue for review."
                  : `You don't have any ${activeTab} items yet.`
              }
              actionLabel="Search Jobs"
              onAction={() => navigate("/job-search")}
            />
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item) => {
                const matchBadge = getMatchScoreBadge(item.match_score);
                return (
                  <div key={item.id} className="relative">
                    <Badge 
                      className={`absolute -top-2 -right-2 z-10 ${matchBadge.color} text-white`}
                    >
                      {Math.round(item.match_score)}% - {matchBadge.label}
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
    </div>
  );
}
