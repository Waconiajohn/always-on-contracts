import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { subDays, subHours } from "date-fns";
import { jobSearch } from "@/lib/mcp-client";
import { SearchFilters } from "@/components/job-search/SearchFilters";
import { SearchResults } from "@/components/job-search/SearchResults";
import { AIAssistant } from "@/components/job-search/AIAssistant";
import { VaultSuggestions } from "@/components/job-search/VaultSuggestions";
import { logger } from "@/lib/logger";

interface JobListing {
  id: string;
  job_title: string;
  company_name: string;
  company_logo_url?: string | null;
  location?: string | null;
  remote_type?: string | null;
  employment_type?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_period?: string | null;
  job_description?: string | null;
  posted_date?: string | null;
  apply_url?: string | null;
  match_score?: number | null;
  source: string;
  raw_data?: any;
}

interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface VaultData {
  initial_analysis: any;
  vault_transferable_skills?: Array<{ stated_skill: string }>;
  total_transferable_skills: number | null;
}

const JobSearchAgentContent = () => {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobListing[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Vault data
  const [vaultStats, setVaultStats] = useState<VaultData | null>(null);
  const [suggestedTitles, setSuggestedTitles] = useState<string[]>([]);
  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([]);
  const [useTransferableSkills, setUseTransferableSkills] = useState(false);
  
  // Filters
  const [dateFilter, setDateFilter] = useState<string>('24h');
  const [remoteType, setRemoteType] = useState<string>('any');
  const [employmentType, setEmploymentType] = useState<string>('any');
  const [salaryRange, setSalaryRange] = useState<string>('any');
  const [experienceLevel, setExperienceLevel] = useState<string>('any');
  const [selectedSources, setSelectedSources] = useState<string[]>(["google_jobs"]);
  const [showAllFilters, setShowAllFilters] = useState(false);

  // AI Chat
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    initializeUser();
    loadRecentJobs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [jobs, dateFilter, remoteType, employmentType, salaryRange]);

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
        .select('*, vault_transferable_skills(stated_skill)')
        .eq('user_id', userId)
        .maybeSingle();

      if (vault) {
        setVaultStats(vault);
        const analysis = vault.initial_analysis as any;
        const titles = analysis?.recommended_positions || [];
        setSuggestedTitles(titles.slice(0, 5));

        const skills = vault.vault_transferable_skills?.map((s: any) => s.stated_skill) || [];
        setSuggestedSkills(skills.slice(0, 8));

        if (titles.length > 0) {
          setAiMessages([{
            role: 'assistant',
            content: `👋 Hi! Based on your Career Vault, I can help you find ${titles.join(', ')} positions. What are you looking for today?`
          }]);
        }
      }
    } catch (error) {
      logger.error('Error loading Career Vault data', error);
    }
  };

  const applyFilters = useCallback(() => {
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
      filtered = filtered.filter(j => j.salary_min && j.salary_min >= minSalary);
    }

    setFilteredJobs(filtered);
  }, [jobs, dateFilter, remoteType, employmentType, salaryRange]);

  const getAppliedFiltersCount = () => {
    let count = 0;
    if (dateFilter !== '24h') count++;
    if (remoteType !== 'any') count++;
    if (employmentType !== 'any') count++;
    if (salaryRange !== 'any') count++;
    if (experienceLevel !== 'any') count++;
    return count;
  };

  const clearFilters = () => {
    setDateFilter('24h');
    setRemoteType('any');
    setEmploymentType('any');
    setSalaryRange('any');
    setExperienceLevel('any');
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
      logger.error('Error loading jobs', error);
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

    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please sign in to search for jobs",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    try {
      const { data: session, error: sessionError } = await supabase
        .from('job_search_sessions')
        .insert([{
          user_id: userId,
          search_query: searchQuery,
          filters: {
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

      await jobSearch.searchJobs({
        query: searchQuery,
        location: '',
        sources: ['google_jobs'],
        maxResults: 50,
        filters: {
          remote: remoteType === 'remote',
          jobType: employmentType !== 'any' ? employmentType : undefined,
          datePosted: 'month'
        },
        userId
      });

      toast({
        title: "Search started",
        description: `Searching for "${searchQuery}"...`,
      });

      pollSearchResults(session.id);
    } catch (error: any) {
      logger.error('Search error', error);
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
        .maybeSingle();

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
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('user_saved_jobs')
        .insert([{ user_id: userId, job_listing_id: jobId, status: 'saved' }]);

      if (error) throw error;

      toast({ title: "Job saved", description: "Added to your saved jobs" });
    } catch (error: any) {
      logger.error('Save error', error);
      toast({
        title: "Failed to save",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const sendAiMessage = async () => {
    const messageToSend = aiInput.trim();
    if (!messageToSend) return;

    const newMessages = [...aiMessages, { role: 'user' as const, content: messageToSend }];
    setAiMessages(newMessages);
    setAiInput("");
    setIsAiTyping(true);

    try {
      const context = {
        skills: suggestedSkills,
        titles: suggestedTitles,
        transferableSkills: vaultStats?.total_transferable_skills || 0,
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
      logger.error('AI error', error);
      setAiMessages([...newMessages, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsAiTyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Job Search Agent</h1>
          <p className="text-muted-foreground">AI-powered job discovery with your Career Vault</p>
        </div>

        <VaultSuggestions
          suggestedTitles={suggestedTitles}
          useTransferableSkills={useTransferableSkills}
          setUseTransferableSkills={setUseTransferableSkills}
          onSelectTitle={setSearchQuery}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
          <div className="lg:col-span-1 space-y-6">
            <SearchFilters
              dateFilter={dateFilter}
              setDateFilter={setDateFilter}
              remoteType={remoteType}
              setRemoteType={setRemoteType}
              employmentType={employmentType}
              setEmploymentType={setEmploymentType}
              salaryRange={salaryRange}
              setSalaryRange={setSalaryRange}
              experienceLevel={experienceLevel}
              setExperienceLevel={setExperienceLevel}
              selectedSources={selectedSources}
              setSelectedSources={setSelectedSources}
              showAllFilters={showAllFilters}
              setShowAllFilters={setShowAllFilters}
              onClearFilters={clearFilters}
              appliedFiltersCount={getAppliedFiltersCount()}
            />

            <AIAssistant
              messages={aiMessages}
              input={aiInput}
              setInput={setAiInput}
              isTyping={isAiTyping}
              isRecording={isRecording}
              onSendMessage={sendAiMessage}
              onVoiceTranscript={setAiInput}
              onToggleRecording={() => setIsRecording(!isRecording)}
            />
          </div>

          <div className="lg:col-span-3">
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search for jobs (e.g. 'Senior Product Manager' or 'AI Engineer')"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1"
                  />
                  <Button onClick={handleSearch} disabled={isSearching}>
                    {isSearching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="results" className="space-y-4">
              <TabsList>
                <TabsTrigger value="results">
                  Results ({filteredJobs.length})
                </TabsTrigger>
                <TabsTrigger value="saved">Saved Jobs</TabsTrigger>
              </TabsList>

              <TabsContent value="results">
                <ScrollArea className="h-[calc(100vh-350px)]">
                  <SearchResults jobs={filteredJobs} onSaveJob={handleSaveJob} />
                </ScrollArea>
              </TabsContent>

              <TabsContent value="saved">
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">Saved jobs feature coming soon</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
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
