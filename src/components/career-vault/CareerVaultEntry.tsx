import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CareerIntelligenceBuilder } from "./intelligence-builder/CareerIntelligenceBuilder";

export const CareerVaultEntry = () => {
  const [vaultId, setVaultId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrCreateVault();
  }, []);

  const fetchOrCreateVault = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if user already has a vault
      const { data: existingVault, error: fetchError } = await supabase
        .from('career_vault')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingVault) {
        setVaultId(existingVault.id);
      } else {
        // Create new vault
        const { data: newVault, error: createError } = await supabase
          .from('career_vault')
          .insert({
            user_id: user.id,
            vault_name: 'My Career Vault',
            intelligence_builder_phase: 0
          })
          .select('id')
          .single();

        if (createError) throw createError;
        setVaultId(newVault.id);
      }
    } catch (error: any) {
      console.error('Error fetching/creating vault:', error);
      toast.error(error.message || 'Failed to load vault');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading your career vault...</p>
      </div>
    );
  }

  if (!vaultId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-destructive">Failed to load vault. Please refresh.</p>
      </div>
    );
  }

  return <CareerIntelligenceBuilder vaultId={vaultId} />;
};
