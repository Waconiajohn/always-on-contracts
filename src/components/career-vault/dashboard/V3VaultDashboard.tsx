import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ContentLayout } from "@/components/layout/ContentLayout";
import { useVaultData } from "@/hooks/useVaultData";
import { useVaultStats } from "@/hooks/useVaultStats";
import { useVaultAssessment } from "@/hooks/useVaultAssessment";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

import { V3VaultOverview } from "./V3VaultOverview";
import { V3SmartQuestionPanel } from "./V3SmartQuestionPanel";
import { V3VaultDetailTabs } from "./V3VaultDetailTabs";
import { CareerFocusClarifier } from "@/components/career-vault/CareerFocusClarifier";
import { JourneyProgress } from "@/components/career-vault/JourneyProgress";
import { GapAnalysisModal } from "@/components/career-vault/modals/GapAnalysisModal";
import { MarketResearchModal } from "@/components/career-vault/modals/MarketResearchModal";
import { VaultNuclearReset } from "@/components/career-vault/VaultNuclearReset";

/**
 * Career Vault V3: Calm, smart, ongoing improvement.
 * 
 * Design principles:
 * - One smart question at a time (right panel)
 * - Simple overview of what's in the vault (below)
 * - No big modal flows, no overwhelming dashboards
 * - Everything is additive: answering questions strengthens the vault over time
 */
