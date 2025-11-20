import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ResumeDataVerification } from "@/components/career-vault/ResumeDataVerification";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function ResumeDataAudit() {
  const navigate = useNavigate();
  const [vaultId, setVaultId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchVault = async () => {
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

        if (error) throw error;
        if (!vault) {
          toast.error('No career vault found');
          navigate('/career-vault');
          return;
        }

        setVaultId(vault.id);
      } catch (error) {
        console.error('Error fetching vault:', error);
        toast.error('Failed to load vault data');
        navigate('/career-vault');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVault();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <p>Loading...</p>
      </div>
    );
  }

  if (!vaultId) {
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <Button 
        variant="ghost" 
        onClick={() => navigate('/career-vault')}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Career Vault
      </Button>
      
      <ResumeDataVerification vaultId={vaultId} />
    </div>
  );
}
