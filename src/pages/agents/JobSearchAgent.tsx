import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { VoiceInput } from "@/components/VoiceInput";
import { 
  Search, 
  BookmarkCheck, 
  TrendingUp, 
  Brain, 
  AlertTriangle, 
  Bookmark, 
  Sparkles,
  MapPin,
  DollarSign,
  Building,
  Clock,
  Send,
  SlidersHorizontal,
  Filter,
  X
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { subDays, subHours } from "date-fns";
import { jobScraper } from "@/lib/mcp-client";

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
  raw_data?: any;
}

interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

const JobSearchAgentContent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("search");
  const [useTransferableSkills, setUseTransferableSkills] = useState(false);
  const [warChestStats, setWarChestStats] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobListing[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAllFilters, setShowAllFilters] = useState(false);
  
  // War Chest suggestions
  const [suggestedTitles, setSuggestedTitles] = useState<string[]>([]);
  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([]);
  
  // Filters
  const [dateFilter, setDateFilter] = useState<string>('24h');
  const [remoteType, setRemoteType] = useState<string>('any');
  const [employmentType, setEmploymentType] = useState<string>('any');
  const [salaryRange, setSalaryRange] = useState<string>('any');
  const [experienceLevel, setExperienceLevel] = useState<string>('any');
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>(["linkedin", "indeed", "glassdoor"]);

  // AI Chat state
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  const loadWarChestData = async (userId: string) => {
    try {
      const { data: warChest } = await supabase
        .from('career_vault')
        .select(`
          *,
          vault_transferable_skills(skill_name, source_industry, target_industry),
          vault_power_phrases(phrase_text)
        `)
        .eq('user_id', userId)
        .single();

      if (warChest) {
        setWarChestStats(warChest);
        const analysis = warChest.initial_analysis as any;
        const titles = analysis?.recommended_positions || [];
        setSuggestedTitles(titles.slice(0, 5));

        const skills = warChest.vault_transferable_skills?.map((s: any) => s.skill_name) || [];
        setSuggestedSkills(skills.slice(0, 8));

        // Send initial AI greeting
        if (titles.length > 0) {
          setAiMessages([{
            role: 'assistant',
            content: `👋 Hi! Based on your War Chest, I can help you find ${titles.join(', ')} positions. What are you looking for today?`
          }]);
        }
      }
    } catch (error) {
      console.error('Error loading War Chest data:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...jobs];

    if (dateFilter !== 'any') {
      const now = new Date();
      const cutoff = dateFilter === '24h' ? subHours(now, 24) :
                     dateFilter === '3d' ? subDays(now, 3) :
                     dateFilter === 'week' ? subDays(now, 7) : null;
      
      if (cutoff) {
        filtered = filtered.filter(j => 
          j.posted_date && new Date(j.posted_date) >= cutoff
        );
      }
    }

    if (remoteType !== 'any') {
      filtered = filtered.filter(j => j.remote_type === remoteType);
    }

    if (employmentType !== 'any') {
      filtered = filtered.filter(j => j.employment_type === employmentType);
    }

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
    if (dateFilter !== '24h') count++;
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
      if (!userId) throw new Error('User not authenticated');

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
            sources: selectedSources,
            includeTransferableSkills: useTransferableSkills
          }
        }])
        .select()
        .single();

      if (sessionError) throw sessionError;

      await jobScraper.scrapeJobs(
        searchQuery,
        selectedLocations[0],
        selectedSources,
        100
      );

      toast({
        title: "Search started",
        description: `Searching for "${searchQuery}"...`,
      });

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
      if (!userId) throw new Error('User not authenticated');

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

  const sendAiMessage = async (userMessage?: string) => {
    const messageToSend = userMessage || aiInput.trim();
    if (!messageToSend) return;

    const newMessages = [...aiMessages, { role: 'user' as const, content: messageToSend }];
    setAiMessages(newMessages);
    setAiInput("");
    setIsAiTyping(true);

    try {
      const context = {
        skills: suggestedSkills,
        titles: suggestedTitles,
        transferableSkills: warChestStats?.total_transferable_skills || 0,
        query: searchQuery,
        resultsCount: filteredJobs.length,
        activeFilters: getAppliedFiltersCount()
      };

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/job-search-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: newMessages, context }),
      });

      if (!response.ok || !response.body) throw new Error('Failed to get AI response');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      setAiMessages([...newMessages, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ') && !line.includes('[DONE]')) {
            try {
              const data = JSON.parse(line.slice(6));
              const content = data.choices?.[0]?.delta?.content;
              if (content) {
                assistantMessage += content;
                setAiMessages([...newMessages, { role: 'assistant', content: assistantMessage }]);
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error('AI error:', error);
      setAiMessages([...newMessages, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleVoiceTranscript = (text: string) => {
    setAiInput(text);
  };

  const handleToggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const formatSalary = (min?: number, max?: number, period?: string) => {
    if (!min && !max) return null;
    const formatted = min && max ? `$${min.toLocaleString()} - $${max.toLocaleString()}` : 
                      min ? `$${min.toLocaleString()}+` :
                      max ? `Up to $${max.toLocaleString()}` : null;
    return formatted ? `${formatted} ${period || 'annual'}` : null;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Job Search Agent</h1>
          <p className="text-muted-foreground">AI-powered job discovery with your War Chest</p>
        </div>

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
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 p-6 flex flex-col h-[calc(100vh-300px)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">Search Assistant</h2>
                <p className="text-sm text-muted-foreground">AI co-pilot</p>
              </div>
            </div>

            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4">
                {aiMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground ml-8'
                        : 'bg-muted mr-8'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                ))}
                {isAiTyping && (
                  <div className="bg-muted p-3 rounded-lg mr-8">
                    <p className="text-sm text-muted-foreground">Typing...</p>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </ScrollArea>

            <div className="mt-4 bg-muted p-3 rounded-lg border-l-4 border-yellow-500">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <Label htmlFor="transferable-skills" className="text-xs font-semibold">
                    Transferable Skills
                  </Label>
                </div>
                <Switch 
                  id="transferable-skills"
                  checked={useTransferableSkills}
                  onCheckedChange={setUseTransferableSkills}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Expands search to cross-industry roles
              </p>
              {warChestStats && (
                <Badge variant="outline" className="text-xs mt-2">
                  {warChestStats.total_transferable_skills} skills available
                </Badge>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <Input
                placeholder="Ask me anything..."
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendAiMessage()}
              />
              <VoiceInput 
                onTranscript={handleVoiceTranscript}
                isRecording={isRecording}
                onToggleRecording={handleToggleRecording}
              />
              <Button onClick={() => sendAiMessage()} disabled={!aiInput.trim() || isAiTyping}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </Card>

          <Card className="lg:col-span-2 p-6">
            <div className="mb-6">
              <div className="flex gap-2">
                <Input
                  placeholder="Job title, keyword, or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="text-lg h-12"
                />
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

              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Label className="font-semibold text-sm">Posted:</Label>
                  <ToggleGroup type="single" value={dateFilter} onValueChange={(v) => v && setDateFilter(v)} size="sm">
                    <ToggleGroupItem value="24h">Last 24h</ToggleGroupItem>
                    <ToggleGroupItem value="3d">3 Days</ToggleGroupItem>
                    <ToggleGroupItem value="week">Week</ToggleGroupItem>
                    <ToggleGroupItem value="any">Any</ToggleGroupItem>
                  </ToggleGroup>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Label className="font-semibold text-sm">Filters:</Label>
                  
                  <Select value={remoteType} onValueChange={setRemoteType}>
                    <SelectTrigger className="w-[130px] h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Location</SelectItem>
                      <SelectItem value="remote">Remote</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                      <SelectItem value="onsite">On-site</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={employmentType} onValueChange={setEmploymentType}>
                    <SelectTrigger className="w-[130px] h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Type</SelectItem>
                      <SelectItem value="full-time">Full-Time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="part-time">Part-Time</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={salaryRange} onValueChange={setSalaryRange}>
                    <SelectTrigger className="w-[130px] h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Salary</SelectItem>
                      <SelectItem value="50000">$50K+</SelectItem>
                      <SelectItem value="75000">$75K+</SelectItem>
                      <SelectItem value="100000">$100K+</SelectItem>
                      <SelectItem value="150000">$150K+</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowAllFilters(!showAllFilters)}
                    className="gap-2"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    All Filters
                    {getAppliedFiltersCount() > 0 && (
                      <Badge variant="secondary">{getAppliedFiltersCount()}</Badge>
                    )}
                  </Button>

                  {getAppliedFiltersCount() > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
                      <X className="h-4 w-4" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              {showAllFilters && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Additional Filters
                  </h3>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Job Boards</Label>
                      <div className="space-y-1">
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
                            <Label className="capitalize text-sm">{source}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm">Locations</Label>
                      <div className="space-y-1">
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
                            <Label className="text-sm">{loc}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm">Industries</Label>
                      <div className="space-y-1">
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
                            <Label className="text-sm">{industry}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="search" className="gap-2">
                  <Search className="h-4 w-4" />
                  Latest ({filteredJobs.length})
                </TabsTrigger>
                <TabsTrigger value="saved" className="gap-2">
                  <BookmarkCheck className="h-4 w-4" />
                  Saved
                </TabsTrigger>
                <TabsTrigger value="trending" className="gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Trending
                </TabsTrigger>
              </TabsList>

              <TabsContent value="search" className="mt-4">
                <ScrollArea className="h-[calc(100vh-500px)]">
                  <div className="space-y-4">
                    {filteredJobs.map((job) => (
                      <Card key={job.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-3">
                                {job.company_logo_url && (
                                  <img 
                                    src={job.company_logo_url} 
                                    alt={job.company_name}
                                    className="h-10 w-10 rounded object-contain"
                                  />
                                )}
                                <div>
                                  <CardTitle className="text-lg">{job.job_title}</CardTitle>
                                  <CardDescription className="flex items-center gap-2">
                                    <Building className="h-3 w-3" />
                                    {job.company_name}
                                  </CardDescription>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {job.location && (
                                  <Badge variant="secondary" className="gap-1 text-xs">
                                    <MapPin className="h-3 w-3" />
                                    {job.location}
                                  </Badge>
                                )}
                                {job.remote_type && (
                                  <Badge variant="secondary" className="text-xs">{job.remote_type}</Badge>
                                )}
                                {job.employment_type && (
                                  <Badge variant="secondary" className="text-xs">{job.employment_type}</Badge>
                                )}
                                {formatSalary(job.salary_min, job.salary_max, job.salary_period) && (
                                  <Badge variant="secondary" className="gap-1 text-xs">
                                    <DollarSign className="h-3 w-3" />
                                    {formatSalary(job.salary_min, job.salary_max, job.salary_period)}
                                  </Badge>
                                )}
                                {job.raw_data?.is_transferable_match && (
                                  <Badge variant="outline" className="gap-1 text-xs border-primary">
                                    🔄 Transferable Skills
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSaveJob(job.id)}
                            >
                              <Bookmark className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-3">
                          {job.job_description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {job.job_description}
                            </p>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              Posted {job.posted_date ? new Date(job.posted_date).toLocaleDateString() : 'recently'}
                            </div>

                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" asChild>
                                <a href={job.apply_url} target="_blank" rel="noopener noreferrer">
                                  View
                                </a>
                              </Button>
                              <Button size="sm" className="gap-1">
                                <Send className="h-3 w-3" />
                                Apply
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {filteredJobs.length === 0 && (
                      <Card>
                        <CardContent className="py-12 text-center">
                          <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
                          <p className="text-muted-foreground text-sm">
                            Start a search or try different filters
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="saved" className="mt-4">
                <Card>
                  <CardContent className="py-12 text-center">
                    <BookmarkCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No saved jobs yet</h3>
                    <p className="text-muted-foreground text-sm">
                      Bookmark jobs to save them here
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="trending" className="mt-4">
                <Card>
                  <CardContent className="py-12 text-center">
                    <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Trending opportunities</h3>
                    <p className="text-muted-foreground text-sm">
                      Based on your field and market demand
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default function JobSearchAgent() {
  return (
    <ProtectedRoute>
      <JobSearchAgentContent />
    </ProtectedRoute>
  );
}
