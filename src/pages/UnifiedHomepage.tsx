import { useState } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { WebinarScheduleWidget } from "@/components/home/WebinarScheduleWidget";
import { CoachingCalendarWidget } from "@/components/home/CoachingCalendarWidget";
import { JobMarketLiveDataWidget } from "@/components/home/JobMarketLiveDataWidget";
import { ContentLayout } from "@/components/layout/ContentLayout";
import { useUserContext } from "@/hooks/useUserContext";
import { useQuickScore } from "@/hooks/useQuickScore";
import { useResumeProgress } from "@/hooks/useResumeProgress";
import { useInterviewPrepStatus } from "@/hooks/useInterviewPrepStatus";
import { V3HomeHero } from "@/components/home/v3/V3HomeHero";
import { V3ActiveJobSearch } from "@/components/home/v3/V3ActiveJobSearch";
import { V3MicroWins } from "@/components/home/v3/V3MicroWins";
import { V3ScoreStatusCard } from "@/components/home/v3/V3ScoreStatusCard";
import { V3QuickActionsCard } from "@/components/home/v3/V3QuickActionsCard";
import { ExplorationModal } from "@/components/ExplorationModal";
import { getNextActionPrompt } from "@/lib/utils/resumeQualityHelpers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { Package, ChevronRight, Lock, ArrowRight } from "lucide-react";

const UnifiedHomeContent = () => {
  const { subscription } = useSubscription();
  const userContext = useUserContext();
  const { data: quickScore, isLoading: scoreLoading } = useQuickScore();
  const { data: resumeProgress, isLoading: progressLoading } = useResumeProgress();
  const { data: interviewStatus, isLoading: interviewLoading } = useInterviewPrepStatus();
  const navigate = useNavigate();
  const isPlatinum = subscription?.tier === 'concierge_elite';
  const [explorationModal, setExplorationModal] = useState<{ isOpen: boolean; feature: string; description: string } | null>(null);

  const showVaultCTA = userContext.vaultCompletion < 30;

  if (userContext.loading || scoreLoading || progressLoading || interviewLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8 flex justify-center items-center min-h-[50vh]">
        <p className="text-muted-foreground">Loading your career center...</p>
      </div>
    );
  }

  // Get today's priority action (now based on Score → Build → Apply flow)
  const todaysPriority = getNextActionPrompt(
    userContext.vaultCompletion,
    []
  );

  // Real score data from database
  const scoreData = quickScore ? {
    lastScore: quickScore.overall_score,
    lastScoredDate: quickScore.scored_at,
    tierInfo: {
      tier: quickScore.tier_name,
      emoji: quickScore.tier_emoji || "",
      message: quickScore.tier_message || ""
    }
  } : {
    lastScore: undefined as number | undefined,
    lastScoredDate: undefined as string | undefined,
    tierInfo: undefined
  };

  // Calculate states for Quick Actions
  const hasScore = typeof scoreData.lastScore === 'number';
  const hasActiveResume = resumeProgress?.has_active_resume || false;
  const applicationCount = userContext.activeApplications || 0;
  const hasInterviewPrep = interviewStatus?.hasInterviewPrep || false;

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
      <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
        
        {/* NEW LAYOUT: Score → Build → Apply → Win */}

        {/* 1. Hero - Updated messaging */}
        <V3HomeHero 
          userName={userContext.userName}
          vaultCompletion={userContext.vaultCompletion}
          todaysPriority={todaysPriority}
        />

        {/* 2. Quick Actions Path - Score → Build → Apply → Win */}
        <V3QuickActionsCard
          hasScore={hasScore}
          hasActiveResume={hasActiveResume}
          applicationCount={applicationCount}
          hasInterviewPrep={hasInterviewPrep}
        />

        {/* 3. Two-column layout: Score Status + Active Applications */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Score Status Card - Most prominent */}
          <V3ScoreStatusCard
            lastScore={scoreData.lastScore}
            lastScoredDate={scoreData.lastScoredDate}
            tierInfo={scoreData.tierInfo}
          />

          {/* Active Job Search - Show applications/interviews */}
          <V3ActiveJobSearch
            activeApplications={userContext.activeApplications}
            upcomingInterviews={userContext.upcomingInterviews}
          />
        </div>

        {/* 4. Micro Wins - Motivational progress indicators */}
        <V3MicroWins vaultCompletion={userContext.vaultCompletion} />

        {/* 5. Vault CTA - Show when vault completion is low */}
        {showVaultCTA && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Lock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Unlock Your Full Potential</CardTitle>
                  <CardDescription>
                    Complete your Career Vault to unlock AI-powered features
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Career Vault Progress</span>
                  <span className="text-muted-foreground">{userContext.vaultCompletion}%</span>
                </div>
                <Progress value={userContext.vaultCompletion} className="h-2" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => navigate('/career-vault')}>
                  Continue Setup
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setExplorationModal({
                    isOpen: true,
                    feature: "AI-Powered Features",
                    description: "Complete your Career Vault to unlock personalized job matching, intelligent resume optimization, and interview preparation tailored to your unique experience."
                  })}
                >
                  Learn More
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 6. Career Vault - Now secondary, collapsible */}
        {!showVaultCTA && (
          <Card className="bg-muted/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-base">Career Vault</CardTitle>
                    <CardDescription className="text-xs">
                      Your achievement library — evidence for your must-interview resumes
                    </CardDescription>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/career-vault')}
                >
                  Manage Vault
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm">
                <div className="flex gap-6">
                  <div>
                    <p className="text-muted-foreground">Completion</p>
                    <p className="font-medium">{userContext.vaultCompletion}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Sections</p>
                    <p className="font-medium">8 areas</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className="font-medium text-amber-500">
                      {userContext.vaultCompletion < 50 ? 'Building' : 
                       userContext.vaultCompletion < 80 ? 'Expanding' : 'Complete'}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  The vault provides evidence for your resumes. Build it as you go.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

      </div>

      {/* Exploration Modal */}
      {explorationModal && (
        <ExplorationModal
          isOpen={explorationModal.isOpen}
          onClose={() => setExplorationModal(null)}
          featureName={explorationModal.feature}
          featureDescription={explorationModal.description}
          vaultCompletion={userContext.vaultCompletion}
        />
      )}
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
