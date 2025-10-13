import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface LinkedInSeries {
  id: string;
  user_id: string;
  series_topic: string;
  series_title: string;
  series_length: number;
  target_audience: string | null;
  user_role: string | null;
  industry: string | null;
  experience_years: number | null;
  outline_data: any;
  created_at: string;
  updated_at: string;
}

export const useSeriesManagement = () => {
  const [series, setSeries] = useState<LinkedInSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSeries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('linkedin_series')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSeries(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading series",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createSeries = async (seriesData: {
    series_topic: string;
    series_title: string;
    series_length: number;
    target_audience?: string;
    user_role?: string;
    industry?: string;
    experience_years?: number;
    outline_data: any;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from('linkedin_series')
        .insert({
          user_id: user.id,
          ...seriesData
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchSeries();
      toast({ title: "Series created!" });
      return data;
    } catch (error: any) {
      toast({
        title: "Error creating series",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteSeries = async (id: string) => {
    try {
      const { error } = await supabase
        .from('linkedin_series')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setSeries(prev => prev.filter(s => s.id !== id));
      toast({ title: "Series deleted" });
    } catch (error: any) {
      toast({
        title: "Error deleting series",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getSeriesPostsCount = async (seriesId: string) => {
    try {
      const { count, error } = await supabase
        .from('linkedin_posts')
        .select('*', { count: 'exact', head: true })
        .eq('series_id', seriesId);

      if (error) throw error;
      return count || 0;
    } catch (error: any) {
      console.error('Error counting series posts:', error);
      return 0;
    }
  };

  useEffect(() => {
    fetchSeries();
  }, []);

  return { series, loading, fetchSeries, createSeries, deleteSeries, getSeriesPostsCount };
};