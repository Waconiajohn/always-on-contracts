import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from 'react-router-dom';
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ContentLayout } from "@/components/layout/ContentLayout";
import { useVaultData } from '@/hooks/useVaultData';
import { useVaultStats } from '@/hooks/useVaultStats';
import { useBenchmarkState } from '@/hooks/useBenchmarkState';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

// Benchmark components
import { BenchmarkSetupCard } from '@/components/career-vault/dashboard/BenchmarkSetupCard';
import { BenchmarkRevealCard } from '@/components/career-vault/dashboard/BenchmarkRevealCard';

// Modals
import { UploadResumeModal } from '@/components/career-vault/modals/UploadResumeModal';
import { ExtractionProgressModal } from '@/components/career-vault/modals/ExtractionProgressModal';

// NEW: Main Vault Building Experience
import { VaultBuilderMainView } from '@/components/career-vault/dashboard/VaultBuilderMainView';

/**
 * Career Vault Dashboard - Complete Redesign
 *
 * Philosophy:
 * - Help users discover they're better than they think
 * - Three-variable model: User Experience vs. Best-in-Class Benchmark (Job Description comes later)
 * - Section-by-section vault building is PRIMARY experience
 * - Creative questions to uncover hidden expertise
 * - Simple, concrete, resume-native structure
 *
 * Flow:
 * 1. Upload resume → Extract
 * 2. Generate benchmark (comparing user to best-in-class)
 * 3. Reveal benchmark results
 * 4. Main vault building: Section-by-section improvement with Current vs. Benchmark comparison
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

  // MAIN DASHBOARD: Vault Building Experience
  const vault = vaultData?.vault;
  const benchmark = vault?.benchmark_standard;

  if (!benchmark) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading benchmark data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* NEW: Main Vault Building Experience */}
      {vaultData && (
        <VaultBuilderMainView
          vaultId={vault.id}
          benchmark={benchmark}
          stats={stats}
          vaultData={vaultData}
          onVaultUpdated={refetch}
        />
      )}

      {/* Modals */}
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
