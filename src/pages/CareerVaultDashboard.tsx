import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Target, Info } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AddMetricsModal } from "@/components/career-vault/AddMetricsModal";
import { ModernizeLanguageModal } from "@/components/career-vault/ModernizeLanguageModal";
import { InferredItemsReview } from "@/components/career-vault/InferredItemsReview";
import { ContentLayout } from "@/components/layout/ContentLayout";
import { ContextSidebar } from "@/components/layout/ContextSidebar";
import { VaultSidebar } from "@/components/career-vault/VaultSidebar";
import { useLayout } from "@/contexts/LayoutContext";
import { calculateQualityDistribution, type QualityDistribution } from "@/lib/utils/qualityDistribution";

interface VaultStats {
  total_power_phrases: number;
  total_transferable_skills: number;
  total_hidden_competencies: number;
  total_soft_skills: number;
  total_leadership_philosophy: number;
  total_executive_presence: number;
  total_personality_traits: number;
  total_work_style: number;
  total_values: number;
  total_behavioral_indicators: number;
  overall_strength_score: number;
  review_completion_percentage: number;
}

interface StrengthScore {
  total: number;
  powerPhrasesScore: number;
  transferableSkillsScore: number;
  hiddenCompetenciesScore: number;
  intangiblesScore: number;
  quantificationScore: number;
  modernTerminologyScore: number;
  level: 'Developing' | 'Solid' | 'Strong' | 'Elite' | 'Exceptional';
}

interface PowerPhrase {
  id: string;
  category: string;
  power_phrase: string;
  confidence_score: number | null;
  keywords: string[] | null;
  impact_metrics?: any;
  quality_tier?: string | null;
  needs_user_review?: boolean | null;
  last_updated_at?: string | null;
}

interface TransferableSkill {
  id: string;
  stated_skill: string;
  equivalent_skills: string[];
  evidence: string;
  confidence_score: number | null;
  quality_tier?: string | null;
  needs_user_review?: boolean | null;
  last_updated_at?: string | null;
}

interface HiddenCompetency {
  id: string;
  competency_area: string;
  inferred_capability: string;
  supporting_evidence: string[];
  confidence_score: number | null;
  certification_equivalent: string | null;
  quality_tier?: string | null;
  needs_user_review?: boolean | null;
  last_updated_at?: string | null;
}

interface SoftSkill {
  id: string;
  skill_name: string;
  examples: string;
  impact: string | null;
  proficiency_level: string | null;
  quality_tier?: string | null;
  needs_user_review?: boolean | null;
  last_updated_at?: string | null;
  ai_confidence?: number | null;
  inferred_from?: string | null;
}

interface LeadershipPhilosophy {
  id: string;
  philosophy_statement: string;
  leadership_style: string | null;
  real_world_application: string | null;
  core_principles: string[] | null;
  quality_tier?: string | null;
  needs_user_review?: boolean | null;
  last_updated_at?: string | null;
  ai_confidence?: number | null;
  inferred_from?: string | null;
}

interface ExecutivePresence {
  id: string;
  presence_indicator: string;
  situational_example: string;
  brand_alignment: string | null;
  perceived_impact: string | null;
  quality_tier?: string | null;
  needs_user_review?: boolean | null;
  last_updated_at?: string | null;
  ai_confidence?: number | null;
  inferred_from?: string | null;
}

interface PersonalityTrait {
  id: string;
  trait_name: string;
  behavioral_evidence: string;
  work_context: string | null;
  strength_or_growth: string | null;
  quality_tier?: string | null;
  needs_user_review?: boolean | null;
  last_updated_at?: string | null;
  ai_confidence?: number | null;
  inferred_from?: string | null;
}

interface WorkStyle {
  id: string;
  preference_area: string;
  preference_description: string;
  examples: string | null;
  ideal_environment: string | null;
  quality_tier?: string | null;
  needs_user_review?: boolean | null;
  last_updated_at?: string | null;
  ai_confidence?: number | null;
  inferred_from?: string | null;
}

interface Value {
  id: string;
  value_name: string;
  manifestation: string;
  importance_level: string | null;
  career_decisions_influenced: string | null;
  quality_tier?: string | null;
  needs_user_review?: boolean | null;
  last_updated_at?: string | null;
  ai_confidence?: number | null;
  inferred_from?: string | null;
}

interface BehavioralIndicator {
  id: string;
  indicator_type: string;
  specific_behavior: string;
  context: string | null;
  outcome_pattern: string | null;
  quality_tier?: string | null;
  needs_user_review?: boolean | null;
  last_updated_at?: string | null;
  ai_confidence?: number | null;
  inferred_from?: string | null;
}

import { EnhancementQueue } from '@/components/EnhancementQueue';
import { useNavigate } from 'react-router-dom';
import { Rocket, Upload, PlayCircle, RotateCcw, Plus, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResumeManagementModal } from '@/components/career-vault/ResumeManagementModal';
import { VaultQuickStats } from '@/components/career-vault/VaultQuickStats';
import { RecentActivityFeed } from '@/components/career-vault/RecentActivityFeed';
import { SmartNextSteps } from '@/components/career-vault/SmartNextSteps';
import { VaultStatusHero } from '@/components/career-vault/VaultStatusHero';
import { VaultContents } from '@/components/career-vault/VaultContents';
import { QualityBoosters } from '@/components/career-vault/QualityBoosters';
import { MilestoneManager } from '@/components/career-vault/MilestoneManager';
import { VaultContentsTable } from '@/components/career-vault/VaultContentsTable';
import { QualityTierExplainer } from '@/components/career-vault/QualityTierExplainer';
import { VaultActivityFeed } from '@/components/career-vault/VaultActivityFeed';
import { VaultSuggestionsWidget } from '@/components/career-vault/VaultSuggestionsWidget';
import { VaultQualityScore } from '@/components/career-vault/VaultQualityScore';
import { CategoryOrganizer } from '@/components/career-vault/CategoryOrganizer';
import { FreshnessManager } from '@/components/career-vault/FreshnessManager';
import { DuplicateDetector } from '@/components/career-vault/DuplicateDetector';
import { VerificationWorkflow } from '@/components/career-vault/VerificationWorkflow';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Shield } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { VaultItemViewModal } from '@/components/career-vault/VaultItemViewModal';
import { VaultItemEditModal } from '@/components/career-vault/VaultItemEditModal';
import { useToast } from '@/hooks/use-toast';

