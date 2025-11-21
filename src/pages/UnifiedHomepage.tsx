import { useSubscription } from "@/hooks/useSubscription";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { WebinarScheduleWidget } from "@/components/home/WebinarScheduleWidget";
import { CoachingCalendarWidget } from "@/components/home/CoachingCalendarWidget";
import { JobMarketLiveDataWidget } from "@/components/home/JobMarketLiveDataWidget";
import { ContentLayout } from "@/components/layout/ContentLayout";
import { useUserContext } from "@/hooks/useUserContext";
import { MorningBrief } from "@/components/home/v2/MorningBrief";
import { ActivePulse } from "@/components/home/v2/ActivePulse";
import { ActionCenter } from "@/components/home/v2/ActionCenter";

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
      <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
        {/* V2 Homepage Components */}
        <MorningBrief 
          userName={userContext.userName}
          vaultCompletion={userContext.vaultCompletion}
          activeApplications={userContext.activeApplications}
          upcomingInterviews={userContext.upcomingInterviews}
        />

        <ActivePulse 
          activeApplications={userContext.activeApplications}
          interviews={userContext.upcomingInterviews}
          offers={userContext.offers}
          vaultScore={userContext.vaultCompletion}
        />

        <ActionCenter />
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
