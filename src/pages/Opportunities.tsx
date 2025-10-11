import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { jobScraper, application } from "@/lib/mcp-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, MapPin, DollarSign, Clock, Sparkles, ExternalLink, RefreshCw, Loader2, AlertCircle, CheckCircle, TrendingUp, FileText, Calculator } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AppNav } from "@/components/AppNav";
import { JobFeedbackDialog } from "@/components/JobFeedbackDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface OpportunityMatch {
  id: string;
  opportunity_id: string;
  match_score: number | null;
  status: string | null;
  matching_skills: string[] | null;
  ai_recommendation: string | null;
  created_at: string | null;
  job_opportunities: {
    id: string;
    job_title: string;
    agency_id: string | null;
    location: string | null;
    job_description: string | null;
    required_skills: string[] | null;
    hourly_rate_min: number | null;
    hourly_rate_max: number | null;
    contract_type: string | null;
    contract_duration_months: number | null;
    posted_date: string | null;
    external_url: string | null;
    contract_confidence_score: number | null;
    extracted_rate_min: number | null;
    extracted_rate_max: number | null;
    extracted_duration_months: number | null;
    quality_score: number | null;
    ai_verified_at: string | null;
    staffing_agencies: {
      agency_name: string;
      location: string | null;
    } | null;
  };
}

