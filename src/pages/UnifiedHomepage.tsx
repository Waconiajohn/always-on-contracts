import { useSubscription } from "@/hooks/useSubscription";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { WebinarScheduleWidget } from "@/components/home/WebinarScheduleWidget";
import { CoachingCalendarWidget } from "@/components/home/CoachingCalendarWidget";
import { JobMarketLiveDataWidget } from "@/components/home/JobMarketLiveDataWidget";
import { ContentLayout } from "@/components/layout/ContentLayout";
import { useUserContext } from "@/hooks/useUserContext";
import { V3HomeHero } from "@/components/home/v3/V3HomeHero";
import { V3JourneyStatus } from "@/components/home/v3/V3JourneyStatus";
import { V3PersonalizedTools } from "@/components/home/v3/V3PersonalizedTools";
import { getNextActionPrompt } from "@/lib/utils/vaultQualitativeHelpers";

const UnifiedHomeContent = () => {
  const { subscription } = useSubscription();
  const userContext = useUserContext();
  const isPlatinum = subscription?.tier === 'concierge_elite';

  if (userContext.loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8 flex justify-center items-center min-h-[50vh]">
        <p className="text-muted-foreground">Loading your career center...</p>
      </div>
    );
  }

  // Get today's priority action
  const todaysPriority = getNextActionPrompt(
    userContext.vaultCompletion,
    [] // We don't have section data here, so we'll provide a simplified version
  );

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
      <div className="container mx-auto px-4 py-8 max-w-7xl space-y-12">
        {/* V3 Homepage Components */}
        <V3HomeHero 
          userName={userContext.userName}
          vaultCompletion={userContext.vaultCompletion}
          todaysPriority={todaysPriority}
        />

        <V3JourneyStatus 
          activeApplications={userContext.activeApplications}
          interviews={userContext.upcomingInterviews}
          vaultCompletion={userContext.vaultCompletion}
        />

        <V3PersonalizedTools 
          vaultCompletion={userContext.vaultCompletion}
          activeApplications={userContext.activeApplications}
          upcomingInterviews={userContext.upcomingInterviews}
        />
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
