import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from 'react-router-dom';
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ContentLayout } from "@/components/layout/ContentLayout";
import { Phase5_VaultLibrary } from "@/components/career-vault/intelligence-builder/phases/Phase5_VaultLibrary";
import { Loader2 } from "lucide-react";

const CareerIntelligenceLibraryContent = () => {
  const navigate = useNavigate();
  const [vaultId, setVaultId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadVault = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/auth');
          return;
        }

        const { data: vault, error } = await supabase
          .from('career_vault')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (error || !vault) {
          navigate('/career-vault');
          return;
        }

        setVaultId(vault.id);
      } catch (error) {
        console.error('Error loading vault:', error);
        navigate('/career-vault');
      } finally {
        setIsLoading(false);
      }
    };

    loadVault();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!vaultId) {
    return null;
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => navigate('/career-vault')}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2"
      >
        ← Back to Career Vault
      </button>
      <Phase5_VaultLibrary
        vaultId={vaultId}
        onProgress={() => {}}
        onTimeEstimate={() => {}}
        onComplete={() => {}}
      />
    </div>
  );
};

export default function CareerIntelligenceLibrary() {
  return (
    <ProtectedRoute>
      <ContentLayout>
        <CareerIntelligenceLibraryContent />
      </ContentLayout>
    </ProtectedRoute>
  );
}
