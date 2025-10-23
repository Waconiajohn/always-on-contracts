import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Home, Briefcase, FileText, MessageSquare, Users, 
  Linkedin, TrendingUp, Building2, DollarSign, BarChart3, 
  Target, Calculator
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { useJourneyState } from "@/hooks/useJourneyState";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LaunchpadCard } from "@/components/home/LaunchpadCard";
import { UniqueFeaturesShowcase } from "@/components/home/UniqueFeaturesShowcase";
import { WebinarScheduleWidget } from "@/components/home/WebinarScheduleWidget";
import { CoachingCalendarWidget } from "@/components/home/CoachingCalendarWidget";
import { JobMarketLiveDataWidget } from "@/components/home/JobMarketLiveDataWidget";
import { ActivityFeed } from "@/components/home/ActivityFeed";
import { ContentLayout } from "@/components/layout/ContentLayout";

interface VaultStats {
  powerPhrases: number;
  skills: number;
  competencies: number;
  vaultCompletion: number;
}

const UnifiedHomeContent = () => {
  const navigate = useNavigate();
  const { subscription, isLoading: subscriptionLoading } = useSubscription();
  const { journeyState } = useJourneyState();
  const [vaultStats, setVaultStats] = useState<VaultStats>({
    powerPhrases: 0,
    skills: 0,
    competencies: 0,
    vaultCompletion: 0
  });

  const isPlatinum = subscription?.tier === 'concierge_elite';
  const isVaultComplete = vaultStats.vaultCompletion === 100;

  useEffect(() => {
    fetchVaultStats();
  }, []);

  const fetchVaultStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('career_vault')
        .select('achievements, skills, competencies, interview_completion_percentage')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setVaultStats({
          powerPhrases: data.achievements?.length || 0,
          skills: data.skills?.length || 0,
          competencies: data.competencies?.length || 0,
          vaultCompletion: data.interview_completion_percentage || 0
        });
      }
    } catch (error) {
      console.error('Error fetching vault stats:', error);
    }
  };

  // Define all launchpad sections with dynamic ordering
  const allSections = [
    {
      id: 'career-vault',
      title: 'Career Vault',
      description: 'Build your intelligence foundation',
      icon: Target,
      path: '/career-vault-onboarding',
      progress: vaultStats.vaultCompletion,
      order: vaultStats.vaultCompletion < 100 ? 1 : 8,
      isLocked: false,
      isDualAI: true
    },
    {
      id: 'job-search',
      title: 'Job Search',
      description: 'Find and save opportunities with AI',
      icon: Briefcase,
      path: '/job-search',
      order: isVaultComplete ? 1 : 3,
      isLocked: !isVaultComplete,
      lockReason: 'Complete Career Vault first',
      isDualAI: true
    },
    {
      id: 'application-queue',
      title: 'Application Queue',
      description: 'Manage your active applications',
      icon: FileText,
      path: '/application-queue',
      order: 2,
      isLocked: !isVaultComplete,
      lockReason: 'Complete Career Vault first'
    },
    {
      id: 'resume-builder',
      title: 'Resume Builder',
      description: 'Create tailored, ATS-optimized resumes',
      icon: FileText,
      path: '/agents/resume-builder-wizard',
      order: isVaultComplete ? 3 : 4,
      isLocked: !isVaultComplete,
      lockReason: 'Complete Career Vault first',
      isDualAI: true
    },
    {
      id: 'interview-prep',
      title: 'Interview Prep',
      description: 'Practice with vault-powered responses',
      icon: MessageSquare,
      path: '/agents/interview-prep',
      order: 4,
      isLocked: !isVaultComplete,
      lockReason: 'Complete Career Vault first',
      isDualAI: true
    },
    {
      id: 'linkedin-profile',
      title: 'LinkedIn Profile',
      description: 'Optimize your professional presence',
      icon: Linkedin,
      path: '/agents/linkedin-profile-builder',
      order: 5,
      isLocked: !isVaultComplete,
      lockReason: 'Complete Career Vault first'
    },
    {
      id: 'linkedin-content',
      title: 'LinkedIn Content',
      description: 'Thought leadership and blogging',
      icon: Linkedin,
      path: '/agents/linkedin-blogging',
      order: 6,
      isLocked: !isVaultComplete,
      lockReason: 'Complete Career Vault first'
    },
    {
      id: 'networking',
      title: 'Networking Hub',
      description: 'Build strategic connections',
      icon: Users,
      path: '/agents/networking',
      order: 7,
      isLocked: !isVaultComplete,
      lockReason: 'Complete Career Vault first'
    },
    {
      id: 'salary-negotiation',
      title: 'Salary Negotiation',
      description: 'Market data and negotiation scripts',
      icon: DollarSign,
      path: '/salary-negotiation',
      order: 9,
      isLocked: !isVaultComplete,
      lockReason: 'Complete Career Vault first'
    },
    {
      id: 'career-trends',
      title: 'Career Trends',
      description: 'Industry insights and market intelligence',
      icon: TrendingUp,
      path: '/agents/career-trends-scout',
      order: 10,
      isLocked: !isVaultComplete,
      lockReason: 'Complete Career Vault first'
    },
    {
      id: 'agencies',
      title: 'Agency Matcher',
      description: 'Connect with top recruiters',
      icon: Building2,
      path: '/agencies',
      order: 11,
      isLocked: !isVaultComplete,
      lockReason: 'Complete Career Vault first'
    },
    {
      id: 'financial-planning',
      title: 'Financial Planning',
      description: 'Compensation and retirement analysis',
      icon: Calculator,
      path: '/agents/financial-planning-assistant',
      order: 12,
      isLocked: !isVaultComplete,
      lockReason: 'Complete Career Vault first'
    }
  ];

  const orderedSections = [...allSections].sort((a, b) => a.order - b.order);

  return (
    <ContentLayout
      maxWidth="full"
      rightSidebar={
        <aside className="w-80 border-l bg-background p-6 space-y-6 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          <WebinarScheduleWidget isPlatinum={isPlatinum} />
          <CoachingCalendarWidget isPlatinum={isPlatinum} />
          <JobMarketLiveDataWidget />
        </aside>
      }
    >
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-primary to-purple-600">
              <Home className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                Welcome to <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">CareerIQ</span>
              </h1>
              <p className="text-muted-foreground">Your AI-powered career intelligence platform</p>
            </div>
          </div>

          {/* Feature Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              🤖 12 AI Agents
            </Badge>
            <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300">
              ✅ Dual-AI Verification
            </Badge>
            <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300">
              🟢 All Systems Active
            </Badge>
            {isPlatinum && (
              <Badge variant="secondary" className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
                💎 Platinum Member
              </Badge>
            )}
          </div>

          {/* Vault Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold">{vaultStats.powerPhrases}</div>
              <div className="text-sm text-muted-foreground">Power Phrases</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold">{vaultStats.skills}</div>
              <div className="text-sm text-muted-foreground">Skills</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold">{vaultStats.competencies}</div>
              <div className="text-sm text-muted-foreground">Competencies</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Vault Progress</span>
                  <span className="text-sm font-medium">{vaultStats.vaultCompletion}%</span>
                </div>
                <Progress value={vaultStats.vaultCompletion} className="h-2" />
              </div>
            </div>
          </div>
        </div>

        {/* Unique Features Showcase */}
        <UniqueFeaturesShowcase />

        {/* Main Launchpad Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Your Career Launchpad</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orderedSections.map(section => (
              <LaunchpadCard
                key={section.id}
                {...section}
              />
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <ActivityFeed />
        </div>
      </div>
    </ContentLayout>
  );
};

export default function UnifiedHomepage() {
  return (
    <ProtectedRoute>
      <UnifiedHomeContent />
    </ProtectedRoute>
  );
}
