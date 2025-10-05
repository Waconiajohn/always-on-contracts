import { useState, useEffect } from "react";
import { AppNav } from "@/components/AppNav";
import { jobScraper } from "@/lib/mcp-client";
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
  Sparkles,
  X
} from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { subDays, subHours } from "date-fns";

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
  const [filteredJobs, setFilteredJobs] = useState<JobListing[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAllFilters, setShowAllFilters] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // War Chest suggestions
  const [suggestedTitles, setSuggestedTitles] = useState<string[]>([]);
  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([]);
  
  // Quick filters (top 5)
  const [dateFilter, setDateFilter] = useState<string>('24h');
  const [remoteType, setRemoteType] = useState<string>('any');
  const [employmentType, setEmploymentType] = useState<string>('any');
  const [salaryRange, setSalaryRange] = useState<string>('any');
  const [experienceLevel, setExperienceLevel] = useState<string>('any');
  
  // Extended filters (in "All Filters")
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>(["linkedin", "indeed", "glassdoor"]);

  useEffect(() => {
    const initUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        await loadWarChestData(user.id);
      }
    };
    initUser();
    loadRecentJobs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [jobs, dateFilter, remoteType, employmentType, salaryRange, experienceLevel]);

  const loadWarChestData = async (userId: string) => {
    try {
      const { data: warChest } = await supabase
        .from('career_war_chest')
        .select(`
          *,
          war_chest_transferable_skills(skill_name),
          war_chest_power_phrases(phrase_text)
        `)
        .eq('user_id', userId)
        .single();

      if (warChest) {
        // Extract job titles from analysis
        const analysis = warChest.initial_analysis as any;
        const titles = analysis?.recommended_positions || [];
        setSuggestedTitles(titles.slice(0, 5));

        // Extract skills
        const skills = warChest.war_chest_transferable_skills?.map((s: any) => s.skill_name) || [];
        setSuggestedSkills(skills.slice(0, 8));
      }
    } catch (error) {
      console.error('Error loading War Chest data:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...jobs];

    // Date filter
    if (dateFilter !== 'any') {
      const now = new Date();
      const cutoff = dateFilter === '24h' ? subHours(now, 24) :
                     dateFilter === '3d' ? subDays(now, 3) :
                     dateFilter === 'week' ? subDays(now, 7) :
                     null;
      
      if (cutoff) {
        filtered = filtered.filter(j => 
          j.posted_date && new Date(j.posted_date) >= cutoff
        );
      }
    }

    // Remote type filter
    if (remoteType !== 'any') {
      filtered = filtered.filter(j => j.remote_type === remoteType);
    }

    // Employment type filter
    if (employmentType !== 'any') {
      filtered = filtered.filter(j => j.employment_type === employmentType);
    }

    // Salary range filter
    if (salaryRange !== 'any') {
      const minSalary = parseInt(salaryRange);
      filtered = filtered.filter(j => 
        j.salary_min && j.salary_min >= minSalary
      );
    }

    setFilteredJobs(filtered);
  };

  const getAppliedFiltersCount = () => {
    let count = 0;
    if (dateFilter !== 'any') count++;
    if (remoteType !== 'any') count++;
    if (employmentType !== 'any') count++;
    if (salaryRange !== 'any') count++;
    if (experienceLevel !== 'any') count++;
    if (selectedLocations.length > 0) count++;
    if (selectedIndustries.length > 0) count++;
    return count;
  };

  const clearFilters = () => {
    setDateFilter('24h');
    setRemoteType('any');
    setEmploymentType('any');
    setSalaryRange('any');
    setExperienceLevel('any');
    setSelectedLocations([]);
    setSelectedIndustries([]);
  };

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
          remote_types: remoteType !== 'any' ? [remoteType] : [],
          employment_types: employmentType !== 'any' ? [employmentType] : [],
          salary_min: salaryRange !== 'any' ? parseInt(salaryRange) : null,
          sources: selectedSources
        }
        }])
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Use MCP job scraper
      await jobScraper.scrapeJobs(
        searchQuery,
        selectedLocations[0],
        selectedSources,
        100
      );

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

        {/* War Chest Suggestions */}
        {(suggestedTitles.length > 0 || suggestedSkills.length > 0) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-primary" />
                Suggested by Your War Chest
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {suggestedTitles.length > 0 && (
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">Job Titles</Label>
                  <div className="flex flex-wrap gap-2">
                    {suggestedTitles.map((title, idx) => (
                      <Badge 
                        key={idx} 
                        variant="outline" 
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                        onClick={() => setSearchQuery(title)}
                      >
                        {title}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {suggestedSkills.length > 0 && (
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">Your Skills</Label>
                  <div className="flex flex-wrap gap-2">
                    {suggestedSkills.map((skill, idx) => (
                      <Badge key={idx} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
            </div>

            {/* Date & Quick Filters */}
            <div className="mt-6 space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <Label className="font-semibold">Posted:</Label>
                <ToggleGroup type="single" value={dateFilter} onValueChange={(v) => v && setDateFilter(v)}>
                  <ToggleGroupItem value="24h" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                    Last 24 Hours ({jobs.filter(j => j.posted_date && new Date(j.posted_date) >= subHours(new Date(), 24)).length})
                  </ToggleGroupItem>
                  <ToggleGroupItem value="3d" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                    Last 3 Days ({jobs.filter(j => j.posted_date && new Date(j.posted_date) >= subDays(new Date(), 3)).length})
                  </ToggleGroupItem>
                  <ToggleGroupItem value="week" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                    Last Week ({jobs.filter(j => j.posted_date && new Date(j.posted_date) >= subDays(new Date(), 7)).length})
                  </ToggleGroupItem>
                  <ToggleGroupItem value="any" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                    Any Time ({jobs.length})
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Label className="font-semibold">Quick Filters:</Label>
                
                <Select value={remoteType} onValueChange={setRemoteType}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Location</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="onsite">On-site</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={employmentType} onValueChange={setEmploymentType}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Job Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Type</SelectItem>
                    <SelectItem value="full-time">Full-Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="part-time">Part-Time</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={salaryRange} onValueChange={setSalaryRange}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Salary" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Salary</SelectItem>
                    <SelectItem value="50000">$50K+</SelectItem>
                    <SelectItem value="75000">$75K+</SelectItem>
                    <SelectItem value="100000">$100K+</SelectItem>
                    <SelectItem value="150000">$150K+</SelectItem>
                    <SelectItem value="200000">$200K+</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Level</SelectItem>
                    <SelectItem value="entry">Entry Level</SelectItem>
                    <SelectItem value="mid">Mid-Level</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  variant="outline" 
                  onClick={() => setShowAllFilters(!showAllFilters)}
                  className="gap-2"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  All Filters
                  {getAppliedFiltersCount() > 5 && (
                    <Badge variant="secondary">{getAppliedFiltersCount() - 5} more</Badge>
                  )}
                </Button>

                {getAppliedFiltersCount() > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
                    <X className="h-4 w-4" />
                    Clear All
                  </Button>
                )}
              </div>
            </div>

            {/* All Filters Panel */}
            {showAllFilters && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Additional Filters
                </h3>
                
                <div className="grid md:grid-cols-3 gap-4">
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

                  <div className="space-y-2">
                    <Label>Locations</Label>
                    <div className="space-y-2">
                      {['New York', 'San Francisco', 'Austin', 'Remote'].map((loc) => (
                        <div key={loc} className="flex items-center space-x-2">
                          <Checkbox
                            checked={selectedLocations.includes(loc)}
                            onCheckedChange={(checked) => {
                              setSelectedLocations(
                                checked
                                  ? [...selectedLocations, loc]
                                  : selectedLocations.filter((l) => l !== loc)
                              );
                            }}
                          />
                          <Label>{loc}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Industries</Label>
                    <div className="space-y-2">
                      {['Technology', 'Finance', 'Healthcare', 'Retail'].map((industry) => (
                        <div key={industry} className="flex items-center space-x-2">
                          <Checkbox
                            checked={selectedIndustries.includes(industry)}
                            onCheckedChange={(checked) => {
                              setSelectedIndustries(
                                checked
                                  ? [...selectedIndustries, industry]
                                  : selectedIndustries.filter((i) => i !== industry)
                              );
                            }}
                          />
                          <Label>{industry}</Label>
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
            <TabsTrigger value="all">All Jobs ({filteredJobs.length})</TabsTrigger>
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
            {filteredJobs.map((job) => (
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
