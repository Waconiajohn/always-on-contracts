import { useState, useEffect, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ContentLayout } from "@/components/layout/ContentLayout";
import { AddMetricsModal } from "@/components/career-vault/AddMetricsModal";
import { ModernizeLanguageModal } from "@/components/career-vault/ModernizeLanguageModal";
import { ResumeManagementModal } from '@/components/career-vault/ResumeManagementModal';
import { VaultItemViewModal } from '@/components/career-vault/VaultItemViewModal';
import { VaultItemEditModal } from '@/components/career-vault/VaultItemEditModal';
import { BlockerAlert, detectCareerBlockers } from '@/components/career-vault/dashboard/BlockerAlert';
import { UnifiedHeroCard } from '@/components/career-vault/dashboard/UnifiedHeroCard';
import { AIPrimaryAction, determinePrimaryAction } from '@/components/career-vault/dashboard/AIPrimaryAction';
import { VaultMigrationTool } from '@/components/career-vault/VaultMigrationTool';
import { calculateGrade } from '@/components/career-vault/dashboard/CompactVaultStats';
import { useVaultData } from '@/hooks/useVaultData';
import { useVaultStats } from '@/hooks/useVaultStats';
import { useVaultMissions } from '@/hooks/useVaultMissions';
import { useQuickWins } from '@/components/career-vault/dashboard/QuickWinsPanel';
import { calculateMarketRank } from '@/lib/utils/missionGenerator';
import { handleVaultError, handleVaultSuccess } from '@/lib/utils/errorHandling';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Info } from "lucide-react";

// Lazy load heavy components (progressive disclosure)
const VaultTabs = lazy(() => import('@/components/career-vault/dashboard/VaultTabs').then(m => ({ default: m.VaultTabs })));
const VaultAIAssistant = lazy(() => import('@/components/career-vault/VaultAIAssistant').then(m => ({ default: m.VaultAIAssistant })));

/**
 * Career Vault Dashboard V2 - Ultimate UI/UX
 *
 * Design principles:
 * - Progressive disclosure (show essentials, hide details)
 * - AI-first (smart guidance, contextual help)
 * - Single source of truth (no duplicate info)
 * - Mobile-first responsive
 * - WCAG 2.1 AA accessible
 *
 * Layout structure:
 * 1. Unified Hero Card (status at-a-glance)
 * 2. Critical Blockers (if any)
 * 3. Migration Tool (conditional: only if needed)
 * 4. AI Primary Action (THE one thing to do)
 * 5. Content Tabs (progressive disclosure)
 * 6. AI Assistant (floating, dismissible)
 */
