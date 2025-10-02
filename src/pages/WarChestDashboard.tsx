import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, Zap, Brain, FileText, TrendingUp } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";

interface WarChestStats {
  total_power_phrases: number;
  total_transferable_skills: number;
  total_hidden_competencies: number;
  overall_strength_score: number;
  interview_completion_percentage: number;
}

interface PowerPhrase {
  id: string;
  category: string;
  power_phrase: string;
  confidence_score: number;
  keywords: string[];
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

const WarChestDashboardContent = () => {
  const [userId, setUserId] = useState<string>("");
  const [warChestId, setWarChestId] = useState<string>("");
  const [stats, setStats] = useState<WarChestStats | null>(null);
  const [powerPhrases, setPowerPhrases] = useState<PowerPhrase[]>([]);
  const [transferableSkills, setTransferableSkills] = useState<TransferableSkill[]>([]);
  const [hiddenCompetencies, setHiddenCompetencies] = useState<HiddenCompetency[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      // Get war chest stats
      const { data: warChest } = await supabase
        .from('career_war_chest')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (warChest) {
        setWarChestId(warChest.id);
        setStats({
          total_power_phrases: warChest.total_power_phrases,
          total_transferable_skills: warChest.total_transferable_skills,
          total_hidden_competencies: warChest.total_hidden_competencies,
          overall_strength_score: warChest.overall_strength_score,
          interview_completion_percentage: warChest.interview_completion_percentage
        });

        // Get power phrases
        const { data: phrases } = await supabase
          .from('war_chest_power_phrases')
          .select('*')
          .eq('war_chest_id', warChest.id)
          .order('confidence_score', { ascending: false });

        setPowerPhrases(phrases || []);

        // Get transferable skills
        const { data: skills } = await supabase
          .from('war_chest_transferable_skills')
          .select('*')
          .eq('war_chest_id', warChest.id)
          .order('confidence_score', { ascending: false });

        setTransferableSkills(skills || []);

        // Get hidden competencies
        const { data: competencies } = await supabase
          .from('war_chest_hidden_competencies')
          .select('*')
          .eq('war_chest_id', warChest.id)
          .order('confidence_score', { ascending: false });

        setHiddenCompetencies(competencies || []);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="text-center">Loading your War Chest...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <Card className="p-8 text-center">
          <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-semibold mb-2">No War Chest Yet</h2>
          <p className="text-muted-foreground">Complete your interview with the Corporate Assistant to build your War Chest.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Your Career War Chest</h1>
        <p className="text-muted-foreground">
          A comprehensive intelligence system of your skills, achievements, and capabilities
        </p>
      </div>

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
      <Tabs defaultValue="power-phrases" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="power-phrases">Power Phrases</TabsTrigger>
          <TabsTrigger value="transferable-skills">Transferable Skills</TabsTrigger>
          <TabsTrigger value="hidden-competencies">Hidden Competencies</TabsTrigger>
        </TabsList>

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

        <TabsContent value="hidden-competencies" className="space-y-4">
          {hiddenCompetencies.map((comp) => (
            <Card key={comp.id} className="p-6">
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-lg font-semibold">{comp.competency_area}</h4>
                <Badge variant={comp.confidence_score > 80 ? "default" : "outline"}>
                  {comp.confidence_score}% confidence
                </Badge>
              </div>
              {comp.certification_equivalent && (
                <Badge variant="secondary" className="mb-3">
                  {comp.certification_equivalent}
                </Badge>
              )}
              <p className="text-sm mb-3">{comp.inferred_capability}</p>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Supporting Evidence:</p>
                <ul className="text-sm space-y-1">
                  {comp.supporting_evidence.map((evidence, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>{evidence}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default function WarChestDashboard() {
  return (
    <ProtectedRoute>
      <WarChestDashboardContent />
    </ProtectedRoute>
  );
}
