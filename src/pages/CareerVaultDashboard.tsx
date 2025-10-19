import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Target, Award, Trophy, Info } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";

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
  interview_completion_percentage: number;
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
}

interface TransferableSkill {
  id: string;
  stated_skill: string;
  equivalent_skills: string[];
  evidence: string;
  confidence_score: number | null;
}

interface HiddenCompetency {
  id: string;
  competency_area: string;
  inferred_capability: string;
  supporting_evidence: string[];
  confidence_score: number | null;
  certification_equivalent: string | null;
}

interface SoftSkill {
  id: string;
  skill_name: string;
  examples: string;
  impact: string | null;
  proficiency_level: string | null;
}

interface LeadershipPhilosophy {
  id: string;
  philosophy_statement: string;
  leadership_style: string | null;
  real_world_application: string | null;
  core_principles: string[] | null;
}

interface ExecutivePresence {
  id: string;
  presence_indicator: string;
  situational_example: string;
  brand_alignment: string | null;
  perceived_impact: string | null;
}

interface PersonalityTrait {
  id: string;
  trait_name: string;
  behavioral_evidence: string;
  work_context: string | null;
  strength_or_growth: string | null;
}

interface WorkStyle {
  id: string;
  preference_area: string;
  preference_description: string;
  examples: string | null;
  ideal_environment: string | null;
}

interface Value {
  id: string;
  value_name: string;
  manifestation: string;
  importance_level: string | null;
  career_decisions_influenced: string | null;
}

interface BehavioralIndicator {
  id: string;
  indicator_type: string;
  specific_behavior: string;
  context: string | null;
  outcome_pattern: string | null;
}

import { EnhancementQueue } from '@/components/EnhancementQueue';
import { useNavigate } from 'react-router-dom';
import { Rocket, Upload, PlayCircle, RotateCcw, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResumeManagementModal } from '@/components/career-vault/ResumeManagementModal';
import { VaultQuickStats } from '@/components/career-vault/VaultQuickStats';
import { RecentActivityFeed } from '@/components/career-vault/RecentActivityFeed';
import { SmartNextSteps } from '@/components/career-vault/SmartNextSteps';

