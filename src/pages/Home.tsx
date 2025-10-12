import { useNavigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
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
import { AIActivityBanner } from "@/components/home/AIActivityBanner";
import { useJourneyState } from "@/hooks/useJourneyState";
import { CelebrationBanner } from "@/components/home/CelebrationBanner";
import { JourneyStateCard } from "@/components/home/JourneyStateCard";
import { ActivityFeed } from "@/components/home/ActivityFeed";
import { SchedulingCTA } from "@/components/SchedulingCTA";

const HomeContent = () => {
  const navigate = useNavigate();
  const [vaultCompletion, setVaultCompletion] = useState(0);
  const [activeJobs, setActiveJobs] = useState(0);
  const [stats, setStats] = useState({ powerPhrases: 0, skills: 0, competencies: 0 });
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const journeyState = useJourneyState();

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
    { icon: Shield, title: "Research Hub", path: "/research-hub", locked: false, minCompletion: 0 },
  ];

  const featureDetails = {
    agents: {
      title: "12 Specialized AI Agents",
      description: "A full suite of AI-powered career tools working together to accelerate your job search and optimize every aspect of your career strategy.",
      features: [
        "Job Search Agent - Scours the market 24/7, matching opportunities to your unique profile and career goals",
        "Resume Optimizer - Transforms your experience into ATS-friendly, compelling narratives that get you interviews", 
        "Interview Prep Agent - Simulates real interviews, provides feedback, and helps you craft winning answers",
        "LinkedIn Builder - Optimizes your profile for maximum visibility and positions you as an industry authority",
        "Networking Agent - Identifies key connections, crafts personalized outreach, and tracks relationship building",
        "Auto-Apply Agent - Intelligently applies to pre-screened opportunities while you sleep",
        "Career Trends Scout - Monitors industry shifts and emerging opportunities before they hit job boards",
        "Agency Matcher - Connects you with specialized recruiters who have your dream roles",
        "Financial Planning Assistant - Analyzes compensation packages and negotiation strategies",
        "Resume Builder Agent - Guides you through creating powerful, achievement-focused resumes",
        "LinkedIn Blogging Agent - Generates thought leadership content to boost your professional brand",
        "Career Vault Builder - Extracts your career intelligence through guided interview process"
      ]
    },
    verification: {
      title: "Dual-AI Verification System",
      description: "Every critical decision and recommendation goes through our proprietary dual-AI verification process for maximum accuracy and reliability.",
      features: [
        "Cross-validation by multiple AI systems",
        "Reduced hallucinations and errors",
        "Higher quality recommendations",
        "Fact-checking against live data sources",
        "Continuous accuracy monitoring",
        "Industry-leading reliability standards"
      ]
    },
    active: {
      title: "All Systems Operational",
      description: "Real-time monitoring ensures all AI agents are active and ready to assist you 24/7 with your career needs.",
      features: [
        "24/7 availability",
        "Real-time processing",
        "Instant AI responses",
        "Continuous learning from latest data",
        "Live market intelligence updates",
        "Always up-to-date with industry trends"
      ]
    }
  };

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
            {/* Prominent Feature Badges */}
            <div className="flex items-center justify-center gap-4 flex-wrap mb-4">
              <Badge 
                variant="secondary" 
                className="bg-ai-primary/10 text-ai-primary border-ai-primary/20 px-5 py-2.5 text-base cursor-pointer hover:bg-ai-primary/20 hover:scale-105 transition-all hover:shadow-ai-subtle"
                onClick={() => setSelectedFeature('agents')}
              >
                <Bot className="h-5 w-5 mr-2" />
                <span className="font-semibold">12 AI Agents</span>
              </Badge>
              <Badge 
                variant="secondary" 
                className="bg-ai-secondary/10 text-ai-secondary border-ai-secondary/20 px-5 py-2.5 text-base cursor-pointer hover:bg-ai-secondary/20 hover:scale-105 transition-all hover:shadow-ai-subtle"
                onClick={() => setSelectedFeature('verification')}
              >
                <Shield className="h-5 w-5 mr-2" />
                <span className="font-semibold">Dual-AI Verification</span>
              </Badge>
              <Badge 
                variant="secondary" 
                className="bg-ai-active/10 text-ai-active border-ai-active/20 px-5 py-2.5 text-base cursor-pointer hover:bg-ai-active/20 hover:scale-105 transition-all hover:shadow-ai-subtle"
                onClick={() => setSelectedFeature('active')}
              >
                <CheckCircle2 className="h-5 w-5 mr-2" />
                <span className="font-semibold">All Systems Active</span>
              </Badge>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-ai-primary via-ai-secondary to-ai-accent bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]">
              AI-Powered Career Intelligence Platform
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Every decision cross-verified by multiple AI systems for maximum accuracy and reliability.
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

        {/* Celebration Banner - Only shown first time vault hits 100% */}
        {journeyState.state === 'vault-complete-first-time' && !journeyState.celebrationSeen && (
          <CelebrationBanner onDismiss={journeyState.markCelebrationSeen} />
        )}

        {/* Dynamic Journey State Card */}
        <div className="mb-8">
          <JourneyStateCard
            state={journeyState.state}
            vaultCompletion={journeyState.vaultCompletion}
            activeApplications={journeyState.activeApplications}
            upcomingInterviews={journeyState.upcomingInterviews}
          />
        </div>

        {/* Main Content */}
        <div className="space-y-6">
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
                        Complete Vault
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Recent Activity Feed */}
          <ActivityFeed />

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

          {/* Financial Planning CTA */}
          <div className="mt-8">
            <SchedulingCTA variant="compact" />
          </div>
        </div>
      </div>

      {/* Feature Details Dialog */}
      <Dialog open={selectedFeature !== null} onOpenChange={() => setSelectedFeature(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-3">
              {selectedFeature === 'agents' && <Bot className="h-6 w-6 text-ai-primary" />}
              {selectedFeature === 'verification' && <Shield className="h-6 w-6 text-ai-secondary" />}
              {selectedFeature === 'active' && <CheckCircle2 className="h-6 w-6 text-ai-active" />}
              {selectedFeature && featureDetails[selectedFeature as keyof typeof featureDetails].title}
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              {selectedFeature && featureDetails[selectedFeature as keyof typeof featureDetails].description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-4">
            {selectedFeature && featureDetails[selectedFeature as keyof typeof featureDetails].features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <CheckCircle2 className="h-5 w-5 text-ai-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
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
