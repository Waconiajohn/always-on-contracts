import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { invokeEdgeFunction, ParseResumeMilestonesSchema, safeValidateInput } from '@/lib/edgeFunction';
import { logger } from '@/lib/logger';

export interface ResumeMilestone {
  id: string;
  vault_id: string;
  user_id: string;
  company_name: string | null;
  job_title: string | null;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  key_achievements: string[] | null;
  milestone_title: string | null;
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

      // First get the vault_id for this user
      const { data: vaultData, error: vaultError } = await supabase
        .from('career_vault')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (vaultError) throw vaultError;
      if (!vaultData) {
        // No vault exists yet
        setMilestones([]);
        setLoading(false);
        return;
      }

      // Now fetch milestones from the vault
      const { data, error: fetchError } = await supabase
        .from('vault_resume_milestones')
        .select('*')
        .eq('vault_id', vaultData.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setMilestones((data as ResumeMilestone[]) || []);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch milestones');
      setError(error);
      logger.error('Error fetching resume milestones', error);
    } finally {
      setLoading(false);
    }
  };

  const parseResumeForMilestones = async (resumeText: string) => {
    setLoading(true);
    setError(null);

    const validation = safeValidateInput(ParseResumeMilestonesSchema, { resume_text: resumeText });
    if (!validation.success) {
      setLoading(false);
      return [];
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Get or create vault
      let { data: vaultData, error: vaultError } = await supabase
        .from('career_vault')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (vaultError) throw vaultError;

      if (!vaultData) {
        // Create vault if it doesn't exist
        const { data: newVault, error: createError } = await supabase
          .from('career_vault')
          .insert({ user_id: user.id })
          .select('id')
          .single();

        if (createError) throw createError;
        vaultData = newVault;
      }

      const { data, error: parseError } = await invokeEdgeFunction(
        'parse-resume-milestones',
        { resume_text: resumeText }
      );

      if (parseError) {
        logger.error('Parse resume milestones failed', parseError);
        throw new Error(parseError.message);
      }

      // Save parsed milestones to database
      if (data?.milestones && data.milestones.length > 0) {
        const milestonesToInsert = data.milestones.map((m: any) => ({
          vault_id: vaultData!.id,
          user_id: user.id,
          milestone_type: 'work_experience',
          company_name: m.company,
          job_title: m.role,
          start_date: m.start_date,
          end_date: m.end_date,
          description: m.responsibilities?.join('\n') || '',
          key_achievements: m.achievements || [],
          extracted_from_resume: true
        }));

        const { error: insertError } = await supabase
          .from('vault_resume_milestones')
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