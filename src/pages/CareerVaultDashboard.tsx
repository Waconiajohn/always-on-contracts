import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ContentLayout } from "@/components/layout/ContentLayout";
import { VaultSidebar } from "@/components/career-vault/VaultSidebar";
import { AddMetricsModal } from "@/components/career-vault/AddMetricsModal";
import { ModernizeLanguageModal } from "@/components/career-vault/ModernizeLanguageModal";
import { InferredItemsReview } from "@/components/career-vault/InferredItemsReview";
import { ResumeManagementModal } from '@/components/career-vault/ResumeManagementModal';
import { SmartNextSteps } from '@/components/career-vault/SmartNextSteps';
import { VaultHeader } from '@/components/career-vault/dashboard/VaultHeader';
import { QuickActionsBar } from '@/components/career-vault/dashboard/QuickActionsBar';
import { VaultTabs } from '@/components/career-vault/dashboard/VaultTabs';
import { StrategicCommandCenter } from '@/components/career-vault/dashboard/StrategicCommandCenter';
import { BlockerAlert, detectCareerBlockers } from '@/components/career-vault/dashboard/BlockerAlert';
import { CompactVaultStats, calculateGrade } from '@/components/career-vault/dashboard/CompactVaultStats';
import { QuickWinsPanel, useQuickWins } from '@/components/career-vault/dashboard/QuickWinsPanel';
import { VaultItemViewModal } from '@/components/career-vault/VaultItemViewModal';
import { VaultItemEditModal } from '@/components/career-vault/VaultItemEditModal';
import { VaultAIAssistant } from '@/components/career-vault/VaultAIAssistant';
import { VaultMigrationTool } from '@/components/career-vault/VaultMigrationTool';
import { useVaultData } from '@/hooks/useVaultData';
import { useVaultStats } from '@/hooks/useVaultStats';
import { useVaultMissions } from '@/hooks/useVaultMissions';
import { calculateMarketRank } from '@/lib/utils/missionGenerator';
import { handleVaultError, handleVaultSuccess } from '@/lib/utils/errorHandling';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