const VaultDashboardContent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [addMetricsModalOpen, setAddMetricsModalOpen] = useState(false);
  const [modernizeModalOpen, setModernizeModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [showMigrationTool, setShowMigrationTool] = useState(false);

  // Data hooks
  const { data: vaultData, isLoading, refetch } = useVaultData(userId);
  const stats = useVaultStats(vaultData);

  // Mission callbacks
  const missionCallbacks = {
    onVerifyAssumed: () => navigate('/career-vault-onboarding'),
    onAddMetrics: () => setAddMetricsModalOpen(true),
    onRefreshStale: () => handleReanalyze(),
  };

  const missions = useVaultMissions(vaultData, stats, missionCallbacks);
  const quickWins = useQuickWins({
    assumedCount: stats?.qualityDistribution.assumedNeedingReview || 0,
    weakPhrasesCount: vaultData?.powerPhrases.filter((p: any) =>
      !p.impact_metrics || Object.keys(p.impact_metrics).length === 0
    ).length || 0,
    outdatedTermsCount: 0,
  });

  // Get user on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUser();
  }, []);

  // Handlers
  const handleReanalyze = async () => {
    if (!vaultData?.vault?.id) return;

    setIsReanalyzing(true);
    try {
      const { error } = await supabase.functions.invoke('auto-populate-vault-v3', {
        body: {
          vaultId: vaultData.vault.id,
          resumeText: vaultData.vault.resume_raw_text,
          mode: 'full',
        },
      });

      if (error) throw error;

      await refetch();
      queryClient.invalidateQueries({ queryKey: ['vault-data'] });

      handleVaultSuccess(
        toast,
        'Vault re-analyzed successfully',
        'Your career vault has been updated with the latest extraction.'
      );
    } catch (error: any) {
      handleVaultError(toast, error, 'Re-analysis failed');
    } finally {
      setIsReanalyzing(false);
    }
  };

  const handleEditItem = (item: any) => {
    setSelectedItem(item);
    setEditModalOpen(true);
  };

  const handleViewItem = (item: any) => {
    setSelectedItem(item);
    setViewModalOpen(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <ContentLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-lg text-muted-foreground">Loading your career vault...</p>
          </div>
        </div>
      </ContentLayout>
    );
  }

  // Error state
  if (!vaultData) {
    return (
      <ContentLayout>
        <div className="p-8">
          <Alert variant="destructive">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Unable to load vault data. Please try refreshing the page.
            </AlertDescription>
          </Alert>
        </div>
      </ContentLayout>
    );
  }

  // Calculate metrics
  const grade = calculateGrade(stats?.strengthScore.total || 0);
  const marketRank = calculateMarketRank(stats?.strengthScore.total || 0);
  const unverifiedItems = stats ? (stats.totalItems - stats.qualityDistribution.gold - stats.qualityDistribution.silver - stats.qualityDistribution.bronze) : 0;

  // Detect blockers (only critical severity shown in main area)
  const allBlockers = detectCareerBlockers({
    strengthScore: stats?.strengthScore.total || 0,
    leadershipItems: (vaultData?.leadershipPhilosophy?.length || 0) + (vaultData?.executivePresence?.length || 0),
    budgetOwnership: vaultData?.careerContext?.has_budget_ownership || false,
    targetRoles: vaultData?.userProfile?.target_roles || [],
  });
  const criticalBlockers = allBlockers.filter(b => b.severity === 'critical');

  // Determine if migration tool should be shown
  const shouldShowMigrationTool = grade < 'B' || showMigrationTool || (stats?.totalItems || 0) > 500;

  // AI-powered career level detection
  const determineCareerLevel = () => {
    const score = stats?.strengthScore.total || 0;
    const leadership = (vaultData?.leadershipPhilosophy?.length || 0) + (vaultData?.executivePresence?.length || 0);

    if (score >= 90 && leadership >= 10) return 'C-Suite Ready';
    if (score >= 80 && leadership >= 5) return 'Senior Executive Ready';
    if (score >= 70 && leadership >= 3) return 'Director+ Ready';
    if (score >= 60) return 'Senior Professional';
    return 'Professional';
  };

  // AI-generated contextual summary
  const generateContextualSummary = () => {
    const score = stats?.strengthScore.total || 0;
    const items = stats?.totalItems || 0;
    const targetRole = vaultData?.userProfile?.target_roles?.[0] || 'your target roles';
    const percentile = marketRank;

    if (criticalBlockers.length > 0) {
      return `Your vault has ${items} items but needs critical updates before applying to ${targetRole} positions.`;
    }

    if (unverifiedItems > 20) {
      return `Your vault has ${items} items with ${Math.round((items - unverifiedItems) / items * 100)}% verified. Quick review will boost your competitiveness.`;
    }

    if (score >= 85) {
      return `Your vault is highly optimized for ${targetRole} positions. You rank in the top ${Math.round((100 - percentile) / 10) * 10}% of professionals.`;
    }

    if (score >= 70) {
      return `Your vault is ${Math.round(score)}% optimized and competitive for ${targetRole} positions.`;
    }

    return `Your vault has ${items} items. Continue building to strengthen your position for ${targetRole} roles.`;
  };

  return (
    <ContentLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto">

        {/* ====================================================================
            HERO SECTION - Single-glance vault status
            ==================================================================== */}
        <UnifiedHeroCard
          score={stats?.strengthScore.total || 0}
          grade={grade}
          level={determineCareerLevel()}
          summary={generateContextualSummary()}
          totalItems={stats?.totalItems || 0}
          marketPercentile={marketRank}
          itemsToReview={unverifiedItems}
          onManageResume={() => setResumeModalOpen(true)}
          onReanalyze={handleReanalyze}
          onSettings={() => navigate('/settings')}
          isReanalyzing={isReanalyzing}
        />

        {/* ====================================================================
            CRITICAL BLOCKERS - Only severity='critical' shown here
            ==================================================================== */}
        {criticalBlockers.length > 0 && (
          <div className="mb-6" role="alert" aria-live="assertive">
            {criticalBlockers.map((blocker) => (
              <BlockerAlert
                key={blocker.id}
                blocker={blocker}
                onAction={() => navigate(blocker.actionRoute)}
              />
            ))}
          </div>
        )}

        {/* ====================================================================
            MIGRATION TOOL - Conditional: Only if grade < B or quality issues
            ==================================================================== */}
        {shouldShowMigrationTool && (
          <div className="mb-6">
            <VaultMigrationTool
              vaultId={vaultData.vault.id}
              resumeText={vaultData.vault.resume_raw_text}
              onComplete={() => {
                queryClient.invalidateQueries({ queryKey: ['vault-data'] });
                refetch();
                setShowMigrationTool(false); // Hide after successful migration
              }}
              onDataChange={() => {
                queryClient.invalidateQueries({ queryKey: ['vault-data'] });
                refetch();
              }}
            />
          </div>
        )}

        {/* ====================================================================
            AI PRIMARY ACTION - THE one thing to do next
            ==================================================================== */}
        <AIPrimaryAction
          action={determinePrimaryAction({
            hasBlockers: criticalBlockers.length > 0,
            blockerMessage: criticalBlockers[0]?.description,
            blockerRoute: criticalBlockers[0]?.actionRoute,
            unverifiedItems,
            quickWins: quickWins.map(qw => ({
              title: qw.title,
              actionLabel: qw.actionLabel,
              route: qw.actionRoute || '#',
              impact: qw.impact,
            })),
            score: stats?.strengthScore.total || 0,
          })}
          onActionClick={(route) => {
            if (route.startsWith('#')) {
              // Scroll to section
              const element = document.querySelector(route);
              element?.scrollIntoView({ behavior: 'smooth' });
            } else {
              navigate(route);
            }
          }}
        />

        {/* ====================================================================
            CONTENT TABS - Progressive disclosure (lazy loaded)
            ==================================================================== */}
        <div id="vault-tabs">
          <Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }>
            <VaultTabs
              vaultId={vaultData.vault.id}
              vault={vaultData.vault}
              vaultData={vaultData}
              onRefresh={() => refetch()}
              onEdit={handleEditItem}
              onView={handleViewItem}
            />
          </Suspense>
        </div>

        {/* ====================================================================
            MODALS - Same as before
            ==================================================================== */}
        <ResumeManagementModal
          open={resumeModalOpen}
          onOpenChange={setResumeModalOpen}
          vaultId={vaultData.vault.id}
          onResumeUploaded={() => refetch()}
        />

        <AddMetricsModal
          open={addMetricsModalOpen}
          onOpenChange={setAddMetricsModalOpen}
          vaultId={vaultData.vault.id}
          onSuccess={() => refetch()}
        />

        <ModernizeLanguageModal
          open={modernizeModalOpen}
          onOpenChange={setModernizeModalOpen}
          vaultId={vaultData.vault.id}
          onSuccess={() => refetch()}
        />

        {selectedItem && (
          <>
            <VaultItemViewModal
              open={viewModalOpen}
              onOpenChange={setViewModalOpen}
              item={selectedItem}
            />
            <VaultItemEditModal
              open={editModalOpen}
              onOpenChange={setEditModalOpen}
              item={selectedItem}
              onSave={() => {
                refetch();
                setEditModalOpen(false);
              }}
            />
          </>
        )}
      </div>

      {/* ====================================================================
          AI ASSISTANT - Floating, dismissible (lazy loaded)
          ==================================================================== */}
      {stats && (
        <Suspense fallback={null}>
          <VaultAIAssistant
            vault={vaultData.vault}
            stats={{
              totalItems: stats.totalItems,
              strengthScore: stats.strengthScore.total,
              verifiedPercentage: Math.round(((stats.totalItems - unverifiedItems) / Math.max(stats.totalItems, 1)) * 100),
            }}
            userId={userId || ''}
          />
        </Suspense>
      )}
    </ContentLayout>
  );
};

const CareerVaultDashboardV2 = () => (
  <ProtectedRoute>
    <VaultDashboardContent />
  </ProtectedRoute>
);

export default CareerVaultDashboardV2;
