import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Briefcase, MapPin, DollarSign, Clock, Sparkles, ExternalLink, RefreshCw, Loader2 } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";

interface OpportunityMatch {
  id: string;
  match_score: number;
  matching_skills: string[];
  ai_recommendation: string;
  status: string;
  job_opportunities: {
    id: string;
    job_title: string;
    job_description: string;
    location: string;
    hourly_rate_min: number;
    hourly_rate_max: number;
    contract_duration_months: number;
    external_url: string;
    posted_date: string;
    staffing_agencies: {
      agency_name: string;
      location: string;
    };
  };
}

const OpportunitiesContent = () => {
  const [opportunities, setOpportunities] = useState<OpportunityMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('opportunity_matches')
        .select(`
          *,
          job_opportunities (
            *,
            staffing_agencies (
              agency_name,
              location
            )
          )
        `)
        .eq('user_id', user.id)
        .order('match_score', { ascending: false });

      if (error) throw error;
      setOpportunities(data || []);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      toast({
        title: "Error",
        description: "Failed to load opportunities",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const syncExternalJobs = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-external-jobs');

      if (error) throw error;

      toast({
        title: "Success",
        description: `Synced ${data.inserted} new jobs, updated ${data.updated} existing jobs`,
      });
    } catch (error: any) {
      console.error('Error syncing external jobs:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to sync external jobs",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const runAIMatching = async () => {
    setMatching(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const { data, error } = await supabase.functions.invoke('match-opportunities', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: data.message || "AI matching completed",
      });

      // Refresh opportunities
      await fetchOpportunities();
    } catch (error: any) {
      console.error('Error running AI matching:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to run AI matching",
        variant: "destructive",
      });
    } finally {
      setMatching(false);
    }
  };

  const updateOpportunityStatus = async (matchId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('opportunity_matches')
        .update({ status, applied_date: status === 'applied' ? new Date().toISOString() : null })
        .eq('id', matchId);

      if (error) throw error;

      toast({
        title: "Updated",
        description: `Opportunity marked as ${status}`,
      });

      await fetchOpportunities();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update opportunity status",
        variant: "destructive",
      });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-blue-500";
    if (score >= 40) return "bg-yellow-500";
    return "bg-gray-500";
  };

  const getStatusColor = (status: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (status) {
      case 'new': return 'default';
      case 'viewed': return 'secondary';
      case 'applied': return 'default';
      case 'rejected': return 'destructive';
      case 'not_interested': return 'outline';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <div className="text-2xl">Loading opportunities...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-4xl font-bold">Contract Opportunities</h1>
              <p className="text-muted-foreground">AI-matched opportunities based on your profile</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={syncExternalJobs} disabled={syncing} variant="outline">
              {syncing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              {syncing ? 'Syncing Jobs...' : 'Sync External Jobs'}
            </Button>
            <Button onClick={runAIMatching} disabled={matching}>
              {matching ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              {matching ? 'AI Matching in Progress...' : 'Run AI Matching'}
            </Button>
          </div>
        </div>

        {opportunities.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Briefcase className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Opportunities Yet</h3>
              <p className="text-muted-foreground mb-4 text-center max-w-md">
                Click "Run AI Matching" to find contract opportunities that match your skills and experience.
              </p>
              <Button onClick={runAIMatching} disabled={matching}>
                {matching ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                {matching ? 'Matching in Progress...' : 'Find Matches'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {opportunities.map((match) => (
              <Card key={match.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-2xl">{match.job_opportunities.job_title}</CardTitle>
                        <Badge className={getScoreColor(match.match_score)}>
                          {match.match_score}% Match
                        </Badge>
                        <Badge variant={getStatusColor(match.status)}>
                          {match.status}
                        </Badge>
                      </div>
                      <CardDescription className="text-base">
                        {match.job_opportunities.staffing_agencies?.agency_name}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{match.job_opportunities.location || 'Remote'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        ${match.job_opportunities.hourly_rate_min}-${match.job_opportunities.hourly_rate_max}/hr
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{match.job_opportunities.contract_duration_months} months</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Posted {new Date(match.job_opportunities.posted_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {match.job_opportunities.job_description && (
                    <p className="text-sm text-muted-foreground">
                      {match.job_opportunities.job_description}
                    </p>
                  )}

                  {match.matching_skills.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-2">Your Matching Skills:</p>
                      <div className="flex flex-wrap gap-2">
                        {match.matching_skills.map((skill, index) => (
                          <Badge key={index} variant="outline">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {match.ai_recommendation && (
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold mb-1">AI Recommendation:</p>
                          <p className="text-sm">{match.ai_recommendation}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    {match.status === 'new' && (
                      <Button onClick={() => updateOpportunityStatus(match.id, 'viewed')}>
                        Mark as Viewed
                      </Button>
                    )}
                    {(match.status === 'new' || match.status === 'viewed') && (
                      <>
                        <Button onClick={() => updateOpportunityStatus(match.id, 'applied')}>
                          Mark as Applied
                        </Button>
                        <Button variant="outline" onClick={() => updateOpportunityStatus(match.id, 'not_interested')}>
                          Not Interested
                        </Button>
                      </>
                    )}
                    {match.job_opportunities.external_url && (
                      <Button variant="outline" asChild>
                        <a href={match.job_opportunities.external_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Posting
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Opportunities = () => {
  return (
    <ProtectedRoute>
      <OpportunitiesContent />
    </ProtectedRoute>
  );
};

export default Opportunities;