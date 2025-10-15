import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink, Trash2, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface SavedJob {
  id: string;
  job_listing_id: string;
  status: string | null;
  saved_at: string | null;
  job_listings: {
    job_title: string;
    company_name: string;
    location: string | null;
    salary_min: number | null;
    salary_max: number | null;
    apply_url: string | null;
    posted_date: string | null;
    source: string;
  } | null;
}

export const SavedJobsList = () => {
  const { toast } = useToast();
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSavedJobs();
  }, []);

  const loadSavedJobs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_saved_jobs')
        .select(`
          id,
          job_listing_id,
          status,
          saved_at,
          job_listings (
            job_title,
            company_name,
            location,
            salary_min,
            salary_max,
            apply_url,
            posted_date,
            source
          )
        `)
        .eq('user_id', user.id)
        .order('saved_at', { ascending: false });

      if (error) throw error;
      setSavedJobs(data || []);
    } catch (error) {
      console.error('Error loading saved jobs:', error);
      toast({
        title: "Failed to load saved jobs",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeSavedJob = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_saved_jobs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSavedJobs(prev => prev.filter(job => job.id !== id));
      toast({
        title: "Job removed",
        description: "Job removed from saved list"
      });
    } catch (error) {
      console.error('Error removing job:', error);
      toast({
        title: "Failed to remove job",
        variant: "destructive"
      });
    }
  };

  const formatSalary = (min?: number | null, max?: number | null) => {
    if (!min && !max) return null;
    if (min && max) return `$${(min / 1000).toFixed(0)}k-$${(max / 1000).toFixed(0)}k`;
    if (min) return `$${(min / 1000).toFixed(0)}k+`;
    if (max) return `Up to $${(max / 1000).toFixed(0)}k`;
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (savedJobs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No saved jobs yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Save jobs from search results to view them here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-350px)]">
      <div className="space-y-4">
        {savedJobs.map((saved) => {
          // Handle case where job_listings might be null or missing
          if (!saved.job_listings) {
            return null;
          }
          
          const job = saved.job_listings;
          const salary = formatSalary(job.salary_min, job.salary_max);
          
          return (
            <Card key={saved.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{job.job_title || 'Untitled Job'}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{job.company_name || 'Unknown Company'}</p>
                  </div>
                  <Badge variant="secondary" className="ml-2">{job.source || 'Unknown'}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {job.location && (
                    <p className="text-sm text-muted-foreground">{job.location}</p>
                  )}
                  {salary && (
                    <p className="text-sm font-medium">{salary}/year</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Posted {job.posted_date ? formatDistanceToNow(new Date(job.posted_date), { addSuffix: true }) : 'Recently'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Saved {saved.saved_at ? formatDistanceToNow(new Date(saved.saved_at), { addSuffix: true }) : 'Recently'}
                  </p>
                  <div className="flex gap-2 pt-2">
                    {job.apply_url && (
                      <Button
                        size="sm"
                        onClick={() => window.open(job.apply_url || '', '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Apply Now
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeSavedJob(saved.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
};
