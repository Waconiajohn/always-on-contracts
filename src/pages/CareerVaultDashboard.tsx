import { useState, useEffect, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from 'react-router-dom';
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ContentLayout } from "@/components/layout/ContentLayout";
import { useVaultData } from '@/hooks/useVaultData';
import { useVaultStats } from '@/hooks/useVaultStats';
import { useBenchmarkState, determinePrimaryGoal } from '@/hooks/useBenchmarkState';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

// Benchmark components
import { BenchmarkHeroCard } from '@/components/career-vault/dashboard/BenchmarkHeroCard';
import { PrimaryGoalCard } from '@/components/career-vault/dashboard/PrimaryGoalCard';
import { BenchmarkProgressCard } from '@/components/career-vault/dashboard/BenchmarkProgressCard';
import { BenchmarkSetupCard } from '@/components/career-vault/dashboard/BenchmarkSetupCard';
import { BenchmarkRevealCard } from '@/components/career-vault/dashboard/BenchmarkRevealCard';
import { BlockerAlert, detectCareerBlockers } from '@/components/career-vault/dashboard/BlockerAlert';

// Modals (with Claude's PDF parsing fixes)
import { UploadResumeModal } from '@/components/career-vault/modals/UploadResumeModal';
import { ExtractionProgressModal } from '@/components/career-vault/modals/ExtractionProgressModal';

// ChatGPT's Smart Question Panel
import { V3SmartQuestionPanel } from '@/components/career-vault/dashboard/V3SmartQuestionPanel';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Lazy loaded tabs
const VaultTabs = lazy(() => import('@/components/career-vault/dashboard/VaultTabs').then(m => ({ default: m.VaultTabs })));

/**
 * Enhanced Career Vault Dashboard
 *
 * Architecture:
 * - Original benchmark-driven dashboard (proven, works)
 * - Claude's modal fixes (PDF parsing, auth headers)
 * - ChatGPT's Smart Question panel (calm improvement loop)
 *
 * Layout:
 * - Hero: Benchmark progress
 * - Main content (2/3): Benchmark breakdown + tabs
 * - Right sidebar (1/3): Smart question panel
 */
