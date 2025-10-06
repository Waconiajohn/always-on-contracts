import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { careerVault } from "@/lib/mcp-client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, Zap, Brain, FileText, TrendingUp, Award, Trophy } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";

interface VaultStats {
  total_power_phrases: number;
  total_transferable_skills: number;
  total_hidden_competencies: number;
  overall_strength_score: number;
  interview_completion_percentage: number;
}

interface StrengthScore {
  total: number;
  powerPhrasesScore: number;
  transferableSkillsScore: number;
  hiddenCompetenciesScore: number;
  quantificationScore: number;
  modernTerminologyScore: number;
  level: 'Developing' | 'Solid' | 'Strong' | 'Elite' | 'Exceptional';
}

interface PowerPhrase {
  id: string;
  category: string;
  power_phrase: string;
  confidence_score: number;
  keywords: string[];
  impact_metrics?: any;
}

interface TransferableSkill {
  id: string;
  stated_skill: string;
  equivalent_skills: string[];
  evidence: string;
  confidence_score: number;
}

interface HiddenCompetency {
  id: string;
  competency_area: string;
  inferred_capability: string;
  supporting_evidence: string[];
  confidence_score: number;
  certification_equivalent: string | null;
}

import { InterviewResponsesTab } from '@/components/InterviewResponsesTab';
import { MarketResearchPanel } from '@/components/MarketResearchPanel';
import { EnhancementQueue } from '@/components/EnhancementQueue';