const VaultDashboardContent = () => {
  const navigate = useNavigate();
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
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
    // Core Intelligence (30 points total)
    const powerPhrasesScore = Math.min((phrases.length / 20) * 10, 10);
    const transferableSkillsScore = Math.min((skills.length / 15) * 10, 10);
    const hiddenCompetenciesScore = Math.min((competencies.length / 10) * 10, 10);
    
    // Intangibles Intelligence (40 points total)
    const softSkillsScore = Math.min((softSkills.length / 8) * 8, 8);
    const leadershipScore = Math.min((leadership.length / 3) * 8, 8);
    const presenceScore = Math.min((presence.length / 3) * 8, 8);
    const traitsScore = Math.min((traits.length / 5) * 4, 4);
    const styleScore = Math.min((style.length / 3) * 4, 4);
    const valuesScore = Math.min((vals.length / 3) * 4, 4);
    const behavioralScore = Math.min((behavioral.length / 3) * 4, 4);
    
    const intangiblesScore = softSkillsScore + leadershipScore + presenceScore + traitsScore + styleScore + valuesScore + behavioralScore;
    
    // Quality Metrics (30 points total)
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
    
    const total = Math.round(
      powerPhrasesScore + 
      transferableSkillsScore + 
      hiddenCompetenciesScore + 
      intangiblesScore +
      quantificationScore + 
      modernTerminologyScore
    );
    
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

  useEffect(() => {
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
            interview_completion_percentage: vault.interview_completion_percentage || 0
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
            interview_completion_percentage: vault.interview_completion_percentage || 0
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

    fetchData();
  }, []);

  const handleResumeUploaded = () => {
    window.location.reload();
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
          <Button size="lg" onClick={() => navigate('/career-vault/onboarding')}>
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
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Career Vault Control Panel</h1>
        <p className="text-muted-foreground">
          Your career intelligence command center - manage documents, track progress, and deploy your vault
        </p>
      </div>

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
              {stats.interview_completion_percentage}% interview complete • {totalIntelligenceItems} intelligence items extracted
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
            
            {stats.interview_completion_percentage < 100 ? (
              <Button 
                className="justify-start"
                onClick={() => navigate('/career-vault/onboarding')}
              >
                <PlayCircle className="h-4 w-4 mr-2" />
                Continue Interview
              </Button>
            ) : (
              <Button 
                variant="outline"
                className="justify-start"
                onClick={() => navigate('/career-vault/onboarding')}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Restart Interview
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
        interviewProgress={stats.interview_completion_percentage}
        strengthScore={strengthScore?.total || 0}
        lastUpdated={null}
      />

      {/* Two Column Layout for Activity and Next Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <RecentActivityFeed vaultId={vaultId} />
        <SmartNextSteps
          interviewProgress={stats.interview_completion_percentage}
          strengthScore={strengthScore?.total || 0}
          totalItems={totalIntelligenceItems}
          hasLeadership={stats.total_leadership_philosophy > 0}
          hasExecutivePresence={stats.total_executive_presence > 0}
        />
      </div>

      {/* Career Vault Strength Score */}
      {strengthScore && (
        <Card className="p-8 mb-8 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <Trophy className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1">Career Vault Strength Score</h2>
                <p className="text-muted-foreground">Comprehensive assessment across 20 intelligence categories</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold text-primary mb-1">{strengthScore.total}</div>
              <Badge variant={
                strengthScore.level === 'Exceptional' ? 'default' :
                strengthScore.level === 'Elite' ? 'default' :
                strengthScore.level === 'Strong' ? 'secondary' :
                'outline'
              } className="text-lg px-4 py-1">
                {strengthScore.level}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Power Phrases</span>
                <span className="text-sm text-muted-foreground">{strengthScore.powerPhrasesScore}/10</span>
              </div>
              <Progress value={(strengthScore.powerPhrasesScore / 10) * 100} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Skills</span>
                <span className="text-sm text-muted-foreground">{strengthScore.transferableSkillsScore}/10</span>
              </div>
              <Progress value={(strengthScore.transferableSkillsScore / 10) * 100} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Competencies</span>
                <span className="text-sm text-muted-foreground">{strengthScore.hiddenCompetenciesScore}/10</span>
              </div>
              <Progress value={(strengthScore.hiddenCompetenciesScore / 10) * 100} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Intangibles</span>
                <span className="text-sm text-muted-foreground">{strengthScore.intangiblesScore}/40</span>
              </div>
              <Progress value={(strengthScore.intangiblesScore / 40) * 100} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Quantification</span>
                <span className="text-sm text-muted-foreground">{strengthScore.quantificationScore}/15</span>
              </div>
              <Progress value={(strengthScore.quantificationScore / 15) * 100} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Modern Terms</span>
                <span className="text-sm text-muted-foreground">{strengthScore.modernTerminologyScore}/15</span>
              </div>
              <Progress value={(strengthScore.modernTerminologyScore / 15) * 100} className="h-2" />
            </div>
          </div>

          <div className="text-center mt-4 p-4 bg-muted/50 rounded-lg border-t">
            <p className="text-sm font-medium mb-3">Your Vault Powers All 5 Dimensions:</p>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
              <div className="p-2 bg-background rounded">
                <p className="font-semibold text-ai-primary">Resume 90%+</p>
                <p className="text-muted-foreground">Gets reviewed</p>
              </div>
              <div className="p-2 bg-background rounded">
                <p className="font-semibold text-ai-secondary">LinkedIn Top 10</p>
                <p className="text-muted-foreground">Gets found</p>
              </div>
              <div className="p-2 bg-background rounded">
                <p className="font-semibold text-ai-accent">Interview Mastery</p>
                <p className="text-muted-foreground">Gets past screening</p>
              </div>
              <div className="p-2 bg-background rounded">
                <p className="font-semibold text-ai-active">Market Intel</p>
                <p className="text-muted-foreground">Informed insider</p>
              </div>
              <div className="p-2 bg-background rounded">
                <p className="font-semibold text-ai-complete">Network</p>
                <p className="text-muted-foreground">Gets referrals</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3 italic">
              Your vault score represents foundation strength. Deploy it across all 5 dimensions to become 
              the benchmark candidate for each specific role you pursue.
            </p>
          </div>

          <div className="mt-6 p-4 bg-background/50 rounded-lg">
            <div className="flex items-start gap-3">
              <Award className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium mb-2">Career Intelligence Summary:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                  <div>✓ {stats.total_power_phrases} power phrases</div>
                  <div>✓ {stats.total_transferable_skills} transferable skills</div>
                  <div>✓ {stats.total_hidden_competencies} hidden competencies</div>
                  <div>✓ {stats.total_soft_skills} soft skills</div>
                  <div>✓ {stats.total_leadership_philosophy} leadership insights</div>
                  <div>✓ {stats.total_executive_presence} presence indicators</div>
                  <div>✓ {stats.total_personality_traits} personality traits</div>
                  <div>✓ {stats.total_work_style} work style aspects</div>
                </div>
                {strengthScore.level === 'Exceptional' && <p className="text-primary font-medium mt-2">🏆 Exceptional Career Vault - Top 5% of professionals!</p>}
                {strengthScore.level === 'Elite' && <p className="text-primary font-medium mt-2">⭐ Elite Career Vault - Outstanding career intelligence!</p>}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Interview Progress */}
      <Card className="p-6 mb-8">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Interview Completion</h3>
          <span className="text-sm text-muted-foreground">{stats.interview_completion_percentage}%</span>
        </div>
        <Progress value={stats.interview_completion_percentage} className="h-2" />
        <p className="text-sm text-muted-foreground mt-2">
          Continue the interview to unlock more intelligence categories
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
    </div>
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