const CareerVaultDashboardContent = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const [generatingBenchmark, setGeneratingBenchmark] = useState(false);
  const [showBenchmarkReveal, setShowBenchmarkReveal] = useState(false);

  // Modal states
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [extractionModalOpen, setExtractionModalOpen] = useState(false);

  // Fetch data
  const { data: vaultData, isLoading, refetch } = useVaultData(userId);
  const stats = useVaultStats(vaultData);
  const dashboardState = useBenchmarkState(vaultData?.vault, stats);

  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      } else {
        navigate('/auth');
      }
    };
    getUserId();
  }, [navigate]);

  // Auto-generate benchmark if needed
  useEffect(() => {
    if (dashboardState.state === 'benchmark-setup' && vaultData?.vault && !generatingBenchmark) {
      handleGenerateBenchmark();
    }
  }, [dashboardState.state, vaultData?.vault]);

  const handleGenerateBenchmark = async () => {
    if (!vaultData?.vault?.id) return;

    setGeneratingBenchmark(true);
    try {
      const { error } = await supabase.functions.invoke('generate-benchmark-standard', {
        body: { vaultId: vaultData.vault.id }
      });

      if (error) throw error;

      await refetch();
      setShowBenchmarkReveal(true);
      toast.success('Benchmark generated successfully!');
    } catch (error) {
      console.error('Error generating benchmark:', error);
      toast.error('Failed to generate benchmark. Please try again.');
    } finally {
      setGeneratingBenchmark(false);
    }
  };

  const handleUploadComplete = async () => {
    setUploadModalOpen(false);
    setExtractionModalOpen(true);
    await refetch();
  };

  const handleExtractionComplete = async () => {
    setExtractionModalOpen(false);
    await refetch();
  };

  const handlePrimaryGoalStart = () => {
    // Navigate to appropriate modal/action based on goal
    toast.info('Feature coming soon!');
  };

  const handleBenchmarkRevealStart = () => {
    setShowBenchmarkReveal(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ONBOARDING STATE: Empty state
  if (dashboardState.state === 'onboarding') {
    return (
      <div className="container mx-auto max-w-4xl py-12">
        <Card>
          <CardContent className="pt-12 pb-12 text-center space-y-6">
            <Upload className="h-16 w-16 text-primary mx-auto" />
            <div>
              <h1 className="text-3xl font-bold mb-2">Build Your Career Vault</h1>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Upload your resume and let AI extract insights, set personalized benchmarks, and track your progress to market readiness.
              </p>
            </div>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span>1. Upload Resume</span>
              <span>→</span>
              <span>2. AI Extracts</span>
              <span>→</span>
              <span>3. Set Benchmark</span>
              <span>→</span>
              <span>4. Track Progress</span>
            </div>
            <Button size="lg" onClick={() => setUploadModalOpen(true)}>
              Upload Resume to Get Started
            </Button>
          </CardContent>
        </Card>

        <UploadResumeModal
          open={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          onUploadComplete={handleUploadComplete}
        />
      </div>
    );
  }

  // EXTRACTING STATE: Show extraction modal
  if (dashboardState.state === 'extracting') {
    return (
      <div className="container mx-auto max-w-4xl py-12">
        <ExtractionProgressModal
          open={true}
          onComplete={handleExtractionComplete}
          vaultId={vaultData?.vault?.id}
        />
      </div>
    );
  }

  // BENCHMARK SETUP STATE: Show AI generating benchmark
  if (dashboardState.state === 'benchmark-setup' || generatingBenchmark) {
    return (
      <div className="container mx-auto max-w-4xl py-12">
        <BenchmarkSetupCard />
      </div>
    );
  }

  // BENCHMARK REVEAL: Show benchmark results
  if (showBenchmarkReveal && vaultData?.vault?.benchmark_standard) {
    const benchmark = vaultData.vault.benchmark_standard;
    return (
      <div className="container mx-auto max-w-4xl py-12">
        <BenchmarkRevealCard
          role={benchmark.role}
          level={benchmark.level}
          industry={benchmark.industry}
          overallTarget={benchmark.overall_target}
          overallCurrent={benchmark.overall_current}
          criticalGaps={benchmark.gap_analysis.critical_gaps}
          quickWins={benchmark.gap_analysis.quick_wins}
          estimatedTime={benchmark.gap_analysis.estimated_time}
          onStart={handleBenchmarkRevealStart}
        />
      </div>
    );
  }

  // MAIN DASHBOARD: Building/Optimizing/Ready states
  const vault = vaultData?.vault;
  const benchmark = vault?.benchmark_standard;
  const blockers = vaultData && stats ? detectCareerBlockers({
    strengthScore: stats.strengthScore.total,
    leadershipItems: stats.categoryCounts.leadershipPhilosophy,
    budgetOwnership: false,
    targetRoles: vault?.target_roles || []
  }) : [];
  const primaryGoal = determinePrimaryGoal(benchmark);

  if (!benchmark) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading benchmark data...</p>
      </div>
    );
  }

  const percentage = Math.round((benchmark.overall_current / benchmark.overall_target) * 100);
  const nextMilestone = percentage < 60
    ? "Reach 60% to unlock Resume Builder"
    : percentage < 85
    ? "Reach 85% to be market ready"
    : "Ready to build custom resumes!";

  return (
    <div className="space-y-6">
      {/* Hero: Benchmark Progress */}
      <BenchmarkHeroCard
        current={benchmark.overall_current}
        target={benchmark.overall_target}
        percentage={percentage}
        status={dashboardState.message}
        nextMilestone={nextMilestone}
        level={benchmark.level}
        role={benchmark.role}
      />

      {/* Blockers (if any) */}
      {blockers.length > 0 && (
        <div className="space-y-3">
          {blockers.map((blocker, i) => (
            <BlockerAlert
              key={i}
              blocker={blocker}
              onAction={() => toast.info('Feature coming soon!')}
            />
          ))}
        </div>
      )}

      {/* Primary Goal */}
      {primaryGoal && (
        <PrimaryGoalCard
          goal={primaryGoal.goal}
          impact={primaryGoal.impact}
          scoreGain={primaryGoal.scoreGain}
          newScore={benchmark.overall_current + primaryGoal.scoreGain}
          targetScore={benchmark.overall_target}
          estimatedTime={primaryGoal.estimatedTime}
          onStart={handlePrimaryGoalStart}
        />
      )}

      {/* Main Content Grid: Content (2/3) + Smart Questions (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Main Dashboard Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Benchmark Progress Breakdown */}
          <BenchmarkProgressCard
            layer1={{
              total_current: benchmark.layer1_foundations.work_experience.current +
                            benchmark.layer1_foundations.skills.current,
              total_target: benchmark.layer1_foundations.work_experience.target +
                           benchmark.layer1_foundations.skills.target,
              sections: [
                {
                  name: 'Work Experience',
                  target: benchmark.layer1_foundations.work_experience.target,
                  current: benchmark.layer1_foundations.work_experience.current,
                  percentage: benchmark.layer1_foundations.work_experience.percentage,
                  details: benchmark.layer1_foundations.work_experience.benchmark_rule,
                  missing: benchmark.layer1_foundations.work_experience.examples.slice(0, 3)
                },
                {
                  name: 'Skills & Expertise',
                  target: benchmark.layer1_foundations.skills.target,
                  current: benchmark.layer1_foundations.skills.current,
                  percentage: benchmark.layer1_foundations.skills.percentage,
                  missing: benchmark.layer1_foundations.skills.critical_missing
                }
              ]
            }}
            layer2={{
              total_current: benchmark.layer2_intelligence.leadership.current +
                            benchmark.layer2_intelligence.strategic_impact.current +
                            benchmark.layer2_intelligence.professional_resources.current,
              total_target: benchmark.layer2_intelligence.leadership.target +
                           benchmark.layer2_intelligence.strategic_impact.target +
                           benchmark.layer2_intelligence.professional_resources.target,
              sections: [
                {
                  name: 'Leadership Approach',
                  target: benchmark.layer2_intelligence.leadership.target,
                  current: benchmark.layer2_intelligence.leadership.current,
                  percentage: benchmark.layer2_intelligence.leadership.percentage,
                  missing: benchmark.layer2_intelligence.leadership.focus_areas
                },
                {
                  name: 'Strategic Impact',
                  target: benchmark.layer2_intelligence.strategic_impact.target,
                  current: benchmark.layer2_intelligence.strategic_impact.current,
                  percentage: benchmark.layer2_intelligence.strategic_impact.percentage,
                  missing: benchmark.layer2_intelligence.strategic_impact.missing_metrics
                },
                {
                  name: 'Professional Resources',
                  target: benchmark.layer2_intelligence.professional_resources.target,
                  current: benchmark.layer2_intelligence.professional_resources.current,
                  percentage: benchmark.layer2_intelligence.professional_resources.percentage,
                  missing: benchmark.layer2_intelligence.professional_resources.expected_tools
                }
              ]
            }}
          />

          {/* Tabs: Items, Activity, Settings */}
          <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin mx-auto" />}>
            <VaultTabs
              vaultId={vault.id}
              vault={vault}
              vaultData={vaultData}
              onRefresh={refetch}
              onEdit={() => {}}
              onView={() => {}}
            />
          </Suspense>
        </div>

        {/* Right: Smart Question Panel (ChatGPT's calm improvement loop) */}
        <div className="lg:col-span-1">
          <div className="sticky top-6" id="smart-question-panel">
            <ErrorBoundary>
              <V3SmartQuestionPanel
                vaultId={vault.id}
                onVaultUpdated={() => refetch()}
              />
            </ErrorBoundary>
          </div>
        </div>
      </div>

      {/* Modals (with Claude's fixes) */}
      <UploadResumeModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadComplete={handleUploadComplete}
      />
      <ExtractionProgressModal
        open={extractionModalOpen}
        onComplete={handleExtractionComplete}
        vaultId={vault.id}
      />
    </div>
  );
};

export default function CareerVaultDashboard() {
  return (
    <ProtectedRoute>
      <ContentLayout>
        <CareerVaultDashboardContent />
      </ContentLayout>
    </ProtectedRoute>
  );
}
