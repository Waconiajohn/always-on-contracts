import { useState, useEffect } from "react";
import { 
  Home, Briefcase, FileText, MessageSquare, Users, 
  Linkedin, TrendingUp, Building2, DollarSign, 
  Target, Calculator
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  const { subscription } = useSubscription();
  const { vaultCompletion: _journeyVaultCompletion } = useJourneyState();
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
        .select('total_power_phrases, total_transferable_skills, total_hidden_competencies, review_completion_percentage')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setVaultStats({
          powerPhrases: data.total_power_phrases || 0,
          skills: data.total_transferable_skills || 0,
          competencies: data.total_hidden_competencies || 0,
          vaultCompletion: data.review_completion_percentage || 0
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
      path: '/career-vault',
      progress: vaultStats.vaultCompletion,
      order: 1,
      isLocked: false,
      isDualAI: true
    },
    {
      id: 'job-search',
      title: 'Job Search',
      description: 'Find and save opportunities with AI',
      icon: Briefcase,
      path: '/job-search',
      order: 2,
      isLocked: !isVaultComplete,
      lockReason: 'Complete Career Vault first',
      isDualAI: true
    },
    {
      id: 'resume-builder',
      title: 'Resume Builder',
      description: 'Create tailored, ATS-optimized resumes',
      icon: FileText,
      path: '/agents/resume-builder-wizard',
      order: 3,
      isLocked: !isVaultComplete,
      lockReason: 'Complete Career Vault first',
      isDualAI: true
    },
    {
      id: 'active-applications',
      title: 'Active Applications',
      description: 'Track applications, interviews & offers',
      icon: FileText,
      path: '/active-applications',
      order: 4,
      isLocked: !isVaultComplete,
      lockReason: 'Complete Career Vault first'
    },
    {
      id: 'interview-prep',
      title: 'Interview Prep',
      description: 'Practice with vault-powered responses',
      icon: MessageSquare,
      path: '/agents/interview-prep',
      order: 5,
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
      order: 6,
      isLocked: !isVaultComplete,
      lockReason: 'Complete Career Vault first'
    },
    {
      id: 'linkedin-content',
      title: 'LinkedIn Content',
      description: 'Thought leadership and blogging',
      icon: Linkedin,
      path: '/agents/linkedin-blogging',
      order: 7,
      isLocked: !isVaultComplete,
      lockReason: 'Complete Career Vault first'
    },
    {
      id: 'networking',
      title: 'Networking Hub',
      description: 'Build strategic connections',
      icon: Users,
      path: '/agents/networking',
      order: 8,
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
            <div className="p-3 rounded-lg bg-primary">
              <Home className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                Welcome to <span className="bg-gradient-to-r from-primary to-blue-700 bg-clip-text text-transparent">CareerIQ</span>
              </h1>
              <p className="text-muted-foreground">Your AI-powered career intelligence platform</p>
            </div>
          </div>

          {/* Feature Badges */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              🤖 12 AI Agents
            </Badge>
            <Badge variant="secondary" className="bg-blue-50/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
              ✅ Dual-AI Verification
            </Badge>
            <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300">
              🟢 All Systems Active
            </Badge>
            {isPlatinum && (
              <Badge variant="secondary" className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
                💎 Platinum Member
              </Badge>
            )}
          </div>

          {/* Quick link to unique features */}
          <div className="flex justify-center">
            <button 
              onClick={() => document.getElementById('unique-features')?.scrollIntoView({ behavior: 'smooth' })}
              className="group flex items-center gap-3 px-6 py-3 rounded-full border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all shadow-sm hover:shadow-md"
            >
              <span className="text-sm font-semibold text-primary">
                💎 Find out why CareerIQ is different
              </span>
              <span className="text-xs text-muted-foreground">
                Features you won't find anywhere else
              </span>
            </button>
          </div>
        </div>

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

        {/* Industry-First Features Showcase - Moved to Bottom */}
        <div id="unique-features" className="mt-12 pt-8 border-t">
          <UniqueFeaturesShowcase />
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
