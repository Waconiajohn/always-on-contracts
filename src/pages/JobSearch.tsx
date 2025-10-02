import { useState, useEffect } from "react";
import { AppNav } from "@/components/AppNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  MapPin, 
  DollarSign, 
  Briefcase, 
  Building, 
  Clock, 
  Bookmark, 
  Send,
  Filter,
  SlidersHorizontal,
  TrendingUp,
  Sparkles
} from "lucide-react";

interface JobListing {
  id: string;
  job_title: string;
  company_name: string;
  company_logo_url?: string;
  location?: string;
  remote_type?: string;
  employment_type?: string;
  salary_min?: number;
  salary_max?: number;
  salary_period?: string;
  job_description?: string;
  posted_date?: string;
  apply_url?: string;
  match_score?: number;
  source: string;
}

export default function JobSearch() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Filter states
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedRemoteTypes, setSelectedRemoteTypes] = useState<string[]>([]);
  const [selectedEmploymentTypes, setSelectedEmploymentTypes] = useState<string[]>([]);
  const [salaryMin, setSalaryMin] = useState<string>("");
  const [selectedSources, setSelectedSources] = useState<string[]>(["linkedin", "indeed", "glassdoor"]);

  useEffect(() => {
    const initUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    initUser();
    loadRecentJobs();
  }, []);

  const loadRecentJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('job_listings')
        .select('*')
        .eq('is_active', true)
        .order('posted_date', { ascending: false })
        .limit(20);

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error loading jobs:', error);
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
    try {
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Create search session
      const { data: session, error: sessionError } = await supabase
        .from('job_search_sessions')
        .insert([{
          user_id: userId,
          search_query: searchQuery,
          filters: {
            locations: selectedLocations,
            remote_types: selectedRemoteTypes,
            employment_types: selectedEmploymentTypes,
            salary_min: salaryMin ? parseInt(salaryMin) : null,
            sources: selectedSources
          }
        }])
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Invoke scraping function
      const { data, error } = await supabase.functions.invoke('scrape-jobs', {
        body: {
          sessionId: session.id,
          query: searchQuery,
          filters: {
            locations: selectedLocations,
            remote_types: selectedRemoteTypes,
            employment_types: selectedEmploymentTypes,
            salary_min: salaryMin ? parseInt(salaryMin) : null,
            sources: selectedSources
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Search started",
        description: `Searching for "${searchQuery}" across ${selectedSources.length} job boards...`,
      });

      // Poll for results
      pollSearchResults(session.id);
    } catch (error: any) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: error.message || "Failed to start job search",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const pollSearchResults = async (sessionId: string) => {
    const maxAttempts = 30;
    let attempts = 0;

    const poll = async () => {
      attempts++;
      
      const { data: session } = await supabase
        .from('job_search_sessions')
        .select('status, results_count')
        .eq('id', sessionId)
        .single();

      if (session?.status === 'completed') {
        loadRecentJobs();
        toast({
          title: "Search complete",
          description: `Found ${session.results_count} jobs`,
        });
        return;
      }

      if (session?.status === 'failed') {
        toast({
          title: "Search failed",
          description: "Unable to complete job search",
          variant: "destructive"
        });
        return;
      }

      if (attempts < maxAttempts) {
        setTimeout(poll, 2000);
      }
    };

    poll();
  };

  const handleSaveJob = async (jobId: string) => {
    try {
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('user_saved_jobs')
        .insert([{
          user_id: userId,
          job_listing_id: jobId,
          status: 'saved'
        }]);

      if (error) throw error;

      toast({
        title: "Job saved",
        description: "Added to your saved jobs",
      });
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: "Failed to save",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const formatSalary = (min?: number, max?: number, period?: string) => {
    if (!min && !max) return null;
    const formatted = min && max ? `$${min.toLocaleString()} - $${max.toLocaleString()}` : 
                      min ? `$${min.toLocaleString()}+` :
                      max ? `Up to $${max.toLocaleString()}` : null;
    return formatted ? `${formatted} ${period || 'annual'}` : null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      <AppNav />
      
      <div className="container py-8">
        {/* Header */}
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Intelligent Job Search</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            AI-powered job discovery across LinkedIn, Indeed, and Glassdoor
          </p>
        </div>

        {/* Search Bar */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Job title, keyword, or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="text-lg h-12"
                />
              </div>
              <Button 
                onClick={handleSearch} 
                disabled={isSearching}
                size="lg"
                className="gap-2"
              >
                <Search className="h-5 w-5" />
                {isSearching ? "Searching..." : "Search"}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <SlidersHorizontal className="h-5 w-5" />
                Filters
              </Button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-6 space-y-4 p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Advanced Filters
                </h3>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Minimum Salary</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 80000"
                      value={salaryMin}
                      onChange={(e) => setSalaryMin(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Work Location</Label>
                    <div className="space-y-2">
                      {['remote', 'hybrid', 'onsite'].map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            checked={selectedRemoteTypes.includes(type)}
                            onCheckedChange={(checked) => {
                              setSelectedRemoteTypes(
                                checked
                                  ? [...selectedRemoteTypes, type]
                                  : selectedRemoteTypes.filter((t) => t !== type)
                              );
                            }}
                          />
                          <Label className="capitalize">{type}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Employment Type</Label>
                    <div className="space-y-2">
                      {['full-time', 'contract', 'part-time'].map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            checked={selectedEmploymentTypes.includes(type)}
                            onCheckedChange={(checked) => {
                              setSelectedEmploymentTypes(
                                checked
                                  ? [...selectedEmploymentTypes, type]
                                  : selectedEmploymentTypes.filter((t) => t !== type)
                              );
                            }}
                          />
                          <Label className="capitalize">{type.replace('-', ' ')}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Job Boards</Label>
                    <div className="space-y-2">
                      {['linkedin', 'indeed', 'glassdoor'].map((source) => (
                        <div key={source} className="flex items-center space-x-2">
                          <Checkbox
                            checked={selectedSources.includes(source)}
                            onCheckedChange={(checked) => {
                              setSelectedSources(
                                checked
                                  ? [...selectedSources, source]
                                  : selectedSources.filter((s) => s !== source)
                              );
                            }}
                          />
                          <Label className="capitalize">{source}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Jobs ({jobs.length})</TabsTrigger>
            <TabsTrigger value="best-match">
              <Sparkles className="h-4 w-4 mr-2" />
              Best Matches
            </TabsTrigger>
            <TabsTrigger value="saved">
              <Bookmark className="h-4 w-4 mr-2" />
              Saved
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {jobs.map((job) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        {job.company_logo_url && (
                          <img 
                            src={job.company_logo_url} 
                            alt={job.company_name}
                            className="h-12 w-12 rounded object-contain"
                          />
                        )}
                        <div>
                          <CardTitle className="text-xl">{job.job_title}</CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            {job.company_name}
                          </CardDescription>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {job.location && (
                          <Badge variant="secondary" className="gap-1">
                            <MapPin className="h-3 w-3" />
                            {job.location}
                          </Badge>
                        )}
                        {job.remote_type && (
                          <Badge variant="secondary">{job.remote_type}</Badge>
                        )}
                        {job.employment_type && (
                          <Badge variant="secondary">{job.employment_type}</Badge>
                        )}
                        {formatSalary(job.salary_min, job.salary_max, job.salary_period) && (
                          <Badge variant="secondary" className="gap-1">
                            <DollarSign className="h-3 w-3" />
                            {formatSalary(job.salary_min, job.salary_max, job.salary_period)}
                          </Badge>
                        )}
                        {job.match_score && (
                          <Badge variant="default" className="gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {Math.round(job.match_score)}% Match
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSaveJob(job.id)}
                      >
                        <Bookmark className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {job.job_description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {job.job_description}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Posted {job.posted_date ? new Date(job.posted_date).toLocaleDateString() : 'recently'}
                      <Separator orientation="vertical" className="h-4" />
                      <Badge variant="outline" className="capitalize">{job.source}</Badge>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" asChild>
                        <a href={job.apply_url} target="_blank" rel="noopener noreferrer">
                          View Details
                        </a>
                      </Button>
                      <Button className="gap-2">
                        <Send className="h-4 w-4" />
                        Quick Apply
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {jobs.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
                  <p className="text-muted-foreground">
                    Try a different search query or adjust your filters
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="best-match">
            <Card>
              <CardContent className="py-12 text-center">
                <Sparkles className="h-12 w-12 mx-auto text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">AI-Powered Matching Coming Soon</h3>
                <p className="text-muted-foreground">
                  We'll analyze your resume and preferences to find your perfect matches
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="saved">
            <Card>
              <CardContent className="py-12 text-center">
                <Bookmark className="h-12 w-12 mx-auto text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">No saved jobs yet</h3>
                <p className="text-muted-foreground">
                  Click the bookmark icon on any job to save it here
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