const OpportunitiesContent = () => {
  const [opportunities, setOpportunities] = useState<OpportunityMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(20);
  const [activeTab, setActiveTab] = useState('full-time');
  const navigate = useNavigate();
  const { toast } = useToast();

  const fullTimeJobs = opportunities.filter(o => 
    !o.job_opportunities.contract_type || o.job_opportunities.contract_type === 'permanent'
  );
  const contractJobs = opportunities.filter(o => 
    o.job_opportunities.contract_type && o.job_opportunities.contract_type !== 'permanent'
  );

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
      
      // Filter out placeholder jobs with example.com URLs
      const realJobs = (data || []).filter(match => 
        match.job_opportunities?.external_url && 
        !match.job_opportunities.external_url.includes('example.com')
      );
      
      setOpportunities(realJobs);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please sign in to continue');

      // Use MCP job scraper to sync jobs
      const result = await jobScraper.scrapeJobs(
        'contract opportunities',
        undefined,
        ['linkedin', 'indeed', 'glassdoor'],
        100
      );

      toast({
        title: "Success",
        description: `Job sync started - check back in a moment`,
      });
      
      // Refresh after a delay
      setTimeout(() => fetchOpportunities(), 3000);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Please sign in to continue');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication session expired. Please refresh the page.');
      }

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

  const clearAndRematch = async () => {
    setMatching(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Please sign in to continue');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication session expired. Please refresh the page.');
      }

      // Clear existing matches
      const { error: deleteMatchesError } = await supabase
        .from('opportunity_matches')
        .delete()
        .eq('user_id', user.id);

      if (deleteMatchesError) throw deleteMatchesError;

      // Clear existing jobs to force fresh data
      const { error: deleteJobsError } = await supabase
        .from('job_opportunities')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (deleteJobsError) throw deleteJobsError;

      toast({
        title: "Cleared all data",
        description: "Syncing fresh jobs...",
      });

      // Sync fresh jobs
      await syncExternalJobs();

      toast({
        title: "Jobs synced",
        description: "Re-matching opportunities...",
      });

      // Re-run matching
      const { data, error } = await supabase.functions.invoke('match-opportunities', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: "Re-matching complete!",
        description: data.message || "AI matching completed with fresh results",
      });

      // Refresh opportunities
      await fetchOpportunities();
    } catch (error: any) {
      console.error('Error clearing and re-matching:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to clear and re-match",
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
    <div className="min-h-screen bg-background">
      <AppNav />
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold">Job Board</h1>
            <p className="text-muted-foreground">AI-matched opportunities based on your profile</p>
          </div>
          <TooltipProvider delayDuration={300}>
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={syncExternalJobs} disabled={syncing} variant="outline">
                    {syncing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    {syncing ? 'Syncing Jobs...' : 'Sync External Jobs'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={5}>
                  <p className="max-w-xs">Fetch fresh career opportunities from 30+ job boards (Greenhouse, Lever, RemoteOK, etc.) and store them in your database</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={runAIMatching} disabled={matching}>
                    {matching ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    {matching ? 'AI Matching in Progress...' : 'Run AI Matching'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={5}>
                  <p className="max-w-xs">Analyze your resume and profile to find the best job matches with personalized AI recommendations</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={clearAndRematch} disabled={matching} variant="outline">
                    {matching ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Clear & Re-match
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={5}>
                  <p className="max-w-xs">Clear all existing matches and run AI matching again from scratch</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="full-time" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Full-Time ({fullTimeJobs.length})
            </TabsTrigger>
            <TabsTrigger value="contract" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Contract ({contractJobs.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

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
          <TabsContent value={activeTab} className="mt-0">
            <div className="space-y-6">
              {activeTab === 'full-time' && fullTimeJobs.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No full-time opportunities found. Try running AI matching.</p>
                  </CardContent>
                </Card>
              )}
              {activeTab === 'contract' && contractJobs.length === 0 && (
                <>
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground">No contract opportunities found. Try running AI matching.</p>
                    </CardContent>
                  </Card>
                  
                  {/* Contract Tools */}
                  <div className="grid md:grid-cols-2 gap-6 mt-6">
                    <Card className="hover:shadow-lg transition-all cursor-pointer" onClick={() => navigate('/rate-calculator')}>
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Calculator className="h-6 w-6 text-primary" />
                          </div>
                          <CardTitle>Rate Calculator</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="mb-4">
                          Calculate your premium hourly rate for contract work
                        </CardDescription>
                        <Button className="w-full">Calculate Rate</Button>
                      </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-all cursor-pointer" onClick={() => navigate('/templates')}>
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <FileText className="h-6 w-6 text-primary" />
                          </div>
                          <CardTitle>Templates</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="mb-4">
                          Communication templates for contract negotiations
                        </CardDescription>
                        <Button className="w-full">Browse Templates</Button>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
              
              {activeTab === 'contract' && contractJobs.length > 0 && (
                <>
                  {/* Contract Tools */}
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <Card className="hover:shadow-lg transition-all cursor-pointer" onClick={() => navigate('/rate-calculator')}>
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Calculator className="h-6 w-6 text-primary" />
                          </div>
                          <CardTitle>Rate Calculator</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="mb-4">
                          Calculate your premium hourly rate for contract work
                        </CardDescription>
                        <Button className="w-full">Calculate Rate</Button>
                      </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-all cursor-pointer" onClick={() => navigate('/templates')}>
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <FileText className="h-6 w-6 text-primary" />
                          </div>
                          <CardTitle>Templates</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="mb-4">
                          Communication templates for contract negotiations
                        </CardDescription>
                        <Button className="w-full">Browse Templates</Button>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
              
              {((activeTab === 'full-time' && fullTimeJobs.length > 0) || (activeTab === 'contract' && contractJobs.length > 0)) && (
                <>
                  <div className="flex items-center justify-between bg-muted p-4 rounded-lg">
                    <div className="text-sm">
                      <span className="font-semibold">
                        {activeTab === 'full-time' ? fullTimeJobs.length : contractJobs.length}
                      </span> matches found
                      <span className="text-muted-foreground ml-2">
                        (showing {Math.min(displayLimit, activeTab === 'full-time' ? fullTimeJobs.length : contractJobs.length)})
                      </span>
                    </div>
              {(activeTab === 'full-time' ? fullTimeJobs.length : contractJobs.length) > displayLimit && (
                <Button 
                  variant="outline" 
                  onClick={() => setDisplayLimit(prev => prev + 20)}
                >
                  Load More ({(activeTab === 'full-time' ? fullTimeJobs.length : contractJobs.length) - displayLimit} remaining)
                </Button>
              )}
              {displayLimit > 20 && (activeTab === 'full-time' ? fullTimeJobs.length : contractJobs.length) > 20 && (
                <Button 
                  variant="ghost" 
                  onClick={() => setDisplayLimit(20)}
                >
                  Show Less
                </Button>
              )}
                  </div>
                  <div className="grid gap-6">
                    {(activeTab === 'full-time' ? fullTimeJobs : contractJobs).slice(0, displayLimit).map((match) => (
              <Card key={match.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-2xl">{match.job_opportunities.job_title}</CardTitle>
                        <Badge className={getScoreColor(match.match_score ?? 0)}>
                          {match.match_score ?? 0}% Match
                        </Badge>
                        <Badge variant={getStatusColor(match.status ?? 'new')}>
                          {match.status ?? 'new'}
                        </Badge>
                      </div>
                      <CardDescription className="text-base">
                        {match.job_opportunities.staffing_agencies?.agency_name}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* AI Quality Indicators */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {match.job_opportunities.contract_confidence_score !== null && (
                      <Badge 
                        variant={match.job_opportunities.contract_confidence_score >= 80 ? "default" : "secondary"}
                        className="gap-1"
                      >
                        {match.job_opportunities.contract_confidence_score >= 80 ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <AlertCircle className="h-3 w-3" />
                        )}
                        {match.job_opportunities.contract_confidence_score}% Contract Verified
                      </Badge>
                    )}
                    
                    {match.job_opportunities.quality_score !== null && (
                      <Badge variant="outline" className="gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Quality: {match.job_opportunities.quality_score}/100
                      </Badge>
                    )}
                    
                    {match.job_opportunities.ai_verified_at && (
                      <Badge variant="secondary">
                        AI Verified
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{match.job_opportunities.location || 'Remote'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        {match.job_opportunities.extracted_rate_min && match.job_opportunities.extracted_rate_max ? (
                          <span className="font-medium">
                            ${match.job_opportunities.extracted_rate_min}-${match.job_opportunities.extracted_rate_max}/hr
                          </span>
                        ) : match.job_opportunities.hourly_rate_min && match.job_opportunities.hourly_rate_max ? (
                          `$${match.job_opportunities.hourly_rate_min}-${match.job_opportunities.hourly_rate_max}/hr`
                        ) : (
                          'Rate not specified'
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        {match.job_opportunities.extracted_duration_months 
                          ? `${match.job_opportunities.extracted_duration_months} months`
                          : match.job_opportunities.contract_duration_months
                          ? `${match.job_opportunities.contract_duration_months} months`
                          : 'Duration not specified'
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {match.job_opportunities.posted_date && `Posted ${new Date(match.job_opportunities.posted_date).toLocaleDateString()}`}
                      </span>
                    </div>
                  </div>

                  {match.job_opportunities.job_description && (
                    <p className="text-sm text-muted-foreground">
                      {match.job_opportunities.job_description}
                    </p>
                  )}

                  {match.matching_skills && match.matching_skills.length > 0 && (
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

                  <div className="flex gap-2 pt-4 flex-wrap">
                    {/* Primary CTA - Apply to Job */}
                    {match.job_opportunities.external_url && (match.status === 'new' || match.status === 'viewed') && (
                      <Button 
                        onClick={async () => {
                          try {
                            // Open job posting in new tab - do this FIRST before async operations
                            const newWindow = window.open(match.job_opportunities.external_url ?? '', '_blank', 'noopener,noreferrer');
                            
                            if (!newWindow) {
                              toast({
                                title: "Popup Blocked",
                                description: "Please allow popups to open job postings",
                                variant: "destructive",
                              });
                              return;
                            }
                            
                            // Then mark as applied
                            await updateOpportunityStatus(match.id, 'applied');
                          } catch (error) {
                            console.error('Error opening job:', error);
                            toast({
                              title: "Error",
                              description: "Failed to open job posting",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Apply to Job
                      </Button>
                    )}
                    
                    {/* View posting for already applied jobs */}
                    {match.job_opportunities.external_url && match.status === 'applied' && (
                      <Button 
                        variant="outline"
                        onClick={() => {
                          const newWindow = window.open(match.job_opportunities.external_url ?? '', '_blank', 'noopener,noreferrer');
                          if (!newWindow) {
                            toast({
                              title: "Popup Blocked",
                              description: "Please allow popups to open job postings",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Posting
                      </Button>
                    )}
                    
                    {/* Status management buttons */}
                    {match.status === 'new' && (
                      <Button variant="outline" onClick={() => updateOpportunityStatus(match.id, 'viewed')}>
                        Mark as Viewed
                      </Button>
                    )}
                    
                    {(match.status === 'new' || match.status === 'viewed') && (
                      <>
                        <Button variant="outline" onClick={() => updateOpportunityStatus(match.id, 'not_interested')}>
                          Not Interested
                        </Button>
                      </>
                    )}
                    
                  </div>
                </CardContent>
              </Card>
            ))}
                  </div>
                  {(activeTab === 'full-time' ? fullTimeJobs.length : contractJobs.length) > displayLimit && (
                    <div className="flex justify-center mt-6">
                      <Button 
                        onClick={() => setDisplayLimit(prev => prev + 20)}
                        variant="outline"
                        size="lg"
                      >
                        Load More Opportunities ({(activeTab === 'full-time' ? fullTimeJobs.length : contractJobs.length) - displayLimit} remaining)
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>
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