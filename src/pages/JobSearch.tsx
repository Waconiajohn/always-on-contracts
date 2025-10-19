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
import { Loader2, Search, ChevronDown, ChevronUp, MapPin, DollarSign, Briefcase, Clock, Copy, Sparkles, FileText, Star, StarOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BooleanAIAssistant } from "@/components/job-search/BooleanAIAssistant";
import { SavedSearches } from "@/components/job-search/SavedSearches";
import { SavedJobsList } from "@/components/job-search/SavedJobsList";
import { QuickBooleanBuilder } from "@/components/job-search/QuickBooleanBuilder";
import { BooleanActiveIndicator } from "@/components/job-search/BooleanActiveIndicator";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [radiusMiles, setRadiusMiles] = useState<string>('50');
  const [jobs, setJobs] = useState<JobResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTime, setSearchTime] = useState<number | null>(null);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  
  // Filters
  const [dateFilter, setDateFilter] = useState<string>('30d');
  const [contractOnly, setContractOnly] = useState(false);
  const [remoteType, setRemoteType] = useState<string>('any');
  const [employmentType, setEmploymentType] = useState<string>('any');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [booleanString, setBooleanString] = useState('');
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showBooleanBuilder, setShowBooleanBuilder] = useState(false);
  const [activeSavedSearchName, setActiveSavedSearchName] = useState<string | null>(null);
  const [basicSearchCount, setBasicSearchCount] = useState<number | null>(null);
  const [booleanSearchCount, setBooleanSearchCount] = useState<number | null>(null);

  const handleApplyAISearch = async (booleanString: string) => {
    setBooleanString(booleanString);
    setShowAdvanced(true);
    setActiveSavedSearchName('AI Generated');
    
    // Scroll to the advanced filters section with smooth animation
    setTimeout(() => {
      const advancedSection = document.getElementById('advanced-filters-section');
      if (advancedSection) {
        advancedSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Add a pulsing highlight effect to the boolean input
        const booleanInput = document.getElementById('boolean-input');
        if (booleanInput) {
          booleanInput.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
          setTimeout(() => {
            booleanInput.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
          }, 2000);
        }
      }
    }, 100);

    // Auto-trigger search after a brief delay
    setTimeout(async () => {
      if (searchQuery.trim()) {
        await handleSearch(true); // Pass flag to indicate this is a boolean search
      } else {
        toast({
          title: "Search query needed",
          description: "Please enter a job title or keyword to search with the boolean string",
          variant: "destructive"
        });
      }
    }, 300);
  };
  
  const handleLoadSavedSearch = (search: any) => {
    setBooleanString(search.boolean_string);
    if (search.search_query) setSearchQuery(search.search_query);
    if (search.location) setLocation(search.location);
    if (search.filters) {
      if (search.filters.datePosted) setDateFilter(search.filters.datePosted);
      // Migrate old remote type values to new simplified system
      if (search.filters.remoteType) {
        const oldRemoteType = search.filters.remoteType;
        if (oldRemoteType === 'hybrid' || oldRemoteType === 'onsite') {
          setRemoteType('local');
        } else {
          setRemoteType(oldRemoteType);
        }
      }
      if (search.filters.employmentType) setEmploymentType(search.filters.employmentType);
      if (search.filters.contractOnly !== undefined) setContractOnly(search.filters.contractOnly);
    }
    setActiveSavedSearchName(search.name);
    setShowAdvanced(true);
  };

  const handleClearBoolean = () => {
    setBooleanString('');
    setActiveSavedSearchName(null);
    setBasicSearchCount(null);
    setBooleanSearchCount(null);
  };
  
  const [suggestedTitles, setSuggestedTitles] = useState<string[]>([]);
  const [sourceStats, setSourceStats] = useState<Record<string, { count: number; status: string }>>({});
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    initializeUser();
  }, []);

  const initializeUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      await loadVaultData(user.id);
      await loadSavedJobs(user.id);
    }
  };

  const loadSavedJobs = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('user_saved_jobs')
        .select('job_listing_id, job_listings!inner(external_id)')
        .eq('user_id', userId);

      if (data) {
        setSavedJobIds(new Set(data.map((j: any) => j.job_listings.external_id)));
      }
    } catch (error) {
      console.error('Error loading saved jobs:', error);
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

  const handleSearch = async (isBooleanSearch = false, loadMore = false) => {
    if (!searchQuery.trim()) {
      toast({
        title: "Search query required",
        description: "Please enter a job title, keyword, or company name",
        variant: "destructive"
      });
      return;
    }

    if (loadMore) {
      setIsLoadingMore(true);
    } else {
      setIsSearching(true);
      setJobs([]);
      setSourceStats({});
      setNextPageToken(null);
    }
    
    const currentBooleanActive = booleanString.trim().length > 0;

    // Store basic search count before running boolean search for comparison
    if (isBooleanSearch && currentBooleanActive && basicSearchCount === null && !loadMore) {
      setBasicSearchCount(jobs.length);
    }

    try {
      const { data, error } = await supabase.functions.invoke('unified-job-search', {
        body: {
          query: searchQuery,
          location: location || undefined,
          radiusMiles: location ? parseInt(radiusMiles) : undefined,
          nextPageToken: loadMore ? nextPageToken : undefined,
          filters: {
            datePosted: dateFilter,
            contractOnly,
            remoteType,
            employmentType,
            booleanString: booleanString.trim() || undefined
          },
          userId: userId || undefined,
          sources: ['google_jobs', 'company_boards']
        }
      });

      if (error) throw error;

      const newJobs = data.jobs || [];
      
      if (loadMore) {
        setJobs(prev => [...prev, ...newJobs]);
      } else {
        setJobs(newJobs);
      }
      
      setSearchTime(data.executionTimeMs);
      setSourceStats(data.sources || {});
      
      // Store pagination info
      if (data.pagination?.nextPageToken) {
        setNextPageToken(data.pagination.nextPageToken);
      } else {
        setNextPageToken(null);
      }

      // Store counts for comparison
      if (loadMore) {
        // Don't update counts when loading more
      } else if (currentBooleanActive) {
        setBooleanSearchCount(newJobs.length);
      } else {
        setBasicSearchCount(newJobs.length);
        setBooleanSearchCount(null);
      }

      // Show enhanced feedback for boolean searches
      if (loadMore) {
        toast({
          title: "Loaded more results",
          description: `Added ${newJobs.length} more jobs`,
        });
      } else if (isBooleanSearch && currentBooleanActive) {
        const jobCount = newJobs.length;
        const comparison = basicSearchCount ? ` (+${jobCount - basicSearchCount} more than basic search)` : '';
        
        toast({
          title: "🎯 AI Boolean Search Complete",
          description: `Found ${jobCount} jobs${comparison} in ${(data.executionTimeMs / 1000).toFixed(1)}s`,
          duration: 5000,
        });
      } else {
        toast({
          title: "Search complete",
          description: `Found ${newJobs.length} jobs in ${(data.executionTimeMs / 1000).toFixed(1)}s`,
        });
      }
    } catch (error: any) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: error.message || "Failed to search jobs",
        variant: "destructive"
      });
    } finally {
      if (loadMore) {
        setIsLoadingMore(false);
      } else {
        setIsSearching(false);
      }
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
          posted_date: job.posted_date,
          is_external: true
        }, { onConflict: 'external_url' })
        .select()
        .single();

      if (oppError) throw oppError;

      // Create application_queue record directly (manual source)
      const { error: queueError } = await supabase
        .from('application_queue')
        .insert({
          user_id: userId,
          opportunity_id: opportunity.id,
          match_score: job.match_score || 0,
          status: 'pending',
          source: 'manual'
        });

      if (queueError) throw queueError;

      toast({
        title: "Added to queue",
        description: `${job.title} at ${job.company} added to your application queue`
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

  const saveJob = async (job: JobResult) => {
    if (!userId) return;

    try {
      // First ensure job is in job_listings table
      const { data: listing, error: listingError } = await supabase
        .from('job_listings')
        .upsert({
          external_id: job.id,
          source: job.source,
          job_title: job.title,
          company_name: job.company,
          location: job.location,
          remote_type: job.remote_type,
          employment_type: job.employment_type,
          salary_min: job.salary_min,
          salary_max: job.salary_max,
          salary_currency: 'USD',
          salary_period: 'year',
          job_description: job.description,
          posted_date: job.posted_date,
          apply_url: job.apply_url,
          is_active: true,
          match_score: job.match_score,
          raw_data: {}
        }, {
          onConflict: 'external_id,source',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (listingError) throw listingError;

      // Now save to user_saved_jobs
      const { error: savedError } = await supabase
        .from('user_saved_jobs')
        .insert({
          user_id: userId,
          job_listing_id: listing.id,
          status: 'saved'
        });

      if (savedError) throw savedError;

      setSavedJobIds(prev => new Set(prev).add(job.id));

      toast({
        title: "Job saved ⭐",
        description: `${job.title} saved for later review`
      });
    } catch (error: any) {
      console.error('Save job error:', error);
      toast({
        title: "Failed to save",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const unsaveJob = async (job: JobResult) => {
    if (!userId) return;

    try {
      // Find the job_listing_id first
      const { data: listing } = await supabase
        .from('job_listings')
        .select('id')
        .eq('external_id', job.id)
        .eq('source', job.source)
        .single();

      if (!listing) {
        throw new Error('Job not found');
      }

      const { error } = await supabase
        .from('user_saved_jobs')
        .delete()
        .eq('user_id', userId)
        .eq('job_listing_id', listing.id);

      if (error) throw error;

      setSavedJobIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(job.id);
        return newSet;
      });

      toast({
        title: "Job removed",
        description: "Removed from saved jobs"
      });
    } catch (error: any) {
      console.error('Unsave job error:', error);
      toast({
        title: "Failed to remove",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const generateResumeForJob = async (job: JobResult) => {
    // Navigate to resume builder with job pre-loaded via state
    navigate('/agents/resume-builder', {
      state: {
        jobTitle: job.title,
        companyName: job.company,
        jobDescription: job.description || `${job.title} at ${job.company}`,
        fromJobSearch: true
      }
    });
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
    if (booleanString.trim()) count++;
    return count;
  }, [dateFilter, contractOnly, remoteType, employmentType, booleanString]);

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Search Jobs</h1>
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
            <div className="space-y-3">
              <div className="grid md:grid-cols-[1fr_auto] gap-3">
                <Input
                  placeholder="Search for jobs (e.g., 'Senior Product Manager' or 'AI Engineer')"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={() => handleSearch(false)} disabled={isSearching} className="min-w-[120px]">
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
              
              <div className="grid md:grid-cols-[1fr_200px] gap-3">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="City, State (e.g., Minneapolis, MN)"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-9"
                  />
                </div>
                <Select value={radiusMiles} onValueChange={setRadiusMiles} disabled={!location}>
                  <SelectTrigger>
                    <SelectValue placeholder="Radius" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 miles</SelectItem>
                    <SelectItem value="25">25 miles</SelectItem>
                    <SelectItem value="50">50 miles</SelectItem>
                    <SelectItem value="75">75 miles</SelectItem>
                    <SelectItem value="100">100 miles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6 space-y-4">
            {booleanString && activeSavedSearchName && (
              <BooleanActiveIndicator 
                booleanString={booleanString}
                searchName={activeSavedSearchName}
                onClear={handleClearBoolean}
              />
            )}
            
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
                    <SelectItem value="local">Hybrid/Onsite</SelectItem>
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
              <CollapsibleContent className="pt-4 space-y-4">
                <div className="mb-4">
                  <SavedSearches 
                    onLoadSearch={handleLoadSavedSearch}
                    currentBooleanString={booleanString}
                    currentSearchQuery={searchQuery}
                    currentLocation={location}
                    currentFilters={{
                      datePosted: dateFilter,
                      contractOnly,
                      remoteType,
                      employmentType
                    }}
                  />
                </div>
                
                <div id="advanced-filters-section" className="space-y-2 p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="font-semibold">🚀 Boolean Search String</Label>
                    <Badge variant="secondary" className="text-xs">Google Jobs Only</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Use advanced boolean operators (AND, OR, NOT) for precise searches. 
                    Note: This works best with Google Jobs; may not apply to all sources.
                  </p>
                  
                   <Button 
                    onClick={() => setShowBooleanBuilder(true)}
                    className="w-full mb-3"
                    variant="outline"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Quick Boolean Builder
                  </Button>
                  
                  <Button 
                    onClick={() => setShowAIAssistant(true)}
                    className="w-full mb-3"
                    variant="ghost"
                    size="sm"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI Boolean Assistant (Advanced)
                  </Button>
                  
                  <Input
                    id="boolean-input"
                    placeholder='e.g., ("Product Manager" OR "Program Manager") AND (Agile OR Scrum) NOT "junior"'
                    value={booleanString}
                    onChange={(e) => setBooleanString(e.target.value)}
                    className="font-mono text-sm transition-all duration-300"
                  />
                  {booleanString && (
                    <div className="flex gap-2 mt-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          navigator.clipboard.writeText(booleanString);
                          toast({
                            title: "Copied for LinkedIn",
                            description: "Paste this into LinkedIn's job search to use advanced operators"
                          });
                        }}
                      >
                        <Copy className="h-3 w-3 mr-2" />
                        Copy for LinkedIn
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setBooleanString('')}
                      >
                        Clear
                      </Button>
                    </div>
                  )}
                </div>
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
                  <p className="font-medium">Searching 7 sources...</p>
                  <p className="text-sm text-muted-foreground mt-1">Google Jobs + 6 ATS systems (150+ companies)</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-sm">
                    <span className={sourceStats.google_jobs?.status === 'success' ? 'text-green-600' : 'text-muted-foreground'}>
                      Google Jobs {sourceStats.google_jobs?.status === 'success' ? '✓' : '⏳'}
                    </span>
                    <span className={sourceStats.greenhouse?.status === 'success' ? 'text-green-600' : 'text-muted-foreground'}>
                      Greenhouse {sourceStats.greenhouse?.status === 'success' ? '✓' : '⏳'}
                    </span>
                    <span className={sourceStats.lever?.status === 'success' ? 'text-green-600' : 'text-muted-foreground'}>
                      Lever {sourceStats.lever?.status === 'success' ? '✓' : '⏳'}
                    </span>
                    <span className={sourceStats.workday?.status === 'success' ? 'text-green-600' : 'text-muted-foreground'}>
                      Workday {sourceStats.workday?.status === 'success' ? '✓' : '⏳'}
                    </span>
                    <span className={sourceStats.recruitee?.status === 'success' ? 'text-green-600' : 'text-muted-foreground'}>
                      Recruitee {sourceStats.recruitee?.status === 'success' ? '✓' : '⏳'}
                    </span>
                    <span className={sourceStats.workable?.status === 'success' ? 'text-green-600' : 'text-muted-foreground'}>
                      Workable {sourceStats.workable?.status === 'success' ? '✓' : '⏳'}
                    </span>
                    <span className={sourceStats.ashby?.status === 'success' ? 'text-green-600' : 'text-muted-foreground'}>
                      Ashby {sourceStats.ashby?.status === 'success' ? '✓' : '⏳'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Header */}
        {jobs.length > 0 && (
          <div className="mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Found {jobs.length} jobs {searchTime && `in ${(searchTime / 1000).toFixed(1)}s`}
              </p>
            </div>
            
            {/* Boolean Search Comparison Banner */}
            {booleanString && activeSavedSearchName && booleanSearchCount !== null && basicSearchCount !== null && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Badge className="shrink-0">
                      🎯 AI Boolean Search
                    </Badge>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Basic search: {basicSearchCount} jobs → Boolean search: {booleanSearchCount} jobs
                        {booleanSearchCount > basicSearchCount && (
                          <span className="text-primary ml-2">
                            (+{booleanSearchCount - basicSearchCount} more jobs found)
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Using: <code className="text-xs bg-background/50 px-1 rounded">{booleanString.length > 80 ? booleanString.slice(0, 80) + '...' : booleanString}</code>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Results */}
        <Tabs defaultValue="results" className="space-y-4">
          <TabsList>
            <TabsTrigger value="results">
              Search Results ({jobs.length})
            </TabsTrigger>
            <TabsTrigger value="saved">
              Saved Jobs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="results">
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
                        Posted {(() => {
                          try {
                            const date = new Date(job.posted_date);
                            if (isNaN(date.getTime())) {
                              return 'Recently';
                            }
                            return formatDistanceToNow(date, { addSuffix: true });
                          } catch {
                            return 'Recently';
                          }
                        })()}
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

                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => generateResumeForJob(job)} className="gap-2">
                        <FileText className="h-4 w-4" />
                        Generate Resume
                      </Button>
                      <Button onClick={() => addToQueue(job)} variant="secondary" className="gap-2">
                        Add to Queue
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => savedJobIds.has(job.id) ? unsaveJob(job) : saveJob(job)}
                        title={savedJobIds.has(job.id) ? "Remove from saved" : "Save for later"}
                      >
                        {savedJobIds.has(job.id) ? (
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ) : (
                          <StarOff className="h-4 w-4" />
                        )}
                      </Button>
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

              {/* Load More Button */}
              {!isSearching && nextPageToken && jobs.length > 0 && (
                <div className="flex justify-center pt-6">
                  <Button
                    onClick={() => handleSearch(false, true)}
                    disabled={isLoadingMore}
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading more jobs...
                      </>
                    ) : (
                      <>
                        Load More Results
                        <span className="ml-2 text-xs text-muted-foreground">
                          (Page 2+)
                        </span>
                      </>
                    )}
                  </Button>
                </div>
              )}

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
          </TabsContent>

          <TabsContent value="saved">
            <SavedJobsList />
          </TabsContent>
        </Tabs>

      {/* AI Assistants */}
      <BooleanAIAssistant
        open={showAIAssistant}
        onOpenChange={setShowAIAssistant}
        onApplySearch={handleApplyAISearch}
      />

      <QuickBooleanBuilder
        open={showBooleanBuilder}
        onOpenChange={setShowBooleanBuilder}
        onApply={(booleanStr) => {
          setBooleanString(booleanStr);
          setActiveSavedSearchName('Quick Builder');
          setShowAdvanced(true);
        }}
      />
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
