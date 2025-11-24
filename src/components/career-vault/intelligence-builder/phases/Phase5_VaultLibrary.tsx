import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Linkedin,
  MessageSquare,
  TrendingUp,
  Briefcase,
  Award,
  Search,
  Sparkles,
  Target
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Phase5Props {
  vaultId: string;
  onProgress: (progress: number) => void;
  onTimeEstimate: (estimate: string) => void;
  onComplete: () => void;
}

interface VaultStats {
  powerPhrases: number;
  skills: number;
  competencies: number;
  softSkills: number;
  total: number;
}

export const Phase5_VaultLibrary = ({
  vaultId,
  onProgress,
  onTimeEstimate,
}: Phase5Props) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState<VaultStats | null>(null);
  const [powerPhrases, setPowerPhrases] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadVaultData();
  }, [vaultId]);

  const loadVaultData = async () => {
    setIsLoading(true);
    onProgress(20);

    try {
      // Load vault metadata for stats
      const { data: vault } = await supabase
        .from('career_vault')
        .select('*')
        .eq('id', vaultId)
        .single();

      onProgress(40);

      // Load power phrases
      const { data: phrases } = await supabase
        .from('vault_power_phrases')
        .select('*')
        .eq('vault_id', vaultId)
        .order('created_at', { ascending: false });

      setPowerPhrases(phrases || []);
      onProgress(60);

      // Load skills
      const { data: skillsData } = await supabase
        .from('vault_transferable_skills')
        .select('*')
        .eq('vault_id', vaultId)
        .order('created_at', { ascending: false });

      setSkills(skillsData || []);
      onProgress(80);

      // Calculate stats
      setStats({
        powerPhrases: phrases?.length || 0,
        skills: skillsData?.length || 0,
        competencies: vault?.total_hidden_competencies || 0,
        softSkills: vault?.total_soft_skills || 0,
        total: (phrases?.length || 0) + (skillsData?.length || 0)
      });

      onProgress(100);
      onTimeEstimate('Ready to use');
      toast.success('Vault loaded successfully');
    } catch (error) {
      console.error('Error loading vault:', error);
      toast.error('Failed to load vault data');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPhrases = powerPhrases.filter(p =>
    p.power_phrase?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSkills = skills.filter(s =>
    s.stated_skill?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading your vault...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-7xl mx-auto p-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Your Career Intelligence Library</h1>
          <p className="text-lg text-muted-foreground">
            {stats?.total || 0} market-ready items organized and searchable
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="text-3xl font-bold text-primary">
              {stats?.powerPhrases || 0}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Power Phrases</p>
          </Card>

          <Card className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-blue-500">
              {stats?.skills || 0}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Skills</p>
          </Card>

          <Card className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Target className="h-5 w-5 text-orange-500" />
            </div>
            <div className="text-3xl font-bold text-orange-500">
              {stats?.competencies || 0}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Competencies</p>
          </Card>

          <Card className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Award className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-green-500">
              {stats?.softSkills || 0}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Soft Skills</p>
          </Card>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Resume Builder */}
          <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Resume Builder</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Generate tailored resumes with AI-optimized bullets from your vault
            </p>
            <Button className="w-full" variant="default">
              Create Resume
            </Button>
          </Card>

          {/* LinkedIn Optimizer */}
          <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Linkedin className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">LinkedIn Optimizer</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Optimize your LinkedIn profile with strategic positioning
            </p>
            <Button className="w-full" variant="default">
              Optimize Profile
            </Button>
          </Card>

          {/* Interview Prep */}
          <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Interview Prep</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Practice with AI-powered interview coaching and feedback
            </p>
            <Button className="w-full" variant="default">
              Start Prep
            </Button>
          </Card>
        </div>

        {/* Vault Content Browser */}
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Browse Your Vault</h2>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search your vault..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Tabs */}
          <Tabs defaultValue="phrases" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="phrases">
                <Briefcase className="h-4 w-4 mr-2" />
                Power Phrases ({filteredPhrases.length})
              </TabsTrigger>
              <TabsTrigger value="skills">
                <TrendingUp className="h-4 w-4 mr-2" />
                Skills ({filteredSkills.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="phrases" className="space-y-3">
              {filteredPhrases.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No power phrases found</p>
                </div>
              ) : (
                filteredPhrases.map((phrase) => (
                  <Card key={phrase.id} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-medium">{phrase.power_phrase}</p>
                        {phrase.context && (
                          <p className="text-sm text-muted-foreground mt-1">{phrase.context}</p>
                        )}
                      </div>
                      <Badge variant={
                        phrase.quality_tier === 'gold' ? 'default' :
                        phrase.quality_tier === 'silver' ? 'secondary' : 'outline'
                      }>
                        {phrase.quality_tier || 'bronze'}
                      </Badge>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="skills" className="space-y-3">
              {filteredSkills.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No skills found</p>
                </div>
              ) : (
                filteredSkills.map((skill) => (
                  <Card key={skill.id} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-medium">{skill.stated_skill}</p>
                        {skill.evidence && (
                          <p className="text-sm text-muted-foreground mt-1">{skill.evidence}</p>
                        )}
                      </div>
                      <Badge variant={
                        skill.quality_tier === 'gold' ? 'default' :
                        skill.quality_tier === 'silver' ? 'secondary' : 'outline'
                      }>
                        {skill.quality_tier || 'bronze'}
                      </Badge>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};
