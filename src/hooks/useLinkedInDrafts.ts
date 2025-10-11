import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface LinkedInDraft {
  id: string;
  title: string | null;
  content: string;
  hashtags: string[] | null;
  post_type: string | null;
  tone: string | null;
  engagement_score: number | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export const useLinkedInDrafts = () => {
  const [drafts, setDrafts] = useState<LinkedInDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDrafts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('linkedin_posts')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setDrafts(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading drafts",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteDraft = async (id: string) => {
    try {
      const { error } = await supabase
        .from('linkedin_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setDrafts(prev => prev.filter(d => d.id !== id));
      toast({ title: "Draft deleted" });
    } catch (error: any) {
      toast({
        title: "Error deleting draft",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateDraft = async (id: string, updates: Partial<LinkedInDraft>) => {
    try {
      const { error } = await supabase
        .from('linkedin_posts')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      await fetchDrafts();
      toast({ title: "Draft updated" });
    } catch (error: any) {
      toast({
        title: "Error updating draft",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, []);

  return { drafts, loading, fetchDrafts, deleteDraft, updateDraft };
};