const VaultDashboardContent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [addMetricsModalOpen, setAddMetricsModalOpen] = useState(false);
  const [modernizeModalOpen, setModernizeModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Use centralized data hooks
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
    weakPhrasesCount: vaultData?.powerPhrases.filter((p: any) => !p.impact_metrics || Object.keys(p.impact_metrics).length === 0).length || 0,
    staleItemsCount: 0,
    onVerifyAssumed: () => navigate('/career-vault-onboarding'),
    onAddMetrics: () => setAddMetricsModalOpen(true),
    onRefreshStale: () => handleReanalyze(),
  });

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      } else {
        navigate('/auth');
      }
    };
    fetchUser();
  }, [navigate]);

  const handleReanalyze = async () => {
    if (!vaultData?.vault?.id || !vaultData?.vault?.resume_raw_text) {
      toast({ title: "Error", description: "Cannot re-analyze: missing vault data", variant: "destructive" });
      return;
    }

    setIsReanalyzing(true);
    try {
      const { error } = await supabase.functions.invoke('auto-populate-vault-v3', {
        body: {
          resumeText: vaultData.vault.resume_raw_text,
          vaultId: vaultData.vault.id,
          targetRoles: vaultData.userProfile?.target_roles || [],
          targetIndustries: vaultData.vault.target_industries || [],
          mode: 'incremental'
        }
      });

      if (error) throw error;
      handleVaultSuccess('Vault re-analysis completed successfully');
      refetch();
    } catch (error: any) {
      handleVaultError(error, 'Re-analyze vault');
    } finally {
      setIsReanalyzing(false);
    }
  };

  const handleViewItem = (item: any) => {
    setSelectedItem(item);
    setViewModalOpen(true);
  };

  const handleEditItem = (item: any) => {
    setSelectedItem(item);
    setEditModalOpen(true);
  };

  const handleResetVault = () => {
    // Navigate to nuclear reset or open a dialog
    toast({ title: "Reset vault", description: "Navigate to settings tab to use nuclear reset" });
  };

  if (isLoading) {
    return (
      <ContentLayout
        rightSidebar={
          <VaultSidebar
            completionPercentage={0}
            totalItems={0}
            strengthScore={0}
          />
        }
      >
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-2">Career Vault</h1>
          <p className="text-muted-foreground mb-6">Loading your career intelligence...</p>
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </ContentLayout>
    );
  }

  if (!vaultData?.vault) {
    return (
      <ContentLayout
        rightSidebar={
          <VaultSidebar
            completionPercentage={0}
            totalItems={0}
            strengthScore={0}
          />
        }
      >
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-2">Career Vault</h1>
          <p className="text-muted-foreground mb-6">Set up your career vault</p>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>No Vault Found</AlertTitle>
            <AlertDescription>
              You haven't created a Career Vault yet. Start by uploading your resume to unlock your career intelligence.
            </AlertDescription>
          </Alert>
          <div className="mt-6">
            <SmartNextSteps
              interviewProgress={0}
              strengthScore={0}
              totalItems={0}
              hasLeadership={false}
              hasExecutivePresence={false}
            />
          </div>
        </div>
      </ContentLayout>
    );
  }

  const grade = calculateGrade(stats?.strengthScore.total || 0);
  const dataFreshness = grade; // Simplified for now
  const marketRank = calculateMarketRank(stats?.strengthScore.total || 0);
  const verifiedPercentage = stats ? Math.round(((stats.totalItems - stats.qualityDistribution.assumed) / Math.max(stats.totalItems, 1)) * 100) : 0;
  
  // Detect career blockers
  const blockers = detectCareerBlockers({
    strengthScore: stats?.strengthScore.total || 0,
    leadershipItems: (vaultData?.leadershipPhilosophy?.length || 0) + (vaultData?.executivePresence?.length || 0),
    budgetOwnership: vaultData?.careerContext?.has_budget_ownership || false,
    targetRoles: vaultData?.userProfile?.target_roles || [],
  });

  return (
    <ContentLayout
      rightSidebar={
        <VaultSidebar
          completionPercentage={verifiedPercentage}
          totalItems={stats?.totalItems || 0}
          strengthScore={stats?.strengthScore.total || 0}
        />
      }
    >
      <div className="p-8">
        <VaultHeader
          vault={vaultData.vault}
          grade={grade}
          onResumeClick={() => setResumeModalOpen(true)}
          onReanalyze={handleReanalyze}
          isReanalyzing={isReanalyzing}
        />

        {/* Career Blockers (Critical Issues) */}
        {blockers.length > 0 && (
          <div className="mb-6">
            {blockers.map((blocker) => (
              <BlockerAlert
                key={blocker.id}
                blocker={blocker}
                onAction={() => navigate(blocker.actionRoute)}
              />
            ))}
          </div>
        )}

        {/* Vault Migration Tool */}
        <div className="mb-6">
          <VaultMigrationTool 
            vaultId={vaultData.vault.id} 
            resumeText={vaultData.vault.resume_raw_text}
            onComplete={() => {
              console.log('📊 Migration onComplete - invalidating cache and refetching');
              // Force complete cache invalidation to show fresh data
              queryClient.invalidateQueries({ queryKey: ['vault-data'] });
              refetch();
            }}
            onDataChange={() => {
              console.log('📊 Migration onDataChange - invalidating cache and refetching');
              // Force complete cache invalidation to show fresh data
              queryClient.invalidateQueries({ queryKey: ['vault-data'] });
              refetch();
            }}
          />
        </div>

        {/* Compact Stats */}
        {stats && (
          <CompactVaultStats
            strengthScore={stats.strengthScore.total}
            level={stats.strengthScore.level}
            totalItems={stats.totalItems}
            verifiedPercentage={verifiedPercentage}
            dataQuality={grade}
            dataFreshness={dataFreshness}
            marketRank={marketRank}
            coreScores={{
              powerPhrases: stats.strengthScore.powerPhrasesScore,
              skills: stats.strengthScore.transferableSkillsScore,
              competencies: stats.strengthScore.hiddenCompetenciesScore,
              intangibles: stats.strengthScore.intangiblesScore,
              quantification: stats.strengthScore.quantificationScore,
              modernTerms: stats.strengthScore.modernTerminologyScore,
            }}
          />
        )}

        {/* Strategic Command Center */}
        {stats && (
          <StrategicCommandCenter
            strengthScore={stats.strengthScore.total}
            level={stats.strengthScore.level}
            totalItems={stats.totalItems}
            reviewProgress={verifiedPercentage}
            autoPopulated={true}
            marketAverage={65}
            eliteThreshold={85}
            marketRank={marketRank}
            missions={missions}
            onManageResume={() => setResumeModalOpen(true)}
            onAddDocument={() => setResumeModalOpen(true)}
            onReanalyze={handleReanalyze}
            isReanalyzing={isReanalyzing}
            hasResumeData={!!vaultData.vault.resume_raw_text}
            onResetVault={handleResetVault}
          />
        )}

        {/* Quick Wins */}
        {quickWins.length > 0 && (
          <QuickWinsPanel quickWins={quickWins} maxVisible={3} />
        )}

        {/* Quick Actions */}
        <QuickActionsBar
          onAddMetrics={() => setAddMetricsModalOpen(true)}
          onModernize={() => setModernizeModalOpen(true)}
        />

        {/* Main Content Tabs */}
        <VaultTabs
          vaultId={vaultData.vault.id}
          vault={vaultData.vault}
          vaultData={vaultData}
          onRefresh={() => refetch()}
          onEdit={handleEditItem}
          onView={handleViewItem}
        />

        {/* Inferred Items Review */}
        <div className="mt-6">
          <InferredItemsReview />
        </div>

        {/* Modals */}
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

      {/* AI Assistant */}
      {stats && (
        <VaultAIAssistant
          vaultContext={{
            totalItems: stats.totalItems,
            strengthScore: stats.strengthScore.total,
            qualityDistribution: stats.qualityDistribution,
            powerPhrases: vaultData?.powerPhrases,
            skills: vaultData?.transferableSkills,
            competencies: vaultData?.hiddenCompetencies,
          }}
        />
      )}
    </ContentLayout>
  );
};

const CareerVaultDashboard = () => (
  <ProtectedRoute>
    <VaultDashboardContent />
  </ProtectedRoute>
);

export default CareerVaultDashboard;