const VaultDashboardContent = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string>("");
  const [vaultId, setVaultId] = useState<string>("");
  const [stats, setStats] = useState<VaultStats | null>(null);
  const [powerPhrases, setPowerPhrases] = useState<PowerPhrase[]>([]);
  const [transferableSkills, setTransferableSkills] = useState<TransferableSkill[]>([]);
  const [hiddenCompetencies, setHiddenCompetencies] = useState<HiddenCompetency[]>([]);
  const [loading, setLoading] = useState(true);
  const [strengthScore, setStrengthScore] = useState<StrengthScore | null>(null);

  const calculateStrengthScore = (
    phrases: PowerPhrase[], 
    skills: TransferableSkill[], 
    competencies: HiddenCompetency[]
  ): StrengthScore => {
    // Power Phrases Score (0-20 points)
    const powerPhrasesScore = Math.min((phrases.length / 15) * 20, 20);
    
    // Transferable Skills Score (0-20 points)
    const transferableSkillsScore = Math.min((skills.length / 10) * 20, 20);
    
    // Hidden Competencies Score (0-20 points)
    const hiddenCompetenciesScore = Math.min((competencies.length / 8) * 20, 20);
    
    // Quantification Density Score (0-20 points)
    const phrasesWithMetrics = phrases.filter(p => 
      p.impact_metrics && Object.keys(p.impact_metrics).length > 0
    ).length;
    const quantificationScore = phrases.length > 0 
      ? (phrasesWithMetrics / phrases.length) * 20 
      : 0;
    
    // Modern Terminology Score (0-20 points)
    const modernKeywords = ['AI', 'ML', 'cloud', 'digital transformation', 'automation', 
      'data science', 'agile', 'DevOps', 'analytics', 'optimization'];
    const modernPhrases = phrases.filter(p => 
      p.keywords.some(k => modernKeywords.some(mk => k.toLowerCase().includes(mk.toLowerCase())))
    ).length;
    const modernTerminologyScore = phrases.length > 0 
      ? (modernPhrases / phrases.length) * 20 
      : 0;
    
    const total = Math.round(
      powerPhrasesScore + 
      transferableSkillsScore + 
      hiddenCompetenciesScore + 
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
      quantificationScore: Math.round(quantificationScore),
      modernTerminologyScore: Math.round(modernTerminologyScore),
      level
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      try {
        // Get career vault data via MCP
        const vaultResponse = await careerVault.get();
        
        if (vaultResponse.data) {
          const vault = vaultResponse.data;
          setVaultId(vault.id);
          setStats({
            total_power_phrases: vault.total_power_phrases || 0,
            total_transferable_skills: vault.total_transferable_skills || 0,
            total_hidden_competencies: vault.total_hidden_competencies || 0,
            overall_strength_score: vault.overall_strength_score || 0,
            interview_completion_percentage: vault.interview_completion_percentage || 0
          });

          // Get power phrases via MCP
          const { data: phrases } = await supabase
            .from('vault_power_phrases')
            .select('*')
            .eq('vault_id', vault.id)
            .order('confidence_score', { ascending: false });

          setPowerPhrases(phrases || []);

          // Get transferable skills via MCP
          const { data: skills } = await supabase
            .from('vault_transferable_skills')
            .select('*')
            .eq('vault_id', vault.id)
            .order('confidence_score', { ascending: false });

          setTransferableSkills(skills || []);

          // Get hidden competencies via MCP
          const { data: competencies } = await supabase
            .from('vault_hidden_competencies')
            .select('*')
            .eq('vault_id', vault.id)
            .order('confidence_score', { ascending: false });

          setHiddenCompetencies(competencies || []);

          // Calculate strength score
          const score = calculateStrengthScore(phrases || [], skills || [], competencies || []);
          setStrengthScore(score);

          // Update overall strength score in database
          await supabase
            .from('career_vault')
            .update({ overall_strength_score: score.total })
            .eq('id', vault.id);
        }
      } catch (error) {
        console.error('Error fetching career vault data:', error);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="text-center">Loading your Career Vault...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <Card className="p-8 text-center">
          <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-semibold mb-2">No Career Vault Yet</h2>
          <p className="text-muted-foreground">Complete your interview with the Corporate Assistant to build your Career Vault.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Your Career Vault</h1>
        <p className="text-muted-foreground">
          A comprehensive intelligence system of your skills, achievements, and capabilities
        </p>
      </div>

      {/* Career Vault Strength Score - Prominent Display */}
      {strengthScore && (
        <Card className="p-8 mb-8 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <Trophy className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1">War Chest Strength Score</h2>
                <p className="text-muted-foreground">Your career intelligence assessment</p>
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

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Power Phrases</span>
                <span className="text-sm text-muted-foreground">{strengthScore.powerPhrasesScore}/20</span>
              </div>
              <Progress value={(strengthScore.powerPhrasesScore / 20) * 100} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Transferable Skills</span>
                <span className="text-sm text-muted-foreground">{strengthScore.transferableSkillsScore}/20</span>
              </div>
              <Progress value={(strengthScore.transferableSkillsScore / 20) * 100} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Hidden Competencies</span>
                <span className="text-sm text-muted-foreground">{strengthScore.hiddenCompetenciesScore}/20</span>
              </div>
              <Progress value={(strengthScore.hiddenCompetenciesScore / 20) * 100} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Quantification</span>
                <span className="text-sm text-muted-foreground">{strengthScore.quantificationScore}/20</span>
              </div>
              <Progress value={(strengthScore.quantificationScore / 20) * 100} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Modern Terms</span>
                <span className="text-sm text-muted-foreground">{strengthScore.modernTerminologyScore}/20</span>
              </div>
              <Progress value={(strengthScore.modernTerminologyScore / 20) * 100} className="h-2" />
            </div>
          </div>

          <div className="mt-6 p-4 bg-background/50 rounded-lg">
            <div className="flex items-start gap-3">
              <Award className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium mb-2">Your War Chest Achievements:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ {stats.total_power_phrases} power phrases ready to deploy</li>
                  <li>✓ {stats.total_transferable_skills} skills mapped to multiple opportunities</li>
                  <li>✓ {stats.total_hidden_competencies} hidden competencies discovered</li>
                  {strengthScore.level === 'Exceptional' && <li className="text-primary font-medium">🏆 Exceptional War Chest - Top 5% of professionals!</li>}
                  {strengthScore.level === 'Elite' && <li className="text-primary font-medium">⭐ Elite War Chest - Outstanding career intelligence!</li>}
                </ul>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Power Phrases</p>
              <p className="text-2xl font-bold">{stats.total_power_phrases}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Transferable Skills</p>
              <p className="text-2xl font-bold">{stats.total_transferable_skills}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Hidden Competencies</p>
              <p className="text-2xl font-bold">{stats.total_hidden_competencies}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Strength Score</p>
              <p className="text-2xl font-bold">{stats.overall_strength_score}/100</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Interview Progress */}
      <Card className="p-6 mb-8">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Interview Completion</h3>
          <span className="text-sm text-muted-foreground">{stats.interview_completion_percentage}%</span>
        </div>
        <Progress value={stats.interview_completion_percentage} className="h-2" />
      </Card>

      {/* Detailed Tabs */}
      <Tabs defaultValue="enhancement-queue" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="enhancement-queue">🎯 Enhancement Queue</TabsTrigger>
          <TabsTrigger value="power-phrases">Power Phrases</TabsTrigger>
          <TabsTrigger value="transferable-skills">Skills</TabsTrigger>
          <TabsTrigger value="intangibles">🧠 Intangibles</TabsTrigger>
          <TabsTrigger value="responses">All Responses</TabsTrigger>
          <TabsTrigger value="market-research">Market Intel</TabsTrigger>
        </TabsList>

        <TabsContent value="enhancement-queue">
          <EnhancementQueue vaultId={vaultId} />
        </TabsContent>

        <TabsContent value="power-phrases" className="space-y-4">
          {powerPhrases.map((phrase) => (
            <Card key={phrase.id} className="p-6">
              <div className="flex items-start justify-between mb-2">
                <Badge variant="secondary">{phrase.category}</Badge>
                <Badge variant={phrase.confidence_score > 80 ? "default" : "outline"}>
                  {phrase.confidence_score}% confidence
                </Badge>
              </div>
              <p className="text-lg mb-3">{phrase.power_phrase}</p>
              <div className="flex flex-wrap gap-2">
                {phrase.keywords.map((keyword, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="transferable-skills" className="space-y-4">
          {transferableSkills.map((skill) => (
            <Card key={skill.id} className="p-6">
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-lg font-semibold">{skill.stated_skill}</h4>
                <Badge variant={skill.confidence_score > 80 ? "default" : "outline"}>
                  {skill.confidence_score}% confidence
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
          ))}
        </TabsContent>

        <TabsContent value="intangibles">
          <Card className="p-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">🧠 Intangibles Intelligence</h3>
              <p className="text-muted-foreground">
                Soft skills, leadership philosophy, executive presence, personality traits, work style, values, and behavioral patterns
              </p>
            </div>
            <div className="grid gap-4">
              {hiddenCompetencies.length > 0 ? (
                hiddenCompetencies.map((comp) => (
                  <Card key={comp.id} className="p-4 bg-muted/50">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold">{comp.competency_area}</h4>
                      <Badge variant={comp.confidence_score > 80 ? "default" : "outline"}>
                        {comp.confidence_score}%
                      </Badge>
                    </div>
                    <p className="text-sm mb-2">{comp.inferred_capability}</p>
                    {comp.supporting_evidence.length > 0 && (
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {comp.supporting_evidence.slice(0, 2).map((ev, idx) => (
                          <li key={idx}>• {ev}</li>
                        ))}
                      </ul>
                    )}
                  </Card>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Complete more of the War Chest interview to reveal intangibles intelligence
                </p>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="responses">
          <InterviewResponsesTab vaultId={vaultId} />
        </TabsContent>

        <TabsContent value="market-research">
          <MarketResearchPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default function CareerVaultDashboard() {
  return (
    <ProtectedRoute>
      <VaultDashboardContent />
    </ProtectedRoute>
  );
}