const VaultDashboardContent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { rightSidebarCollapsed, toggleRightSidebar } = useLayout();
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [restartDialogOpen, setRestartDialogOpen] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [addMetricsModalOpen, setAddMetricsModalOpen] = useState(false);
  const [modernizeModalOpen, setModernizeModalOpen] = useState(false);
  const [vaultId, setVaultId] = useState<string>("");
  const [vault, setVault] = useState<any>(null);
  const [stats, setStats] = useState<VaultStats | null>(null);
  const [powerPhrases, setPowerPhrases] = useState<PowerPhrase[]>([]);
  const [transferableSkills, setTransferableSkills] = useState<TransferableSkill[]>([]);
  const [hiddenCompetencies, setHiddenCompetencies] = useState<HiddenCompetency[]>([]);
  const [softSkills, setSoftSkills] = useState<SoftSkill[]>([]);
  const [leadershipPhilosophy, setLeadershipPhilosophy] = useState<LeadershipPhilosophy[]>([]);
  const [executivePresence, setExecutivePresence] = useState<ExecutivePresence[]>([]);
  const [personalityTraits, setPersonalityTraits] = useState<PersonalityTrait[]>([]);
  const [workStyle, setWorkStyle] = useState<WorkStyle[]>([]);
  const [values, setValues] = useState<Value[]>([]);
  const [behavioralIndicators, setBehavioralIndicators] = useState<BehavioralIndicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [strengthScore, setStrengthScore] = useState<StrengthScore | null>(null);
  const [qualityDistribution, setQualityDistribution] = useState<QualityDistribution>({ gold: 0, silver: 0, bronze: 0, assumed: 0 });
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const calculateStrengthScore = (
    phrases: PowerPhrase[], 
    skills: TransferableSkill[], 
    competencies: HiddenCompetency[],
    softSkills: SoftSkill[],
    leadership: LeadershipPhilosophy[],
    presence: ExecutivePresence[],
    traits: PersonalityTrait[],
    style: WorkStyle[],
    vals: Value[],
    behavioral: BehavioralIndicator[]
  ): StrengthScore => {
    // Use quality-tier-based scoring with freshness weighting
    const allItems = [
      ...phrases.map((p: any) => ({ ...p, category: 'power_phrases' })),
      ...skills.map((s: any) => ({ ...s, category: 'transferable_skills' })),
      ...competencies.map((c: any) => ({ ...c, category: 'hidden_competencies' })),
      ...softSkills.map((s: any) => ({ ...s, category: 'soft_skills' })),
      ...leadership.map((l: any) => ({ ...l, category: 'leadership' })),
      ...presence.map((p: any) => ({ ...p, category: 'executive_presence' })),
      ...traits.map((t: any) => ({ ...t, category: 'personality_traits' })),
      ...style.map((s: any) => ({ ...s, category: 'work_style' })),
      ...vals.map((v: any) => ({ ...v, category: 'values' })),
      ...behavioral.map((b: any) => ({ ...b, category: 'behavioral_indicators' }))
    ];
    
    // Use quality-tier-based scoring
    const tierWeights = { gold: 1.0, silver: 0.8, bronze: 0.6, assumed: 0.4 };
    
    const itemScores = allItems.map(item => {
      const qualityTier = item.quality_tier || 'assumed';
      const tierWeight = tierWeights[qualityTier as keyof typeof tierWeights];
      
      // Calculate freshness multiplier
      const lastUpdated = item.last_updated_at || item.updated_at || item.created_at;
      let freshnessMultiplier = 0.7; // Default
      if (lastUpdated) {
        const daysSince = Math.floor((Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSince <= 30) freshnessMultiplier = 1.0;
        else if (daysSince <= 90) freshnessMultiplier = 0.9;
        else if (daysSince <= 180) freshnessMultiplier = 0.8;
      }
      
      return tierWeight * freshnessMultiplier;
    });
    
    const avgScore = itemScores.length > 0 
      ? itemScores.reduce((sum, score) => sum + score, 0) / itemScores.length 
      : 0;
    
    const total = Math.round(avgScore * 100);
    
    // Category scores (simplified)
    const powerPhrasesScore = Math.min((phrases.length / 20) * 10, 10);
    const transferableSkillsScore = Math.min((skills.length / 15) * 10, 10);
    const hiddenCompetenciesScore = Math.min((competencies.length / 10) * 10, 10);
    const intangiblesScore = Math.min(
      (softSkills.length + leadership.length + presence.length + traits.length + 
       style.length + vals.length + behavioral.length) / 30 * 40, 40
    );
    
    // Quality metrics
    const phrasesWithMetrics = phrases.filter(p => 
      p.impact_metrics && Object.keys(p.impact_metrics).length > 0
    ).length;
    const quantificationScore = phrases.length > 0 
      ? (phrasesWithMetrics / phrases.length) * 15 
      : 0;
    
    const modernKeywords = ['AI', 'ML', 'cloud', 'digital transformation', 'automation', 
      'data science', 'agile', 'DevOps', 'analytics', 'optimization'];
    const modernPhrases = phrases.filter(p => 
      (p.keywords ?? []).some(k => modernKeywords.some(mk => k.toLowerCase().includes(mk.toLowerCase())))
    ).length;
    const modernTerminologyScore = phrases.length > 0 
      ? (modernPhrases / phrases.length) * 15 
      : 0;
    
    let level: StrengthScore['level'] = 'Developing';
    if (total >= 90) level = 'Exceptional';
    else if (total >= 80) level = 'Elite';
    else if (total >= 70) level = 'Strong';
    else if (total >= 60) level = 'Solid';
    
    return {
      total,
      powerPhrasesScore: Math.round(powerPhrasesScore),
      transferableSkillsScore: Math.round(transferableSkillsScore),
      hiddenCompetenciesScore: Math.round(hiddenCompetenciesScore),
      intangiblesScore: Math.round(intangiblesScore),
      quantificationScore: Math.round(quantificationScore),
      modernTerminologyScore: Math.round(modernTerminologyScore),
      level
    };
  };

  const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      try {
        // Get career vault data directly from Supabase (more reliable than MCP)
        const { data: vault, error: vaultError } = await supabase
          .from('career_vault')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (vaultError) {
          console.error('Error fetching vault:', vaultError);
          setLoading(false);
          return;
        }

        if (vault) {
          setVaultId(vault.id);
          setVault(vault);
          setStats({
            total_power_phrases: vault.total_power_phrases || 0,
            total_transferable_skills: vault.total_transferable_skills || 0,
            total_hidden_competencies: vault.total_hidden_competencies || 0,
            total_soft_skills: vault.total_soft_skills || 0,
            total_leadership_philosophy: vault.total_leadership_philosophy || 0,
            total_executive_presence: vault.total_executive_presence || 0,
            total_personality_traits: vault.total_personality_traits || 0,
            total_work_style: vault.total_work_style || 0,
            total_values: vault.total_values || 0,
            total_behavioral_indicators: vault.total_behavioral_indicators || 0,
            overall_strength_score: vault.overall_strength_score || 0,
            review_completion_percentage: vault.review_completion_percentage || 0
          });

          // Fetch all intelligence data in parallel
          const [phrasesData, skillsData, competenciesData, softSkillsData, leadershipData, presenceData, traitsData, styleData, valuesData, behavioralData] = await Promise.all([
            supabase.from('vault_power_phrases').select('*').eq('vault_id', vault.id).order('confidence_score', { ascending: false }),
            supabase.from('vault_transferable_skills').select('*').eq('vault_id', vault.id).order('confidence_score', { ascending: false }),
            supabase.from('vault_hidden_competencies').select('*').eq('vault_id', vault.id).order('confidence_score', { ascending: false }),
            supabase.from('vault_soft_skills').select('*').eq('vault_id', vault.id).order('created_at', { ascending: false }),
            supabase.from('vault_leadership_philosophy').select('*').eq('vault_id', vault.id).order('created_at', { ascending: false }),
            supabase.from('vault_executive_presence').select('*').eq('vault_id', vault.id).order('created_at', { ascending: false }),
            supabase.from('vault_personality_traits').select('*').eq('vault_id', vault.id).order('created_at', { ascending: false }),
            supabase.from('vault_work_style').select('*').eq('vault_id', vault.id).order('created_at', { ascending: false }),
            supabase.from('vault_values_motivations').select('*').eq('vault_id', vault.id).order('created_at', { ascending: false }),
            supabase.from('vault_behavioral_indicators').select('*').eq('vault_id', vault.id).order('created_at', { ascending: false })
          ]);

          setPowerPhrases(phrasesData.data || []);
          setTransferableSkills(skillsData.data || []);
          setHiddenCompetencies(competenciesData.data || []);
          setSoftSkills(softSkillsData.data || []);
          setLeadershipPhilosophy(leadershipData.data || []);
          setExecutivePresence(presenceData.data || []);
          setPersonalityTraits(traitsData.data || []);
          setWorkStyle(styleData.data || []);
          setValues(valuesData.data || []);
          setBehavioralIndicators(behavioralData.data || []);

          // Calculate strength score across all 20 categories
          const score = calculateStrengthScore(
            phrasesData.data || [], 
            skillsData.data || [], 
            competenciesData.data || [],
            softSkillsData.data || [],
            leadershipData.data || [],
            presenceData.data || [],
            traitsData.data || [],
            styleData.data || [],
            valuesData.data || [],
            behavioralData.data || []
          );
          setStrengthScore(score);

          // Calculate quality distribution once for all 10 vault tables
          const distribution = calculateQualityDistribution(
            phrasesData.data || [],
            skillsData.data || [],
            competenciesData.data || [],
            softSkillsData.data || [],
            leadershipData.data || [],
            presenceData.data || [],
            traitsData.data || [],
            styleData.data || [],
            valuesData.data || [],
            behavioralData.data || []
          );
          setQualityDistribution(distribution);

          // Update stats with ACTUAL counts from fetched data (not stale vault totals)
          setStats({
            total_power_phrases: (phrasesData.data || []).length,
            total_transferable_skills: (skillsData.data || []).length,
            total_hidden_competencies: (competenciesData.data || []).length,
            total_soft_skills: (softSkillsData.data || []).length,
            total_leadership_philosophy: (leadershipData.data || []).length,
            total_executive_presence: (presenceData.data || []).length,
            total_personality_traits: (traitsData.data || []).length,
            total_work_style: (styleData.data || []).length,
            total_values: (valuesData.data || []).length,
            total_behavioral_indicators: (behavioralData.data || []).length,
            overall_strength_score: score.total,
            review_completion_percentage: vault.review_completion_percentage || 0
          });

          // Update vault totals in database with actual counts
          await supabase
            .from('career_vault')
            .update({ 
              overall_strength_score: score.total,
              total_power_phrases: (phrasesData.data || []).length,
              total_transferable_skills: (skillsData.data || []).length,
              total_hidden_competencies: (competenciesData.data || []).length,
              total_soft_skills: (softSkillsData.data || []).length,
              total_leadership_philosophy: (leadershipData.data || []).length,
              total_executive_presence: (presenceData.data || []).length,
              total_personality_traits: (traitsData.data || []).length,
              total_work_style: (styleData.data || []).length,
              total_values: (valuesData.data || []).length,
              total_behavioral_indicators: (behavioralData.data || []).length
            })
            .eq('id', vault.id);
        }
      } catch (error) {
        console.error('Error fetching career vault data:', error);
      }

      setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleResumeUploaded = () => {
    window.location.reload();
  };

  const handleRefreshVault = async () => {
    if (!vaultId) {
      toast({
        title: 'No Vault Found',
        description: 'Please build your vault first',
        variant: 'destructive'
      });
      return;
    }

    setIsReanalyzing(true);

    try {
      toast({
        title: 'Refreshing Vault',
        description: 'Updating quality tiers and freshness scores for stale items...'
      });

      const { data, error } = await supabase.functions.invoke('refresh-vault-intelligence', {
        body: {
          vaultId,
          ageThresholdDays: 180 // Refresh items older than 6 months
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Refresh failed');
      }

      toast({
        title: 'Vault Refreshed!',
        description: `Updated ${data.totalRefreshed} stale items`,
      });

      // Reload to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Refresh error:', error);
      toast({
        title: 'Refresh Failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setIsReanalyzing(false);
    }
  };

  const handleReanalyze = async () => {
    if (!vaultId || !vault?.resume_raw_text) {
      toast({
        title: 'No Resume Data',
        description: 'Please upload a resume first',
        variant: 'destructive'
      });
      return;
    }

    setIsReanalyzing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('target_roles, target_industries')
        .eq('user_id', user.id)
        .single();

      toast({
        title: 'Re-Analyzing Vault',
        description: 'AI is discovering additional intelligence from your documents...'
      });

      const { data: autoPopData, error } = await supabase.functions.invoke('auto-populate-vault', {
        body: {
          vaultId,
          resumeText: vault.resume_raw_text,
          targetRoles: profile?.target_roles || [],
          targetIndustries: profile?.target_industries || []
        }
      });

      if (error) throw error;

      if (!autoPopData.success) {
        throw new Error(autoPopData.error || 'Re-analysis failed');
      }

      toast({
        title: 'Re-Analysis Complete!',
        description: `Added ${autoPopData.totalExtracted} intelligence items across ${autoPopData.categories?.length || 0} categories`,
      });

      window.location.reload();
    } catch (error) {
      console.error('Re-analyze error:', error);
      toast({
        title: 'Re-Analysis Failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setIsReanalyzing(false);
    }
  };

  const handleRestartInterview = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !vaultId) return;

      // Delete all vault intelligence data
      await Promise.all([
        supabase.from('vault_power_phrases').delete().eq('user_id', user.id),
        supabase.from('vault_transferable_skills').delete().eq('user_id', user.id),
        supabase.from('vault_hidden_competencies').delete().eq('user_id', user.id),
        supabase.from('vault_soft_skills').delete().eq('user_id', user.id),
        supabase.from('vault_leadership_philosophy').delete().eq('user_id', user.id),
        supabase.from('vault_executive_presence').delete().eq('user_id', user.id),
        supabase.from('vault_personality_traits').delete().eq('user_id', user.id),
        supabase.from('vault_work_style').delete().eq('user_id', user.id),
        supabase.from('vault_values_motivations').delete().eq('user_id', user.id),
        supabase.from('vault_behavioral_indicators').delete().eq('user_id', user.id),
        supabase.from('vault_interview_responses').delete().eq('user_id', user.id),
        supabase.from('vault_resume_milestones').delete().eq('user_id', user.id),
        supabase.from('vault_confirmed_skills').delete().eq('user_id', user.id),
      ]);

      // Reset career vault counters (both legacy and current completion fields)
      await supabase
        .from('career_vault')
        .update({
          interview_completion_percentage: 0,
          review_completion_percentage: 0,
          total_power_phrases: 0,
          total_transferable_skills: 0,
          total_hidden_competencies: 0,
          total_soft_skills: 0,
          total_leadership_philosophy: 0,
          total_executive_presence: 0,
          total_personality_traits: 0,
          total_work_style: 0,
          total_values: 0,
          total_behavioral_indicators: 0,
          overall_strength_score: 0,
          auto_populated: false,
          resume_raw_text: null
        })
        .eq('user_id', user.id);

      toast({
        title: 'Vault Cleared',
        description: 'All data deleted. Starting fresh...',
      });

      // Navigate to onboarding
      navigate('/career-vault-onboarding');
    } catch (error) {
      console.error('Error clearing vault:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear vault data. Please try again.',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="text-center">Loading your Career Vault...</div>
      </div>
    );
  }

  // Only show empty state if vault doesn't exist at all
  if (!vaultId || !stats) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <Card className="p-8 text-center max-w-2xl mx-auto">
          <Target className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-semibold mb-2">
            Build Your Career Intelligence Foundation
          </h2>
          <p className="text-muted-foreground mb-6">
            Your vault is the foundation that powers all 5 dimensions: resume scoring, LinkedIn positioning, 
            interview prep, market intelligence leverage, and strategic networking. It's critical—but it's step one. 
            Becoming the benchmark candidate for a specific role requires deploying this intelligence across all dimensions.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-left">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="font-semibold text-sm mb-1">Power Phrases</p>
              <p className="text-xs text-muted-foreground">Quantified achievements</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="font-semibold text-sm mb-1">Transferable Skills</p>
              <p className="text-xs text-muted-foreground">Cross-role capabilities</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="font-semibold text-sm mb-1">Hidden Competencies</p>
              <p className="text-xs text-muted-foreground">Undiscovered strengths</p>
            </div>
          </div>
          <Button size="lg" onClick={() => navigate('/career-vault-onboarding')}>
            Build Your Career Vault
          </Button>
        </Card>
      </div>
    );
  }

  const totalIntelligenceItems = 
    stats.total_power_phrases + 
    stats.total_transferable_skills + 
    stats.total_hidden_competencies +
    stats.total_soft_skills +
    stats.total_leadership_philosophy +
    stats.total_executive_presence +
    stats.total_personality_traits +
    stats.total_work_style +
    stats.total_values +
    stats.total_behavioral_indicators;

  return (
    <ContentLayout
      rightSidebar={
        stats ? (
          <ContextSidebar
            side="right"
            collapsed={rightSidebarCollapsed}
            onToggle={toggleRightSidebar}
          >
            <VaultSidebar
              completionPercentage={stats.review_completion_percentage}
              totalItems={totalIntelligenceItems}
              strengthScore={stats.overall_strength_score}
              onQuickAction={(action) => {
                toast({ title: `Quick action: ${action}`, description: 'Feature coming soon!' });
              }}
            />
          </ContextSidebar>
        ) : undefined
      }
      maxWidth="full"
    >
      <div className="px-6 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Career Vault Control Panel</h1>
        <p className="text-muted-foreground">
          Your career intelligence command center - manage documents, track progress, and deploy your vault
        </p>
      </div>

      {/* AI Inference Review Alert */}
      <InferredItemsReview />

      {/* Master Controls Section */}
      <Card className="mb-6 p-6 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
        <div className="flex flex-col space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              Mission Control
              {vault?.auto_populated && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  AI Auto-Populated
                </Badge>
              )}
            </h2>
            <p className="text-sm text-muted-foreground">
              {vault?.auto_populated
                ? `Onboarding: Complete • ${totalIntelligenceItems} items extracted • Vault Quality: ${strengthScore?.total || 0}/100`
                : `Review: ${stats.review_completion_percentage}% complete • ${totalIntelligenceItems} items extracted`
              }
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => setResumeModalOpen(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Manage Resume
            </Button>

            <Button
              variant="outline"
              className="justify-start"
              onClick={() => setResumeModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Document
            </Button>

            <Button
              variant="outline"
              className="justify-start"
              onClick={handleReanalyze}
              disabled={isReanalyzing || !vault?.resume_raw_text}
            >
              {isReanalyzing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              {isReanalyzing ? 'Re-Analyzing...' : 'Re-Analyze All'}
            </Button>
            
            {stats.review_completion_percentage < 100 ? (
              <Button 
                className="justify-start"
                onClick={() => navigate('/career-vault-onboarding')}
              >
                <PlayCircle className="h-4 w-4 mr-2" />
                Continue Review
              </Button>
            ) : (
              <Button
                variant="destructive"
                className="justify-start whitespace-nowrap"
                onClick={() => setRestartDialogOpen(true)}
              >
                <RotateCcw className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">Reset Vault</span>
              </Button>
            )}
            
            <Button 
              variant="secondary"
              className="justify-start"
              onClick={() => navigate('/agents/resume-builder')}
            >
              <Rocket className="h-4 w-4 mr-2" />
              Deploy Vault
            </Button>
          </div>
        </div>
      </Card>

      <ResumeManagementModal
        open={resumeModalOpen}
        onOpenChange={setResumeModalOpen}
        vaultId={vaultId}
        onResumeUploaded={handleResumeUploaded}
      />

      {/* Restart Interview Confirmation Dialog */}
      <AlertDialog open={restartDialogOpen} onOpenChange={setRestartDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Vault Data & Start Over?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="font-medium text-destructive">⚠️ This will permanently delete:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>All {totalIntelligenceItems} intelligence items</li>
                <li>Your review progress ({stats?.review_completion_percentage}%)</li>
                <li>All power phrases, skills, and competencies</li>
                <li>All uploaded resume data</li>
              </ul>
              <p className="pt-2">This cannot be undone. You'll start completely fresh.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestartInterview}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Delete Everything & Restart
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Empty Vault Banner */}
      {totalIntelligenceItems === 0 && (
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>Your vault is empty</AlertTitle>
          <AlertDescription>
            Upload a resume or continue the interview to populate your vault with career intelligence.
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Stats Cards */}
      <VaultQuickStats
        totalItems={totalIntelligenceItems}
        interviewProgress={stats.review_completion_percentage}
        strengthScore={strengthScore?.total || 0}
        lastUpdated={null}
      />

      {/* Two Column Layout for Activity and Next Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <RecentActivityFeed vaultId={vaultId} />
        <SmartNextSteps
          interviewProgress={stats.review_completion_percentage}
          strengthScore={strengthScore?.total || 0}
          totalItems={totalIntelligenceItems}
          hasLeadership={stats.total_leadership_philosophy > 0}
          hasExecutivePresence={stats.total_executive_presence > 0}
        />
      </div>

      {/* Career History Manager */}
      {vault && (
        <Card className="mb-6 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Career History & Privacy
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Control which jobs and education appear in your resumes
              </p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Shield className="h-4 w-4 mr-2" />
                  Manage Milestones
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Career History Manager</DialogTitle>
                </DialogHeader>
                <MilestoneManager vaultId={vault.id} />
              </DialogContent>
            </Dialog>
          </div>
        </Card>
      )}

      {/* Career Vault Status Hero */}
      {strengthScore && (
        <div className="mb-6">
          <VaultStatusHero
            strengthScore={strengthScore.total}
            level={strengthScore.level}
            totalItems={totalIntelligenceItems}
            quickWinsAvailable={
              (strengthScore.quantificationScore < 10 ? 1 : 0) +
              (strengthScore.modernTerminologyScore < 10 ? 1 : 0)
            }
            onTakeQuickWins={() => {
              // Open the first quick win modal
              if (strengthScore.quantificationScore < 10) {
                setAddMetricsModalOpen(true);
              } else if (strengthScore.modernTerminologyScore < 10) {
                setModernizeModalOpen(true);
              }
            }}
            onRefresh={handleRefreshVault}
            qualityDistribution={qualityDistribution}
            coreScores={{
              powerPhrases: strengthScore.powerPhrasesScore,
              skills: strengthScore.transferableSkillsScore,
              competencies: strengthScore.hiddenCompetenciesScore,
              intangibles: strengthScore.intangiblesScore,
              quantification: strengthScore.quantificationScore,
              modernTerms: strengthScore.modernTerminologyScore
            }}
          />
        </div>
      )}

      {/* Quality Tier Explainer - NEW: Phase 0 */}
      {strengthScore && (
        <div className="mb-6">
          <QualityTierExplainer
            goldCount={qualityDistribution.gold}
            silverCount={qualityDistribution.silver}
            bronzeCount={qualityDistribution.bronze}
            assumedCount={qualityDistribution.assumed}
            totalItems={totalIntelligenceItems}
            onVerifyAssumed={() => navigate('/career-vault-onboarding')}
          />
        </div>
      )}

      {/* Vault Improvement Suggestions - NEW: Phase 0 */}
      {strengthScore && (
        <div className="mb-6">
          <VaultSuggestionsWidget
            assumedCount={qualityDistribution.assumed}
            weakPhrasesCount={powerPhrases.filter(p =>
              !p.impact_metrics || Object.keys(p.impact_metrics).length === 0
            ).length}
            staleItemsCount={[
              ...powerPhrases,
              ...transferableSkills,
              ...hiddenCompetencies,
              ...softSkills
            ].filter(item => {
              const lastUpdated = item.last_updated_at || (item as any).updated_at || (item as any).created_at;
              if (!lastUpdated) return true;
              const daysSince = Math.floor((Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24));
              return daysSince > 180; // 6 months
            }).length}
            onVerifyAssumed={() => navigate('/career-vault-onboarding')}
            onAddMetrics={() => setAddMetricsModalOpen(true)}
            onUpdateStale={() => setModernizeModalOpen(true)}
          />
        </div>
      )}

      {/* Phase 3: Quality Score & Organization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <VaultQualityScore
          currentScore={strengthScore?.total || 0}
          maxScore={150}
          level={strengthScore?.level || 'Developing'}
          nextLevel={strengthScore?.level === 'Developing' ? 'Solid' : 
                    strengthScore?.level === 'Solid' ? 'Strong' :
                    strengthScore?.level === 'Strong' ? 'Elite' : 'Exceptional'}
          pointsToNextLevel={
            strengthScore?.level === 'Developing' ? 50 - (strengthScore?.total || 0) :
            strengthScore?.level === 'Solid' ? 75 - (strengthScore?.total || 0) :
            strengthScore?.level === 'Strong' ? 100 - (strengthScore?.total || 0) :
            strengthScore?.level === 'Elite' ? 125 - (strengthScore?.total || 0) : 0
          }
          weeklyImprovement={5}
          percentile={Math.min(95, Math.floor((strengthScore?.total || 0) / 1.5))}
        />
        
        <CategoryOrganizer
          stats={{
            resumeContent: {
              achievements: powerPhrases.length,
              powerPhrases: powerPhrases.length,
              skills: transferableSkills.length,
              education: 0
            },
            interviewPrep: {
              leadershipStories: leadershipPhilosophy.length,
              softSkills: softSkills.length,
              problemSolving: 0,
              competencies: hiddenCompetencies.length
            },
            targeting: {
              differentiators: executivePresence.length,
              cultureFit: values.length,
              personalityTraits: personalityTraits.length,
              workStyle: workStyle.length
            }
          }}
          onCategoryClick={(category) => console.log('Category clicked:', category)}
        />
      </div>

      {/* Vault Activity Feed - Phase 0 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <VaultActivityFeed vaultId={vaultId} limit={7} />
        <SmartNextSteps
          interviewProgress={stats.review_completion_percentage}
          strengthScore={strengthScore?.total || 0}
          totalItems={totalIntelligenceItems}
          hasLeadership={stats.total_leadership_philosophy > 0}
          hasExecutivePresence={stats.total_executive_presence > 0}
        />
      </div>
      
      {/* Phase 4: Maintenance & Verification */}
      <div data-verification-workflow className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <VerificationWorkflow vaultId={vaultId} />
        <FreshnessManager vaultId={vaultId} />
        <DuplicateDetector vaultId={vaultId} />
      </div>

      {/* Unified Vault Contents Table - NEW: Phase 0 */}
      <div data-contents-table className="mb-6">
        <VaultContentsTable
          powerPhrases={powerPhrases}
          transferableSkills={transferableSkills}
          hiddenCompetencies={hiddenCompetencies}
          softSkills={softSkills}
          leadershipPhilosophy={leadershipPhilosophy}
          executivePresence={executivePresence}
          personalityTraits={personalityTraits}
          workStyle={workStyle}
          values={values}
          behavioralIndicators={behavioralIndicators}
          onEdit={(item) => {
            setSelectedItem(item);
            setEditModalOpen(true);
          }}
          onView={(item) => {
            setSelectedItem(item);
            setViewModalOpen(true);
          }}
        />
      </div>

      {/* View & Edit Modals */}
      <VaultItemViewModal
        item={selectedItem}
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
      />
      <VaultItemEditModal
        item={selectedItem}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSave={() => {
          fetchData();
          toast({
            title: 'Success',
            description: 'Vault item updated successfully',
          });
        }}
      />

      {/* Vault Contents (OLD - replaced by table above) */}
      {stats && false && (
        <div className="mb-6">
          <VaultContents
            categories={{
              core: [
                {
                  name: 'Power Phrases',
                  description: 'Achievement statements like "Increased revenue by 40%"',
                  icon: '💪',
                  count: stats?.total_power_phrases || 0,
                  isEmpty: (stats?.total_power_phrases || 0) === 0
                },
                {
                  name: 'Skills',
                  description: 'Technical and soft skills extracted from your experience',
                  icon: '🛠️',
                  count: stats?.total_transferable_skills || 0,
                  isEmpty: (stats?.total_transferable_skills || 0) === 0
                },
                {
                  name: 'Competencies',
                  description: 'High-level capabilities like "Strategic Planning"',
                  icon: '💡',
                  count: stats?.total_hidden_competencies || 0,
                  isEmpty: (stats?.total_hidden_competencies || 0) === 0
                }
              ],
              leadership: [
                {
                  name: 'Leadership Philosophy',
                  description: 'Your approach to leading teams',
                  icon: '🎯',
                  count: stats?.total_leadership_philosophy || 0,
                  isEmpty: (stats?.total_leadership_philosophy || 0) === 0
                },
                {
                  name: 'Executive Presence',
                  description: 'How you show up in professional settings',
                  icon: '👔',
                  count: stats?.total_executive_presence || 0,
                  isEmpty: (stats?.total_executive_presence || 0) === 0
                }
              ],
              culture: [
                {
                  name: 'Soft Skills',
                  description: 'Communication, teamwork, problem-solving abilities',
                  icon: '🧠',
                  count: stats?.total_soft_skills || 0,
                  isEmpty: (stats?.total_soft_skills || 0) === 0
                },
                {
                  name: 'Personality Traits',
                  description: 'Your natural work tendencies and characteristics',
                  icon: '🎭',
                  count: stats?.total_personality_traits || 0,
                  isEmpty: (stats?.total_personality_traits || 0) === 0
                },
                {
                  name: 'Work Style',
                  description: 'Your preferences for how you work best',
                  icon: '⚙️',
                  count: stats?.total_work_style || 0,
                  isEmpty: (stats?.total_work_style || 0) === 0
                },
                {
                  name: 'Values',
                  description: 'What matters most to you in your career',
                  icon: '💎',
                  count: stats?.total_values || 0,
                  isEmpty: (stats?.total_values || 0) === 0
                },
                {
                  name: 'Behavioral Indicators',
                  description: 'Observable patterns in how you work',
                  icon: '🔍',
                  count: stats?.total_behavioral_indicators || 0,
                  isEmpty: (stats?.total_behavioral_indicators || 0) === 0
                }
              ]
            }}
            onAddItem={() => {
              // Navigate to onboarding to add items
              navigate('/career-vault-onboarding');
            }}
            onViewCategory={(categoryName) => {
              // Switch to the appropriate tab in the dashboard
              const tabMap: Record<string, string> = {
                'Power Phrases': 'power-phrases',
                'Skills': 'transferable-skills',
                'Competencies': 'hidden-competencies',
                'Soft Skills': 'soft-skills',
                'Leadership Philosophy': 'leadership',
                'Executive Presence': 'presence',
                'Personality Traits': 'traits',
                'Work Style': 'work-style',
                'Values': 'values',
                'Behavioral Indicators': 'behavioral'
              };
              // This would require adding state to control the active tab
              // For now, it scrolls to the tabs section
              const tabValue = tabMap[categoryName];
              if (tabValue) {
                document.querySelector(`[value="${tabValue}"]`)?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          />
        </div>
      )}

      {/* Quality Boosters */}
      {strengthScore && stats && (
        <div className="mb-6">
          <QualityBoosters
            quantificationScore={strengthScore.quantificationScore}
            modernTermsScore={strengthScore.modernTerminologyScore}
            totalPhrases={stats.total_power_phrases}
            onAddMetrics={() => setAddMetricsModalOpen(true)}
            onModernizeLanguage={() => setModernizeModalOpen(true)}
          />
        </div>
      )}

      {/* Review Progress */}
      <Card className="p-6 mb-8">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Review Completion</h3>
          <span className="text-sm text-muted-foreground">{stats.review_completion_percentage}%</span>
        </div>
        <Progress value={stats.review_completion_percentage} className="h-2" />
        <p className="text-sm text-muted-foreground mt-2">
          Continue reviewing AI-extracted items to complete your vault
        </p>
      </Card>

      {/* Detailed Tabs */}
      <Tabs defaultValue="enhancement-queue" className="w-full">
        <div className="overflow-x-auto">
          <TabsList className="inline-flex w-max min-w-full">
            <TabsTrigger value="enhancement-queue">🎯 Queue</TabsTrigger>
            <TabsTrigger value="power-phrases">Phrases</TabsTrigger>
            <TabsTrigger value="transferable-skills">Skills</TabsTrigger>
            <TabsTrigger value="hidden-competencies">Competencies</TabsTrigger>
            <TabsTrigger value="soft-skills">🧠 Soft Skills</TabsTrigger>
            <TabsTrigger value="leadership">🎯 Leadership</TabsTrigger>
            <TabsTrigger value="presence">👔 Presence</TabsTrigger>
            <TabsTrigger value="traits">🎭 Traits</TabsTrigger>
            <TabsTrigger value="work-style">⚙️ Style</TabsTrigger>
            <TabsTrigger value="values">💎 Values</TabsTrigger>
            <TabsTrigger value="behavioral">🔍 Behavioral</TabsTrigger>
            <TabsTrigger value="responses">All</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="enhancement-queue">
          <EnhancementQueue vaultId={vaultId} />
        </TabsContent>

        <TabsContent value="power-phrases" className="space-y-4">
          {powerPhrases.length > 0 ? (
            powerPhrases.map((phrase) => (
              <Card key={phrase.id} className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="secondary">{phrase.category}</Badge>
                  <Badge variant={(phrase.confidence_score ?? 0) > 80 ? "default" : "outline"}>
                    {phrase.confidence_score ?? 0}% confidence
                  </Badge>
                </div>
                <p className="text-lg mb-3">{phrase.power_phrase}</p>
                <div className="flex flex-wrap gap-2">
                  {(phrase.keywords ?? []).map((keyword, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No power phrases yet. Continue your interview to build your vault.</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="transferable-skills" className="space-y-4">
          {transferableSkills.length > 0 ? (
            transferableSkills.map((skill) => (
              <Card key={skill.id} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-lg font-semibold">{skill.stated_skill}</h4>
                  <Badge variant={(skill.confidence_score ?? 0) > 80 ? "default" : "outline"}>
                    {skill.confidence_score ?? 0}% confidence
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{skill.evidence}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm font-medium">Also qualifies for:</span>
                  {skill.equivalent_skills.map((eq, idx) => (
                    <Badge key={idx} variant="secondary">
                      {eq}
                    </Badge>
                  ))}
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No transferable skills yet. Continue your interview to build your vault.</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="hidden-competencies" className="space-y-4">
          {hiddenCompetencies.length > 0 ? (
            hiddenCompetencies.map((comp) => (
              <Card key={comp.id} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-lg font-semibold">{comp.competency_area}</h4>
                  <Badge variant={(comp.confidence_score ?? 0) > 80 ? "default" : "outline"}>
                    {comp.confidence_score ?? 0}% confidence
                  </Badge>
                </div>
                <p className="text-sm mb-3">{comp.inferred_capability}</p>
                {comp.certification_equivalent && (
                  <Badge variant="secondary">≈ {comp.certification_equivalent}</Badge>
                )}
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No hidden competencies yet. Continue your interview to discover them.</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="soft-skills" className="space-y-4">
          {softSkills.length > 0 ? (
            softSkills.map((skill) => (
              <Card key={skill.id} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-lg font-semibold">{skill.skill_name}</h4>
                  <Badge variant={skill.proficiency_level === 'expert' ? 'default' : 'secondary'}>
                    {skill.proficiency_level || 'Proficient'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{skill.examples}</p>
                {skill.impact && (
                  <p className="text-sm text-primary">Impact: {skill.impact}</p>
                )}
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No soft skills documented yet. Continue your interview to reveal them.</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="leadership" className="space-y-4">
          {leadershipPhilosophy.length > 0 ? (
            leadershipPhilosophy.map((philosophy) => (
              <Card key={philosophy.id} className="p-6 bg-gradient-to-br from-primary/5 to-transparent">
                {philosophy.leadership_style && (
                  <Badge variant="default" className="mb-3">{philosophy.leadership_style}</Badge>
                )}
                <p className="text-lg font-medium mb-3">{philosophy.philosophy_statement}</p>
                {philosophy.real_world_application && (
                  <p className="text-sm text-muted-foreground mb-2">{philosophy.real_world_application}</p>
                )}
                {philosophy.core_principles && philosophy.core_principles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {philosophy.core_principles.map((principle, idx) => (
                      <Badge key={idx} variant="outline">{principle}</Badge>
                    ))}
                  </div>
                )}
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No leadership philosophy documented yet. Continue your interview.</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="presence" className="space-y-4">
          {executivePresence.length > 0 ? (
            executivePresence.map((presence) => (
              <Card key={presence.id} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-lg font-semibold">{presence.presence_indicator}</h4>
                  {presence.perceived_impact && (
                    <Badge variant="default">{presence.perceived_impact}</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">{presence.situational_example}</p>
                {presence.brand_alignment && (
                  <p className="text-sm text-primary">Brand: {presence.brand_alignment}</p>
                )}
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No executive presence indicators yet. Continue your interview.</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="traits" className="space-y-4">
          {personalityTraits.length > 0 ? (
            personalityTraits.map((trait) => (
              <Card key={trait.id} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-lg font-semibold">{trait.trait_name}</h4>
                  {trait.strength_or_growth && (
                    <Badge variant={trait.strength_or_growth === 'strength' ? 'default' : 'secondary'}>
                      {trait.strength_or_growth}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">{trait.behavioral_evidence}</p>
                {trait.work_context && (
                  <p className="text-sm text-primary">Context: {trait.work_context}</p>
                )}
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No personality traits documented yet. Continue your interview.</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="work-style" className="space-y-4">
          {workStyle.length > 0 ? (
            workStyle.map((style) => (
              <Card key={style.id} className="p-6">
                <h4 className="text-lg font-semibold mb-3">{style.preference_area}</h4>
                <p className="text-sm mb-2">{style.preference_description}</p>
                {style.examples && (
                  <p className="text-sm text-muted-foreground mb-2">Examples: {style.examples}</p>
                )}
                {style.ideal_environment && (
                  <p className="text-sm text-primary">Ideal: {style.ideal_environment}</p>
                )}
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No work style preferences documented yet. Continue your interview.</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="values" className="space-y-4">
          {values.length > 0 ? (
            values.map((value) => (
              <Card key={value.id} className="p-6 bg-gradient-to-br from-primary/5 to-transparent">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-lg font-semibold">{value.value_name}</h4>
                  {value.importance_level && (
                    <Badge variant="default">{value.importance_level}</Badge>
                  )}
                </div>
                <p className="text-sm mb-2">{value.manifestation}</p>
                {value.career_decisions_influenced && (
                  <p className="text-sm text-muted-foreground">Influences: {value.career_decisions_influenced}</p>
                )}
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No core values documented yet. Continue your interview.</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="behavioral" className="space-y-4">
          {behavioralIndicators.length > 0 ? (
            behavioralIndicators.map((indicator) => (
              <Card key={indicator.id} className="p-6">
                <h4 className="text-lg font-semibold mb-3">{indicator.indicator_type}</h4>
                <p className="text-sm mb-2">{indicator.specific_behavior}</p>
                {indicator.context && (
                  <p className="text-sm text-muted-foreground mb-2">Context: {indicator.context}</p>
                )}
                {indicator.outcome_pattern && (
                  <p className="text-sm text-primary">Outcome: {indicator.outcome_pattern}</p>
                )}
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No behavioral patterns documented yet. Continue your interview.</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="responses">
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              This tab shows all your Career Vault intelligence in one place.
            </p>
            <p className="text-sm text-muted-foreground">
              Use the individual tabs above to explore specific categories of your career vault.
            </p>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Improvement Modals */}
      <AddMetricsModal
        open={addMetricsModalOpen}
        onOpenChange={setAddMetricsModalOpen}
        vaultId={vaultId}
        onSuccess={() => {
          // Refresh data after improvements
          fetchData();
        }}
      />

      <ModernizeLanguageModal
        open={modernizeModalOpen}
        onOpenChange={setModernizeModalOpen}
        vaultId={vaultId}
        onSuccess={() => {
          // Refresh data after improvements
          fetchData();
        }}
      />
    </div>
  </ContentLayout>
);
};

const CareerVaultDashboard = () => {
  return (
    <ProtectedRoute>
      <VaultDashboardContent />
    </ProtectedRoute>
  );
};

export default CareerVaultDashboard;