import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { invokeEdgeFunction } from '@/lib/edgeFunction';

export interface TitleRecommendation {
  title: string;
  confidence: number; // 0-100
  synonyms: string[];
  reasoning: string;
  suggestedBoolean?: string; // Pre-built boolean OR string
  industryAlignment: 'high' | 'medium' | 'low';
}

interface JobTitleRecommendationsHook {
  suggestedTitles: TitleRecommendation[];
  isLoading: boolean;
  error: string | null;
  refreshRecommendations: () => Promise<void>;
}

export const useJobTitleRecommendations = (userId: string | null): JobTitleRecommendationsHook => {
  const { toast } = useToast();
  const [suggestedTitles, setSuggestedTitles] = useState<TitleRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateRecommendations = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // First, fetch resume data for AI analysis
      const { data: resume } = await supabase
        .from('career_vault')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!resume) {
        throw new Error('No Master Resume found. Please set up your Master Resume first.');
      }

      // Check if we have cached recommendations
      if (resume.initial_analysis) {
        const analysis = resume.initial_analysis as any;
        if (analysis?.recommended_positions && analysis.recommended_positions.length > 0) {
          setSuggestedTitles(analysis.recommended_positions.slice(0, 7));
          setIsLoading(false);
          return;
        }
      }

      // Fetch resume items for comprehensive analysis (DB tables retain vault_* naming for back-compat)
      const [powerPhrases, skills, competencies] = await Promise.all([
        supabase
          .from('vault_power_phrases')
          .select('power_phrase, category, impact_metrics')
          .eq('vault_id', resume.id)
          .order('confidence_score', { ascending: false })
          .limit(10),
        supabase
          .from('vault_transferable_skills')
          .select('stated_skill')
          .eq('vault_id', resume.id)
          .order('confidence_score', { ascending: false })
          .limit(10),
        supabase
          .from('vault_hidden_competencies')
          .select('competency_area, inferred_capability')
          .eq('vault_id', resume.id)
          .order('confidence_score', { ascending: false })
          .limit(10)
      ]);

      // Build comprehensive resume analysis for AI
      const resumeAnalysisData = resume.initial_analysis as any;
      const resumeAnalysis = {
        current_role: resumeAnalysisData?.current_role || 'Professional',
        years_of_experience: resumeAnalysisData?.years_of_experience || 5,
        seniority_level: resumeAnalysisData?.seniority_level || 'Mid-Level',
        industry: resumeAnalysisData?.industry || 'General',
        key_skills: skills.data?.map(s => s.stated_skill) || [],
        key_achievements: powerPhrases.data?.map(p => p.power_phrase).slice(0, 5) || [],
        management_capabilities: competencies.data?.map(c => c.inferred_capability) || [],
        analysis_summary: resumeAnalysisData?.analysis_summary || 'Experienced professional with demonstrated expertise'
      };

      // Call infer-target-roles edge function
      const { data, error: funcError } = await invokeEdgeFunction('infer-target-roles', {
        resume_analysis: resumeAnalysis
      });

      if (funcError) {
        throw new Error(funcError.message || 'Failed to generate recommendations');
      }

      if (!data?.success || !data.suggestions || data.suggestions.length === 0) {
        throw new Error('No role suggestions generated');
      }

      // Handle both old (string array) and new (rich object) formats
      const titles: TitleRecommendation[] = data.suggestions.map((suggestion: any) => {
        if (typeof suggestion === 'string') {
          // Legacy format - convert to rich format
          return {
            title: suggestion,
            confidence: 70,
            synonyms: [],
            reasoning: 'Based on Master Resume analysis',
            industryAlignment: 'medium' as const
          };
        }
        // New rich format
        return suggestion as TitleRecommendation;
      });

      setSuggestedTitles(titles);

      // Cache recommendations in career_vault (DB table name retained for back-compat)
      const currentAnalysis = (resume.initial_analysis as any) || {};
      const updatedAnalysis = {
        ...currentAnalysis,
        recommended_positions: titles,
        last_recommendations_update: new Date().toISOString()
      };

      await supabase
        .from('career_vault')
        .update({ initial_analysis: updatedAnalysis })
        .eq('id', resume.id);

      toast({
        title: "Job Titles Generated",
        description: `Found ${titles.length} recommended roles based on your Master Resume`,
      });

    } catch (err: any) {
      console.error('Error generating job title recommendations:', err);
      setError(err.message || 'Failed to load recommendations');
      
      toast({
        title: "Could not generate recommendations",
        description: err.message || "Please ensure your Master Resume has sufficient data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshRecommendations = async () => {
    if (!userId) return;
    
    // Clear cache and regenerate
    setSuggestedTitles([]);
    await generateRecommendations();
  };

  // Load recommendations on mount
  useEffect(() => {
    if (userId) {
      generateRecommendations();
    }
  }, [userId]);

  return {
    suggestedTitles,
    isLoading,
    error,
    refreshRecommendations
  };
};
