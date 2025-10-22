import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ResumeMilestone {
  id: string;
  user_id: string;
  company: string;
  role: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  achievements: string[];
  skills_used: string[];
  key_metrics: Record<string, any>;
  responsibilities: string[];
  created_at: string;
}

export const useResumeMilestones = () => {
  const [milestones, setMilestones] = useState<ResumeMilestone[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const fetchMilestones = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error: fetchError } = await supabase
        .from('resume_milestones' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('end_date', { ascending: false, nullsFirst: true });

      if (fetchError) throw fetchError;

      setMilestones((data as any) || []);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch milestones');
      setError(error);
      console.error('Error fetching resume milestones:', error);
    } finally {
      setLoading(false);
    }
  };

  const parseResumeForMilestones = async (resumeText: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error: parseError } = await supabase.functions.invoke('parse-resume-milestones', {
        body: { resume_text: resumeText }
      });

      if (parseError) throw parseError;

      // Save parsed milestones to database
      if (data?.milestones && data.milestones.length > 0) {
        const milestonesToInsert = data.milestones.map((m: any) => ({
          user_id: user.id,
          company: m.company,
          role: m.role,
          start_date: m.start_date,
          end_date: m.end_date,
          is_current: m.is_current || false,
          achievements: m.achievements || [],
          skills_used: m.skills_used || [],
          key_metrics: m.key_metrics || {},
          responsibilities: m.responsibilities || []
        }));

        const { error: insertError } = await supabase
          .from('resume_milestones' as any)
          .insert(milestonesToInsert);

        if (insertError) throw insertError;

        toast({
          title: "Milestones Extracted",
          description: `Parsed ${data.milestones.length} career milestone(s) from your resume`
        });

        await fetchMilestones();
      }

      return data?.milestones || [];
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to parse resume');
      setError(error);
      toast({
        title: "Parsing Failed",
        description: error.message,
        variant: "destructive"
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMilestones();
  }, []);

  return {
    milestones,
    loading,
    error,
    refetch: fetchMilestones,
    parseResumeForMilestones
  };
};
