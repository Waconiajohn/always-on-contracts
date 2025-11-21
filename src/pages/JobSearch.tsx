import { useState, useEffect, useMemo } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ContentLayout } from "@/components/layout/ContentLayout";
import { ContextSidebar } from "@/components/layout/ContextSidebar";
import { JobSearchSidebar } from "@/components/job-search/JobSearchSidebar";
import { useLayout } from "@/contexts/LayoutContext";
import { invokeEdgeFunction } from "@/lib/edgeFunction";
import { logger } from "@/lib/logger";
import { useJobTitleRecommendations } from "@/hooks/useJobTitleRecommendations";

// V2 Components
import { SearchHeader } from "@/components/job-search/v2/SearchHeader";
import { SearchControls } from "@/components/job-search/v2/SearchControls";
import { BooleanBuilderTool } from "@/components/job-search/v2/BooleanBuilderTool";
import { SearchResults } from "@/components/job-search/v2/SearchResults";

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
  const { leftSidebarCollapsed, toggleLeftSidebar } = useLayout();
  const [userId, setUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [expandedJobIds, setExpandedJobIds] = useState<Set<string>>(new Set());
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
  const [activeSavedSearchName, setActiveSavedSearchName] = useState<string | null>(null);
  const [basicSearchCount, setBasicSearchCount] = useState<number | null>(null);
  const [booleanSearchCount, setBooleanSearchCount] = useState<number | null>(null);
  
  // Phase 2: Vault integration state
  const [searchOrigin, setSearchOrigin] = useState<'vault_title' | 'typed_query' | 'saved_search' | 'boolean_ai'>('typed_query');
  const [selectedJobTitle, setSelectedJobTitle] = useState<string | null>(null);
  const [autoRunFromVault, setAutoRunFromVault] = useState(false);
  const [useTransferableSkills, setUseTransferableSkills] = useState(false);

  // handleApplyAISearch removed as it was tightly coupled to old UI structure
  
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
  
  // Use hook for AI-powered job title recommendations
  const { suggestedTitles, isLoading: loadingTitles } = useJobTitleRecommendations(userId);
  
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    initializeUser();
  }, []);

  const initializeUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
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

  // Removed: loadVaultData - now handled by useJobTitleRecommendations hook

  // Phase 2: Vault title click handler
  const handleVaultTitleClick = async (recommendation: any) => {
    setSearchQuery(recommendation.title);
    setSelectedJobTitle(recommendation.title);
    setSearchOrigin('vault_title');
    
    // If has pre-built boolean, apply it
    if (recommendation.suggestedBoolean) {
      setBooleanString(recommendation.suggestedBoolean);
      setShowAdvanced(true);
      
      toast({
        title: "Smart Boolean Applied",
        description: `Searching for "${recommendation.title}" and ${recommendation.synonyms?.length || 0} similar titles`,
        duration: 5000,
      });
    }
    
    if (autoRunFromVault) {
      // Use boolean search if available
      const useBooleanSearch = !!recommendation.suggestedBoolean;
      await handleSearch(useBooleanSearch, false);
      
      toast({
        title: "Vault search started",
        description: `Searching with ${recommendation.confidence}% confidence match for "${recommendation.title}"`,
      });
    } else {
      toast({
        title: "Title selected",
        description: recommendation.reasoning || `"${recommendation.title}" added to search. Click Search to run.`,
        duration: 5000,
      });
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
      setNextPageToken(null);
    }
    
    const currentBooleanActive = booleanString.trim().length > 0;

    // Store basic search count before running boolean search for comparison
    if (isBooleanSearch && currentBooleanActive && basicSearchCount === null && !loadMore) {
      setBasicSearchCount(jobs.length);
    }

    try {
      const { data, error } = await invokeEdgeFunction(
        'unified-job-search',
        {
          query: searchQuery,
          location: location || undefined,
          radiusMiles: location ? parseInt(radiusMiles) : undefined,
          nextPageToken: loadMore ? nextPageToken : undefined,
          filters: {
            datePosted: dateFilter,
            contractOnly,
            remoteType,
            employmentType,
            booleanString: booleanString.trim() || undefined,
            radiusMiles: location ? parseInt(radiusMiles) : undefined
          },
          metadata: {
            searchOrigin,
            vaultTitleUsed: selectedJobTitle,
            userId: userId || undefined,
            timestamp: new Date().toISOString()
          },
          userId: userId || undefined,
          sources: ['google_jobs', 'company_boards', 'usajobs', 'adzuna', 'jsearch']
        }
      );

      if (error) throw error;

      const newJobs = data.jobs || [];
      
      if (loadMore) {
        setJobs(prev => [...prev, ...newJobs]);
      } else {
        setJobs(newJobs);
      }
      
      setSearchTime(data.executionTimeMs);
      
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
      logger.error('Search error', error);
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
          application_status: 'not_applied',
          source: 'manual'
        });

      if (queueError) throw queueError;

      toast({
        title: "Added to My Applications",
        description: `${job.title} at ${job.company} added. View in Active Applications →`
      });
    } catch (error: any) {
      logger.error('Add to applications error', error);
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
      logger.error('Save job error', error);
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

  const canGenerateResume = (job: JobResult): boolean => {
    // Must have a description to work with
    return !!job.description;
  };

  const generateResumeForJob = async (job: JobResult) => {
    // Must have a description
    if (!canGenerateResume(job)) {
      toast({
        title: "Cannot Generate Resume",
        description: "This job has no description. Please copy the full job posting and paste it manually into the Resume Builder.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // First, create or get job_opportunities record
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: existingOpportunity } = await supabase
        .from('job_opportunities')
        .select('id')
        .eq('external_id', job.id || job.title)
        .eq('external_source', job.source || 'manual')
        .maybeSingle();

      let opportunityId = existingOpportunity?.id;

      if (!opportunityId) {
        const { data: newOpportunity, error: createError } = await supabase
          .from('job_opportunities')
          .insert({
            job_title: job.title,
            job_description: job.description,
            location: job.location,
            external_url: job.apply_url,
            external_id: job.id || job.title,
            external_source: job.source || 'manual',
            is_external: true,
            status: 'active',
            required_skills: job.required_skills || [],
          })
          .select('id')
          .single();

        if (createError) throw createError;
        opportunityId = newOpportunity.id;
      }

      // Check if already in application queue
      const { data: existingQueue } = await supabase
        .from('application_queue')
        .select('id')
        .eq('user_id', user.id)
        .eq('opportunity_id', opportunityId)
        .maybeSingle();

      if (!existingQueue) {
        // Add to application queue
        const { error: queueError } = await supabase
          .from('application_queue')
          .insert({
            user_id: user.id,
            opportunity_id: opportunityId,
            company_name: job.company,
            match_score: 0,
            application_status: 'not_applied',
            source: 'manual'
          });

        if (queueError) throw queueError;
      }

      toast({
        title: "Added to applications",
        description: "Preparing resume generation...",
      });

      // Navigate to resume builder
      navigate('/agents/resume-builder', {
        state: {
          jobTitle: job.title,
          companyName: job.company,
          jobDescription: job.description || `${job.title} at ${job.company}`,
          location: job.location,
          salary: job.salary_min && job.salary_max ? `${job.salary_min}-${job.salary_max}` : undefined,
          applyUrl: job.apply_url,
          opportunityId,
          fromJobSearch: true
        }
      });
    } catch (error) {
      console.error('Error adding to queue:', error);
      toast({
        title: "Error",
        description: "Failed to add job to applications. Please try again.",
        variant: "destructive"
      });
    }
  };

  const toggleJobExpansion = (jobId: string) => {
    setExpandedJobIds(prev => {
      const next = new Set(prev);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else {
        next.add(jobId);
      }
      return next;
    });
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
    <ContentLayout
      leftSidebar={
        <ContextSidebar
          side="left"
          collapsed={leftSidebarCollapsed}
          onToggle={toggleLeftSidebar}
        >
          <JobSearchSidebar
            appliedFiltersCount={appliedFiltersCount}
            onClearFilters={handleClearBoolean}
            suggestedTitles={suggestedTitles}
            useTransferableSkills={useTransferableSkills}
            setUseTransferableSkills={setUseTransferableSkills}
            onSelectTitle={handleVaultTitleClick}
            autoRunFromVault={autoRunFromVault}
            setAutoRunFromVault={setAutoRunFromVault}
            loadingTitles={loadingTitles}
            userId={userId}
          />
        </ContextSidebar>
      }
      maxWidth="full"
    >
      <div className="px-4 py-8 max-w-7xl mx-auto">
        <SearchHeader 
          query={searchQuery}
          setQuery={setSearchQuery}
          location={location}
          setLocation={setLocation}
          radius={radiusMiles}
          setRadius={setRadiusMiles}
          onSearch={() => handleSearch(false)}
          isSearching={isSearching}
          suggestedTitles={suggestedTitles}
        />

        <SearchControls 
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          remoteType={remoteType}
          setRemoteType={setRemoteType}
          employmentType={employmentType}
          setEmploymentType={setEmploymentType}
          contractOnly={contractOnly}
          setContractOnly={setContractOnly}
          showAdvanced={showAdvanced}
          setShowAdvanced={setShowAdvanced}
          activeSavedSearchName={activeSavedSearchName}
          onLoadSearch={handleLoadSavedSearch}
          currentBooleanString={booleanString}
          currentSearchQuery={searchQuery}
          currentLocation={location}
        />

        <BooleanBuilderTool 
          booleanString={booleanString}
          setBooleanString={setBooleanString}
        />

        <SearchResults 
          jobs={jobs}
          isSearching={isSearching}
          isLoadingMore={isLoadingMore}
          searchTime={searchTime}
          booleanString={booleanString}
          activeSavedSearchName={activeSavedSearchName}
          basicSearchCount={basicSearchCount}
          booleanSearchCount={booleanSearchCount}
          expandedJobIds={expandedJobIds}
          savedJobIds={savedJobIds}
          contractOnly={contractOnly}
          searchQuery={searchQuery}
          nextPageToken={nextPageToken}
          onLoadMore={() => handleSearch(false, true)}
          onToggleExpand={toggleJobExpansion}
          onGenerateResume={generateResumeForJob}
          onAddToQueue={addToQueue}
          onSaveJob={saveJob}
          onUnsaveJob={unsaveJob}
        />
      </div>
    </ContentLayout>
  );
};

export default function JobSearch() {
  return (
    <ProtectedRoute>
      <JobSearchContent />
    </ProtectedRoute>
  );
}
