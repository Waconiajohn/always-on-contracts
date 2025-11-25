import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Trophy, Brain, FileText, Users, 
  MessageSquare, Loader2, ArrowLeft, Home
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CategorySection } from '../components/CategorySection';

interface Phase5Props {
  vaultId: string;
  onProgress: (progress: number, message?: string) => void;
  onTimeEstimate: (estimate: string) => void;
  onComplete: () => void;
  onBackToBuilder?: () => void;
}

export const Phase5_VaultLibrary = ({
  vaultId,
  onProgress,
  onBackToBuilder
}: Phase5Props) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  const handleBackToVault = async () => {
    if (onBackToBuilder) {
      // Go back to builder interface
      onBackToBuilder();
    } else {
      // Reset to phase 0 and reload
      await supabase
        .from('career_vault')
        .update({ current_phase: 0 })
        .eq('id', vaultId);
      
      window.location.href = '/career-vault';
    }
  };
  
  // All 10 intelligence categories
  const [achievements, setAchievements] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [competencies, setCompetencies] = useState<any[]>([]);
  const [softSkills, setSoftSkills] = useState<any[]>([]);
  const [leadership, setLeadership] = useState<any[]>([]);
  const [executivePresence, setExecutivePresence] = useState<any[]>([]);
  const [personality, setPersonality] = useState<any[]>([]);
  const [workstyle, setWorkstyle] = useState<any[]>([]);
  const [values, setValues] = useState<any[]>([]);
  const [behavioral, setBehavioral] = useState<any[]>([]);
  
  // Work context data
  const [workPositions, setWorkPositions] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);

  useEffect(() => {
    loadVaultData();
  }, [vaultId]);

  const loadVaultData = async () => {
    if (!vaultId) return;

    setIsLoading(true);
    onProgress(10, "Loading vault data...");

    try {
      // Fetch vault metadata to ensure vault exists
      const { error: vaultError } = await supabase
        .from('career_vault')
        .select('id')
        .eq('id', vaultId)
        .single();

      if (vaultError) throw vaultError;
      onProgress(20, "Loading work experience...");

      // Fetch work positions and milestones for context
      const { data: positionsData } = await supabase
        .from('vault_work_positions')
        .select('*')
        .eq('vault_id', vaultId)
        .order('start_date', { ascending: false });

      setWorkPositions(positionsData || []);
      setMilestones([]);
      onProgress(30, "Loading intelligence categories...");

      // Fetch all 10 intelligence categories in parallel
      const [
        achievementsRes,
        skillsRes,
        competenciesRes,
        softSkillsRes,
        leadershipRes,
        executiveRes,
        personalityRes,
        workstyleRes,
        valuesRes,
        behavioralRes
      ] = await Promise.all([
        supabase.from('vault_power_phrases').select('*').eq('vault_id', vaultId).order('quality_tier', { ascending: false }),
        supabase.from('vault_transferable_skills').select('*').eq('vault_id', vaultId).order('quality_tier', { ascending: false }),
        supabase.from('vault_hidden_competencies').select('*').eq('vault_id', vaultId).order('quality_tier', { ascending: false }),
        supabase.from('vault_soft_skills').select('*').eq('vault_id', vaultId).order('quality_tier', { ascending: false }),
        supabase.from('vault_leadership_philosophy').select('*').eq('vault_id', vaultId).order('quality_tier', { ascending: false }),
        supabase.from('vault_executive_presence').select('*').eq('vault_id', vaultId).order('quality_tier', { ascending: false }),
        supabase.from('vault_personality_traits').select('*').eq('vault_id', vaultId).order('quality_tier', { ascending: false }),
        supabase.from('vault_work_style').select('*').eq('vault_id', vaultId).order('quality_tier', { ascending: false }),
        supabase.from('vault_values_motivations').select('*').eq('vault_id', vaultId).order('quality_tier', { ascending: false }),
        supabase.from('vault_behavioral_indicators').select('*').eq('vault_id', vaultId).order('quality_tier', { ascending: false })
      ]);

      setAchievements(achievementsRes.data || []);
      setSkills(skillsRes.data || []);
      setCompetencies(competenciesRes.data || []);
      setSoftSkills(softSkillsRes.data || []);
      setLeadership(leadershipRes.data || []);
      setExecutivePresence(executiveRes.data || []);
      setPersonality(personalityRes.data || []);
      setWorkstyle(workstyleRes.data || []);
      setValues(valuesRes.data || []);
      setBehavioral(behavioralRes.data || []);

      onProgress(100, "Vault loaded successfully");
      
      toast({
        title: "Vault loaded",
        description: "All 10 intelligence categories ready to explore"
      });
    } catch (error) {
      console.error('Error loading vault:', error);
      toast({
        title: "Error",
        description: "Failed to load vault data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateCategory = async (categoryName: string) => {
    try {
      toast({
        title: "Generating intelligence...",
        description: `Using Gemini 2.5 Flash to analyze your career data`
      });

      const { error } = await supabase.functions.invoke('extract-vault-intangibles', {
        body: { vaultId, category: categoryName }
      });

      if (error) throw error;

      toast({
        title: "Generation complete!",
        description: `New ${categoryName} items added to your vault`
      });

      loadVaultData();
    } catch (error) {
      console.error('Error regenerating category:', error);
      toast({
        title: "Error",
        description: "Failed to generate intelligence",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">Loading your career intelligence library...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 pb-24">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Navigation */}
        <div className="flex items-center justify-between pt-4">
          <Button
            variant="ghost"
            onClick={handleBackToVault}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Builder
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/home')}
            className="gap-2"
          >
            <Home className="h-4 w-4" />
            Home
          </Button>
        </div>

        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-full">
            <Trophy className="h-5 w-5 text-purple-600" />
            <span className="font-semibold text-purple-700 dark:text-purple-300">Powered by Advanced AI</span>
          </div>
          <h1 className="text-4xl font-bold">Career Intelligence Library</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            10 categories of professional intelligence, enhanced by Google's most advanced AI models
          </p>
        </div>

        {/* AI Intelligence Engine Info */}
        <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-blue-500/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Brain className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">AI Intelligence Engine</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Every item in your vault can be enhanced using advanced AI. Enhancement includes strategic keyword injection, executive-level language optimization, and quality tier upgrades.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Sections */}
        <div className="space-y-6">
          {/* Core Intelligence */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span>⚡</span> Core Intelligence
            </h2>
            <CategorySection
              title="Career Achievements"
              icon="🎯"
              description="Quantified accomplishments that demonstrate impact"
              educationalContext="These achievements power your Resume Builder by providing concrete, metrics-driven bullet points that pass ATS systems and impress hiring managers."
              items={achievements}
              category="achievements"
              defaultOpen={true}
              onRefresh={loadVaultData}
              onGenerateCategory={() => handleRegenerateCategory('power_phrases')}
              workPositions={workPositions}
              milestones={milestones}
            />
            
            <CategorySection
              title="Skills & Expertise"
              icon="💼"
              description="Technical and functional capabilities"
              educationalContext="Your skills library helps LinkedIn Optimizer create keyword-rich profiles and enables Interview Prep to match your expertise to job requirements."
              items={skills}
              category="skills"
              onRefresh={loadVaultData}
              onGenerateCategory={() => handleRegenerateCategory('transferable_skills')}
              workPositions={workPositions}
              milestones={milestones}
            />
            
            <CategorySection
              title="Strategic Capabilities"
              icon="🧩"
              description="Hidden competencies and strategic strengths"
              educationalContext="These competencies differentiate you in competitive hiring processes by revealing strategic thinking abilities that aren't obvious from job titles alone."
              items={competencies}
              category="competencies"
              onRefresh={loadVaultData}
              onGenerateCategory={() => handleRegenerateCategory('hidden_competencies')}
              workPositions={workPositions}
              milestones={milestones}
            />
          </div>

          {/* Leadership & Presence */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span>👑</span> Leadership & Presence
            </h2>
            <CategorySection
              title="Professional Strengths"
              icon="💪"
              description="Core soft skills and interpersonal abilities"
              educationalContext="These strengths enhance your Interview Prep responses with behavioral examples and help LinkedIn Optimizer craft authentic personal brand messaging."
              items={softSkills}
              category="strengths"
              onRefresh={loadVaultData}
              onGenerateCategory={() => handleRegenerateCategory('soft_skills')}
              workPositions={workPositions}
              milestones={milestones}
            />
            
            <CategorySection
              title="Leadership Philosophy"
              icon="🎓"
              description="Your approach to leading teams and driving results"
              educationalContext="Leadership insights power executive-level Interview Prep responses and create compelling LinkedIn thought leadership content."
              items={leadership}
              category="leadership"
              onRefresh={loadVaultData}
              onGenerateCategory={() => handleRegenerateCategory('leadership')}
              workPositions={workPositions}
              milestones={milestones}
            />
            
            <CategorySection
              title="Executive Presence"
              icon="✨"
              description="Communication style and professional gravitas"
              educationalContext="Executive presence indicators help Interview Prep craft C-suite level responses and guide LinkedIn Optimizer in positioning you for senior roles."
              items={executivePresence}
              category="executive"
              onRefresh={loadVaultData}
              onGenerateCategory={() => handleRegenerateCategory('executive_presence')}
              workPositions={workPositions}
              milestones={milestones}
            />
          </div>

          {/* Personal Brand */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span>🌟</span> Personal Brand
            </h2>
            <CategorySection
              title="Personality Traits"
              icon="🎭"
              description="Behavioral characteristics and work personality"
              educationalContext="Personality insights enable LinkedIn Optimizer to create authentic voice content and help Interview Prep answer culture-fit questions naturally."
              items={personality}
              category="personality"
              onRefresh={loadVaultData}
              onGenerateCategory={() => handleRegenerateCategory('personality')}
              workPositions={workPositions}
              milestones={milestones}
            />
            
            <CategorySection
              title="Work Style Preferences"
              icon="⚙️"
              description="How you work best and collaborate"
              educationalContext="Work style data helps Resume Builder customize objective statements and provides Interview Prep with team dynamics examples."
              items={workstyle}
              category="workstyle"
              onRefresh={loadVaultData}
              onGenerateCategory={() => handleRegenerateCategory('work_style')}
              workPositions={workPositions}
              milestones={milestones}
            />
            
            <CategorySection
              title="Core Values & Motivations"
              icon="❤️"
              description="What drives you professionally"
              educationalContext="Values inform LinkedIn Optimizer's authentic storytelling and help Interview Prep answer motivation questions with genuine passion."
              items={values}
              category="values"
              onRefresh={loadVaultData}
              onGenerateCategory={() => handleRegenerateCategory('values')}
              workPositions={workPositions}
              milestones={milestones}
            />
            
            <CategorySection
              title="Behavioral Indicators"
              icon="🔍"
              description="Observable patterns in how you deliver results"
              educationalContext="Behavioral patterns provide Interview Prep with rich STAR story examples and give LinkedIn Optimizer proof points for your claims."
              items={behavioral}
              category="behavioral"
              onRefresh={loadVaultData}
              onGenerateCategory={() => handleRegenerateCategory('behavioral')}
              workPositions={workPositions}
              milestones={milestones}
            />
          </div>
        </div>

        {/* Feature Integration Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t">
          <Card className="border-primary/20 hover:border-primary/40 transition-colors cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Resume Builder</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Uses: Achievements, Skills, Competencies, Work Style
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 hover:border-blue-500/40 transition-colors cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>LinkedIn Optimizer</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Uses: All categories for authentic personal branding
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-500/20 hover:border-purple-500/40 transition-colors cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Interview Prep</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Uses: Leadership, Behavioral, Values for STAR responses
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
