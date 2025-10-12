import { useNavigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Package, 
  ArrowRight, 
  Lock,
  FileText,
  Briefcase,
  Bot,
  Network,
  TrendingUp,
  Building2,
  DollarSign,
  Sparkles,
  Zap,
  CheckCircle2,
  Shield
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AISystemsStatusWidget } from "@/components/home/AISystemsStatusWidget";
import { VaultPowerWidget } from "@/components/home/VaultPowerWidget";
import { QuickLaunchWidget } from "@/components/home/QuickLaunchWidget";
import { AIActivityBanner } from "@/components/home/AIActivityBanner";

const HomeContent = () => {
  const navigate = useNavigate();
  const [vaultCompletion, setVaultCompletion] = useState(0);
  const [activeJobs, setActiveJobs] = useState(0);
  const [stats, setStats] = useState({ powerPhrases: 0, skills: 0, competencies: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load vault completion
      const { data: vaultData } = await supabase
        .from('career_vault')
        .select('interview_completion_percentage, total_power_phrases, total_transferable_skills, total_hidden_competencies')
        .eq('user_id', user.id)
        .single();

      if (vaultData) {
        setVaultCompletion(vaultData.interview_completion_percentage || 0);
        setStats({
          powerPhrases: vaultData.total_power_phrases || 0,
          skills: vaultData.total_transferable_skills || 0,
          competencies: vaultData.total_hidden_competencies || 0
        });
      }

      // Load active jobs
      const { count } = await supabase
        .from('job_opportunities')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      setActiveJobs(count || 0);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const vaultComplete = vaultCompletion >= 100;

  const allTools = [
    { icon: FileText, title: "Resume Optimizer", path: "/resume-optimizer", locked: !vaultComplete, minCompletion: 100 },
    { icon: Briefcase, title: "Job Search", path: "/agents/job-search", locked: !vaultComplete, minCompletion: 100 },
    { icon: Bot, title: "Interview Prep", path: "/agents/interview-prep", locked: !vaultComplete, minCompletion: 100 },
    { icon: Sparkles, title: "LinkedIn Builder", path: "/agents/linkedin-profile", locked: !vaultComplete, minCompletion: 100 },
    { icon: Network, title: "Networking", path: "/agents/networking", locked: !vaultComplete, minCompletion: 100 },
    { icon: Zap, title: "Auto-Apply", path: "/agents/auto-apply", locked: !vaultComplete, minCompletion: 100 },
    { icon: TrendingUp, title: "Career Trends", path: "/agents/career-trends", locked: false, minCompletion: 0 },
    { icon: Building2, title: "Agencies", path: "/agencies", locked: !vaultComplete, minCompletion: 100 },
    { icon: DollarSign, title: "Financial Planning", path: "/agents/financial-planning", locked: false, minCompletion: 0 },
    { icon: Bot, title: "AI Coach", path: "/coaching", locked: false, minCompletion: 0 },
    { icon: Briefcase, title: "Opportunities", path: "/opportunities", locked: false, minCompletion: 0 },
    { icon: FileText, title: "Templates", path: "/templates", locked: false, minCompletion: 0 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section with Animated Gradient */}
        <div className="relative overflow-hidden rounded-2xl p-12 mb-8">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-ai-primary/20 via-ai-secondary/20 to-ai-accent/20 animate-pulse-subtle" />
          <div className="absolute inset-0 bg-grid-pattern opacity-10" />
          
          {/* Content */}
          <div className="relative z-10 text-center space-y-6">
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Badge variant="secondary" className="bg-ai-primary/10 text-ai-primary border-ai-primary/20 px-3 py-1">
                <Bot className="h-3.5 w-3.5 mr-1.5" />
                12 AI Agents
              </Badge>
              <Badge variant="secondary" className="bg-ai-secondary/10 text-ai-secondary border-ai-secondary/20 px-3 py-1">
                <Shield className="h-3.5 w-3.5 mr-1.5" />
                Dual-AI Verification
              </Badge>
              <Badge variant="secondary" className="bg-ai-active/10 text-ai-active border-ai-active/20 px-3 py-1">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                All Systems Active
              </Badge>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-ai-primary via-ai-secondary to-ai-accent bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]">
              AI-Powered Career Intelligence Platform
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Every decision verified by dual AI systems. Gemini analyzes, Perplexity verifies.
            </p>
            
            {/* Live stats bar */}
            <div className="flex justify-center gap-8 text-sm flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-ai-primary rounded-full animate-pulse" />
                <span>{stats.powerPhrases} Power Phrases</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-ai-secondary rounded-full animate-pulse" />
                <span>{stats.skills} Skills Mapped</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-ai-accent rounded-full animate-pulse" />
                <span>{stats.competencies} Competencies</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* AI Activity Banner */}
        <AIActivityBanner />

        {/* Process Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {['Build', 'Deploy', 'Win'].map((stage, i) => {
            const descriptions = [
              'Foundation vault with AI-extracted intelligence',
              'Smart matching and targeted applications',
              'Interview mastery and offer optimization'
            ];
            const completionPercentages = [
              Math.min(vaultCompletion, 100),
              vaultComplete ? 25 : 0,
              0
            ];
            const colors = ['text-ai-primary', 'text-ai-secondary', 'text-ai-active'];
            
            return (
              <Card key={stage} className="glass hover:border-ai-primary/50 transition-all group cursor-pointer hover:shadow-ai-subtle">
                <CardContent className="p-6 text-center">
                  {/* Radial progress */}
                  <div className="relative w-24 h-24 mx-auto mb-4">
                    <svg className="transform -rotate-90" viewBox="0 0 96 96">
                      <circle 
                        cx="48" 
                        cy="48" 
                        r="44" 
                        stroke="currentColor" 
                        className="text-muted/30" 
                        strokeWidth="8" 
                        fill="none" 
                      />
                      <circle 
                        cx="48" 
                        cy="48" 
                        r="44" 
                        stroke="currentColor" 
                        className={`${colors[i]} transition-all duration-1000`}
                        strokeWidth="8" 
                        fill="none" 
                        strokeDasharray={`${completionPercentages[i] * 2.76} 276`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold">
                      {completionPercentages[i]}%
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-lg mb-2">{stage}</h3>
                  <p className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    {descriptions[i]}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Career Vault Status - Elevated */}
        <Card className="relative overflow-hidden border-2 border-ai-primary/30 mb-8">
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-br from-ai-primary/10 via-ai-secondary/10 to-transparent opacity-50" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-ai-primary/20 rounded-full blur-3xl animate-float" />
          
          <CardContent className="relative z-10 p-8">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Package className="h-12 w-12 text-ai-primary animate-pulse-subtle" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-ai-primary rounded-full animate-ping" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-2xl font-bold">Career Vault</h2>
                    <Badge variant="secondary" className="text-[10px] bg-ai-primary/10 text-ai-primary border-ai-primary/20">
                      <Bot className="h-2.5 w-2.5 mr-1" />
                      12 AI Agents
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {vaultComplete ? "Fully loaded and ready" : `${vaultCompletion}% complete`}
                  </p>
                </div>
              </div>
              
              {/* Circular progress indicator */}
              <div className="relative w-20 h-20">
                <svg className="transform -rotate-90" viewBox="0 0 80 80">
                  <circle 
                    cx="40" 
                    cy="40" 
                    r="36" 
                    stroke="currentColor" 
                    className="text-muted/30" 
                    strokeWidth="8" 
                    fill="none" 
                  />
                  <circle 
                    cx="40" 
                    cy="40" 
                    r="36" 
                    stroke="currentColor" 
                    className="text-ai-primary transition-all duration-1000" 
                    strokeWidth="8" 
                    fill="none" 
                    strokeDasharray={`${vaultCompletion * 2.26} 226`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-xl font-bold">
                  {vaultCompletion}%
                </div>
              </div>
            </div>
            
            <Progress value={vaultCompletion} className="h-3 mb-6" />
            
            <Button 
              size="lg" 
              className="w-full group"
              onClick={() => navigate(vaultComplete ? '/career-vault' : '/career-vault-onboarding')}
            >
              {vaultComplete ? "View Career Vault" : "Continue Building"}
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Center Content */}
          <div className="lg:col-span-9 space-y-6">
            {/* Quick Access Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {allTools.map((tool) => {
                const hasDualAI = ['Resume Optimizer', 'Interview Prep', 'Job Search'].includes(tool.title);
                
                return (
                  <Card 
                    key={tool.title}
                    className={`group cursor-pointer transition-all hover:scale-105 ${
                      tool.locked 
                        ? 'opacity-40 grayscale' 
                        : 'hover:shadow-ai-subtle hover:border-ai-primary/50'
                    }`}
                    onClick={() => !tool.locked && navigate(tool.path)}
                  >
                    <CardContent className="p-4 text-center relative">
                      {hasDualAI && !tool.locked && (
                        <Badge 
                          variant="secondary" 
                          className="absolute top-2 right-2 text-[8px] px-1.5 py-0 bg-ai-primary/10 text-ai-primary border-ai-primary/20"
                        >
                          <Shield className="h-2 w-2 mr-0.5" />
                          Dual-AI
                        </Badge>
                      )}
                      <tool.icon className={`h-8 w-8 mx-auto mb-2 ${tool.locked ? '' : 'text-ai-primary'}`} />
                      <p className="text-xs font-medium mb-1">{tool.title}</p>
                      {tool.locked && (
                        <Badge variant="outline" className="text-[10px] mt-1">
                          <Lock className="h-2 w-2 mr-1" />
                          {tool.minCompletion}%
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Stats Snapshot */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="hover:border-ai-primary/50 transition-all cursor-pointer" onClick={() => navigate('/opportunities')}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Briefcase className="h-5 w-5 text-ai-primary" />
                    <h3 className="text-lg font-semibold">Active Jobs</h3>
                  </div>
                  <p className="text-3xl font-bold mb-3">{activeJobs}</p>
                  <Button variant="outline" size="sm" className="w-full">
                    View All
                    <ArrowRight className="ml-2 h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:border-ai-secondary/50 transition-all cursor-pointer" onClick={() => navigate('/pricing')}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Sparkles className="h-5 w-5 text-ai-secondary" />
                    <h3 className="text-lg font-semibold">AI Stats</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">12 Agents Working</p>
                  <Button variant="outline" size="sm" className="w-full">
                    View Details
                    <ArrowRight className="ml-2 h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Sidebar - Widgets */}
          <div className="lg:col-span-3 space-y-4">
            <AISystemsStatusWidget />
            <VaultPowerWidget completion={vaultCompletion} />
            <QuickLaunchWidget />
          </div>
        </div>
      </div>
    </div>
  );
};

const Home = () => {
  return (
    <ProtectedRoute>
      <HomeContent />
    </ProtectedRoute>
  );
};

export default Home;