function V3VaultDashboardContent() {
  const { user } = useAuth();
  const { data: vaultData, isLoading, refetch } = useVaultData(user?.id);
  const stats = useVaultStats(vaultData);
  const { assessment, assessVaultQuality, isAssessing } = useVaultAssessment();
  const navigate = useNavigate();

  const [showCareerDirectionModal, setShowCareerDirectionModal] = useState(false);
  const [showGapAnalysisModal, setShowGapAnalysisModal] = useState(false);
  const [showMarketResearchModal, setShowMarketResearchModal] = useState(false);
  const [marketResearchCount, setMarketResearchCount] = useState(0);
  const [gapAnalysisExists, setGapAnalysisExists] = useState(false);

  const vaultId = (vaultData?.vault as any)?.id;
  const careerDirection = (vaultData?.vault as any)?.career_direction;
  const targetRoles = (vaultData?.vault as any)?.target_roles || [];
  const targetIndustries = (vaultData?.vault as any)?.target_industries || [];

  // Check for career direction on load
  useEffect(() => {
    if (vaultId && !careerDirection) {
      setShowCareerDirectionModal(true);
    }
  }, [vaultId, careerDirection]);

  // Fetch market research and gap analysis counts
  useEffect(() => {
    if (!vaultId) return;

    const fetchCounts = async () => {
      const [marketRes, gapRes] = await Promise.all([
        supabase
          .from('vault_market_research')
          .select('id', { count: 'exact', head: true })
          .eq('vault_id', vaultId),
        supabase
          .from('vault_gap_analysis')
          .select('id')
          .eq('vault_id', vaultId)
          .single(),
      ]);

      setMarketResearchCount(marketRes.count || 0);
      setGapAnalysisExists(!!gapRes.data);
    };

    void fetchCounts();
  }, [vaultId]);

  // Fetch assessment on mount
  useEffect(() => {
    if (vaultId && !assessment && !isAssessing) {
      void assessVaultQuality(vaultId);
    }
  }, [vaultId, assessment, isAssessing, assessVaultQuality]);

  const handleCareerDirectionComplete = async (data: {
    careerDirection: 'stay' | 'pivot' | 'explore';
    targetRoles: string[];
    targetIndustries: string[];
  }) => {
    if (!vaultId) return;

    // Save career direction to vault
    await supabase
      .from('career_vault')
      .update({
        career_direction: data.careerDirection,
        target_roles: data.targetRoles,
        target_industries: data.targetIndustries,
      })
      .eq('id', vaultId);

    setShowCareerDirectionModal(false);

    // Trigger market research with actual targets
    const targetRole = data.targetRoles[0];
    const targetIndustry = data.targetIndustries[0];

    if (targetRole && targetIndustry) {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const { data: vaultInfo } = await supabase
        .from('career_vault')
        .select('resume_raw_text')
        .eq('id', vaultId)
        .single();

      await supabase.functions.invoke('analyze-market-fit', {
        body: {
          vaultId,
          targetRole,
          targetIndustry,
          resumeText: vaultInfo?.resume_raw_text || '',
          numJobs: 25,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    void refetch();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!vaultData) {
    return (
      <div className="text-center py-12 space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Welcome to Your Career Vault</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Your Career Vault is your personal intelligence hub. Upload your resume 
            to get started, and we'll help you build a powerful career profile.
          </p>
        </div>
        <Button size="lg" onClick={() => navigate('/onboarding')}>
          Start Career Compass <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    );
  }

  const benchmarkMatch = assessment?.competitive_percentile;
  const vaultStrength = stats?.strengthScore.total ?? 0;
  const totalItems = stats?.totalItems ?? 0;

  // Show career direction modal if not set
  if (showCareerDirectionModal && vaultId) {
    return (
      <CareerFocusClarifier
        onComplete={handleCareerDirectionComplete}
        detectedRole={targetRoles[0]}
        detectedIndustry={targetIndustries[0]}
      />
    );
  }

  return (
    <div className="space-y-4 pb-8">
      <V3VaultOverview 
        vault={vaultData} 
        stats={stats} 
        benchmarkMatch={benchmarkMatch}
      />

      {/* Journey Progress */}
      <JourneyProgress
        careerDirection={careerDirection}
        marketResearchCount={marketResearchCount}
        gapAnalysisExists={gapAnalysisExists}
        vaultStrength={vaultStrength}
      />

      {/* 3 Action Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Box 1: Review Your Intelligence */}
        <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/career-intelligence")}>
          <CardContent className="py-4 px-4 space-y-2">
            <div className="text-sm font-semibold">Review Your Intelligence</div>
            <div className="text-xs text-muted-foreground">
              View and edit your {totalItems} extracted career data points across 10 categories
            </div>
            <Button variant="ghost" size="sm" className="w-full justify-start px-0">
              Open Library <ArrowRight className="ml-2 h-3 w-3" />
            </Button>
          </CardContent>
        </Card>

        {/* Box 2: Gap Analysis */}
        <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowGapAnalysisModal(true)}>
          <CardContent className="py-4 px-4 space-y-2">
            <div className="text-sm font-semibold">Gap Analysis</div>
            <div className="text-xs text-muted-foreground">
              {gapAnalysisExists
                ? `Comparing your vault to ${marketResearchCount} real ${targetRoles[0] || 'target role'} job postings`
                : "Generate your first gap analysis based on market research"}
            </div>
            <Button variant="ghost" size="sm" className="w-full justify-start px-0">
              View Gaps <ArrowRight className="ml-2 h-3 w-3" />
            </Button>
          </CardContent>
        </Card>

        {/* Box 3: Market Research */}
        <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowMarketResearchModal(true)}>
          <CardContent className="py-4 px-4 space-y-2">
            <div className="text-sm font-semibold">Market Research</div>
            <div className="text-xs text-muted-foreground">
              {marketResearchCount > 0
                ? `Based on ${marketResearchCount} job postings we collected for ${targetRoles[0] || 'your target role'}`
                : "Market research will run after you set your career direction"}
            </div>
            <Button variant="ghost" size="sm" className="w-full justify-start px-0">
              See Research <ArrowRight className="ml-2 h-3 w-3" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <V3VaultDetailTabs vault={vaultData} />
        </div>

        <div className="lg:col-span-1">
          {vaultId && (
            <V3SmartQuestionPanel
              vaultId={vaultId}
              onVaultUpdated={() => refetch()}
            />
          )}
        </div>
      </div>

      {/* What's Next CTA */}
      <Card className="shadow-sm">
        <CardContent className="py-4 px-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            {vaultStrength < 60
              ? "Continue strengthening your vault by answering the smart questions above."
              : "Your vault is ready! Go to Job Search to find matching opportunities."}
          </div>
          <div className="flex gap-2">
            {vaultStrength >= 60 && (
              <Button onClick={() => navigate("/job-search")}>
                Go to Job Search <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setShowCareerDirectionModal(true)}
            >
              Change Target Role/Industry
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      {vaultId && (
        <Card className="border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="text-red-900 dark:text-red-200">Danger Zone</CardTitle>
            <CardDescription className="text-red-800 dark:text-red-300">
              Destructive operations that permanently delete all vault data.
              Use only when you want to start completely fresh.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VaultNuclearReset vaultId={vaultId} />
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      {vaultId && (
        <>
          <GapAnalysisModal
            open={showGapAnalysisModal}
            onClose={() => setShowGapAnalysisModal(false)}
            vaultId={vaultId}
          />
          <MarketResearchModal
            open={showMarketResearchModal}
            onClose={() => setShowMarketResearchModal(false)}
            vaultId={vaultId}
          />
        </>
      )}
    </div>
  );
}

export function V3VaultDashboard() {
  return (
    <ProtectedRoute>
      <ContentLayout maxWidth="container" className="py-6">
        <V3VaultDashboardContent />
      </ContentLayout>
    </ProtectedRoute>
  );
}
