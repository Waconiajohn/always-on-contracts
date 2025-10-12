import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Package, 
  ArrowRight, 
  FileText, 
  Search, 
  Bot, 
  Briefcase, 
  TrendingUp, 
  Users,
  Building,
  Target,
  MessageSquare,
  Sparkles,
  Lock,
  Crown,
  Code
} from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { CareerIntelWidget } from "@/components/home/CareerIntelWidget";
import { VaultPowerWidget } from "@/components/home/VaultPowerWidget";
import { RecentActivityWidget } from "@/components/home/RecentActivityWidget";
import { QuickLaunchWidget } from "@/components/home/QuickLaunchWidget";
import { WeeklyFocusWidget } from "@/components/home/WeeklyFocusWidget";

const HomeContent = () => {
  const navigate = useNavigate();
  const [vaultCompletion, setVaultCompletion] = useState(0);
  const [activeOpportunities, setActiveOpportunities] = useState(0);
  const [vaultStats, setVaultStats] = useState({ power_phrases: 0, skills: 0, competencies: 0 });

  useEffect(() => {
    checkVaultStatus();
    loadActiveOpportunities();
    loadVaultStats();
  }, []);

  const checkVaultStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('career_vault_progress' as any)
        .select('completion_percentage')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setVaultCompletion((data as any)?.completion_percentage || 0);
    } catch (error) {
      console.error('Error checking vault status:', error);
    }
  };

  const loadActiveOpportunities = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count } = await supabase
        .from('opportunities' as any)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'active');

      setActiveOpportunities(count || 0);
    } catch (error) {
      console.error('Error loading opportunities:', error);
    }
  };

  const loadVaultStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('vault_intelligence' as any)
        .select('power_phrases, skills, competencies')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setVaultStats({
          power_phrases: (data as any).power_phrases?.length || 0,
          skills: (data as any).skills?.length || 0,
          competencies: (data as any).competencies?.length || 0
        });
      }
    } catch (error) {
      console.error('Error loading vault stats:', error);
    }
  };

  const vaultComplete = vaultCompletion >= 100;

  const processStages = [
    { name: "Build", completion: Math.min(vaultCompletion, 100), description: "Career Vault foundation" },
    { name: "Deploy", completion: Math.min(Math.max(vaultCompletion - 50, 0), 50) * 2, description: "AI-powered job search" },
    { name: "Win", completion: vaultComplete ? 100 : 0, description: "Land your dream role" }
  ];

  const quickLinks = [
    { icon: FileText, title: "Resume Optimizer", description: "AI-powered customization", path: "/resume-optimizer", locked: !vaultComplete, minCompletion: 100 },
    { icon: Search, title: "Job Search", description: "Smart opportunity matching", path: "/agents/job-search", locked: !vaultComplete, minCompletion: 100 },
    { icon: Bot, title: "AI Coach", description: "Career guidance 24/7", path: "/coaching", locked: false, minCompletion: 0 },
    { icon: Briefcase, title: "Opportunities", description: "Track applications", path: "/opportunities", locked: false, minCompletion: 0 },
    { icon: MessageSquare, title: "Interview Prep", description: "Practice & feedback", path: "/agents/interview-prep", locked: !vaultComplete, minCompletion: 100 },
    { icon: TrendingUp, title: "Career Trends", description: "Market intelligence", path: "/agents/career-trends", locked: false, minCompletion: 0 },
    { icon: Users, title: "Networking", description: "Build connections", path: "/agents/networking", locked: !vaultComplete, minCompletion: 100 },
    { icon: Building, title: "Agencies", description: "Recruiter matching", path: "/agencies", locked: !vaultComplete, minCompletion: 100 },
    { icon: Target, title: "Auto-Apply", description: "Application automation", path: "/agents/auto-apply", locked: !vaultComplete, minCompletion: 100 },
    { icon: Sparkles, title: "Profile Builder", description: "LinkedIn optimization", path: "/agents/linkedin-profile", locked: !vaultComplete, minCompletion: 100 },
    { icon: Code, title: "AI Agents", description: "Advanced tools", path: "/ai-agents", locked: false, minCompletion: 0 },
    { icon: Crown, title: "Templates", description: "Professional docs", path: "/templates", locked: false, minCompletion: 0 },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl p-12 mb-8 border border-border/50">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-500/20 to-accent/20 animate-pulse-subtle" />
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
        
        <div className="relative z-10 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]">
            Your AI Career Command Center
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Intelligence-first job search powered by your Career Vault
          </p>
          
          {/* Live stats bar */}
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span>{vaultStats.power_phrases} Power Phrases</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              <span>{vaultStats.skills} Skills Mapped</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              <span>{vaultStats.competencies} Competencies</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar - Widgets */}
        <div className="lg:col-span-3 space-y-4">
          <CareerIntelWidget />
          <VaultPowerWidget completion={vaultCompletion} />
          <RecentActivityWidget />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-6 space-y-6">
          {/* Process Pillars */}
          <div className="grid grid-cols-3 gap-4">
            {processStages.map((stage, i) => {
              const circumference = 2 * Math.PI * 44;
              const strokeDashoffset = circumference - (stage.completion / 100) * circumference;
              
              return (
                <Card key={stage.name} className="glass hover:border-primary/50 transition-all group cursor-default">
                  <CardContent className="p-6 text-center">
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
                          className={i === 0 ? "text-primary" : i === 1 ? "text-purple-500" : "text-accent"} 
                          strokeWidth="8" 
                          fill="none" 
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold">
                        {Math.round(stage.completion)}%
                      </div>
                    </div>
                    
                    <h3 className="font-semibold mb-2">{stage.name}</h3>
                    <p className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      {stage.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Career Vault Status */}
          <Card className="relative overflow-hidden border-2 border-primary/30">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/10 to-transparent opacity-50" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
            
            <CardContent className="relative z-10 p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Package className="h-12 w-12 text-primary animate-pulse-subtle" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full animate-ping" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Career Vault</h2>
                    <p className="text-sm text-muted-foreground">
                      {vaultComplete ? "Fully loaded and ready" : `${Math.round(vaultCompletion)}% complete`}
                    </p>
                  </div>
                </div>
                
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
                      className="text-primary transition-all duration-1000" 
                      strokeWidth="8" 
                      fill="none" 
                      strokeDasharray={226}
                      strokeDashoffset={226 - (vaultCompletion / 100) * 226}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-xl font-bold">
                    {Math.round(vaultCompletion)}%
                  </div>
                </div>
              </div>
              
              <Progress value={vaultCompletion} className="h-3 mb-6" />
              
              <Button 
                size="lg" 
                className="w-full group"
                onClick={() => navigate(vaultComplete ? "/career-vault" : "/career-vault-onboarding")}
              >
                {vaultComplete ? "View Career Vault" : "Continue Building"}
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>

          {/* Quick Access Grid */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Quick Access</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {quickLinks.map(tool => (
                <Card 
                  key={tool.path}
                  className={`group cursor-pointer transition-all hover:scale-105 ${
                    tool.locked 
                      ? 'opacity-40 grayscale' 
                      : 'hover:shadow-lg hover:shadow-primary/20 hover:border-primary/50'
                  }`}
                  onClick={() => !tool.locked && navigate(tool.path)}
                >
                  <CardContent className="p-4 text-center">
                    <tool.icon className={`h-8 w-8 mx-auto mb-2 ${tool.locked ? '' : 'text-primary'}`} />
                    <p className="text-sm font-medium mb-1">{tool.title}</p>
                    <p className="text-xs text-muted-foreground">{tool.description}</p>
                    {tool.locked && (
                      <Badge variant="outline" className="mt-2 text-[10px]">
                        <Lock className="h-2 w-2 mr-1" />
                        {tool.minCompletion}%
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Stats Snapshot */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="hover:border-primary/50 transition-all cursor-pointer" onClick={() => navigate('/opportunities')}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Active Jobs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold mb-2">{activeOpportunities}</p>
                <Button variant="outline" size="sm" className="w-full">
                  View All
                  <ArrowRight className="ml-2 h-3 w-3" />
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition-all cursor-pointer" onClick={() => navigate('/pricing')}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Crown className="h-5 w-5 text-accent" />
                  Subscription
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary" className="mb-3">Free Plan</Badge>
                <Button variant="outline" size="sm" className="w-full">
                  Upgrade
                  <ArrowRight className="ml-2 h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Sidebar - Action Widgets */}
        <div className="lg:col-span-3 space-y-4">
          <QuickLaunchWidget />
          <WeeklyFocusWidget />
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
