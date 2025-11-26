import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GlobalProgressShell } from "./GlobalProgressShell";
import { ExplainerOnboarding } from "./ExplainerOnboarding";
import { Phase1_MarketResearch } from "./phases/Phase1_MarketResearch";
import { Phase2_WorkHistoryMapping } from "./phases/Phase2_WorkHistoryMapping";
import { Phase3_BenchmarkReveal } from "./phases/Phase3_BenchmarkReveal";
import { Phase4_GapFillingInterview } from "./phases/Phase4_GapFillingInterview";
import { Phase5_VaultLibrary } from "./phases/Phase5_VaultLibrary";

interface CareerIntelligenceBuilderProps {
  vaultId: string;
  initialPhase?: number;
}

export const CareerIntelligenceBuilder = ({
  vaultId,
  initialPhase = 0
}: CareerIntelligenceBuilderProps) => {
  const navigate = useNavigate();
  const [currentPhase, setCurrentPhase] = useState(initialPhase);
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [timeEstimate, setTimeEstimate] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadVaultState();
  }, [vaultId]);

  const loadVaultState = async () => {
    setIsLoading(true);
    try {
      const { data: vault, error } = await supabase
        .from('career_vault')
        .select('*')
        .eq('id', vaultId)
        .single();

      if (error) throw error;
      
      // If already completed, go straight to library
      if (vault.intelligence_builder_completed) {
        setCurrentPhase(5);
      } else if (vault.current_phase) {
        setCurrentPhase(vault.current_phase);
      }
    } catch (error) {
      console.error('Error loading vault state:', error);
      toast.error('Failed to load vault data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStart = async () => {
    setCurrentPhase(1);
    await updateVaultPhase(1);
  };

  const handleExitToLibrary = async () => {
    // Save current progress and go to library
    await updateVaultPhase(5);
    setCurrentPhase(5);
  };

  const handlePhaseComplete = async (nextPhase: number) => {
    setPhaseProgress(0);
    setCurrentPhase(nextPhase);
    await updateVaultPhase(nextPhase);

    // If reaching Phase 5, mark as completed
    if (nextPhase === 5) {
      await supabase
        .from('career_vault')
        .update({ intelligence_builder_completed: true })
        .eq('id', vaultId);
    }
  };

  const updateVaultPhase = async (phase: number) => {
    try {
      await supabase
        .from('career_vault')
        .update({ current_phase: phase })
        .eq('id', vaultId);
    } catch (error) {
      console.error('Error updating vault phase:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading your vault...</p>
      </div>
    );
  }

  // Phase 0: Onboarding explainer
  if (currentPhase === 0) {
    return <ExplainerOnboarding onStart={handleStart} />;
  }

  const handleBackFromLibrary = () => {
    // Navigate back to Career Vault dashboard
    navigate('/career-vault');
  };

  // Phase 5: Vault Library (persistent home)
  if (currentPhase === 5) {
    return (
      <Phase5_VaultLibrary
        vaultId={vaultId}
        onProgress={setPhaseProgress}
        onTimeEstimate={setTimeEstimate}
        onComplete={() => {}} // Phase 5 is final destination
        onBackToBuilder={handleBackFromLibrary}
      />
    );
  }

  // Phases 1-4: Progressive builder
  return (
    <GlobalProgressShell
      currentPhase={currentPhase}
      totalPhases={5}
      progressPercentage={phaseProgress}
      timeEstimate={timeEstimate}
      onExit={handleExitToLibrary}
    >
      {currentPhase === 1 && (
        <Phase1_MarketResearch
          vaultId={vaultId}
          onProgress={setPhaseProgress}
          onTimeEstimate={setTimeEstimate}
          onComplete={() => handlePhaseComplete(2)}
        />
      )}

      {currentPhase === 2 && (
        <Phase2_WorkHistoryMapping
          vaultId={vaultId}
          onProgress={setPhaseProgress}
          onTimeEstimate={setTimeEstimate}
          onComplete={() => handlePhaseComplete(3)}
        />
      )}

      {currentPhase === 3 && (
        <Phase3_BenchmarkReveal
          vaultId={vaultId}
          onProgress={setPhaseProgress}
          onTimeEstimate={setTimeEstimate}
          onComplete={() => handlePhaseComplete(4)}
        />
      )}

      {currentPhase === 4 && (
        <Phase4_GapFillingInterview
          vaultId={vaultId}
          onProgress={setPhaseProgress}
          onTimeEstimate={setTimeEstimate}
          onComplete={() => handlePhaseComplete(5)}
        />
      )}
    </GlobalProgressShell>
  );
};
