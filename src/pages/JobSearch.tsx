import { useState, useEffect, useMemo } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppNav } from "@/components/AppNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Search, ChevronDown, ChevronUp, MapPin, DollarSign, Briefcase, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface JobResult {
  id: string;
  title: string;
  company: string;
  location: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  description?: string | null;
  posted_date: string;
  apply_url: string | null;
  source: string;
  remote_type?: string | null;
  employment_type?: string | null;
  match_score?: number | null;
  required_skills?: string[] | null;
}

const JobSearchContent = () => {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [jobs, setJobs] = useState<JobResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTime, setSearchTime] = useState<number | null>(null);
  
  // Filters
  const [dateFilter, setDateFilter] = useState<string>('24h');
  const [contractOnly, setContractOnly] = useState(false);
  const [remoteType, setRemoteType] = useState<string>('any');
  const [employmentType, setEmploymentType] = useState<string>('any');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Vault suggestions
  const [suggestedTitles, setSuggestedTitles] = useState<string[]>([]);
  const [sourceStats, setSourceStats] = useState<Record<string, { count: number; status: string }>>({});

  useEffect(() => {
    initializeUser();
  }, []);

  const initializeUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      await loadVaultData(user.id);
    }
  };

  const loadVaultData = async (userId: string) => {
    try {
      const { data: vault } = await supabase
        .from('career_vault')
        .select('initial_analysis')
        .eq('user_id', userId)
        .maybeSingle();

      if (vault?.initial_analysis) {
        const analysis = vault.initial_analysis as any;
        const titles = analysis?.recommended_positions || [];
        setSuggestedTitles(titles.slice(0, 5));
      }
    } catch (error) {
      console.error('Error loading Career Vault data:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Search query required",
        description: "Please enter a job title, keyword, or company name",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    setJobs([]);
    setSourceStats({});

    try {
      const { data, error } = await supabase.functions.invoke('unified-job-search', {
        body: {
          query: searchQuery,
          location: location || undefined,
          filters: {
            datePosted: dateFilter,
            contractOnly,
            remoteType,
            employmentType
          },
          userId: userId || undefined,
          sources: ['google_jobs', 'company_boards']
        }
      });

      if (error) throw error;

      setJobs(data.jobs || []);
      setSourceStats(data.sources || {});
      setSearchTime(data.executionTime);

      toast({
        title: "Search complete",
        description: `Found ${data.jobs?.length || 0} jobs in ${(data.executionTime / 1000).toFixed(1)}s`,
      });
    } catch (error: any) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: error.message || "Failed to search jobs",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const addToQueue = async (job: JobResult) => {
    if (!userId) return;

    try {
      // First create or find a job opportunity record
      const { data: opportunity, error: oppError } = await supabase
        .from('job_opportunities')
        .upsert({
          job_title: job.title,
          job_description: job.description,
          location: job.location,
          external_url: job.apply_url,
          source: job.source,
          status: 'active',
          posted_date: job.posted_date
        }, { onConflict: 'external_url' })
        .select()
        .single();

      if (oppError) throw oppError;

      // Then create match record
      const { error: matchError } = await supabase
        .from('opportunity_matches')
        .insert({
          user_id: userId,
          opportunity_id: opportunity.id,
          match_score: job.match_score || 0,
          status: 'pending'
        });

      if (matchError) throw matchError;

      toast({
        title: "Added to queue",
        description: `${job.title} at ${job.company} added to your opportunities`
      });
    } catch (error: any) {
      console.error('Add to queue error:', error);
      toast({
        title: "Failed to add",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-blue-600 dark:text-blue-400";
    if (score >= 40) return "text-yellow-600 dark:text-yellow-400";
    return "text-muted-foreground";
  };

  const formatSalary = (min?: number | null, max?: number | null) => {
    if (!min && !max) return null;
    if (min && max) return `$${(min / 1000).toFixed(0)}k-$${(max / 1000).toFixed(0)}k`;
    if (min) return `$${(min / 1000).toFixed(0)}k+`;
    if (max) return `Up to $${(max / 1000).toFixed(0)}k`;
    return null;
  };

  const appliedFiltersCount = useMemo(() => {
    let count = 0;
    if (dateFilter !== '24h') count++;
    if (contractOnly) count++;
    if (remoteType !== 'any') count++;
    if (employmentType !== 'any') count++;
    return count;
  }, [dateFilter, contractOnly, remoteType, employmentType]);

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Job Search</h1>
          <p className="text-muted-foreground">Live results from 50+ sources</p>
        </div>

        {/* Vault Suggestions */}
        {suggestedTitles.length > 0 && (
          <Card className="mb-6 border-primary/20">
            <CardContent className="pt-6">
              <Label className="text-sm text-muted-foreground mb-3 block">💡 From your Career Vault:</Label>
              <div className="flex flex-wrap gap-2">
                {suggestedTitles.map((title) => (
                  <Badge
                    key={title}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    onClick={() => setSearchQuery(title)}
                  >
                    {title}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-[1fr_300px_auto] gap-3">
              <Input
                placeholder="Search for jobs (e.g., 'Senior Product Manager' or 'AI Engineer')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Input
                placeholder="Location (optional)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={isSearching} className="min-w-[100px]">
                {isSearching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Searching
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Posted</Label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">Last 24 hours</SelectItem>
                    <SelectItem value="3d">Last 3 days</SelectItem>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="14d">Last 14 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="any">Any time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Remote</Label>
                <Select value={remoteType} onValueChange={setRemoteType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="onsite">Onsite</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Employment Type</Label>
                <Select value={employmentType} onValueChange={setEmploymentType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="freelance">Freelance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-7">
                <Switch
                  id="contract-only"
                  checked={contractOnly}
                  onCheckedChange={setContractOnly}
                />
                <Label htmlFor="contract-only">Contract Only</Label>
              </div>
            </div>

            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full">
                  {showAdvanced ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
                  Advanced Filters {appliedFiltersCount > 0 && `(${appliedFiltersCount} applied)`}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 space-y-2">
                <p className="text-sm text-muted-foreground">Additional filters coming soon...</p>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>

        {/* Search Progress */}
        {isSearching && (
          <Card className="mb-6 border-primary">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Loader2 className="h-5 w-5 animate-spin" />
                <div className="flex-1">
                  <p className="font-medium">Searching 2 sources...</p>
                  <div className="flex gap-3 mt-2 text-sm">
                    <span className={sourceStats.google_jobs?.status === 'success' ? 'text-green-600' : 'text-muted-foreground'}>
                      Google Jobs {sourceStats.google_jobs?.status === 'success' ? '✓' : '⏳'}
                    </span>
                    <span className={sourceStats.company_boards?.status === 'success' ? 'text-green-600' : 'text-muted-foreground'}>
                      Company Boards {sourceStats.company_boards?.status === 'success' ? '✓' : '⏳'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Header */}
        {jobs.length > 0 && (
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Found {jobs.length} jobs {searchTime && `in ${(searchTime / 1000).toFixed(1)}s`}
            </p>
          </div>
        )}

        {/* Results */}
        <div className="space-y-4">
          {jobs.map((job) => (
            <Card key={job.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-semibold">{job.title}</h3>
                      {job.match_score && job.match_score > 0 && (
                        <Badge variant="outline" className={getScoreColor(job.match_score)}>
                          {job.match_score}% Match
                        </Badge>
                      )}
                      {contractOnly && (
                        <Badge variant="secondary">Contract</Badge>
                      )}
                    </div>
                    <p className="text-lg text-muted-foreground">{job.company}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                  {job.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {job.location}
                    </div>
                  )}
                  {formatSalary(job.salary_min, job.salary_max) && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {formatSalary(job.salary_min, job.salary_max)}
                    </div>
                  )}
                  {job.employment_type && (
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      {job.employment_type}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Posted {formatDistanceToNow(new Date(job.posted_date), { addSuffix: true })}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline">{job.source}</Badge>
                  {job.remote_type && (
                    <Badge variant="secondary">{job.remote_type}</Badge>
                  )}
                </div>

                {job.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {job.description}
                  </p>
                )}

                <div className="flex gap-2">
                  <Button onClick={() => addToQueue(job)}>Add to Queue</Button>
                  {job.apply_url && (
                    <Button variant="outline" asChild>
                      <a href={job.apply_url} target="_blank" rel="noopener noreferrer">
                        View Details
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {!isSearching && jobs.length === 0 && searchQuery && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No jobs found. Try adjusting your search or filters.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default function JobSearch() {
  return (
    <ProtectedRoute>
      <JobSearchContent />
    </ProtectedRoute>
  );
}
